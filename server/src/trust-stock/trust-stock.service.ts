import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { applyStatusDateAutomation } from '../common/helpers/status-date-automation';
import { CreateTrustStockGroupDto, UpdateTrustStockGroupDto, TrustStockItemDto } from './dto/trust-stock.dto';

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
}
