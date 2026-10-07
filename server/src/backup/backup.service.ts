import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { BackupStorage } from './backup-storage';

import { generateProjectsExcel } from './generators/projects-excel.gen';
import { generateDirectOrderExcel } from './generators/direct-order-excel.gen';
import { generateMissingExtraExcel } from './generators/missing-extra-excel.gen';
import { generateExpensesPExcel } from './generators/expenses-p-excel.gen';
import { generateExpensesDoExcel } from './generators/expenses-do-excel.gen';
import { generateExpensesMeExcel } from './generators/expenses-me-excel.gen';
import { generateTrustExpenseExcel } from './generators/trust-expense-excel.gen';
import { generateSupplierTotalExcel } from './generators/supplier-total-excel.gen';
import { generateProjectTotalExcel } from './generators/project-total-excel.gen';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private backupRunning = false; // Overlap guard

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: BackupStorage,
  ) {}

  /** Every night at 00:00 — generate backups + clean old ones (keep 7 days) */
  @Cron('0 0 * * *')
  async handleDailyBackup(): Promise<void> {
    if (this.backupRunning) {
      this.logger.warn('BACKUP: skipped (already running)');
      return;
    }
    this.backupRunning = true;
    const start = Date.now();
    try {
      await this.runFullBackup();
      await this.cleanOldBackups(7);
      this.logger.log(`BACKUP: completed in ${Date.now() - start}ms`);
    } catch (err) {
      this.logger.error('BACKUP: failed', err);
    } finally {
      this.backupRunning = false;
    }
  }

  /** Run full backup — can be called manually */
  async runFullBackup(): Promise<string> {
    const date = new Date().toISOString().slice(0, 10);

    const generators = [
      { name: 'Projects', fn: () => generateProjectsExcel(this.prisma) },
      { name: 'DirectOrders', fn: () => generateDirectOrderExcel(this.prisma) },
      { name: 'MissingExtra', fn: () => generateMissingExtraExcel(this.prisma) },
      { name: 'Expenses_P', fn: () => generateExpensesPExcel(this.prisma) },
      { name: 'Expenses_DO', fn: () => generateExpensesDoExcel(this.prisma) },
      { name: 'Expenses_ME', fn: () => generateExpensesMeExcel(this.prisma) },
      { name: 'TrustExpenses', fn: () => generateTrustExpenseExcel(this.prisma) },
      { name: 'SupplierTotal', fn: () => generateSupplierTotalExcel(this.prisma) },
      { name: 'ProjectTotal', fn: () => generateProjectTotalExcel(this.prisma) },
    ];

    for (const gen of generators) {
      try {
        const start = Date.now();
        const wb = await gen.fn();
        const buffer = Buffer.from(await wb.xlsx.writeBuffer());
        await this.storage.save(date, `${gen.name}.xlsx`, buffer);
        this.logger.log(`Generated ${gen.name}.xlsx (${Date.now() - start}ms)`);
      } catch (err) {
        this.logger.error(`Failed to generate ${gen.name}`, err);
      }
    }

    return this.storage.describe(date);
  }

  /** List all backup dates */
  listBackupDates(): Promise<string[]> {
    return this.storage.listDates();
  }

  /** List files for a specific date */
  listBackupFiles(date: string): Promise<string[]> {
    return this.storage.listFiles(date);
  }

  /** Read a backup file (null if missing / invalid name) */
  readBackupFile(date: string, filename: string): Promise<Buffer | null> {
    return this.storage.read(date, filename);
  }

  /** Clean backups older than N days */
  async cleanOldBackups(maxDays: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - maxDays);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    let removed = 0;
    for (const dir of await this.storage.listDates()) {
      if (dir < cutoffStr) {
        await this.storage.removeDate(dir);
        this.logger.log(`Removed old backup: ${dir}`);
        removed++;
      }
    }

    return removed;
  }
}
