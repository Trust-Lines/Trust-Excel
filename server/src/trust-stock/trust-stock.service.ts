import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { applyStatusDateAutomation } from '../common/helpers/status-date-automation';
import { CreateTrustStockGroupDto, UpdateTrustStockGroupDto, TrustStockItemDto } from './dto/trust-stock.dto';
import { ImportPfDto, UpdateStockProductDto, CreateStockUsageDto, StockMovementsDto } from './dto/trust-stock-pdf.dto';
import { parsePfPdf, normalizeCode, PfItemLayout } from './pf-pdf-parser';
import { renderReorderPf, ReorderPfPage } from './reorder-pf';
import { FileStorage } from '../common/storage/file-storage';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

const ROOMS = ['trust-stock'];
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const ITEM_INCLUDE = {
  vendor: { select: { id: true, code: true, name: true } },
  customType: { select: { id: true, name: true, code: true, description: true } },
};

const GROUP_INCLUDE = {
  items: {
    where: { deletedAt: null },
    include: ITEM_INCLUDE,
    orderBy: { createdAt: 'asc' as const },
  },
};

/**
 * Stock movements that count: not undone, and their Projects row + project are not in the
 * trash. Deleting a row/project gives its stock back; restoring it takes it again.
 */
const LIVE_USAGE = { deletedAt: null, projectItem: { deletedAt: null, project: { deletedAt: null } } };

const DATE_FIELDS = ['std', 'etd', 'rtr', 'rtd', 'rdy', 'ftd', 'snd', 'paidUsd1Date', 'paidUsd2Date', 'paidTl1Date', 'paidTl2Date'] as const;
const PLAIN_FIELDS = [
  'type', 'customTypeId', 'vendorId', 'pfCode', 'orderNo', 'orderType', 'pfSignStatus', 'poSignStatus',
  'pfUsd', 'pfTl', 'invoice', 'invoiceTl', 'paidUsd1', 'paidUsd2', 'paidTl1', 'paidTl2',
  'paymentRule', 'statusNote', 'description', 'priceNotes',
] as const;

/** Trust Stock: purchases Trust makes for its own stock, grouped as STOCK 1, STOCK 2, … */
@Injectable()
export class TrustStockService implements OnModuleInit {
  private readonly logger = new Logger(TrustStockService.name);
  private readonly pdfStore = new FileStorage('trust-stock-pdfs');

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  /**
   * Page access is DB-driven and fail-closed: register the `trust_stock` page and
   * give ADMIN roles access the first time. Other roles are granted in Admin → Roles.
   */
  async onModuleInit() {
    try {
      const page = await this.prisma.pageRegistry.upsert({
        where: { key: 'trust_stock' },
        update: {},
        create: { key: 'trust_stock', name: 'Trust Stock', description: 'Trust Stock purchases (vendor, PF, price, payments)', isActive: true },
      });
      const admins = await this.prisma.role.findMany({ where: { name: { equals: 'ADMIN', mode: 'insensitive' } }, select: { id: true } });
      for (const role of admins) {
        const existing = await this.prisma.rolePageAccess.findUnique({ where: { roleId_pageId: { roleId: role.id, pageId: page.id } } });
        if (!existing) await this.prisma.rolePageAccess.create({ data: { roleId: role.id, pageId: page.id, hasAccess: true } });
      }
    } catch (err: any) {
      this.logger.warn(`Could not seed trust_stock page permission: ${err?.message || err}`);
    }
  }

  // ==================== GROUPS ====================

  async findAllGroups() {
    const groups = await this.prisma.trustStockGroup.findMany({
      where: { deletedAt: null },
      include: GROUP_INCLUDE,
    });
    // Natural order: STOCK 2 before STOCK 10
    groups.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    return { data: groups };
  }

/** Suffix given to a trashed group's code once that code is needed again. */
  static readonly DELETED_SUFFIX = / ~deleted-\d+$/;

  /**
   * A group in the trash still owns its (unique) code. When the same code is needed
   * again (new stock group / PF import), rename the trashed one out of the way —
   * it gets its code back on restore if still free (see TrashBinService).
   */
  private async freeCodeFromTrash(db: any, code: string) {
    const trashed = await db.trustStockGroup.findUnique({ where: { code } });
    if (trashed?.deletedAt) {
      await db.trustStockGroup.update({ where: { id: trashed.id }, data: { code: `${code} ~deleted-${Date.now()}` } });
    }
  }

  private async nextGroupCode(): Promise<string> {
    const all = await this.prisma.trustStockGroup.findMany({ where: { deletedAt: null }, select: { code: true } });
    let max = 0;
    for (const { code } of all) {
      const m = code.match(/^STOCK\s*(\d+)$/i);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `STOCK ${max + 1}`;
  }

  async createGroup(dto: CreateTrustStockGroupDto, userId?: string) {
    const code = (dto.code || '').trim().toUpperCase() || await this.nextGroupCode();
    await this.freeCodeFromTrash(this.prisma, code);
    const clash = await this.prisma.trustStockGroup.findUnique({ where: { code } });
    if (clash) throw new BadRequestException(`${code} already exists`);

    const group = await this.prisma.trustStockGroup.create({
      data: { code, name: dto.name?.trim() || '', notes: dto.notes || null },
      include: GROUP_INCLUDE,
    });
    this.events.emitToRooms(ROOMS, 'trust-stock:group-created', { group }, userId);
    return group;
  }

  async updateGroup(id: string, dto: UpdateTrustStockGroupDto, userId?: string) {
    await this.getGroupOrThrow(id);
    const data: any = {};
    if (dto.code !== undefined) {
      const code = dto.code.trim().toUpperCase();
      const clash = await this.prisma.trustStockGroup.findFirst({ where: { code, id: { not: id } } });
      if (clash) throw new BadRequestException(`${code} already exists`);
      data.code = code;
    }
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.notes !== undefined) data.notes = dto.notes || null;

    const group = await this.prisma.trustStockGroup.update({ where: { id }, data, include: GROUP_INCLUDE });
    this.events.emitToRooms(ROOMS, 'trust-stock:group-updated', { group }, userId);
    return group;
  }

  async deleteGroup(id: string, userId?: string) {
    const group = await this.getGroupOrThrow(id);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.trustStockGroup.update({ where: { id }, data: { deletedAt: now } }),
      this.prisma.trashBin.create({
        data: {
          entityType: 'TrustStockGroup',
          entityId: id,
          entityLabel: group.name ? `${group.code} — ${group.name}` : group.code,
          moduleGroup: 'trust-stock',
          deletedAt: now,
          deletedByUserId: userId,
          restoreUntil: new Date(now.getTime() + THIRTY_DAYS_MS),
        },
      }),
    ]);
    this.events.emitToRooms(ROOMS, 'trust-stock:group-deleted', { groupId: id }, userId);
    return { message: 'Stock group deleted' };
  }

  private async getGroupOrThrow(id: string) {
    const group = await this.prisma.trustStockGroup.findFirst({ where: { id, deletedAt: null } });
    if (!group) throw new NotFoundException('Stock group not found');
    return group;
  }

  // ==================== ITEMS ====================

  private toData(dto: TrustStockItemDto): Record<string, any> {
    const data: Record<string, any> = {};
    for (const f of PLAIN_FIELDS) {
      if ((dto as any)[f] !== undefined) data[f] = (dto as any)[f];
    }
    for (const f of DATE_FIELDS) {
      const v = (dto as any)[f];
      if (v !== undefined) data[f] = v ? new Date(v) : null;
    }
    if (typeof data.pfCode === 'string') data.pfCode = data.pfCode.trim() || null;
    if (typeof data.orderNo === 'string') data.orderNo = data.orderNo.trim() || null;
    return data;
  }

  async createItem(groupId: string, dto: TrustStockItemDto, userId?: string) {
    await this.getGroupOrThrow(groupId);
    const data = this.toData(dto);
    const status = dto.status || 'NOT_ORDERED';
    const item = await this.prisma.trustStockItem.create({
      data: {
        ...data,
        groupId,
        status,
        std: data.std ?? (status === 'ORDERED' ? new Date() : null),
      } as any,
      include: ITEM_INCLUDE,
    });
    this.events.emitToRooms(ROOMS, 'trust-stock:item-created', { item, groupId }, userId);
    return item;
  }

  async updateItem(itemId: string, dto: TrustStockItemDto, userId?: string) {
    const existing = await this.prisma.trustStockItem.findFirst({ where: { id: itemId, ...{ deletedAt: null, group: { deletedAt: null } } } });
    if (!existing) throw new NotFoundException('Stock item not found');

    const data = this.toData(dto);
    if (dto.status !== undefined) {
      data.status = dto.status;
      // Same status → date rules as the Projects table (STD on ORDERED, RTR on READY TO RECEIVE, …)
      Object.assign(data, applyStatusDateAutomation(existing.status, dto.status, existing, { rtrField: 'rtr', hasRtd: true }));
    }

    const updated = await this.prisma.trustStockItem.update({ where: { id: itemId }, data, include: ITEM_INCLUDE });

    // Cell-level live update for other open pages
    const patch: Record<string, any> = {};
    for (const key of [...Object.keys(data), ...DATE_FIELDS]) {
      const v = (updated as any)[key];
      patch[key] = v instanceof Date ? v.toISOString() : v ?? null;
    }
    if (userId) {
      this.events.emitPatchEvent(ROOMS, {
        entity: 'trustStockItem',
        entityId: itemId,
        parentId: existing.groupId,
        patch,
        updatedAt: updated.updatedAt.toISOString(),
        updatedBy: userId,
        mutationId: EventsGateway.generateMutationId(),
      });
    }
    return updated;
  }

  async deleteItem(itemId: string, userId?: string) {
    const item = await this.prisma.trustStockItem.findFirst({
      where: { id: itemId, deletedAt: null },
      include: { group: { select: { code: true } } },
    });
    if (!item) throw new NotFoundException('Stock item not found');
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.trustStockItem.update({ where: { id: itemId }, data: { deletedAt: now } }),
      this.prisma.trashBin.create({
        data: {
          entityType: 'TrustStockItem',
          entityId: itemId,
          entityLabel: item.pfCode || `${item.type || 'Custom'} item`,
          moduleGroup: 'trust-stock-items',
          deletedAt: now,
          deletedByUserId: userId,
          restoreUntil: new Date(now.getTime() + THIRTY_DAYS_MS),
          parentId: item.groupId,
          parentLabel: item.group.code,
        },
      }),
    ]);
    this.events.emitToRooms(ROOMS, 'trust-stock:item-deleted', { itemId, groupId: item.groupId }, userId);
    return { message: 'Stock item deleted' };
  }

  // ==================== PF PDF IMPORT ====================

  /** Vendor from the PF code prefix ("KYA-…") or the supplier name on the form. */
  private async matchVendor(codeHint: string | null, supplierName: string | null) {
    const vendors = await this.prisma.vendor.findMany({ select: { id: true, code: true, name: true } });
    if (codeHint) {
      const byCode = vendors.find(v => v.code.toUpperCase() === codeHint.toUpperCase());
      if (byCode) return byCode;
    }
    if (supplierName) {
      const n = normalizeCode(supplierName);
      const byName = vendors.find(v => {
        const vn = normalizeCode(v.name);
        return vn && n && (vn === n || vn.includes(n) || n.includes(vn));
      });
      if (byName) return byName;
    }
    return null;
  }

  /** Read a PF PDF and return what would be saved (nothing is written). */
  async previewPdf(buffer: Buffer) {
    const parsed = await parsePfPdf(buffer);
    const vendor = await this.matchVendor(parsed.vendorCodeHint, parsed.supplierName);
    if (!vendor) parsed.warnings.push(`No vendor matches "${parsed.supplierName || parsed.vendorCodeHint || '?'}" — pick one before saving.`);
    const stockCode = parsed.stockCode?.trim().toUpperCase() || null;
    const group = stockCode ? await this.prisma.trustStockGroup.findUnique({ where: { code: stockCode } }) : null;
    const duplicate = parsed.pfCode
      ? await this.prisma.trustStockItem.findFirst({ where: { pfCode: parsed.pfCode, ...{ deletedAt: null, group: { deletedAt: null } } }, include: { group: { select: { code: true } } } })
      : null;
    if (duplicate) parsed.warnings.push(`${parsed.pfCode} is already in ${duplicate.group.code}.`);
    delete parsed.layout; // only used for re-order PFs, not part of the import data
    return {
      ...parsed,
      stockCode,
      vendor,
      groupStatus: !group || group.deletedAt ? 'new' : 'exists',
      duplicateOf: duplicate ? { itemId: duplicate.id, groupCode: duplicate.group.code } : null,
    };
  }

  /** Save a PF from the (possibly corrected) preview: group, PF row, products and the PDF itself. */
  async importPdf(buffer: Buffer, fileName: string, raw: unknown, userId?: string) {
    const dto = plainToInstance(ImportPfDto, raw);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length) {
      throw new BadRequestException(errors.map(e => Object.values(e.constraints || {}).join(', ') || `${e.property} is invalid`).join('; '));
    }
    const stockCode = dto.stockCode.trim().toUpperCase();
    const pfCode = dto.pfCode.trim();

    const duplicate = await this.prisma.trustStockItem.findFirst({ where: { pfCode, ...{ deletedAt: null, group: { deletedAt: null } } } });
    if (duplicate) throw new BadRequestException(`${pfCode} has already been imported.`);
    // A trashed group with this code doesn't count — move it out of the way and start fresh
    await this.freeCodeFromTrash(this.prisma, stockCode);
    let group = await this.prisma.trustStockGroup.findUnique({ where: { code: stockCode } });

    // Store the PDF first (its key doesn't depend on DB ids), so a failed upload saves nothing
    const safeName = (fileName || `${pfCode}.pdf`).replace(/[^\w.\-]+/g, '_').slice(-120);
    const fileKey = `${stockCode.replace(/[^\w\-]+/g, '_')}/${Date.now()}-${safeName}`;
    await this.pdfStore.save(fileKey, buffer, 'application/pdf');

    const total = dto.totalPrice ?? dto.products.reduce((s, p) => s + (p.totalPrice ?? 0), 0);
    const item = await this.prisma.$transaction(async (tx) => {
      if (!group) group = await tx.trustStockGroup.create({ data: { code: stockCode } });
      const created = await tx.trustStockItem.create({
        data: {
          groupId: group.id,
          type: dto.type ?? null,
          vendorId: dto.vendorId ?? null,
          pfCode,
          orderNo: dto.orderNo?.trim() || null,
          pfDate: dto.pfDate ? new Date(dto.pfDate) : null,
          pfUsd: dto.currency === 'USD' && total ? total : null,
          pfTl: dto.currency === 'TL' && total ? total : null,
          paymentRule: dto.paymentRule ?? null,
          status: 'NOT_ORDERED',
          pdfFileKey: fileKey,
          pdfFileName: fileName || null,
        },
      });
      await tx.trustStockProduct.createMany({
        data: dto.products.map((p, i) => ({
          stockItemId: created.id,
          itemCode: p.itemCode.trim(),
          ...TrustStockService.splitDimensions(p.description?.trim() || ''),
          category: p.category ?? null,
          quantity: p.quantity,
          unitPrice: p.unitPrice ?? null,
          totalPrice: p.totalPrice ?? (p.unitPrice != null ? p.unitPrice * p.quantity : null),
          currency: dto.currency,
          sortOrder: i,
        })),
      });
      return tx.trustStockItem.findUnique({ where: { id: created.id }, include: ITEM_INCLUDE });
    });

    this.events.emitToRooms(ROOMS, 'trust-stock:item-created', { item, groupId: item!.groupId }, userId);
    return item;
  }

  async getPdf(itemId: string) {
    const item = await this.prisma.trustStockItem.findUnique({ where: { id: itemId }, select: { pdfFileKey: true, pdfFileName: true, pfCode: true } });
    if (!item?.pdfFileKey) throw new NotFoundException('No PDF stored for this PF');
    const data = await this.pdfStore.read(item.pdfFileKey);
    if (!data) throw new NotFoundException('PDF file not found');
    return { data, fileName: item.pdfFileName || `${item.pfCode || 'pf'}.pdf` };
  }

  /**
   * Re-order PF: a PRODUCTION FORM for everything whose Order column is > 0,
   * one page per vendor, under the next stock code (STOCK-TR-04 → STOCK-TR-05).
   * Pictures are copied from the products' original PFs. Nothing is saved.
   */
  async reorderPf(productIds?: string[]) {
    const products = (await this.listProducts()).filter(p => p.reorderQty > 0 && (!productIds?.length || productIds.includes(p.id)));
    if (!products.length) throw new BadRequestException('Nothing to re-order');

    const codes = (await this.prisma.trustStockGroup.findMany({ select: { code: true } })).map(g => g.code.replace(/\s*~deleted-\d+$/, '').replace(/\s*\(restored\)$/i, ''));
    let prefix = 'STOCK-TR-', max = 0, width = 2;
    for (const c of codes) {
      const m = c.match(/^(.*?)(\d+)$/);
      if (!m || !/STOCK/i.test(m[1])) continue;
      if (Number(m[2]) >= max) { max = Number(m[2]); prefix = m[1]; width = m[2].length; }
    }
    const stockCode = `${prefix}${String(max + 1).padStart(width, '0')}`;
    const now = new Date();
    const date = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;

    // one page per vendor + PF type, in the order the products are listed
    const pages = new Map<string, ReorderPfPage>();
    const sourceItemIds = new Set<string>();
    for (const p of products) {
      const vendor = p.stockItem.vendor;
      const type = p.stockItem.type || 'MILLWORK';
      const key = `${vendor?.id || '-'}|${type}`;
      if (!pages.has(key)) {
        const letter = type === 'MILLWORK' ? 'M' : type.charAt(0);
        const sameVendor = [...pages.values()].filter(x => x.supplierName === (vendor?.name || '').toUpperCase() && x.pfCode.endsWith(`-${letter}01`)).length;
        pages.set(key, {
          supplierName: (vendor?.name || '').toUpperCase(),
          pfCode: `${vendor?.code ? vendor.code + '-' : ''}${stockCode}-${letter}${String(sameVendor + 1).padStart(2, '0')}`,
          stockCode,
          date,
          formType: type.replace(/_/g, ' '),
          paymentNote: 'Note: Production will start after receiving a 50% advance payment.',
          lines: [],
        });
      }
      pages.get(key)!.lines.push({
        itemCode: p.itemCode, description: p.description, dimensions: p.dimensions, category: p.category,
        quantity: p.reorderQty, unitPrice: p.unitPrice, currency: p.currency || 'USD',
      });
      if (p.stockItem.hasPdf) sourceItemIds.add(p.stockItem.id);
    }

    // the original PFs, for the product pictures
    const sources: { pdf: Buffer; layout: PfItemLayout[] }[] = [];
    const items = await this.prisma.trustStockItem.findMany({ where: { id: { in: [...sourceItemIds] } }, select: { pdfFileKey: true }, orderBy: { createdAt: 'desc' } });
    for (const it of items) {
      try {
        const pdf = await this.pdfStore.read(it.pdfFileKey!);
        if (!pdf) continue;
        const layout = (await parsePfPdf(pdf)).layout || [];
        if (layout.length) sources.push({ pdf, layout });
      } catch (e: any) {
        this.logger.warn(`Re-order PF: could not read pictures from ${it.pdfFileKey}: ${e?.message || e}`);
      }
    }

    const data = await renderReorderPf([...pages.values()], sources);
    return { data, fileName: `${stockCode}-REORDER.pdf` };
  }

  // ==================== STOCK CONTENTS & USAGE ====================
  //
  // Same rules as the "Cabinet Stock Management" sheet, per product (model):
  //   on hand    = confirmed received − taken + returned     (none until received)
  //   available  = on hand − reserved
  //   remaining% = available ÷ received
  //   reorder at ≤ ROUNDDOWN(25% × received)
  //   status     = PENDING VERIFICATION (no receipt) | OUT OF STOCK (≤ 0) | REORDER NOW (≤ 25%)
  //                | WATCH (≤ 50%) | HEALTHY (> 50%)

  private static stats(p: { quantity: any; receivedQuantity: any; usages: { kind: string; quantity: any; projectItemId?: string }[] }) {
    const sum = (kind: string) => p.usages.filter(u => u.kind === kind).reduce((s, u) => s + Number(u.quantity), 0);
    const ordered = Number(p.quantity);
    const received = p.receivedQuantity != null ? Number(p.receivedQuantity) : null;
    const taken = sum('TAKEN');
    const returned = sum('RETURNED');
    const reserved = sum('RESERVED');
    const onHand = received != null ? received - taken + returned : null;
    const available = onHand != null ? onHand - reserved : null;
    const remainingPct = received ? (available as number) / received : null;
    const reorderThreshold = received != null ? Math.floor(received * 0.25) : null;
    let status: 'PENDING_VERIFICATION' | 'OUT_OF_STOCK' | 'REORDER_NOW' | 'WATCH' | 'HEALTHY';
    if (received == null) status = 'PENDING_VERIFICATION';
    else if ((available as number) <= 0) status = 'OUT_OF_STOCK';
    else if ((remainingPct as number) <= 0.25) status = 'REORDER_NOW';
    else if ((remainingPct as number) <= 0.5) status = 'WATCH';
    else status = 'HEALTHY';
    // What can still be handed out: before the warehouse receipt is confirmed, the ordered quantity is the cap
    const takeable = (received ?? ordered) - taken + returned - reserved;
    // Suggested re-order once the reorder point is hit: what's missing to get back to the ordered quantity
    const reorderQty = status === 'REORDER_NOW' || status === 'OUT_OF_STOCK' ? Math.max(0, ordered - (available as number)) : 0;
    return { ordered, received, taken, returned, netUsed: taken - returned, reserved, onHand, available, remainingPct, reorderThreshold, reorderQty, status, takeable };
  }

  /** "( D=32.5"-W=40"-H=32.75")" at the end of a description → dimensions + clean description */
  static splitDimensions(description: string, dimensions?: string | null) {
    if (dimensions) return { description, dimensions };
    const m = description.match(/\(?\s*(D\s*=\s*[\d.,]+"?[\s\-–x×]*W\s*=\s*[\d.,]+"?[\s\-–x×]*H\s*=\s*[\d.,]+"?)\s*\)?\s*$/i);
    if (!m) return { description, dimensions: null };
    const dims = m[1].replace(/\s*[-–x×]\s*(?=[WH]\s*=)/gi, ' ').replace(/\s+/g, ' ').replace(/\s*=\s*/g, '=').replace(/(\d),(\d)/g, '$1.$2').trim();
    return { description: description.slice(0, m.index).trim(), dimensions: dims };
  }

  /** Every product in stock with the stock-sheet figures and who used it. */
  async listProducts() {
    const products = await this.prisma.trustStockProduct.findMany({
      where: { deletedAt: null, stockItem: { deletedAt: null, group: { deletedAt: null } } },
      include: {
        stockItem: {
          select: {
            id: true, pfCode: true, orderNo: true, pfDate: true, pdfFileKey: true, type: true,
            vendor: { select: { id: true, code: true, name: true } },
            group: { select: { id: true, code: true } },
          },
        },
        usages: {
          where: LIVE_USAGE,
          orderBy: { createdAt: 'asc' },
          include: { projectItem: { select: { id: true, pfCode: true, deletedAt: true, project: { select: { id: true, projectNo: true, name: true } } } } },
        },
      },
      orderBy: [{ stockItemId: 'asc' }, { sortOrder: 'asc' }],
    });
    return products.map(p => {
      const { pdfFileKey, ...stockItem } = p.stockItem;
      const split = TrustStockService.splitDimensions(p.description, p.dimensions);
      return {
        id: p.id,
        itemCode: p.itemCode,
        description: split.description,
        dimensions: split.dimensions,
        category: p.category,
        quantity: Number(p.quantity),
        receivedAt: p.receivedAt,
        unitPrice: p.unitPrice != null ? Number(p.unitPrice) : null,
        totalPrice: p.totalPrice != null ? Number(p.totalPrice) : null,
        currency: p.currency,
        ...TrustStockService.stats(p),
        stockItem: { ...stockItem, hasPdf: !!pdfFileKey },
        usages: p.usages.map(u => ({
          id: u.id,
          kind: u.kind,
          quantity: Number(u.quantity),
          note: u.note,
          takenBy: u.takenBy,
          createdAt: u.createdAt,
          projectItemId: u.projectItemId,
          projectNo: u.projectItem.project.projectNo,
          projectName: u.projectItem.project.name,
          projectPfCode: u.projectItem.pfCode,
          rowDeleted: !!u.projectItem.deletedAt,
        })),
      };
    });
  }

  /**
   * Every product ever entered (imported or typed), one per item code — offered as a
   * dropdown when adding lines by hand. The most recent entry of a code wins.
   */
  async listCatalog() {
    const rows = await this.prisma.trustStockProduct.findMany({
      orderBy: { createdAt: 'desc' },
      select: { itemCode: true, description: true, dimensions: true, category: true, unitPrice: true, currency: true },
    });
    const seen = new Map<string, any>();
    for (const r of rows) {
      const key = r.itemCode.trim().toUpperCase();
      if (!key || seen.has(key)) continue;
      const split = TrustStockService.splitDimensions(r.description, r.dimensions);
      seen.set(key, {
        itemCode: r.itemCode.trim(),
        description: split.description,
        dimensions: split.dimensions,
        category: r.category,
        unitPrice: r.unitPrice != null ? Number(r.unitPrice) : null,
        currency: r.currency,
      });
    }
    return [...seen.values()].sort((a, b) => a.itemCode.localeCompare(b.itemCode, undefined, { numeric: true }));
  }

  async updateProduct(id: string, dto: UpdateStockProductDto, userId?: string) {
    const product = await this.prisma.trustStockProduct.findFirst({ where: { id, deletedAt: null, stockItem: { deletedAt: null, group: { deletedAt: null } } }, include: { usages: { where: LIVE_USAGE } } });
    if (!product) throw new NotFoundException('Stock product not found');
    const s = TrustStockService.stats(product);
    if (dto.quantity !== undefined && dto.quantity < s.netUsed + s.reserved) {
      throw new BadRequestException(`${s.netUsed + s.reserved} already taken/reserved — ordered quantity can't go below that.`);
    }
    if (dto.receivedQuantity != null && dto.receivedQuantity < s.netUsed + s.reserved) {
      throw new BadRequestException(`${s.netUsed + s.reserved} already taken/reserved — received quantity can't go below that.`);
    }
    const data: any = { ...dto };
    if (typeof data.itemCode === 'string') data.itemCode = data.itemCode.trim();
    // Older rows keep their dimensions inside the description (shown split). When the description
    // is edited, move those dimensions into their own field so they aren't lost.
    if (dto.description !== undefined && dto.dimensions === undefined && !product.dimensions) {
      const old = TrustStockService.splitDimensions(product.description);
      if (old.dimensions) data.dimensions = old.dimensions;
    }
    if (dto.receivedQuantity !== undefined) data.receivedAt = dto.receivedQuantity == null ? null : (product.receivedAt ?? new Date());
    const updated = await this.prisma.trustStockProduct.update({ where: { id }, data });
    this.events.emitToRooms(['trust-stock', 'projects'], 'trust-stock:usage-changed', { productId: id }, userId);
    return updated;
  }

  async deleteProduct(id: string, userId?: string) {
    const product = await this.prisma.trustStockProduct.findFirst({ where: { id, deletedAt: null }, include: { usages: { where: LIVE_USAGE } } });
    if (!product) throw new NotFoundException('Stock product not found');
    if (product.usages.length) throw new BadRequestException('This product is used in projects — remove those usages first.');
    await this.prisma.trustStockProduct.update({ where: { id }, data: { deletedAt: new Date() } });
    this.events.emitToRooms(['trust-stock', 'projects'], 'trust-stock:usage-changed', { productId: id }, userId);
    return { message: 'Product removed' };
  }

  /** Stock movements of one Projects-table row, plus its per-product balance. */
  async usageForProjectItem(projectItemId: string) {
    const usages = await this.prisma.trustStockUsage.findMany({
      where: { projectItemId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: { product: { include: { stockItem: { select: { pfCode: true, group: { select: { code: true } } } } } } },
    });
    return usages.map(u => ({
      id: u.id,
      kind: u.kind,
      quantity: Number(u.quantity),
      note: u.note,
      takenBy: u.takenBy,
      createdAt: u.createdAt,
      productId: u.productId,
      itemCode: u.product.itemCode,
      description: TrustStockService.splitDimensions(u.product.description, u.product.dimensions).description,
      unitPrice: u.product.unitPrice != null ? Number(u.product.unitPrice) : null,
      currency: u.product.currency,
      stockPfCode: u.product.stockItem.pfCode,
      stockCode: u.product.stockItem.group.code,
    }));
  }

  private async getStockRow(projectItemId: string) {
    const row = await this.prisma.projectItem.findFirst({
      where: { id: projectItemId, deletedAt: null },
      include: { vendor: { select: { code: true } } },
    });
    if (!row) throw new NotFoundException('Project row not found');
    if (!isStockVendor(row.vendor?.code)) throw new BadRequestException('Stock can only be used on rows whose vendor is TR-STOCK.');
    return row;
  }

  /**
   * Apply several movements for one project row in one go (the "Use from Trust Stock" screen):
   * per product: take N, reserve N, return N. Taking first uses up this row's own reservation.
   */
  async applyMovements(dto: StockMovementsDto, userId?: string) {
    const row = await this.getStockRow(dto.projectItemId);
    const lines = dto.lines.filter(l => (l.take || 0) > 0 || (l.reserve || 0) > 0 || (l.return || 0) > 0);
    const takenBy = dto.takenBy.trim();
    if (!takenBy) throw new BadRequestException('Enter who is taking the stock.');
    if (!lines.length) throw new BadRequestException('Nothing to save.');

    await this.prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const product = await tx.trustStockProduct.findFirst({
          where: { id: line.productId, deletedAt: null, stockItem: { deletedAt: null, group: { deletedAt: null } } },
          include: { usages: { where: LIVE_USAGE } },
        });
        if (!product) throw new NotFoundException('Stock product not found');
        const mine = product.usages.filter(u => u.projectItemId === row.id);
        const sumMine = (kind: string) => mine.filter(u => u.kind === kind).reduce((s, u) => s + Number(u.quantity), 0);
        const s = TrustStockService.stats(product);

        // Return: at most what this row has taken (net)
        if (line.return) {
          const net = sumMine('TAKEN') - sumMine('RETURNED');
          if (line.return > net + 1e-9) throw new BadRequestException(`${product.itemCode}: this row has only ${net} to return.`);
          await tx.trustStockUsage.create({ data: { productId: product.id, projectItemId: row.id, kind: 'RETURNED', quantity: line.return, note: line.note ?? null, takenBy, createdByUserId: userId ?? null } });
        }

        // Take: first from this row's own reservation, the rest from what's free
        if (line.take) {
          const myReserved = sumMine('RESERVED');
          const fromReservation = Math.min(myReserved, line.take);
          const free = s.takeable + (line.return || 0);
          if (line.take - fromReservation > free + 1e-9) {
            throw new BadRequestException(`${product.itemCode}: only ${Math.max(0, free) + myReserved} can be taken.`);
          }
          if (fromReservation > 0) await this.releaseReservation(tx, mine.filter(u => u.kind === 'RESERVED'), fromReservation);
          await tx.trustStockUsage.create({ data: { productId: product.id, projectItemId: row.id, kind: 'TAKEN', quantity: line.take, note: line.note ?? null, takenBy, createdByUserId: userId ?? null } });
        }

        // Reserve: hold for this row without taking it out yet
        if (line.reserve) {
          const free = s.takeable + (line.return || 0) - (line.take ? Math.max(0, line.take - sumMine('RESERVED')) : 0);
          if (line.reserve > free + 1e-9) throw new BadRequestException(`${product.itemCode}: only ${Math.max(0, free)} can be reserved.`);
          await tx.trustStockUsage.create({ data: { productId: product.id, projectItemId: row.id, kind: 'RESERVED', quantity: line.reserve, note: line.note ?? null, takenBy, createdByUserId: userId ?? null } });
        }
      }
    });

    this.events.emitToRooms(['trust-stock', 'projects'], 'trust-stock:usage-changed', { projectItemId: row.id }, userId);
    return this.usageForProjectItem(row.id);
  }

  /** Reduce reservation records by `qty` (newest first). */
  private async releaseReservation(tx: any, reservations: { id: string; quantity: any }[], qty: number) {
    let left = qty;
    for (const r of [...reservations].reverse()) {
      if (left <= 0) break;
      const q = Number(r.quantity);
      if (q <= left + 1e-9) {
        await tx.trustStockUsage.update({ where: { id: r.id }, data: { deletedAt: new Date() } });
        left -= q;
      } else {
        await tx.trustStockUsage.update({ where: { id: r.id }, data: { quantity: q - left } });
        left = 0;
      }
    }
  }

  /** Names entered before as "taken by" — offered in the dropdown. */
  async listPeople(): Promise<string[]> {
    const rows = await this.prisma.trustStockUsage.findMany({ where: { takenBy: { not: null } }, distinct: ['takenBy'], select: { takenBy: true } });
    return rows.map(r => r.takenBy!.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b, 'tr'));
  }

  /** Single take (kept for API compatibility). */
  async addUsage(dto: CreateStockUsageDto, userId?: string) {
    await this.applyMovements({ projectItemId: dto.projectItemId, takenBy: '—', lines: [{ productId: dto.productId, take: dto.quantity }] } as StockMovementsDto, userId);
    return this.prisma.trustStockUsage.findFirst({ where: { projectItemId: dto.projectItemId, productId: dto.productId, kind: 'TAKEN', deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  /** Undo one movement (e.g. a wrong entry or a released reservation). */
  async removeUsage(id: string, userId?: string) {
    const usage = await this.prisma.trustStockUsage.findFirst({ where: { id, deletedAt: null }, include: { product: { include: { usages: { where: LIVE_USAGE } } } } });
    if (!usage) throw new NotFoundException('Usage not found');
    if (usage.kind === 'RETURNED') {
      // Undoing a return puts those pieces back on the row — only possible if they're still free
      const s = TrustStockService.stats(usage.product);
      if (Number(usage.quantity) > s.takeable + 1e-9) throw new BadRequestException('Those pieces have been used elsewhere since — can\'t undo this return.');
    }
    if (usage.kind === 'TAKEN') {
      const mine = usage.product.usages.filter(u => u.projectItemId === usage.projectItemId);
      const net = mine.filter(u => u.kind === 'TAKEN').reduce((s, u) => s + Number(u.quantity), 0)
        - mine.filter(u => u.kind === 'RETURNED').reduce((s, u) => s + Number(u.quantity), 0);
      if (net - Number(usage.quantity) < -1e-9) throw new BadRequestException('Undo the return for this row first.');
    }
    await this.prisma.trustStockUsage.update({ where: { id }, data: { deletedAt: new Date() } });
    this.events.emitToRooms(['trust-stock', 'projects'], 'trust-stock:usage-changed', { projectItemId: usage.projectItemId }, userId);
    return { message: 'Removed' };
  }
}

/** The Trust Stock company as a vendor in the Projects table ("TR-STOCK - TRUST-STOCK"). */
export function isStockVendor(code?: string | null): boolean {
  return !!code && code.toUpperCase().replace(/[^A-Z]/g, '') === 'TRSTOCK';
}
