import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { BackupStorage } from './backup-storage';

// ── Types ──

export interface FileRestoreResult {
  file: string;
  projectsCreated: number;
  projectsSkipped: number;
  itemsCreated: number;
  itemsSkipped: number;
  errors: string[];
}

export interface RestoreResult {
  results: FileRestoreResult[];
  totalDuration: number;
}

// ── Bucket mapping (Excel label → enum) ──

const BUCKET_MAP: Record<string, string> = {
  'TLines NE': 'TLINES_NE',
  'TLINES_NE': 'TLINES_NE',
  'TLines SE': 'TLINES_SE',
  'TLINES_SE': 'TLINES_SE',
  'TLines NW': 'TLINES_NW',
  'TLINES_NW': 'TLINES_NW',
  'TLines CVW': 'CVW',
  'CVW': 'CVW',
  'TLines HQ': 'TLINES_HQ',
  'TLINES_HQ': 'TLINES_HQ',
  'TLines TC': 'TLINES_TC',
  'TLINES_TC': 'TLINES_TC',
};

// ── Status mapping (human readable → enum) ──

const STATUS_MAP: Record<string, string> = {
  'HOLD T': 'HOLD_T',
  'HOLD PM': 'HOLD_PM',
  'NOT ORDERED': 'NOT_ORDERED',
  'TO ORDER': 'TO_ORDER',
  'BOOKS IN PROGRESS': 'BOOKS_IN_PROGRESS',
  'HOLD BOOKS': 'HOLD_BOOKS',
  'ORDERED': 'ORDERED',
  'WAITING PAYMENT': 'WAITING_PAYMENT',
  'ASSEMBLY': 'ASSEMBLY',
  'READY TO RECEIVE': 'READY_TO_RECEIVE',
  'RECEIVED': 'RECEIVED',
  'READY': 'READY',
  'SENT TO TLINES': 'SENT_TO_TLINES',
  'PARTIAL SENT': 'PARTIAL_SENT',
  'SENT': 'SENT',
};

const SIGN_STATUS_MAP: Record<string, string> = {
  'NOT SIGNED': 'NOT_SIGNED',
  'READY TO SIGN': 'READY_TO_SIGN',
  'SIGNED': 'SIGNED',
  'WAITING TLINES TO SIGN': 'WAITING_TLINES_TO_SIGN',
  'WAITING T TO SIGN': 'WAITING_T_TO_SIGN',
  'SIGNED WITH EST PRICE': 'SIGNED_WITH_EST_PRICE',
};

// ── Item type mapping ──

const ITEM_TYPE_ENUMS = ['MILLWORK', 'SHELVING', 'CEILING', 'IMAGE', 'FURNITURE', 'DECORATION'];

// ── File type → parser mapping key ──

const FILE_PARSERS: Record<string, string> = {
  'Projects': 'projects',
  'DirectOrders': 'directOrders',
  'MissingExtra': 'missingExtra',
  'Expenses_P': 'expensesP',
  'Expenses_DO': 'expensesDO',
  'Expenses_ME': 'expensesME',
  'TrustExpenses': 'trustExpenses',
};

@Injectable()
export class RestoreService {
  private readonly logger = new Logger(RestoreService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: BackupStorage,
  ) {}

  // ══════════════════════════════════════════════════════════
  // PUBLIC ENTRY POINTS
  // ══════════════════════════════════════════════════════════

  async restoreFromServerBackup(date: string, files?: string[]): Promise<RestoreResult> {
    const start = Date.now();
    const allFiles = await this.storage.listFiles(date);
    if (allFiles.length === 0) {
      return { results: [{ file: 'N/A', projectsCreated: 0, projectsSkipped: 0, itemsCreated: 0, itemsSkipped: 0, errors: [`Backup directory not found: ${date}`] }], totalDuration: Date.now() - start };
    }

    const targetFiles = files && files.length > 0
      ? allFiles.filter((f) => files.includes(f.replace('.xlsx', '')))
      : allFiles;

    const results: FileRestoreResult[] = [];
    for (const file of targetFiles) {
      const fileKey = file.replace('.xlsx', '');
      const parserKey = FILE_PARSERS[fileKey];
      if (!parserKey) {
        this.logger.warn(`RESTORE: skipping unknown file type: ${file}`);
        continue;
      }
      const result = await this.restoreFile(date, file, parserKey, fileKey);
      results.push(result);
    }

    return { results, totalDuration: Date.now() - start };
  }

  async restoreFromUpload(buffer: Buffer, fileType: string): Promise<RestoreResult> {
    const start = Date.now();
    const parserKey = FILE_PARSERS[fileType];
    if (!parserKey) {
      return { results: [{ file: fileType, projectsCreated: 0, projectsSkipped: 0, itemsCreated: 0, itemsSkipped: 0, errors: [`Unknown file type: ${fileType}`] }], totalDuration: Date.now() - start };
    }

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);
    const ws = wb.worksheets[0];
    if (!ws) {
      return { results: [{ file: fileType, projectsCreated: 0, projectsSkipped: 0, itemsCreated: 0, itemsSkipped: 0, errors: ['No worksheet found in uploaded file'] }], totalDuration: Date.now() - start };
    }

    const result = await this.parseAndRestore(ws, parserKey, fileType);
    return { results: [result], totalDuration: Date.now() - start };
  }

  // ══════════════════════════════════════════════════════════
  // PRIVATE: FILE LOADING + DISPATCH
  // ══════════════════════════════════════════════════════════

  private async restoreFile(date: string, file: string, parserKey: string, fileName: string): Promise<FileRestoreResult> {
    try {
      const buffer = await this.storage.read(date, file);
      if (!buffer) {
        return { file: fileName, projectsCreated: 0, projectsSkipped: 0, itemsCreated: 0, itemsSkipped: 0, errors: ['Backup file not found'] };
      }
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer as any);
      const ws = wb.worksheets[0];
      if (!ws) {
        return { file: fileName, projectsCreated: 0, projectsSkipped: 0, itemsCreated: 0, itemsSkipped: 0, errors: ['No worksheet found'] };
      }
      return await this.parseAndRestore(ws, parserKey, fileName);
    } catch (err: any) {
      return { file: fileName, projectsCreated: 0, projectsSkipped: 0, itemsCreated: 0, itemsSkipped: 0, errors: [err.message || String(err)] };
    }
  }

  private async parseAndRestore(ws: ExcelJS.Worksheet, parserKey: string, fileName: string): Promise<FileRestoreResult> {
    switch (parserKey) {
      case 'projects': return this.parseAndRestoreProjects(ws, fileName);
      case 'directOrders': return this.parseAndRestoreDirectOrders(ws, fileName);
      case 'missingExtra': return this.parseAndRestoreMissingExtra(ws, fileName);
      case 'expensesP': return this.parseAndRestoreExpensesP(ws, fileName);
      case 'expensesDO': return this.parseAndRestoreExpensesDO(ws, fileName);
      case 'expensesME': return this.parseAndRestoreExpensesME(ws, fileName);
      case 'trustExpenses': return this.parseAndRestoreTrustExpenses(ws, fileName);
      default:
        return { file: fileName, projectsCreated: 0, projectsSkipped: 0, itemsCreated: 0, itemsSkipped: 0, errors: [`No parser for: ${parserKey}`] };
    }
  }

  // ══════════════════════════════════════════════════════════
  // HELPERS: Cell detection & parsing
  // ══════════════════════════════════════════════════════════

  private cellStr(cell: ExcelJS.Cell): string {
    if (cell.value === null || cell.value === undefined) return '';
    if (typeof cell.value === 'object' && 'richText' in cell.value) {
      return (cell.value as any).richText.map((r: any) => r.text).join('');
    }
    if (typeof cell.value === 'object' && 'result' in cell.value) {
      return String((cell.value as any).result ?? '');
    }
    return String(cell.value);
  }

  private cellNum(cell: ExcelJS.Cell): number | null {
    const v = cell.value;
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return v;
    if (typeof v === 'object' && 'result' in v) {
      const r = (v as any).result;
      return typeof r === 'number' ? r : null;
    }
    const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : null;
  }

  private getCellBgColor(cell: ExcelJS.Cell): string | null {
    const fill = cell.fill as any;
    if (!fill || fill.type !== 'pattern') return null;
    const argb = fill.fgColor?.argb;
    if (!argb) return null;
    // ExcelJS sometimes returns 8-char ARGB (e.g., FFB02417), strip alpha
    return argb.length === 8 ? argb.substring(2).toUpperCase() : argb.toUpperCase();
  }

  private isMerged(ws: ExcelJS.Worksheet, rowNum: number, col1: number, col2: number): boolean {
    // Check if cell at (rowNum, col1) is merged across to col2 or beyond
    const merges = (ws as any)._merges || {};
    for (const key of Object.keys(merges)) {
      const m = merges[key];
      if (m && m.top === rowNum && m.left === col1 && m.right >= col2) return true;
    }
    return false;
  }

  private isSectionHeader(ws: ExcelJS.Worksheet, row: ExcelJS.Row): boolean {
    const bg = this.getCellBgColor(row.getCell(1));
    return bg === 'B02417' && this.isMerged(ws, row.number, 1, 5);
  }

  private isProjectHeader(ws: ExcelJS.Worksheet, row: ExcelJS.Row): boolean {
    const bg = this.getCellBgColor(row.getCell(1));
    return bg === 'DE8244' && this.isMerged(ws, row.number, 1, 5);
  }

  private isColumnHeader(row: ExcelJS.Row): boolean {
    const bg = this.getCellBgColor(row.getCell(1));
    return bg === '374151' || bg === '000000';
  }

  private isTotalRow(row: ExcelJS.Row): boolean {
    const val = this.cellStr(row.getCell(1)).toLowerCase();
    return val.includes('total') || val.includes('grand total');
  }

  private isTotalOrEmpty(row: ExcelJS.Row): boolean {
    const val = this.cellStr(row.getCell(1)).toLowerCase();
    if (val.includes('total')) return true;
    // Check if row is empty
    let allEmpty = true;
    row.eachCell({ includeEmpty: false }, () => { allEmpty = false; });
    return allEmpty;
  }

  private isBlankRow(row: ExcelJS.Row): boolean {
    let allEmpty = true;
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (cell.value !== null && cell.value !== undefined && String(cell.value).trim() !== '') {
        allEmpty = false;
      }
    });
    return allEmpty;
  }

  private parseBucket(label: string): string | null {
    const trimmed = label.trim();
    // Remove trailing " Total" if present
    const clean = trimmed.replace(/\s*Total\s*$/i, '').trim();
    return BUCKET_MAP[clean] || null;
  }

  private parseStatus(val: string): string | null {
    if (!val) return null;
    const upper = val.trim().toUpperCase();
    return STATUS_MAP[upper] || upper.replace(/\s+/g, '_') || null;
  }

  private parseSignStatus(val: string): string | null {
    if (!val) return null;
    const upper = val.trim().toUpperCase();
    return SIGN_STATUS_MAP[upper] || upper.replace(/\s+/g, '_') || null;
  }

  private parseDate(val: string): Date | null {
    if (!val || val.trim() === '') return null;
    const trimmed = val.trim();

    // Try DD/MM/YY format (from formatDate in shared-styles)
    const ddmmyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (ddmmyy) {
      const day = parseInt(ddmmyy[1]);
      const month = parseInt(ddmmyy[2]) - 1;
      let year = parseInt(ddmmyy[3]);
      if (year < 100) year += 2000;
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }

    // Try ISO format
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;

    return null;
  }

  private parseDateCell(cell: ExcelJS.Cell): Date | null {
    const v = cell.value;
    if (v instanceof Date) return v;
    return this.parseDate(this.cellStr(cell));
  }

  /** Parse "CODE - NAME" vendor string → find or create vendor */
  private async resolveVendor(vendorStr: string): Promise<string | null> {
    if (!vendorStr || vendorStr.trim() === '') return null;
    const parts = vendorStr.split(' - ');
    const code = parts[0]?.trim();
    if (!code) return null;
    const name = parts.slice(1).join(' - ').trim() || code;

    let vendor = await this.prisma.vendor.findFirst({ where: { code } });
    if (!vendor) {
      vendor = await this.prisma.vendor.create({ data: { code, name, isActive: true } });
      this.logger.log(`RESTORE: Created vendor: ${code} - ${name}`);
    }
    return vendor.id;
  }

  /** Resolve item type → customTypeId or ProjectItemType enum */
  private async resolveType(typeStr: string): Promise<{ type: string | null; customTypeId: string | null }> {
    if (!typeStr || typeStr.trim() === '') return { type: null, customTypeId: null };
    const upper = typeStr.trim().toUpperCase();

    // Check if it's a built-in enum
    if (ITEM_TYPE_ENUMS.includes(upper)) {
      return { type: upper, customTypeId: null };
    }

    // Otherwise find or skip custom type (don't create — custom types need manual setup)
    const custom = await this.prisma.customProjectType.findFirst({
      where: { OR: [{ code: typeStr.trim() }, { name: typeStr.trim() }] },
    });
    if (custom) {
      return { type: null, customTypeId: custom.id };
    }

    // Fallback: try as enum anyway (case insensitive)
    const enumMatch = ITEM_TYPE_ENUMS.find((e) => e === upper);
    if (enumMatch) return { type: enumMatch, customTypeId: null };

    return { type: null, customTypeId: null };
  }

  /** Parse project header "PROJNO - Project Name" */
  private parseProjectHeader(val: string): { projectNo: string; name: string } | null {
    if (!val) return null;
    const idx = val.indexOf(' - ');
    if (idx === -1) return { projectNo: val.trim(), name: '' };
    return {
      projectNo: val.substring(0, idx).trim(),
      name: val.substring(idx + 3).trim(),
    };
  }

  /** Parse ME case header "PROJNO - Name (DerivedCode)" */
  private parseMECaseHeader(val: string): { baseProjectNo: string; baseProjectName: string; derivedProjectCode: string } | null {
    if (!val) return null;
    const match = val.match(/^(.+?)\s*-\s*(.+?)\s*\(([^)]+)\)\s*$/);
    if (match) {
      return {
        baseProjectNo: match[1].trim(),
        baseProjectName: match[2].trim(),
        derivedProjectCode: match[3].trim(),
      };
    }
    // Fallback: no parenthesized code
    const idx = val.indexOf(' - ');
    if (idx !== -1) {
      return {
        baseProjectNo: val.substring(0, idx).trim(),
        baseProjectName: val.substring(idx + 3).trim(),
        derivedProjectCode: val.trim(),
      };
    }
    return null;
  }

  // ══════════════════════════════════════════════════════════
  // PARSER: Projects.xlsx
  // ══════════════════════════════════════════════════════════

  private async parseAndRestoreProjects(ws: ExcelJS.Worksheet, fileName: string): Promise<FileRestoreResult> {
    const result: FileRestoreResult = { file: fileName, projectsCreated: 0, projectsSkipped: 0, itemsCreated: 0, itemsSkipped: 0, errors: [] };
    let currentBucket: string | null = null;
    let currentProject: { projectNo: string; name: string } | null = null;
    let inDataSection = false;

    // Columns: Project No(1), Type(2), PF Code(3), Vendor(4), PF Sign(5), PO Sign(6), Status(7), PF/USD(8), PF/TL(9), STD(10), ETD(11), RTD(12), FTD(13), Container No(14), Payment Rule(15)

    ws.eachRow((row, rowNum) => {
      // Skip if blank
      if (this.isBlankRow(row)) { inDataSection = false; return; }

      // Section header
      if (this.isSectionHeader(ws, row)) {
        currentBucket = this.parseBucket(this.cellStr(row.getCell(1)));
        currentProject = null;
        inDataSection = false;
        return;
      }

      // Project header
      if (this.isProjectHeader(ws, row)) {
        currentProject = this.parseProjectHeader(this.cellStr(row.getCell(1)));
        inDataSection = false;
        return;
      }

      // Column header
      if (this.isColumnHeader(row)) {
        inDataSection = true;
        return;
      }

      // Total rows
      if (this.isTotalRow(row)) {
        inDataSection = false;
        return;
      }

      // Data row — collect for batch processing
      // We'll process row-by-row in the async pass below
    });

    // Second pass: async processing
    const rowsToProcess: { rowNum: number; bucket: string; projectNo: string; projectName: string; cells: string[] }[] = [];
    let bucket: string | null = null;
    let proj: { projectNo: string; name: string } | null = null;
    let dataMode = false;

    ws.eachRow((row, rowNum) => {
      if (this.isBlankRow(row)) { dataMode = false; return; }
      if (this.isSectionHeader(ws, row)) {
        bucket = this.parseBucket(this.cellStr(row.getCell(1)));
        proj = null; dataMode = false; return;
      }
      if (this.isProjectHeader(ws, row)) {
        proj = this.parseProjectHeader(this.cellStr(row.getCell(1)));
        dataMode = false; return;
      }
      if (this.isColumnHeader(row)) { dataMode = true; return; }
      if (this.isTotalRow(row)) { dataMode = false; return; }

      if (dataMode && bucket && proj) {
        rowsToProcess.push({
          rowNum,
          bucket,
          projectNo: proj.projectNo,
          projectName: proj.name,
          cells: Array.from({ length: 15 }, (_, i) => this.cellStr(row.getCell(i + 1))),
        });
      }
    });

    // Group by project
    const projectGroups = new Map<string, typeof rowsToProcess>();
    for (const r of rowsToProcess) {
      const key = `${r.bucket}::${r.projectNo}`;
      if (!projectGroups.has(key)) projectGroups.set(key, []);
      projectGroups.get(key)!.push(r);
    }

    for (const [key, rows] of projectGroups) {
      const { bucket: b, projectNo, projectName } = rows[0];
      try {
        // Check if project exists
        const existing = await this.prisma.project.findFirst({
          where: { projectNo, bucket: b as any },
          include: { items: true },
        });

        if (existing) {
          result.projectsSkipped++;
          // Check for missing items
          for (const r of rows) {
            const typeStr = r.cells[1]; // Type
            const vendorStr = r.cells[3]; // Vendor
            const pfCode = r.cells[2]; // PF Code

            // Simple match: type + vendor + pfCode
            const itemExists = existing.items.some((item: any) => {
              const existingType = item.customType?.code || item.type || '';
              const existingVendor = ''; // We don't have vendor loaded, match by other fields
              return (item.pfCode || '') === (pfCode || '') && existingType === typeStr;
            });

            if (itemExists) {
              result.itemsSkipped++;
            } else {
              // Create item
              try {
                const typeInfo = await this.resolveType(typeStr);
                const vendorId = await this.resolveVendor(vendorStr);
                await this.prisma.projectItem.create({
                  data: {
                    projectId: existing.id,
                    type: typeInfo.type as any,
                    customTypeId: typeInfo.customTypeId,
                    pfCode: pfCode || null,
                    vendorId,
                    pfSignStatus: (this.parseSignStatus(r.cells[4]) as any) || 'NOT_SIGNED',
                    poSignStatus: (this.parseSignStatus(r.cells[5]) as any) || 'NOT_SIGNED',
                    status: this.parseStatus(r.cells[6]) as any,
                    pfUsd: this.cellNumFromStr(r.cells[7]),
                    pfTl: this.cellNumFromStr(r.cells[8]),
                    std: this.parseDate(r.cells[9]),
                    etd: this.parseDate(r.cells[10]),
                    rtd: this.parseDate(r.cells[11]),
                    ftd: this.parseDate(r.cells[12]),
                    containerNo: r.cells[13] || null,
                    paymentRule: r.cells[14] || null,
                  },
                });
                result.itemsCreated++;
              } catch (err: any) {
                result.errors.push(`Item create error (${projectNo} row ${r.rowNum}): ${err.message}`);
              }
            }
          }
        } else {
          // Create project + all items
          try {
            const newProject = await this.prisma.project.create({
              data: {
                bucket: b as any,
                projectNo,
                name: projectName,
                address: '',
              },
            });
            result.projectsCreated++;

            for (const r of rows) {
              try {
                const typeInfo = await this.resolveType(r.cells[1]);
                const vendorId = await this.resolveVendor(r.cells[3]);
                await this.prisma.projectItem.create({
                  data: {
                    projectId: newProject.id,
                    type: typeInfo.type as any,
                    customTypeId: typeInfo.customTypeId,
                    pfCode: r.cells[2] || null,
                    vendorId,
                    pfSignStatus: (this.parseSignStatus(r.cells[4]) as any) || 'NOT_SIGNED',
                    poSignStatus: (this.parseSignStatus(r.cells[5]) as any) || 'NOT_SIGNED',
                    status: this.parseStatus(r.cells[6]) as any,
                    pfUsd: this.cellNumFromStr(r.cells[7]),
                    pfTl: this.cellNumFromStr(r.cells[8]),
                    std: this.parseDate(r.cells[9]),
                    etd: this.parseDate(r.cells[10]),
                    rtd: this.parseDate(r.cells[11]),
                    ftd: this.parseDate(r.cells[12]),
                    containerNo: r.cells[13] || null,
                    paymentRule: r.cells[14] || null,
                  },
                });
                result.itemsCreated++;
              } catch (err: any) {
                result.errors.push(`Item create error (${projectNo} row ${r.rowNum}): ${err.message}`);
              }
            }
          } catch (err: any) {
            result.errors.push(`Project create error (${projectNo}): ${err.message}`);
          }
        }
      } catch (err: any) {
        result.errors.push(`Project lookup error (${projectNo}): ${err.message}`);
      }
    }

    this.logger.log(`RESTORE ${fileName}: ${result.projectsCreated} projects created, ${result.projectsSkipped} skipped, ${result.itemsCreated} items created, ${result.itemsSkipped} skipped`);
    return result;
  }

  // ══════════════════════════════════════════════════════════
  // PARSER: DirectOrders.xlsx (same columns as Projects)
  // ══════════════════════════════════════════════════════════

  private async parseAndRestoreDirectOrders(ws: ExcelJS.Worksheet, fileName: string): Promise<FileRestoreResult> {
    const result: FileRestoreResult = { file: fileName, projectsCreated: 0, projectsSkipped: 0, itemsCreated: 0, itemsSkipped: 0, errors: [] };

    const rowsToProcess = this.extractSectionProjectRows(ws, 15);

    const projectGroups = new Map<string, typeof rowsToProcess>();
    for (const r of rowsToProcess) {
      const key = `${r.bucket}::${r.projectNo}`;
      if (!projectGroups.has(key)) projectGroups.set(key, []);
      projectGroups.get(key)!.push(r);
    }

    for (const [key, rows] of projectGroups) {
      const { bucket: b, projectNo, projectName } = rows[0];
      try {
        const existing = await this.prisma.directOrderProject.findFirst({
          where: { projectNo, bucket: b as any },
          include: { items: true },
        });

        if (existing) {
          result.projectsSkipped++;
          for (const r of rows) {
            const pfCode = r.cells[2];
            const itemExists = existing.items.some((item: any) => (item.pfCode || '') === (pfCode || ''));
            if (itemExists) {
              result.itemsSkipped++;
            } else {
              try {
                const typeInfo = await this.resolveType(r.cells[1]);
                const vendorId = await this.resolveVendor(r.cells[3]);
                await this.prisma.directOrderItem.create({
                  data: {
                    projectId: existing.id,
                    type: typeInfo.type as any,
                    customTypeId: typeInfo.customTypeId,
                    pfCode: pfCode || null,
                    vendorId,
                    pfSignStatus: (this.parseSignStatus(r.cells[4]) as any) || 'NOT_SIGNED',
                    poSignStatus: (this.parseSignStatus(r.cells[5]) as any) || 'NOT_SIGNED',
                    status: this.parseStatus(r.cells[6]) as any,
                    pfUsd: this.cellNumFromStr(r.cells[7]),
                    pfTl: this.cellNumFromStr(r.cells[8]),
                    std: this.parseDate(r.cells[9]),
                    etd: this.parseDate(r.cells[10]),
                    rtd: this.parseDate(r.cells[11]),
                    ftd: this.parseDate(r.cells[12]),
                    containerNo: r.cells[13] || null,
                    paymentRule: r.cells[14] || null,
                  },
                });
                result.itemsCreated++;
              } catch (err: any) {
                result.errors.push(`DO item error (${projectNo} row ${r.rowNum}): ${err.message}`);
              }
            }
          }
        } else {
          try {
            const newProject = await this.prisma.directOrderProject.create({
              data: { bucket: b as any, projectNo, name: projectName, address: '' },
            });
            result.projectsCreated++;
            for (const r of rows) {
              try {
                const typeInfo = await this.resolveType(r.cells[1]);
                const vendorId = await this.resolveVendor(r.cells[3]);
                await this.prisma.directOrderItem.create({
                  data: {
                    projectId: newProject.id,
                    type: typeInfo.type as any,
                    customTypeId: typeInfo.customTypeId,
                    pfCode: r.cells[2] || null,
                    vendorId,
                    pfSignStatus: (this.parseSignStatus(r.cells[4]) as any) || 'NOT_SIGNED',
                    poSignStatus: (this.parseSignStatus(r.cells[5]) as any) || 'NOT_SIGNED',
                    status: this.parseStatus(r.cells[6]) as any,
                    pfUsd: this.cellNumFromStr(r.cells[7]),
                    pfTl: this.cellNumFromStr(r.cells[8]),
                    std: this.parseDate(r.cells[9]),
                    etd: this.parseDate(r.cells[10]),
                    rtd: this.parseDate(r.cells[11]),
                    ftd: this.parseDate(r.cells[12]),
                    containerNo: r.cells[13] || null,
                    paymentRule: r.cells[14] || null,
                  },
                });
                result.itemsCreated++;
              } catch (err: any) {
                result.errors.push(`DO item error (${projectNo} row ${r.rowNum}): ${err.message}`);
              }
            }
          } catch (err: any) {
            result.errors.push(`DO project error (${projectNo}): ${err.message}`);
          }
        }
      } catch (err: any) {
        result.errors.push(`DO lookup error (${projectNo}): ${err.message}`);
      }
    }

    this.logger.log(`RESTORE ${fileName}: ${result.projectsCreated} projects, ${result.itemsCreated} items created`);
    return result;
  }

  // ══════════════════════════════════════════════════════════
  // PARSER: MissingExtra.xlsx
  // ══════════════════════════════════════════════════════════

  private async parseAndRestoreMissingExtra(ws: ExcelJS.Worksheet, fileName: string): Promise<FileRestoreResult> {
    const result: FileRestoreResult = { file: fileName, projectsCreated: 0, projectsSkipped: 0, itemsCreated: 0, itemsSkipped: 0, errors: [] };

    // Columns: Project(1), Case(2), Type(3), PF Code(4), Vendor(5), PF Sign(6), PO Sign(7), Status(8), PF/USD(9), PF/TL(10), STD(11), ETD(12), RTD(13), FTD(14), Container No(15), Payment Rule(16)
    let currentSection: string | null = null;
    let currentCase: { baseProjectNo: string; baseProjectName: string; derivedProjectCode: string } | null = null;
    let dataMode = false;

    interface MERow {
      rowNum: number;
      section: string;
      caseInfo: { baseProjectNo: string; baseProjectName: string; derivedProjectCode: string };
      cells: string[];
    }

    const rowsToProcess: MERow[] = [];

    ws.eachRow((row, rowNum) => {
      if (this.isBlankRow(row)) { dataMode = false; return; }
      if (this.isSectionHeader(ws, row)) {
        currentSection = this.cellStr(row.getCell(1)).trim();
        currentCase = null; dataMode = false; return;
      }
      if (this.isProjectHeader(ws, row)) {
        currentCase = this.parseMECaseHeader(this.cellStr(row.getCell(1)));
        dataMode = false; return;
      }
      if (this.isColumnHeader(row)) { dataMode = true; return; }
      if (this.isTotalRow(row)) { dataMode = false; return; }

      if (dataMode && currentSection && currentCase) {
        rowsToProcess.push({
          rowNum,
          section: currentSection,
          caseInfo: currentCase,
          cells: Array.from({ length: 16 }, (_, i) => this.cellStr(row.getCell(i + 1))),
        });
      }
    });

    // Group by derivedProjectCode
    const caseGroups = new Map<string, MERow[]>();
    for (const r of rowsToProcess) {
      const key = r.caseInfo.derivedProjectCode;
      if (!caseGroups.has(key)) caseGroups.set(key, []);
      caseGroups.get(key)!.push(r);
    }

    for (const [derivedCode, rows] of caseGroups) {
      const { section, caseInfo } = rows[0];
      const bucket = this.parseBucket(section);
      if (!bucket) {
        result.errors.push(`Unknown section for ME case ${derivedCode}: ${section}`);
        continue;
      }

      try {
        const existingCase = await this.prisma.missingExtraCase.findUnique({
          where: { derivedProjectCode: derivedCode },
          include: { items: true },
        });

        if (existingCase) {
          result.projectsSkipped++;
          for (const r of rows) {
            const pfCode = r.cells[3]; // PF Code at col 4
            const itemExists = existingCase.items.some((item: any) => (item.pfCode || '') === (pfCode || ''));
            if (itemExists) {
              result.itemsSkipped++;
            } else {
              try {
                const typeInfo = await this.resolveType(r.cells[2]); // Type at col 3
                const vendorId = await this.resolveVendor(r.cells[4]); // Vendor at col 5
                await this.prisma.missingExtraItem.create({
                  data: {
                    caseId: existingCase.id,
                    type: typeInfo.type as any,
                    customTypeId: typeInfo.customTypeId,
                    pfCode: pfCode || null,
                    vendorId,
                    pfSignStatus: this.parseSignStatus(r.cells[5]) as any,
                    poSignStatus: this.parseSignStatus(r.cells[6]) as any,
                    status: this.parseStatus(r.cells[7]) as any,
                    pfUsd: this.cellNumFromStr(r.cells[8]),
                    pfTl: this.cellNumFromStr(r.cells[9]),
                    std: this.parseDate(r.cells[10]),
                    etd: this.parseDate(r.cells[11]),
                    rtd: this.parseDate(r.cells[12]),
                    ftd: this.parseDate(r.cells[13]),
                    containerNo: r.cells[14] || null,
                    paymentRule: r.cells[15] || null,
                  },
                });
                result.itemsCreated++;
              } catch (err: any) {
                result.errors.push(`ME item error (${derivedCode} row ${r.rowNum}): ${err.message}`);
              }
            }
          }
        } else {
          // Derive caseType and caseIndex from derivedProjectCode
          const caseType = this.deriveCaseType(derivedCode);
          const caseIndex = this.deriveCaseIndex(derivedCode);

          // Find base project
          const baseProject = await this.prisma.project.findFirst({
            where: { projectNo: caseInfo.baseProjectNo },
          });

          try {
            const newCase = await this.prisma.missingExtraCase.create({
              data: {
                baseProjectId: baseProject?.id || null,
                baseProjectNo: caseInfo.baseProjectNo,
                baseProjectName: caseInfo.baseProjectName,
                section: bucket as any,
                caseType: caseType as any,
                caseIndex,
                derivedProjectCode: derivedCode,
              },
            });
            result.projectsCreated++;

            for (const r of rows) {
              try {
                const typeInfo = await this.resolveType(r.cells[2]);
                const vendorId = await this.resolveVendor(r.cells[4]);
                await this.prisma.missingExtraItem.create({
                  data: {
                    caseId: newCase.id,
                    type: typeInfo.type as any,
                    customTypeId: typeInfo.customTypeId,
                    pfCode: r.cells[3] || null,
                    vendorId,
                    pfSignStatus: this.parseSignStatus(r.cells[5]) as any,
                    poSignStatus: this.parseSignStatus(r.cells[6]) as any,
                    status: this.parseStatus(r.cells[7]) as any,
                    pfUsd: this.cellNumFromStr(r.cells[8]),
                    pfTl: this.cellNumFromStr(r.cells[9]),
                    std: this.parseDate(r.cells[10]),
                    etd: this.parseDate(r.cells[11]),
                    rtd: this.parseDate(r.cells[12]),
                    ftd: this.parseDate(r.cells[13]),
                    containerNo: r.cells[14] || null,
                    paymentRule: r.cells[15] || null,
                  },
                });
                result.itemsCreated++;
              } catch (err: any) {
                result.errors.push(`ME item error (${derivedCode} row ${r.rowNum}): ${err.message}`);
              }
            }
          } catch (err: any) {
            result.errors.push(`ME case create error (${derivedCode}): ${err.message}`);
          }
        }
      } catch (err: any) {
        result.errors.push(`ME case lookup error (${derivedCode}): ${err.message}`);
      }
    }

    this.logger.log(`RESTORE ${fileName}: ${result.projectsCreated} cases, ${result.itemsCreated} items created`);
    return result;
  }

  private deriveCaseType(derivedCode: string): string {
    const upper = derivedCode.toUpperCase();
    if (upper.includes('-R')) return 'REPLACEMENT';
    if (upper.includes('-E')) return 'EXTRA';
    if (upper.includes('-M')) return 'MISSING';
    return 'MISSING'; // default
  }

  private deriveCaseIndex(derivedCode: string): number {
    // Extract trailing number from e.g. "P001-M1" → 1
    const match = derivedCode.match(/(\d+)$/);
    return match ? parseInt(match[1]) : 1;
  }

  // ══════════════════════════════════════════════════════════
  // PARSER: Expenses_P.xlsx
  // ══════════════════════════════════════════════════════════

  private async parseAndRestoreExpensesP(ws: ExcelJS.Worksheet, fileName: string): Promise<FileRestoreResult> {
    return this.parseAndRestoreExpenses(ws, fileName, 'expensesPProject', 'expensesPItem', false);
  }

  // ══════════════════════════════════════════════════════════
  // PARSER: Expenses_DO.xlsx
  // ══════════════════════════════════════════════════════════

  private async parseAndRestoreExpensesDO(ws: ExcelJS.Worksheet, fileName: string): Promise<FileRestoreResult> {
    return this.parseAndRestoreExpenses(ws, fileName, 'expensesDirectOrderProject', 'expensesDirectOrderItem', false);
  }

  // ══════════════════════════════════════════════════════════
  // PARSER: Expenses_ME.xlsx
  // ══════════════════════════════════════════════════════════

  private async parseAndRestoreExpensesME(ws: ExcelJS.Worksheet, fileName: string): Promise<FileRestoreResult> {
    return this.parseAndRestoreExpenses(ws, fileName, 'expensesMissingExtraProject', 'expensesMissingExtraItem', true);
  }

  // ══════════════════════════════════════════════════════════
  // SHARED: Expenses parser (P / DO / ME share same structure)
  // ══════════════════════════════════════════════════════════

  private async parseAndRestoreExpenses(
    ws: ExcelJS.Worksheet,
    fileName: string,
    projectModel: string,
    itemModel: string,
    hasPfCode: boolean,
  ): Promise<FileRestoreResult> {
    const result: FileRestoreResult = { file: fileName, projectsCreated: 0, projectsSkipped: 0, itemsCreated: 0, itemsSkipped: 0, errors: [] };

    // ME has extra PF Code column at position 1, shifting everything right
    // P/DO columns: Type(1), Vendor(2), OrderType(3), Status(4), STD(5), ETD(6), RTRD(7), FTD(8), ExpUsd(9), ExpTl(10), PayRule(11), ContainerNo(12), ShelvesLoc(13), InvoiceSit(14), PaidUsd1(15), PaidUsd2(16), PaidTl1(17), PaidTl2(18), RemUsd(19), RemTl(20), InvTransNo(21), InvNo(22), QB(23)
    // ME columns: PFCode(1), Type(2), Vendor(3), OrderType(4), Status(5), STD(6), ETD(7), RTRD(8), FTD(9), ExpUsd(10), ExpTl(11), PayRule(12), ContainerNo(13), ShelvesLoc(14), InvoiceSit(15), PaidUsd1(16), PaidUsd2(17), PaidTl1(18), PaidTl2(19), RemUsd(20), RemTl(21), InvTransNo(22), InvNo(23), QB(24)
    const colCount = hasPfCode ? 24 : 23;
    const offset = hasPfCode ? 1 : 0;

    const rowsToProcess = this.extractSectionProjectRows(ws, colCount);

    const projectGroups = new Map<string, typeof rowsToProcess>();
    for (const r of rowsToProcess) {
      const key = `${r.bucket}::${r.projectNo}`;
      if (!projectGroups.has(key)) projectGroups.set(key, []);
      projectGroups.get(key)!.push(r);
    }

    for (const [key, rows] of projectGroups) {
      const { bucket: b, projectNo, projectName } = rows[0];
      try {
        const existing = await (this.prisma as any)[projectModel].findFirst({
          where: { projectNo, bucket: b as any },
          include: { items: true },
        });

        if (existing) {
          result.projectsSkipped++;
          for (const r of rows) {
            // Simple existence check by vendor + type
            const typeStr = r.cells[0 + offset];
            const vendorStr = r.cells[1 + offset];
            const itemExists = existing.items.length > 0; // If project exists and has items, skip
            if (existing.items.length > 0) {
              result.itemsSkipped += rows.length;
              break; // Skip all items for this existing project
            }
            // If project exists but no items, add them
            try {
              await this.createExpenseItem(itemModel, existing.id, r.cells, offset, hasPfCode, result, r.rowNum, projectNo);
            } catch (err: any) {
              result.errors.push(`Expense item error (${projectNo} row ${r.rowNum}): ${err.message}`);
            }
          }
        } else {
          try {
            const newProject = await (this.prisma as any)[projectModel].create({
              data: { bucket: b as any, projectNo, name: projectName, address: '' },
            });
            result.projectsCreated++;
            for (const r of rows) {
              try {
                await this.createExpenseItem(itemModel, newProject.id, r.cells, offset, hasPfCode, result, r.rowNum, projectNo);
              } catch (err: any) {
                result.errors.push(`Expense item error (${projectNo} row ${r.rowNum}): ${err.message}`);
              }
            }
          } catch (err: any) {
            result.errors.push(`Expense project error (${projectNo}): ${err.message}`);
          }
        }
      } catch (err: any) {
        result.errors.push(`Expense lookup error (${projectNo}): ${err.message}`);
      }
    }

    this.logger.log(`RESTORE ${fileName}: ${result.projectsCreated} projects, ${result.itemsCreated} items created`);
    return result;
  }

  private async createExpenseItem(
    itemModel: string,
    projectId: string,
    cells: string[],
    offset: number,
    hasPfCode: boolean,
    result: FileRestoreResult,
    rowNum: number,
    projectNo: string,
  ): Promise<void> {
    const typeInfo = await this.resolveType(cells[0 + offset]);
    const vendorId = await this.resolveVendor(cells[1 + offset]);

    const data: any = {
      projectId,
      type: typeInfo.type as any,
      customTypeId: typeInfo.customTypeId,
      vendorId,
      orderType: cells[2 + offset] || null,
      status: this.parseStatus(cells[3 + offset]) as any,
      std: this.parseDate(cells[4 + offset]),
      etd: this.parseDate(cells[5 + offset]),
      rtrd: this.parseDate(cells[6 + offset]),
      ftd: this.parseDate(cells[7 + offset]),
      expensesUsd: this.cellNumFromStr(cells[8 + offset]),
      expensesTl: this.cellNumFromStr(cells[9 + offset]),
      paymentRule: cells[10 + offset] || null,
      containerNo: cells[11 + offset] || null,
      shelvesLoc: cells[12 + offset] || null,
      invoiceSit: cells[13 + offset] || null,
      paidUsd1: this.cellNumFromStr(cells[14 + offset]),
      paidUsd2: this.cellNumFromStr(cells[15 + offset]),
      paidTl1: this.cellNumFromStr(cells[16 + offset]),
      paidTl2: this.cellNumFromStr(cells[17 + offset]),
      // Skip Remaining USD/TL (18+offset, 19+offset) — calculated fields
      invoiceTransactionNo: cells[20 + offset] || null,
      invoiceNumber: cells[21 + offset] || null,
      quickBook: cells[22 + offset] || null,
    };

    if (hasPfCode) {
      data.pfCode = cells[0] || null;
    }

    await (this.prisma as any)[itemModel].create({ data });
    result.itemsCreated++;
  }

  // ══════════════════════════════════════════════════════════
  // PARSER: TrustExpenses.xlsx
  // ══════════════════════════════════════════════════════════

  private async parseAndRestoreTrustExpenses(ws: ExcelJS.Worksheet, fileName: string): Promise<FileRestoreResult> {
    const result: FileRestoreResult = { file: fileName, projectsCreated: 0, projectsSkipped: 0, itemsCreated: 0, itemsSkipped: 0, errors: [] };

    // TrustExpenses has a different layout: flat items, no section/project grouping
    // Row 1: "TRUST EXPENSES" header
    // Row 2: Group headers (DETAILS, DATES, FINANCIALS, ACCOUNTING, PAYMENTS, INVOICE)
    // Row 3: Column headers
    // Row 4+: Data rows
    // Main cols: #(1), TYPE(2), VENDOR(3), ORDER TYPE(4), STATUS(5), STD(6), ETD(7), RTRD(8), FTD(9), EXP/USD(10), EXP/TL(11), SHELVES(12), CONTAINER(13), INVOICE(14)
    // Gap col: 15
    // Acct cols: PaidUSD1(16), PaidUSD2(17), PaidTL1(18), PaidTL2(19), RemUSD(20), RemTL(21), NotOrdUSD(22), NotOrdTL(23)
    // Gap col: 24
    // Pay cols: DueUSD(25), DueTL(26), Pay1USD(27), Pay1TL(28), Pay2USD(29), Pay2TL(30)
    // Gap col: 31
    // Inv cols: TransNo(32), InvNo(33), QB(34)

    // First, ensure a TrustExpenseProject exists
    let teProject = await this.prisma.trustExpenseProject.findFirst();
    if (!teProject) {
      teProject = await this.prisma.trustExpenseProject.create({
        data: {
          bucket: 'TLINES_NE' as any,
          projectNo: 'TE-001',
          name: 'Trust Expenses',
          address: '',
        },
      });
      result.projectsCreated++;
    }

    const existingItems = await this.prisma.trustExpenseItem.findMany({
      where: { projectId: teProject.id },
      include: { vendor: { select: { code: true } } },
    });

    let startRow = 4; // Skip header rows
    const totalRows = ws.rowCount;

    for (let rowNum = startRow; rowNum <= totalRows; rowNum++) {
      const row = ws.getRow(rowNum);
      if (this.isBlankRow(row)) continue;
      if (this.isTotalRow(row)) break; // Grand total means end of data

      const typeStr = this.cellStr(row.getCell(2));
      const vendorStr = this.cellStr(row.getCell(3));
      const orderType = this.cellStr(row.getCell(4));
      const containerNo = this.cellStr(row.getCell(13));

      // Skip if no type
      if (!typeStr && !vendorStr) continue;

      // Match existing items by type + vendor code + containerNo
      const vendorCode = vendorStr.split(' - ')[0]?.trim() || '';
      const itemExists = existingItems.some((item: any) => {
        const existingType = item.teType || item.type || '';
        const existingVendorCode = item.vendor?.code || '';
        return existingType === typeStr && existingVendorCode === vendorCode && (item.containerNo || '') === (containerNo || '');
      });

      if (itemExists) {
        result.itemsSkipped++;
        continue;
      }

      try {
        const vendorId = await this.resolveVendor(vendorStr);
        await this.prisma.trustExpenseItem.create({
          data: {
            projectId: teProject.id,
            teType: typeStr || null,
            vendorId,
            orderType: orderType || null,
            status: this.parseStatus(this.cellStr(row.getCell(5))) as any,
            std: this.parseDateCell(row.getCell(6)),
            etd: this.parseDateCell(row.getCell(7)),
            rtrd: this.parseDateCell(row.getCell(8)),
            ftd: this.parseDateCell(row.getCell(9)),
            expensesUsd: this.cellNum(row.getCell(10)),
            expensesTl: this.cellNum(row.getCell(11)),
            shelvesLocation: this.cellStr(row.getCell(12)) || null,
            containerNo: containerNo || null,
            invoice: this.cellStr(row.getCell(14)) || null,
            paidUsd1: this.cellNum(row.getCell(16)),
            paidUsd2: this.cellNum(row.getCell(17)),
            paidTl1: this.cellNum(row.getCell(18)),
            paidTl2: this.cellNum(row.getCell(19)),
            invoiceTransactionNo: this.cellStr(row.getCell(32)) || null,
            invoiceNumber: this.cellStr(row.getCell(33)) || null,
            quickBook: this.cellStr(row.getCell(34)) || null,
            sortOrder: rowNum - startRow,
          },
        });
        result.itemsCreated++;
      } catch (err: any) {
        result.errors.push(`TE item error (row ${rowNum}): ${err.message}`);
      }
    }

    this.logger.log(`RESTORE ${fileName}: ${result.itemsCreated} items created, ${result.itemsSkipped} skipped`);
    return result;
  }

  // ══════════════════════════════════════════════════════════
  // SHARED: Extract section/project grouped rows
  // ══════════════════════════════════════════════════════════

  private extractSectionProjectRows(ws: ExcelJS.Worksheet, colCount: number): {
    rowNum: number; bucket: string; projectNo: string; projectName: string; cells: string[];
  }[] {
    const rows: { rowNum: number; bucket: string; projectNo: string; projectName: string; cells: string[] }[] = [];
    let bucket: string | null = null;
    let proj: { projectNo: string; name: string } | null = null;
    let dataMode = false;

    ws.eachRow((row, rowNum) => {
      if (this.isBlankRow(row)) { dataMode = false; return; }
      if (this.isSectionHeader(ws, row)) {
        bucket = this.parseBucket(this.cellStr(row.getCell(1)));
        proj = null; dataMode = false; return;
      }
      if (this.isProjectHeader(ws, row)) {
        proj = this.parseProjectHeader(this.cellStr(row.getCell(1)));
        dataMode = false; return;
      }
      if (this.isColumnHeader(row)) { dataMode = true; return; }
      if (this.isTotalRow(row)) { dataMode = false; return; }

      if (dataMode && bucket && proj) {
        rows.push({
          rowNum,
          bucket,
          projectNo: proj.projectNo,
          projectName: proj.name,
          cells: Array.from({ length: colCount }, (_, i) => this.cellStr(row.getCell(i + 1))),
        });
      }
    });

    return rows;
  }

  private cellNumFromStr(val: string): number | null {
    if (!val || val.trim() === '') return null;
    const n = parseFloat(val.replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : null;
  }
}
