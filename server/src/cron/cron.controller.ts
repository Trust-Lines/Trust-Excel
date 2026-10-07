import { Controller, Get, Headers, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { SkipThrottle } from '@nestjs/throttler';
import { AuditLogService } from '../audit-log/audit-log.service';
import { TokenCleanupService } from '../auth/token-cleanup.service';
import { TrashBinService } from '../trash-bin/trash-bin.service';
import { BackupService } from '../backup/backup.service';

/**
 * Vercel Cron entry point (see vercel.json "crons").
 * Replaces the in-process @Cron timers, which can't run on serverless.
 * Vercel sends `Authorization: Bearer ${CRON_SECRET}`.
 */
@Controller('cron')
@SkipThrottle()
export class CronController {
  private readonly logger = new Logger(CronController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {}

  private assertAuthorized(authorization?: string) {
    const secret = this.config.get<string>('CRON_SECRET');
    if (!secret || authorization !== `Bearer ${secret}`) {
      throw new UnauthorizedException();
    }
  }

  private async run(name: string, fn: () => Promise<unknown>) {
    const start = Date.now();
    try {
      await fn();
      return { job: name, ok: true, ms: Date.now() - start };
    } catch (err: any) {
      this.logger.error(`CRON ${name} failed`, err?.stack || err);
      return { job: name, ok: false, ms: Date.now() - start, error: err?.message || String(err) };
    }
  }

  private svc<T>(type: new (...args: any[]) => T): T {
    return this.moduleRef.get(type, { strict: false });
  }

  /** Daily maintenance: token cleanup, trash purge, audit-log retention. */
  @Get('daily')
  async daily(@Headers('authorization') authorization?: string) {
    this.assertAuthorized(authorization);
    const results = [];
    results.push(await this.run('token-cleanup', () => this.svc(TokenCleanupService).cleanupTokens()));
    results.push(await this.run('trash-cleanup', () => this.svc(TrashBinService).autoCleanupExpired()));
    results.push(await this.run('audit-log-cleanup', () => this.svc(AuditLogService).cleanupOldLogs()));
    return { results };
  }

  /** Daily Excel backup to Supabase Storage (+ keep last 7 days). */
  @Get('backup')
  async backup(@Headers('authorization') authorization?: string) {
    this.assertAuthorized(authorization);
    return { results: [await this.run('backup', () => this.svc(BackupService).handleDailyBackup())] };
  }
}
