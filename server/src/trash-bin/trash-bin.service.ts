import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AdminAlertService } from '../admin-alert/admin-alert.service';

export interface TrashQueryDto {
  moduleGroup?: string;
  page?: number;
  limit?: number;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class TrashBinService {
  private readonly logger = new Logger(TrashBinService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly adminAlertService: AdminAlertService,
  ) {}

  // ── PUBLIC API ──────────────────────────────────────────────────────

  async findAll(query: TrashQueryDto = {}) {
    const { moduleGroup, page = 1, limit = 100 } = query;
    const where: any = {};
    if (moduleGroup) where.moduleGroup = moduleGroup;

    const [items, total] = await Promise.all([
      this.prisma.trashBin.findMany({
        where,
        orderBy: { deletedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.trashBin.count({ where }),
    ]);

    // Group by moduleGroup
    const grouped: Record<string, any[]> = {};
    for (const item of items) {
      if (!grouped[item.moduleGroup]) grouped[item.moduleGroup] = [];
      grouped[item.moduleGroup].push(item);
    }

    return { data: items, grouped, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async restore(trashId: string, userId: string) {
    const entry = await this.prisma.trashBin.findUnique({ where: { id: trashId } });
    if (!entry) throw new NotFoundException('Trash entry not found');

    if (entry.restoreUntil < new Date()) {
      throw new BadRequestException('Restore window expired. This record can only be permanently deleted now.');
    }

    try {
      await this.restoreEntity(entry.entityType, entry.entityId);
    } catch (err) {
      this.logger.error(`Failed to restore entity ${entry.entityType}:${entry.entityId}`, err);
      throw new BadRequestException('Failed to restore record. It may have been permanently deleted.');
    }

    await this.prisma.trashBin.delete({ where: { id: trashId } });

    const userInfo = await this.auditLogService.resolveUser(userId);
    this.auditLogService.log({
      domain: 'TRASH_BIN',
      entityId: entry.entityId,
      entityType: entry.entityType,
      projectRef: entry.parentLabel || null,
      field: 'status',
      oldValue: 'DELETED',
      newValue: 'ACTIVE',
      action: 'RESTORE',
      userId,
      userName: userInfo?.name,
      userRole: userInfo?.role,
    }).catch(() => {});

    this.adminAlertService.warning(
      'Record Restored from Trash',
      `${entry.entityType} "${entry.entityLabel}" was restored from Trash by ${userInfo?.name || userId}.`,
      { source: 'TrashBinService', action: 'RESTORE', userId, entityType: entry.entityType, entityId: entry.entityId },
    ).catch(() => {});

    return { message: `"${entry.entityLabel}" restored successfully.` };
  }

  async permanentDelete(trashId: string, userId: string, force = false) {
    const entry = await this.prisma.trashBin.findUnique({ where: { id: trashId } });
    if (!entry) throw new NotFoundException('Trash entry not found');

    if (entry.restoreUntil > new Date() && !force) {
      throw new BadRequestException(
        `Cannot permanently delete within the 30-day restore window (expires ${entry.restoreUntil.toLocaleDateString()}). Pass force=true to override.`,
      );
    }

    // Audit log BEFORE deletion (must complete first)
    const userInfo = await this.auditLogService.resolveUser(userId);
    await this.auditLogService.log({
      domain: 'TRASH_BIN',
      entityId: entry.entityId,
      entityType: entry.entityType,
      projectRef: entry.parentLabel || null,
      field: 'status',
      oldValue: 'DELETED',
      newValue: 'PERMANENTLY_DELETED',
      action: 'PERMANENT_DELETE',
      userId,
      userName: userInfo?.name,
      userRole: userInfo?.role,
    });

    await this.adminAlertService.critical(
      'Permanent Delete Executed',
      `${entry.entityType} "${entry.entityLabel}" was permanently deleted by ${userInfo?.name || userId}.`,
      undefined,
      { source: 'TrashBinService', action: 'PERMANENT_DELETE', userId, userEmail: userInfo?.name, entityType: entry.entityType, entityId: entry.entityId },
    );

    // Hard delete the entity (cascade handles children)
    try {
      await this.hardDeleteEntity(entry.entityType, entry.entityId);
    } catch (err: any) {
      this.logger.warn(`Hard delete of ${entry.entityType}:${entry.entityId} failed (may already be gone):`, err?.message);
    }

    // Clean up trash entries (this + any child items)
    await this.prisma.trashBin.deleteMany({
      where: { OR: [{ id: trashId }, { parentId: entry.entityId }] },
    });

    return { message: `"${entry.entityLabel}" permanently deleted.` };
  }

  // ── SCHEDULED CLEANUP ───────────────────────────────────────────────

  @Cron('0 2 * * *')
  async autoCleanupExpired() {
    try {
      const now = new Date();
      const expired = await this.prisma.trashBin.findMany({
        where: { restoreUntil: { lt: now } },
        take: 200, // safety cap per run
      });

      if (expired.length === 0) {
        this.logger.log('Trash auto-cleanup: no expired records found.');
        return;
      }

      this.logger.log(`Trash auto-cleanup: found ${expired.length} expired records to permanently delete.`);

      let deleted = 0;
      let failed = 0;
      for (const entry of expired) {
        try {
          await this.hardDeleteEntity(entry.entityType, entry.entityId);
          await this.prisma.trashBin.delete({ where: { id: entry.id } });
          deleted++;
          this.logger.log(`Auto-deleted: ${entry.entityType} "${entry.entityLabel}" (${entry.entityId})`);
        } catch (err: any) {
          failed++;
          this.logger.error(`Auto-delete failed for ${entry.entityType}:${entry.entityId}:`, err?.message);
        }
      }

      this.logger.log(`Trash auto-cleanup complete: ${deleted} deleted, ${failed} failed.`);

      if (failed > 0) {
        this.adminAlertService.warning(
          'Trash Auto-Cleanup Partial Failure',
          `Auto-cleanup ran: ${deleted} records deleted, ${failed} failed. Check server logs.`,
          { source: 'TrashBinService.autoCleanupExpired' },
        ).catch(() => {});
      }
    } catch (err) {
      this.logger.error('Trash auto-cleanup crashed:', err);
    }
  }

  // ── PAGE PERMISSION SEEDING ─────────────────────────────────────────

  async seedPagePermission() {
    try {
      const existing = await this.prisma.pageRegistry.findUnique({ where: { key: 'trash_bin' } });
      if (!existing) {
        await this.prisma.pageRegistry.create({
          data: {
            key: 'trash_bin',
            name: 'Trash Bin',
            description: 'Recycle Bin — restore or permanently delete records within 30 days',
            isActive: true,
          },
        });
        this.logger.log('Seeded trash_bin page permission.');
      }
    } catch (err: any) {
      this.logger.warn('Could not seed trash_bin page permission:', err?.message);
    }
  }

  // ── TRASH ENTRY FACTORY (called by other services) ──────────────────

  buildTrashEntry(params: {
    entityType: string;
    entityId: string;
    entityLabel: string;
    moduleGroup: string;
    deletedByUserId?: string;
    deletedByName?: string;
    deletedReason?: string;
    parentId?: string;
    parentLabel?: string;
  }) {
    const now = new Date();
    return {
      entityType: params.entityType,
      entityId: params.entityId,
      entityLabel: params.entityLabel,
      moduleGroup: params.moduleGroup,
      deletedAt: now,
      deletedByUserId: params.deletedByUserId,
      deletedByName: params.deletedByName,
      deletedReason: params.deletedReason,
      restoreUntil: new Date(now.getTime() + THIRTY_DAYS_MS),
      parentId: params.parentId,
      parentLabel: params.parentLabel,
    };
  }

  // ── PRIVATE ENTITY OPERATIONS ───────────────────────────────────────

  private async restoreEntity(entityType: string, entityId: string) {
    const w = { where: { id: entityId }, data: { deletedAt: null } };
    switch (entityType) {
      case 'Project':                     await this.prisma.project.update(w); break;
      case 'ProjectItem':                 await this.prisma.projectItem.update(w); break;
      case 'DirectOrderProject':          await this.prisma.directOrderProject.update(w); break;
      case 'DirectOrderItem':             await this.prisma.directOrderItem.update(w); break;
      case 'MissingExtraCase':            await this.prisma.missingExtraCase.update(w); break;
      case 'MissingExtraItem':            await this.prisma.missingExtraItem.update(w); break;
      case 'TrustExpenseProject':         await this.prisma.trustExpenseProject.update(w); break;
      case 'TrustExpenseItem':            await this.prisma.trustExpenseItem.update(w); break;
      case 'ExpensesPProject':            await this.prisma.expensesPProject.update(w); break;
      case 'ExpensesPItem':               await this.prisma.expensesPItem.update(w); break;
      case 'ExpensesDirectOrderProject':  await this.prisma.expensesDirectOrderProject.update(w); break;
      case 'ExpensesDirectOrderItem':     await this.prisma.expensesDirectOrderItem.update(w); break;
      case 'ExpensesMissingExtraProject': await this.prisma.expensesMissingExtraProject.update(w); break;
      case 'ExpensesMissingExtraItem':    await this.prisma.expensesMissingExtraItem.update(w); break;
      case 'User':                        await this.prisma.user.update(w); break;
      default: throw new BadRequestException(`Unknown entity type: ${entityType}`);
    }
  }

  private async hardDeleteEntity(entityType: string, entityId: string) {
    const w = { where: { id: entityId } };
    switch (entityType) {
      case 'Project':                     await this.prisma.project.delete(w); break;
      case 'ProjectItem':                 await this.prisma.projectItem.delete(w); break;
      case 'DirectOrderProject':          await this.prisma.directOrderProject.delete(w); break;
      case 'DirectOrderItem':             await this.prisma.directOrderItem.delete(w); break;
      case 'MissingExtraCase':            await this.prisma.missingExtraCase.delete(w); break;
      case 'MissingExtraItem':            await this.prisma.missingExtraItem.delete(w); break;
      case 'TrustExpenseProject':         await this.prisma.trustExpenseProject.delete(w); break;
      case 'TrustExpenseItem':            await this.prisma.trustExpenseItem.delete(w); break;
      case 'ExpensesPProject':            await this.prisma.expensesPProject.delete(w); break;
      case 'ExpensesPItem':               await this.prisma.expensesPItem.delete(w); break;
      case 'ExpensesDirectOrderProject':  await this.prisma.expensesDirectOrderProject.delete(w); break;
      case 'ExpensesDirectOrderItem':     await this.prisma.expensesDirectOrderItem.delete(w); break;
      case 'ExpensesMissingExtraProject': await this.prisma.expensesMissingExtraProject.delete(w); break;
      case 'ExpensesMissingExtraItem':    await this.prisma.expensesMissingExtraItem.delete(w); break;
      case 'User':                        await this.prisma.user.delete(w); break;
      default: throw new BadRequestException(`Unknown entity type: ${entityType}`);
    }
  }
}
