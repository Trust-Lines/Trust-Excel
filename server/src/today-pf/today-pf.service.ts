import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { EmailService } from '../email/email.service';
import { CreateTodayPfFlagDto, TodayPfKind } from './dto/create-today-pf-flag.dto';

// An item counts as 'ordered' once it has moved past these statuses.
const NOT_ORDERED_STATUSES = ['HOLD_T', 'HOLD_PM', 'HOLD_BOOKS', 'NOT_ORDERED', 'TO_ORDER', 'BOOKS_IN_PROGRESS'];
const isOrdered = (status: string | null) => !!status && !NOT_ORDERED_STATUSES.includes(status);
// Progress metric per list: PF list = has a PF code, ORDER list = has been ordered.
const isDone = (kind: string, item: { pfCode: string | null; status: string | null }) =>
  kind === 'ORDER' ? isOrdered(item.status) : !!item.pfCode?.trim();

const PF_TYPE_LABELS: Record<string, string> = {
  MILLWORK: 'Millwork',
  SHELVING: 'Shelving',
  CEILING: 'Ceiling',
  IMAGE: 'Image',
  FURNITURE: 'Furniture',
  DECORATION: 'Decoration',
};

@Injectable()
export class TodayPfService {
  private readonly logger = new Logger(TodayPfService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly emailService: EmailService,
  ) {}

  async list() {
    const flags = await this.prisma.todayPfFlag.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, projectNo: true, name: true, bucket: true, deletedAt: true } },
        customType: { select: { id: true, name: true } },
        item: { select: { id: true, pfCode: true, status: true, deletedAt: true, type: true, customType: { select: { name: true } }, vendor: { select: { name: true } } } },
      },
    });

    // Item-level (ORDER) flags whose PF was deleted are dropped along with it.
    const active = flags.filter(f => !f.project.deletedAt && !(f.itemId && (!f.item || f.item.deletedAt)));

    return Promise.all(active.map(async (flag) => {
      if (flag.itemId && flag.item) {
        const it = flag.item;
        const label = it.customType?.name || PF_TYPE_LABELS[it.type || ''] || it.type || 'Unknown';
        return {
          id: flag.id,
          projectId: flag.projectId,
          projectNo: flag.project.projectNo,
          projectName: flag.project.name,
          bucket: flag.project.bucket,
          type: it.type,
          customTypeId: flag.customTypeId,
          typeLabel: label,
          createdAt: flag.createdAt,
          completedAt: flag.completedAt,
          kind: flag.kind,
          itemId: flag.itemId,
          pfCode: it.pfCode,
          vendorName: it.vendor?.name ?? null,
          itemStatus: it.status,
          totalItems: 1,
          filledItems: isDone(flag.kind, it) ? 1 : 0,
        };
      }

      const itemWhere: any = { projectId: flag.projectId, deletedAt: null };
      if (flag.customTypeId) itemWhere.customTypeId = flag.customTypeId;
      else itemWhere.type = flag.type;

      const items = await this.prisma.projectItem.findMany({
        where: itemWhere,
        select: { pfCode: true, status: true },
      });

      const totalItems = items.length;
      const filledItems = items.filter(i => isDone(flag.kind, i)).length;

      return {
        id: flag.id,
        projectId: flag.projectId,
        projectNo: flag.project.projectNo,
        projectName: flag.project.name,
        bucket: flag.project.bucket,
        type: flag.type,
        customTypeId: flag.customTypeId,
        typeLabel: flag.customType?.name || PF_TYPE_LABELS[flag.type || ''] || flag.type || 'Unknown',
        createdAt: flag.createdAt,
        completedAt: flag.completedAt,
        kind: flag.kind,
        itemId: null,
        pfCode: null,
        vendorName: null,
        itemStatus: null,
        totalItems,
        filledItems,
      };
    }));
  }

  async create(dto: CreateTodayPfFlagDto, userId?: string) {
    const kind: TodayPfKind = dto.kind || 'PF';

    if (kind === 'ORDER' || kind === 'FOLLOWUP') {
      // "To order" / "Follow up" flags target one specific PF (item), not a whole type group.
      if (!dto.itemId) throw new BadRequestException('itemId is required for item-level flags');
      const item = await this.prisma.projectItem.findUnique({
        where: { id: dto.itemId },
        select: { id: true, projectId: true, type: true, customTypeId: true, deletedAt: true, status: true },
      });
      if (!item || item.deletedAt || item.projectId !== dto.projectId) throw new NotFoundException('PF not found');
      if (kind === 'FOLLOWUP' && item.status !== 'ORDERED') {
        throw new BadRequestException('Only ORDERED PFs can be added to Follow Up');
      }

      const existingOrder = await this.prisma.todayPfFlag.findFirst({ where: { kind, itemId: item.id } });
      const orderFlag = existingOrder
        ? await this.prisma.todayPfFlag.update({ where: { id: existingOrder.id }, data: { completedAt: null } })
        : await this.prisma.todayPfFlag.create({
            data: {
              projectId: item.projectId,
              type: item.customTypeId ? null : item.type,
              customTypeId: item.customTypeId ?? null,
              kind,
              itemId: item.id,
              createdByUserId: userId ?? null,
            },
          });
      this.eventsGateway.emitToRooms(['projects', 'suppliers', 'dashboard'], 'today-pf:updated', { flagId: orderFlag.id });
      return orderFlag;
    }

    if (!dto.type && !dto.customTypeId) {
      throw new BadRequestException('Either type or customTypeId is required');
    }

    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId }, select: { id: true, deletedAt: true } });
    if (!project || project.deletedAt) {
      throw new NotFoundException('Project not found');
    }

    // Prisma's compound-unique `where` shorthand rejects a literal `null` for a
    // nullable field in the key, so look the row up manually instead of upsert().
    const existing = await this.prisma.todayPfFlag.findFirst({
      where: {
        kind,
        itemId: null,
        projectId: dto.projectId,
        type: dto.customTypeId ? null : (dto.type as any),
        customTypeId: dto.customTypeId ?? null,
      },
    });

    const flag = existing
      // Re-flagging a previously-completed group resets it back to active.
      ? await this.prisma.todayPfFlag.update({ where: { id: existing.id }, data: { completedAt: null } })
      : await this.prisma.todayPfFlag.create({
          data: {
            projectId: dto.projectId,
            type: dto.customTypeId ? null : (dto.type as any),
            customTypeId: dto.customTypeId ?? null,
            kind,
            createdByUserId: userId ?? null,
          },
        });

    this.eventsGateway.emitToRooms(['projects', 'suppliers', 'dashboard'], 'today-pf:updated', { flagId: flag.id });
    return flag;
  }

  async remove(id: string) {
    const flag = await this.prisma.todayPfFlag.findUnique({ where: { id } });
    if (!flag) {
      throw new NotFoundException('Flag not found');
    }
    await this.prisma.todayPfFlag.delete({ where: { id } });
    this.eventsGateway.emitToRooms(['projects', 'suppliers', 'dashboard'], 'today-pf:updated', { flagId: id, removed: true });
    return { message: 'Flag removed' };
  }

  /**
   * Called after a project item's pfCode transitions from empty to filled.
   * Checks whether this completes any active flag for the item's (project, type)
   * group, and if so marks it complete and emails everyone with manage access.
   * Never throws — a notification failure must not break the item-update request.
   */
  async checkAndCompleteFlags(projectId: string, type: string | null, customTypeId: string | null, kind: TodayPfKind = 'PF', itemId?: string): Promise<void> {
    try {
      if (kind === 'ORDER') {
        // Item-level: complete the flag for exactly this PF once it has been ordered.
        if (!itemId) return;
        const orderFlag = await this.prisma.todayPfFlag.findFirst({ where: { kind: 'ORDER', itemId, completedAt: null } });
        if (!orderFlag) return;
        const item = await this.prisma.projectItem.findUnique({ where: { id: itemId }, select: { pfCode: true, status: true } });
        if (!item || !isDone('ORDER', item)) return;
        await this.prisma.todayPfFlag.update({ where: { id: orderFlag.id }, data: { completedAt: new Date() } });
        this.eventsGateway.emitToRooms(['projects', 'suppliers', 'dashboard'], 'today-pf:updated', { flagId: orderFlag.id, completed: true });
        return;
      }

      const flag = await this.prisma.todayPfFlag.findFirst({
        where: {
          kind,
          itemId: null,
          projectId,
          completedAt: null,
          type: customTypeId ? null : (type as any),
          customTypeId: customTypeId ?? null,
        },
        include: {
          project: { select: { projectNo: true, name: true } },
          customType: { select: { name: true } },
        },
      });

      if (!flag) return;

      const itemWhere: any = { projectId, deletedAt: null };
      if (customTypeId) itemWhere.customTypeId = customTypeId;
      else itemWhere.type = type;

      const items = await this.prisma.projectItem.findMany({ where: itemWhere, select: { pfCode: true, status: true } });
      if (items.length === 0 || !items.every(i => isDone(kind, i))) return;

      await this.prisma.todayPfFlag.update({ where: { id: flag.id }, data: { completedAt: new Date() } });
      this.eventsGateway.emitToRooms(['projects', 'suppliers', 'dashboard'], 'today-pf:updated', { flagId: flag.id, completed: true });

      // Completion email disabled for now — "✓ done" still shows in the UI,
      // just no email is sent. Re-enable by uncommenting this line.
      // if (kind === 'PF') await this.notifyCompletion(flag);
    } catch (err) {
      this.logger.error('checkAndCompleteFlags failed silently:', (err as Error)?.message);
    }
  }

  private async notifyCompletion(flag: { project: { projectNo: string; name: string }; customType: { name: string } | null; type: string | null }) {
    try {
      const recipients = await this.prisma.user.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          role: {
            rolePageAccess: {
              some: {
                hasAccess: true,
                page: { key: 'todays_pf_manage' },
              },
            },
          },
        },
        select: { email: true },
      });

      if (recipients.length === 0) return;

      const typeLabel = flag.customType?.name || PF_TYPE_LABELS[flag.type || ''] || flag.type || 'Unknown';
      const subject = `Today's PFs: ${flag.project.projectNo} — ${typeLabel} completed`;
      const html = `
        <div style="font-family: -apple-system, Arial, sans-serif; max-width: 480px;">
          <h2 style="color: #16a34a;">All PF codes added ✓</h2>
          <p>Project <strong>${flag.project.projectNo}</strong> (${flag.project.name}) — <strong>${typeLabel}</strong> now has PF codes for every item.</p>
        </div>
      `;

      await Promise.all(
        recipients.map(r => this.emailService.sendRawEmail({ to: r.email, subject, html }))
      );
    } catch (err) {
      this.logger.error('notifyCompletion failed silently:', (err as Error)?.message);
    }
  }
}
