import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { Cron } from '@nestjs/schedule';

/**
 * Default audit-log retention. Override with AUDIT_LOG_RETENTION_DAYS in .env.
 * 365 days is conservative for company-grade traceability without exploding the
 * table. Lower it for staging/dev; do NOT raise without checking row growth.
 */
const DEFAULT_AUDIT_LOG_RETENTION_DAYS = 365;
const MIN_AUDIT_LOG_RETENTION_DAYS = 7;

export interface AuditLogEntry {
  domain: string;
  entityId: string;
  entityType: string;
  projectRef?: string;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
  action?: string;
  userId: string;
  userName?: string;
  userRole?: string;
}

export interface AuditLogQuery {
  domain?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * Resolve the configured retention window in days. Falls back to the default
   * if the env var is missing, malformed, or below the safety floor. Never
   * mutates DB state — caller decides what to do with the value.
   */
  private getRetentionDays(): number {
    const raw = process.env.AUDIT_LOG_RETENTION_DAYS;
    if (!raw) return DEFAULT_AUDIT_LOG_RETENTION_DAYS;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < MIN_AUDIT_LOG_RETENTION_DAYS) {
      this.logger.warn(
        `AUDIT_LOG_RETENTION_DAYS="${raw}" is invalid or below floor (${MIN_AUDIT_LOG_RETENTION_DAYS}); falling back to ${DEFAULT_AUDIT_LOG_RETENTION_DAYS}.`,
      );
      return DEFAULT_AUDIT_LOG_RETENTION_DAYS;
    }
    return parsed;
  }

  /**
   * Log a single field change
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const created = await this.prisma.auditLog.create({
        data: {
          domain: entry.domain,
          entityId: entry.entityId,
          entityType: entry.entityType,
          projectRef: entry.projectRef || null,
          field: entry.field,
          oldValue: entry.oldValue ?? null,
          newValue: entry.newValue ?? null,
          action: entry.action || 'UPDATE',
          userId: entry.userId,
          userName: entry.userName || null,
          userRole: entry.userRole || null,
        },
      });
      this.eventsGateway.emitToRooms(['activity-log'], 'audit-log:new-entry', { entry: created });
    } catch (error) {
      console.error('AUDIT_LOG_ERROR: Failed to log entry:', error.message);
    }
  }

  /**
   * Log multiple field changes at once (non-blocking)
   */
  async logBatch(entries: AuditLogEntry[]): Promise<void> {
    if (entries.length === 0) return;

    try {
      await this.prisma.auditLog.createMany({
        data: entries.map((entry) => ({
          domain: entry.domain,
          entityId: entry.entityId,
          entityType: entry.entityType,
          projectRef: entry.projectRef || null,
          field: entry.field,
          oldValue: entry.oldValue ?? null,
          newValue: entry.newValue ?? null,
          action: entry.action || 'UPDATE',
          userId: entry.userId,
          userName: entry.userName || null,
          userRole: entry.userRole || null,
        })),
      });
      this.eventsGateway.emitToRooms(['activity-log'], 'audit-log:new-entries', { count: entries.length });
    } catch (error) {
      console.error('AUDIT_LOG_ERROR: Failed to log batch:', error.message);
    }
  }

  /**
   * Find audit logs with filtering and pagination
   */
  async findAll(query: AuditLogQuery) {
    const {
      domain,
      userId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50,
    } = query;

    const where: any = {};

    if (domain) {
      where.domain = domain;
    }

    if (userId) {
      where.userId = userId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const validatedLimit = Math.min(Math.max(1, limit), 100);
    const validatedPage = Math.max(1, page);
    const skip = (validatedPage - 1) * validatedLimit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: validatedLimit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page: validatedPage,
        limit: validatedLimit,
        totalPages: Math.ceil(total / validatedLimit),
      },
    };
  }

  /**
   * Get all users with their online/offline status
   */
  async getAllUsersWithStatus() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastActiveAt: true,
        lastLoginAt: true,
        role: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name || user.email,
      email: user.email,
      role: user.role.name,
      isActive: user.isActive,
      isOnline: user.lastActiveAt ? user.lastActiveAt > fiveMinutesAgo : false,
      lastActiveAt: user.lastActiveAt?.toISOString() || null,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
    }));
  }

  /**
   * Update user's lastActiveAt timestamp
   */
  async touchUserActivity(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      });
      this.eventsGateway.emitToRooms(['activity-log'], 'active-users:updated', {});
    } catch (error) {
      // Silent fail - activity tracking should not break requests
    }
  }

  /**
   * Resolve user info for audit logging
   */
  async resolveUser(userId: string): Promise<{ name: string; role: string } | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          role: { select: { name: true } },
        },
      });
      if (!user) return null;
      return {
        name: user.name || user.email,
        role: user.role.name,
      };
    } catch {
      return null;
    }
  }

  /**
   * Daily cleanup of audit logs older than the configured retention window.
   * Window is read from AUDIT_LOG_RETENTION_DAYS at run time, so changing the
   * env var takes effect on the next nightly run — no redeploy required.
   */
  @Cron('0 3 * * *')
  async cleanupOldLogs(): Promise<void> {
    const retentionDays = this.getRetentionDays();
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    try {
      const result = await this.prisma.auditLog.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });
      this.logger.log(
        `AUDIT_LOG_CLEANUP: deleted ${result.count} log(s) older than ${retentionDays} days (cutoff=${cutoff.toISOString()})`,
      );
    } catch (error) {
      this.logger.error(
        `AUDIT_LOG_CLEANUP_ERROR (retentionDays=${retentionDays})`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
