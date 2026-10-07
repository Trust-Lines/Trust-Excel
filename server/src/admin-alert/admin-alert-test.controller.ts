import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminAlertService } from './admin-alert.service';

/**
 * Internal test endpoint — verifies every alert scenario sends correctly.
 * Route: POST /api/admin-alert/test/run-all
 */
@Controller('admin-alert/test')
export class AdminAlertTestController {
  constructor(private readonly adminAlertService: AdminAlertService) {}

  @Post('run-all')
  @HttpCode(HttpStatus.OK)
  async runAll(): Promise<{ results: Array<{ scenario: string; status: string }> }> {
    const results: Array<{ scenario: string; status: string }> = [];

    const run = async (label: string, fn: () => Promise<void>) => {
      try {
        await fn();
        results.push({ scenario: label, status: 'sent' });
      } catch {
        results.push({ scenario: label, status: 'failed' });
      }
    };

    // ── 1. SIMPLE ERROR ───────────────────────────────────────────────
    await run('1. Simple Error Alert', () =>
      this.adminAlertService.error(
        'Failed API Request',
        'POST /api/projects returned 500 — database timeout after 30s',
        undefined,
        { source: 'ProjectsController', action: 'POST /api/projects' },
      ),
    );

    // ── 2. ERROR WITH STACK TRACE ─────────────────────────────────────
    await run('2. Error with Stack Trace', () => {
      const err = new Error('Cannot read properties of undefined (reading "id")');
      err.stack = `Error: Cannot read properties of undefined (reading 'id')
    at ProjectsService.updateItem (projects.service.ts:312:24)
    at async ProjectsController.update (projects.controller.ts:88:5)
    at async RouterExecutionContext.<anonymous> (router-execution-context.js:46:28)
    at async RouterProxy.createErrorHandler (router-proxy.js:15:7)`;
      return this.adminAlertService.error(
        'Unhandled Exception in ProjectsService',
        err.message,
        err,
        {
          source: 'ProjectsService',
          action: 'updateItem',
          userId: 'usr_test_001',
          userEmail: 'operator@trustlines.com',
          entityType: 'project-item',
          entityId: 'item_abc123',
        },
      );
    });

    // ── 3. WARNING ────────────────────────────────────────────────────
    await run('3. Warning Alert', () =>
      this.adminAlertService.warning(
        'Multiple Failed Login Attempts',
        '5 consecutive failed login attempts for user hamzaghannom@gmail.com from IP 185.220.101.42',
        {
          source: 'AuthService',
          action: 'LOGIN_FAILED',
          userEmail: 'hamzaghannom@gmail.com',
          extra: { ip: '185.220.101.42', attempts: 5, lastAttemptAt: new Date().toISOString() },
        },
      ),
    );

    // ── 4. CRITICAL — PROCESS CRASH SIMULATION ────────────────────────
    await run('4. Critical — Process Crash Simulation', () => {
      const err = new Error('FATAL: Out of memory — heap allocation failed');
      err.stack = `Error: FATAL: Out of memory — heap allocation failed
    at Object.<anonymous> (main.ts:14:1)
    at Module._compile (internal/modules/cjs/loader.js:999:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)`;
      return this.adminAlertService.critical(
        'Uncaught Exception — Server Shutdown',
        err.message,
        err,
        { source: 'process.uncaughtException' },
      );
    });

    // ── 5. CRITICAL — OPERATIONAL ACTION ─────────────────────────────
    await run('5. Critical — Project Deleted', () =>
      this.adminAlertService.critical(
        'Project Permanently Deleted',
        'Project PRJ-2024-088 "Istanbul Container Shipment" was deleted by an admin user.',
        undefined,
        {
          source: 'ProjectsService',
          action: 'DELETE_PROJECT',
          userId: 'usr_admin_007',
          userEmail: 'hamzaghannom@gmail.com',
          entityType: 'project',
          entityId: 'prj_test_088',
          extra: {
            projectNo: 'PRJ-2024-088',
            projectName: 'Istanbul Container Shipment',
            itemCount: 14,
            deletedAt: new Date().toISOString(),
          },
        },
      ),
    );

    // ── 6. CRITICAL — DATABASE FAILURE ───────────────────────────────
    await run('6. Critical — Database Connection Failure', () => {
      const err = new Error("Can't reach database server at `postgres.railway.internal:5432`");
      err.stack = `Error: Can't reach database server
    at PrismaClientKnownRequestError.init (prisma-client.js:114:28)
    at new PrismaClientKnownRequestError (prisma-client.js:94:5)
    at PrismaService.onModuleInit (prisma.service.ts:18:7)`;
      return this.adminAlertService.critical(
        'PostgreSQL Connection Failure',
        err.message,
        err,
        {
          source: 'PrismaService',
          extra: {
            host: 'postgres.railway.internal',
            port: 5432,
            errorCode: 'P1001',
            retriesExhausted: true,
          },
        },
      );
    });

    // ── 7. WARNING — PERMISSION DENIAL LOOP ──────────────────────────
    await run('7. Warning — Permission Denial Loop', () =>
      this.adminAlertService.warning(
        'Repeated Permission Denials',
        'User attempted to access restricted resource 8 times in 2 minutes.',
        {
          source: 'CombinedAccessGuard',
          action: 'ACCESS_DENIED',
          userId: 'usr_test_099',
          userEmail: 'unknown@external.com',
          entityType: 'page',
          entityId: 'admin_roles_permissions',
          extra: { denialCount: 8, windowMinutes: 2, lastAttemptAt: new Date().toISOString() },
        },
      ),
    );

    // ── 8. ERROR — SMTP FAILURE ───────────────────────────────────────
    await run('8. Error — SMTP Delivery Failure', () =>
      this.adminAlertService.error(
        'SMTP Email Delivery Failed',
        'Invitation email to newuser@company.com failed: Connection timeout after 10s',
        undefined,
        {
          source: 'EmailService',
          action: 'SEND_INVITE_EMAIL',
          extra: {
            recipient: 'newuser@company.com',
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            errorCode: 'ETIMEDOUT',
          },
        },
      ),
    );

    // ── 9. CRITICAL — BACKUP RESTORE ──────────────────────────────────
    await run('9. Critical — Backup Restore Triggered', () =>
      this.adminAlertService.critical(
        'Database Backup Restore Initiated',
        'A full database restore was triggered. All current data will be overwritten.',
        undefined,
        {
          source: 'BackupService',
          action: 'RESTORE_BACKUP',
          userId: 'usr_admin_001',
          userEmail: 'hamzaghannom@gmail.com',
          extra: {
            backupFile: 'trust-lines-backup-2026-05-08.xlsx',
            triggeredAt: new Date().toISOString(),
            estimatedRecords: 4200,
          },
        },
      ),
    );

    // ── 10. WARNING — JWT FAILURE ─────────────────────────────────────
    await run('10. Warning — JWT/Auth Failure', () =>
      this.adminAlertService.warning(
        'JWT Validation Failure',
        'Token signature verification failed — possible tampered token detected.',
        {
          source: 'JwtStrategy',
          action: 'JWT_VERIFY_FAILED',
          extra: {
            reason: 'invalid signature',
            tokenPrefix: 'eyJhbGciOiJIUzI1NiJ9...',
            ip: '91.198.174.192',
          },
        },
      ),
    );

    return { results };
  }
}
