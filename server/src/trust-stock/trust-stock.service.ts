import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { applyStatusDateAutomation } from '../common/helpers/status-date-automation';
import { CreateTrustStockGroupDto, UpdateTrustStockGroupDto, TrustStockItemDto } from './dto/trust-stock.dto';
import { ImportPfDto, UpdateStockProductDto, CreateStockUsageDto } from './dto/trust-stock-pdf.dto';
import { parsePfPdf, normalizeCode } from './pf-pdf-parser';
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

  private async nextGroupCode(): Promise<string> {
    const all = await this.prisma.trustStockGroup.findMany({ select: { code: true } });
    let max = 0;
    for (const { code } of all) {
      const m = code.match(/^STOCK\s*(\d+)$/i);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `STOCK ${max + 1}`;
  }

  async createGroup(dto: CreateTrustStockGroupDto, userId?: string) {
    const code = (dto.code || '').trim().toUpperCase() || await this.nextGroupCode();
    const clash = await this.prisma.trustStockGroup.findUnique({ where: { code } });
    if (clash) throw new BadRequestException(`${code} already exists${clash.deletedAt ? ' (in the trash bin)' : ''}`);

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
    const existing = await this.prisma.trustStockItem.findFirst({ where: { id: itemId, deletedAt: null } });
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
      ? await this.prisma.trustStockItem.findFirst({ where: { pfCode: parsed.pfCode, deletedAt: null }, include: { group: { select: { code: true } } } })
      : null;
    if (duplicate) parsed.warnings.push(`${parsed.pfCode} is already in ${duplicate.group.code}.`);
    return {
      ...parsed,
      stockCode,
      vendor,
      groupStatus: !group ? 'new' : group.deletedAt ? 'in-trash' : 'exists',
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

    const duplicate = await this.prisma.trustStockItem.findFirst({ where: { pfCode, deletedAt: null } });
    if (duplicate) throw new BadRequestException(`${pfCode} has already been imported.`);
    let group = await this.prisma.trustStockGroup.findUnique({ where: { code: stockCode } });
    if (group?.deletedAt) throw new BadRequestException(`${stockCode} is in the trash bin — restore it first.`);

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
          description: p.description?.trim() || '',
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

  // ==================== STOCK CONTENTS & USAGE ====================

  /** Every product in stock with purchased / used / remaining and who used it. */
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
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: { projectItem: { select: { id: true, pfCode: true, deletedAt: true, project: { select: { id: true, projectNo: true, name: true } } } } },
        },
      },
      orderBy: [{ stockItemId: 'asc' }, { sortOrder: 'asc' }],
    });
    return products.map(p => {
      const used = p.usages.reduce((s, u) => s + Number(u.quantity), 0);
      const { pdfFileKey, ...stockItem } = p.stockItem;
      return {
        id: p.id,
        itemCode: p.itemCode,
        description: p.description,
        category: p.category,
        quantity: Number(p.quantity),
        used,
        remaining: Number(p.quantity) - used,
        unitPrice: p.unitPrice != null ? Number(p.unitPrice) : null,
        totalPrice: p.totalPrice != null ? Number(p.totalPrice) : null,
        currency: p.currency,
        stockItem: { ...stockItem, hasPdf: !!pdfFileKey },
        usages: p.usages.map(u => ({
          id: u.id,
          quantity: Number(u.quantity),
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

  async updateProduct(id: string, dto: UpdateStockProductDto, userId?: string) {
    const product = await this.prisma.trustStockProduct.findFirst({ where: { id, deletedAt: null }, include: { usages: { where: { deletedAt: null } } } });
    if (!product) throw new NotFoundException('Stock product not found');
    if (dto.quantity !== undefined) {
      const used = product.usages.reduce((s, u) => s + Number(u.quantity), 0);
      if (dto.quantity < used) throw new BadRequestException(`${used} already used — quantity can't go below that.`);
    }
    const updated = await this.prisma.trustStockProduct.update({ where: { id }, data: dto as any });
    this.events.emitToRooms(['trust-stock', 'projects'], 'trust-stock:usage-changed', { productId: id }, userId);
    return updated;
  }

  async deleteProduct(id: string, userId?: string) {
    const product = await this.prisma.trustStockProduct.findFirst({ where: { id, deletedAt: null }, include: { usages: { where: { deletedAt: null } } } });
    if (!product) throw new NotFoundException('Stock product not found');
    if (product.usages.length) throw new BadRequestException('This product is used in projects — remove those usages first.');
    await this.prisma.trustStockProduct.update({ where: { id }, data: { deletedAt: new Date() } });
    this.events.emitToRooms(['trust-stock', 'projects'], 'trust-stock:usage-changed', { productId: id }, userId);
    return { message: 'Product removed' };
  }

  /** Stock used by one Projects-table row. */
  async usageForProjectItem(projectItemId: string) {
    const usages = await this.prisma.trustStockUsage.findMany({
      where: { projectItemId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: { product: { include: { stockItem: { select: { pfCode: true, group: { select: { code: true } } } } } } },
    });
    return usages.map(u => ({
      id: u.id,
      quantity: Number(u.quantity),
      createdAt: u.createdAt,
      productId: u.productId,
      itemCode: u.product.itemCode,
      description: u.product.description,
      unitPrice: u.product.unitPrice != null ? Number(u.product.unitPrice) : null,
      currency: u.product.currency,
      stockPfCode: u.product.stockItem.pfCode,
      stockCode: u.product.stockItem.group.code,
    }));
  }

  async addUsage(dto: CreateStockUsageDto, userId?: string) {
    const row = await this.prisma.projectItem.findFirst({
      where: { id: dto.projectItemId, deletedAt: null },
      include: { vendor: { select: { code: true } } },
    });
    if (!row) throw new NotFoundException('Project row not found');
    if (!isStockVendor(row.vendor?.code)) {
      throw new BadRequestException('Stock can only be used on rows whose vendor is TR-STOCK.');
    }
    const usage = await this.prisma.$transaction(async (tx) => {
      const product = await tx.trustStockProduct.findFirst({
        where: { id: dto.productId, deletedAt: null, stockItem: { deletedAt: null } },
        include: { usages: { where: { deletedAt: null } } },
      });
      if (!product) throw new NotFoundException('Stock product not found');
      const used = product.usages.reduce((s, u) => s + Number(u.quantity), 0);
      const remaining = Number(product.quantity) - used;
      if (dto.quantity > remaining + 1e-9) {
        throw new BadRequestException(`Only ${remaining} left of ${product.itemCode}.`);
      }
      return tx.trustStockUsage.create({
        data: { productId: product.id, projectItemId: row.id, quantity: dto.quantity, createdByUserId: userId ?? null },
      });
    });
    this.events.emitToRooms(['trust-stock', 'projects'], 'trust-stock:usage-changed', { projectItemId: row.id }, userId);
    return usage;
  }

  async removeUsage(id: string, userId?: string) {
    const usage = await this.prisma.trustStockUsage.findFirst({ where: { id, deletedAt: null } });
    if (!usage) throw new NotFoundException('Usage not found');
    await this.prisma.trustStockUsage.update({ where: { id }, data: { deletedAt: new Date() } });
    this.events.emitToRooms(['trust-stock', 'projects'], 'trust-stock:usage-changed', { projectItemId: usage.projectItemId }, userId);
    return { message: 'Usage removed' };
  }
}

/** The Trust Stock company as a vendor in the Projects table ("TR-STOCK - TRUST-STOCK"). */
export function isStockVendor(code?: string | null): boolean {
  return !!code && code.toUpperCase().replace(/[^A-Z]/g, '') === 'TRSTOCK';
}
