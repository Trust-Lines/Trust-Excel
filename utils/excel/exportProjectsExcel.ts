/**
 * Excel Export for Operational Board (Projects)
 *
 * Exports the current view (filtered sections) to a styled .xlsx file.
 * Respects column permissions: hidden columns are excluded and layout shifts left.
 * Mirrors the React UI exactly:
 *  - Section separator: red (#B02417), centered white bold
 *  - Project header bar: dark gray (#404040), centered, "No - Name"
 *  - Column headers: black bg, white text (like .column-header)
 *  - Project No column merged vertically with project color (incl. TOTAL row)
 *  - TYPE cells merged per type group; green when all rows SENT (like UI)
 *  - PO Sign Status merged per type group with sign-status color
 *  - Dates as real dates formatted dd/mm/yyyy (like formatDateCell)
 *  - Money cells: $ / ₺ formats, blank when 0, centered like UI cells
 *  - TOTAL row: dark gray (#404040) like .total-grey, label before PF/USD
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ApiSection, ApiRow } from '../../lib/projects';
import { OPERATIONAL_BOARD_COLUMNS, ColumnKey } from '../../lib/columns';
import { FIXED_COLUMNS, SCROLLABLE_COLUMNS, COLUMN_WIDTHS } from '../../lib/gridWidth';
import { TYPE_ORDER } from '../../types';
import type { ProjectColor } from '../../lib/projectColor';
import { getStatusExcelFill } from './statusColorsExcel';

// ── Helpers ──────────────────────────────────────────────────────────

/** Parse money string (e.g. "1,234.56" or "1234.56") → number, or 0 */
function parseMoney(value: string | number | null | undefined): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return value;
  const cleaned = value.replace(/[^0-9.\-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Parse an ISO-ish date value → JS Date at midnight, or null */
function parseDateValue(value: any): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  // Date-only (UI shows dd/MM/yyyy via formatDateCell)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Display enums like the UI does: NOT_SIGNED → NOT SIGNED, SENT_TO_TLINES → SENT TO TLINES */
function displayStatus(value: any): string {
  return String(value ?? '').replace(/_/g, ' ');
}

/** Get visible columns in correct order (fixed + scrollable), filtered by permission */
function getVisibleColumns(isColumnVisible: (key: ColumnKey) => boolean): ColumnKey[] {
  const allColumns: ColumnKey[] = [...FIXED_COLUMNS, ...SCROLLABLE_COLUMNS];
  return allColumns.filter(col => isColumnVisible(col));
}

/** Group project rows by type, mirroring ProjectBlock logic */
function groupRowsByType(rows: ApiRow[]): { type: string; rows: ApiRow[] }[] {
  const typeMap = new Map<string, ApiRow[]>();

  rows.forEach(row => {
    if (!typeMap.has(row.type)) {
      typeMap.set(row.type, []);
    }
    typeMap.get(row.type)!.push(row);
  });

  // Known types first (in TYPE_ORDER), then custom types alphabetically
  const knownGroups = TYPE_ORDER
    .filter(t => typeMap.has(t))
    .map(t => ({ type: t, rows: typeMap.get(t)! }));

  const customGroups = Array.from(typeMap.keys())
    .filter(t => !(TYPE_ORDER as string[]).includes(t))
    .sort()
    .map(t => ({ type: t, rows: typeMap.get(t)! }));

  return [...knownGroups, ...customGroups];
}

// ── Column kind helpers (mirror the UI columns) ─────────────────────

const DATE_COLUMNS: ColumnKey[] = ['std', 'etd', 'rtr', 'rtd', 'rdy', 'ftd', 'snd', 'containerDate'] as ColumnKey[];
const USD_COLUMNS: ColumnKey[] = ['pfUsd', 'invoice', 'expensesUsd'] as ColumnKey[];
const TL_COLUMNS: ColumnKey[] = ['pfTl', 'invoiceTl', 'expensesTl'] as ColumnKey[];
const STATUS_COLUMNS: ColumnKey[] = ['status', 'pfSignStatus', 'poSignStatus'] as ColumnKey[];

const isDateCol = (c: ColumnKey) => DATE_COLUMNS.includes(c);
const isUsdCol = (c: ColumnKey) => USD_COLUMNS.includes(c);
const isTlCol = (c: ColumnKey) => TL_COLUMNS.includes(c);
const isMoneyCol = (c: ColumnKey) => isUsdCol(c) || isTlCol(c);
const isStatusCol = (c: ColumnKey) => STATUS_COLUMNS.includes(c);

// ── Styles (taken 1:1 from the React UI) ────────────────────────────

const COLORS = {
  sectionHeader: { bg: 'B02417', fg: 'FFFFFF' },     // .section-separator
  columnHeader: { bg: '000000', fg: 'FFFFFF' },      // .column-header
  projectHeader: { bg: '404040', fg: 'FFFFFF' },     // .project-header
  projectTotal: { bg: '404040', fg: 'FFFFFF' },      // .total-grey
  sectionTotal: { bg: '2563EB', fg: 'FFFFFF' },      // blue SECTION TOTALS bar
  typeAllSent: { bg: '15803D', fg: 'FFFFFF' },       // type cell when all rows SENT
};

/** Map projectNumberColor to Excel ARGB hex — same as getProjectColorHex */
function projectColorToArgb(color: ProjectColor): string {
  switch (color) {
    case 'orange': return 'DE8244';
    case 'blue':   return '6A99D1';
    case 'green':  return '9FCF63';
    case 'red':    return 'E53E3E';
    default:       return 'DE8244';
  }
}

/** PO Sign Status group color — same as ProjectBlock getSignStatusStyle */
function getSignStatusArgb(value: string): { bg: string; fg: string } | null {
  if (value === 'SIGNED') return { bg: '92D050', fg: '000000' };
  if (value === 'READY TO SIGN') return { bg: 'FFFF00', fg: '000000' };
  if (value === 'NOT SIGNED') return { bg: 'FF0000', fg: '000000' };
  if (value === 'WAITING TLINES TO SIGN') return { bg: 'FB923C', fg: '000000' };
  if (value === 'WAITING T TO SIGN') return { bg: 'A78BFA', fg: '000000' };
  if (value === 'SIGNED WITH EST PRICE') return { bg: '4ADE80', fg: '000000' };
  return null;
}

const BORDER_THIN: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'D1D5DB' } };
const BORDERS_ALL: Partial<ExcelJS.Borders> = {
  top: BORDER_THIN,
  bottom: BORDER_THIN,
  left: BORDER_THIN,
  right: BORDER_THIN,
};

function fillBg(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

const CENTER: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center' };

// ── Main Export ──────────────────────────────────────────────────────

interface ExportOptions {
  sections: ApiSection[];
  isColumnVisible: (key: ColumnKey) => boolean;
  filename?: string;
}

/**
 * Write a projects-style sheet (sections → projects → typed rows) into an
 * existing workbook. Used by the single-sheet export and the multi-tab export.
 */
export function writeProjectsSheet(
  wb: ExcelJS.Workbook,
  sheetName: string,
  sections: ApiSection[],
  isColumnVisible: (key: ColumnKey) => boolean,
): void {
  const visibleCols = getVisibleColumns(isColumnVisible);
  if (visibleCols.length === 0) return;

  const colCount = visibleCols.length;
  const projNoColIdx = visibleCols.indexOf('projectNo'); // -1 if hidden
  const typeColIdx = visibleCols.indexOf('type');
  const poSignColIdx = visibleCols.indexOf('poSignStatus');
  const pfUsdColIdx = visibleCols.indexOf('pfUsd');

  // TOTAL label goes in the column just before PF/USD (like the UI)
  const totalLabelIdx = pfUsdColIdx > 0 ? pfUsdColIdx - 1 : 0;

  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 0, xSplit: 0 }],
  });

  // Set column widths (px / 7 ≈ Excel width units)
  ws.columns = visibleCols.map(col => ({
    width: Math.round(COLUMN_WIDTHS[col] / 7.5),
  }));

  // Money cell writer: blank when 0, $/₺ number format, centered like the UI
  const setMoneyCell = (cell: ExcelJS.Cell, colKey: ColumnKey, num: number) => {
    cell.value = num !== 0 ? num : null;
    cell.numFmt = isUsdCol(colKey) ? '$#,##0.00' : '₺#,##0.00';
    cell.alignment = CENTER;
  };

  // ── Iterate sections ──────────────────────────────────────────────

  for (const section of sections) {
    if (section.projects.length === 0) continue;

    // ── Section Header Row (red, centered — like .section-separator) ──
    const sectionRow = ws.addRow([section.label]);
    ws.mergeCells(sectionRow.number, 1, sectionRow.number, colCount);
    const sectionCell = sectionRow.getCell(1);
    sectionCell.font = { bold: true, size: 14, color: { argb: COLORS.sectionHeader.fg } };
    sectionCell.fill = fillBg(COLORS.sectionHeader.bg);
    sectionCell.alignment = CENTER;
    sectionRow.height = 28;

    let sectionTotalUsd = 0;
    let sectionTotalTl = 0;
    let sectionTotalInv = 0;
    let sectionTotalInvTl = 0;

    for (const project of section.projects) {
      const projBgColor = projectColorToArgb(project.projectNumberColor);
      const dataRowCount = project.rows.length;

      // ── Project Name Header Row (dark gray, centered — like .project-header) ──
      const projectLabel = `${project.projectNumber} - ${project.projectName}`;
      const projRow = ws.addRow([projectLabel]);
      ws.mergeCells(projRow.number, 1, projRow.number, colCount);
      const projCell = projRow.getCell(1);
      projCell.font = { bold: true, size: 11, color: { argb: COLORS.projectHeader.fg } };
      projCell.fill = fillBg(COLORS.projectHeader.bg);
      projCell.alignment = CENTER;
      projRow.height = 24;

      // ── Column Headers Row (black — like .column-header) ──
      const headerValues = visibleCols.map(col => OPERATIONAL_BOARD_COLUMNS[col].label);
      const hdrRow = ws.addRow(headerValues);
      hdrRow.height = 22;
      hdrRow.eachCell((cell) => {
        cell.font = { bold: true, size: 10, color: { argb: COLORS.columnHeader.fg } };
        cell.fill = fillBg(COLORS.columnHeader.bg);
        cell.alignment = { ...CENTER, wrapText: true };
        cell.border = BORDERS_ALL;
      });

      // ── Data Rows (grouped by type, like ProjectBlock) ──
      let projectTotalUsd = 0;
      let projectTotalTl = 0;
      let projectTotalInv = 0;
      let projectTotalInvTl = 0;
      const typeGroups = groupRowsByType(project.rows);

      // Track first data row number for Project No vertical merge
      const firstDataRowNum = ws.lastRow!.number + 1;

      for (const group of typeGroups) {
        const groupStartRowNum = ws.lastRow!.number + 1;

        // Type cell green when ALL rows in this type are SENT / SENT TO TLINES (like UI)
        const isAllSent = group.rows.length > 0 && group.rows.every(r => {
          const s = String(r.status || '').toUpperCase().replace(/[\s-]/g, '_');
          return s === 'SENT_TO_TLINES' || s === 'SENT';
        });

        // PO Sign Status per type group (same rules as ProjectBlock)
        const groupPoStatus = (() => {
          const statuses = group.rows
            .map(r => displayStatus((r as any).poSignStatus).toUpperCase())
            .filter(s => s !== '');
          if (statuses.length === 0) return '';
          if (statuses.length === group.rows.length && statuses.every(s => s === 'SIGNED')) return 'SIGNED';
          if (statuses.some(s => s === 'WAITING TLINES TO SIGN')) return 'WAITING TLINES TO SIGN';
          if (statuses.some(s => s === 'WAITING T TO SIGN')) return 'WAITING T TO SIGN';
          if (statuses.some(s => s === 'READY TO SIGN')) return 'READY TO SIGN';
          return 'NOT SIGNED';
        })();

        for (const row of group.rows) {
          const values = visibleCols.map(col => {
            // Filled after the loop: projectNo (vertical merge), type / poSignStatus (group merge)
            if (col === 'projectNo' || col === 'type' || col === 'poSignStatus') return '';
            const val = (row as any)[col];
            if (isMoneyCol(col)) return parseMoney(val) || '';
            if (isDateCol(col)) return parseDateValue(val) ?? '';
            if (isStatusCol(col)) return displayStatus(val);
            return val ?? '';
          });

          const dataRow = ws.addRow(values);
          dataRow.height = 18;

          dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const colKey = visibleCols[colNumber - 1];
            cell.font = { size: 10 };
            cell.border = BORDERS_ALL;
            cell.alignment = CENTER;

            if (isMoneyCol(colKey)) {
              const num = parseMoney((row as any)[colKey]);
              setMoneyCell(cell, colKey, num);
              cell.font = { size: 10 };
              cell.border = BORDERS_ALL;
            } else if (isDateCol(colKey)) {
              cell.numFmt = 'dd/mm/yyyy';
            } else if (colKey === 'status' || colKey === 'pfSignStatus') {
              // Status cell coloring (same palette as the UI)
              const statusFill = getStatusExcelFill(cell.value as string);
              if (statusFill) {
                cell.fill = fillBg(statusFill.bg);
                cell.font = { size: 10, color: { argb: statusFill.fg }, bold: true };
              }
            }
          });

          projectTotalUsd += parseMoney(row.pfUsd);
          projectTotalTl += parseMoney(row.pfTl);
          projectTotalInv += parseMoney((row as any).invoice);
          projectTotalInvTl += parseMoney((row as any).invoiceTl);
        }

        const groupEndRowNum = ws.lastRow!.number;

        // ── Merge TYPE cell per type group (like the UI spanning cell) ──
        if (typeColIdx >= 0 && group.rows.length > 0) {
          const excelCol = typeColIdx + 1;
          if (groupEndRowNum > groupStartRowNum) {
            ws.mergeCells(groupStartRowNum, excelCol, groupEndRowNum, excelCol);
          }
          const typeCell = ws.getCell(groupStartRowNum, excelCol);
          typeCell.value = group.type;
          typeCell.alignment = CENTER;
          typeCell.border = BORDERS_ALL;
          if (isAllSent) {
            typeCell.fill = fillBg(COLORS.typeAllSent.bg);
            typeCell.font = { size: 10, bold: true, color: { argb: COLORS.typeAllSent.fg } };
          } else {
            typeCell.font = { size: 10, bold: true };
          }
        }

        // ── Merge PO SIGN STATUS cell per type group (like the UI) ──
        if (poSignColIdx >= 0 && group.rows.length > 0) {
          const excelCol = poSignColIdx + 1;
          if (groupEndRowNum > groupStartRowNum) {
            ws.mergeCells(groupStartRowNum, excelCol, groupEndRowNum, excelCol);
          }
          const poCell = ws.getCell(groupStartRowNum, excelCol);
          poCell.value = groupPoStatus;
          poCell.alignment = CENTER;
          poCell.border = BORDERS_ALL;
          const poFill = getSignStatusArgb(groupPoStatus);
          if (poFill) {
            poCell.fill = fillBg(poFill.bg);
            poCell.font = { size: 10, bold: true, color: { argb: poFill.fg } };
          } else {
            poCell.font = { size: 10 };
          }
        }
      }

      // ── Project TOTAL Row (dark gray — like .total-grey) ──
      const projTotalValues = visibleCols.map((_col, i) => {
        if (i === totalLabelIdx) return 'TOTAL';
        return '';
      });
      const ptRow = ws.addRow(projTotalValues);
      ptRow.height = 20;
      ptRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const colKey = visibleCols[colNumber - 1];
        cell.font = { bold: true, size: 10, color: { argb: COLORS.projectTotal.fg } };
        cell.fill = fillBg(COLORS.projectTotal.bg);
        cell.border = BORDERS_ALL;
        cell.alignment = CENTER;

        if (colKey === 'pfUsd') {
          setMoneyCell(cell, colKey, projectTotalUsd);
        } else if (colKey === 'pfTl') {
          setMoneyCell(cell, colKey, projectTotalTl);
        } else if (colKey === 'invoice') {
          setMoneyCell(cell, colKey, projectTotalInv);
        } else if (colKey === 'invoiceTl') {
          setMoneyCell(cell, colKey, projectTotalInvTl);
        }
        if (isMoneyCol(colKey)) {
          cell.font = { bold: true, size: 10, color: { argb: COLORS.projectTotal.fg } };
          cell.fill = fillBg(COLORS.projectTotal.bg);
          cell.border = BORDERS_ALL;
        }
      });
      const totalRowNum = ptRow.number;

      // ── Merge Project No column vertically incl. TOTAL row (like React UI) ──
      if (projNoColIdx >= 0 && dataRowCount > 0) {
        const excelCol = projNoColIdx + 1; // 1-based

        if (totalRowNum > firstDataRowNum) {
          ws.mergeCells(firstDataRowNum, excelCol, totalRowNum, excelCol);
        }

        // Style the merged Project No cell: project color bg, white bold text, centered
        const mergedCell = ws.getCell(firstDataRowNum, excelCol);
        mergedCell.value = project.projectNumber;
        mergedCell.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
        mergedCell.fill = fillBg(projBgColor);
        mergedCell.alignment = CENTER;
        mergedCell.border = BORDERS_ALL;
      }

      sectionTotalUsd += projectTotalUsd;
      sectionTotalTl += projectTotalTl;
      sectionTotalInv += projectTotalInv;
      sectionTotalInvTl += projectTotalInvTl;
    }

    // ── Section Total Row (blue — like the SECTION TOTALS bar) ──
    const stRow = ws.addRow(visibleCols.map(() => ''));
    stRow.height = 24;
    stRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const colKey = visibleCols[colNumber - 1];
      cell.font = { bold: true, size: 12, color: { argb: COLORS.sectionTotal.fg } };
      cell.fill = fillBg(COLORS.sectionTotal.bg);
      cell.border = BORDERS_ALL;
      cell.alignment = CENTER;

      if (colKey === 'pfUsd') {
        setMoneyCell(cell, colKey, sectionTotalUsd);
      } else if (colKey === 'pfTl') {
        setMoneyCell(cell, colKey, sectionTotalTl);
      } else if (colKey === 'invoice') {
        setMoneyCell(cell, colKey, sectionTotalInv);
      } else if (colKey === 'invoiceTl') {
        setMoneyCell(cell, colKey, sectionTotalInvTl);
      }
      if (isMoneyCol(colKey)) {
        cell.font = { bold: true, size: 12, color: { argb: COLORS.sectionTotal.fg } };
        cell.fill = fillBg(COLORS.sectionTotal.bg);
        cell.border = BORDERS_ALL;
      }
    });
    // Label merged across the columns before PF/USD (centered, like the blue bar)
    const labelEnd = pfUsdColIdx > 1 ? pfUsdColIdx : 1;
    if (labelEnd > 1) {
      ws.mergeCells(stRow.number, 1, stRow.number, labelEnd);
    }
    const stLabelCell = ws.getCell(stRow.number, 1);
    stLabelCell.value = `${section.label.toUpperCase()} TOTALS`;
    stLabelCell.alignment = CENTER;

    // Spacer row between sections
    ws.addRow([]);
  }
}

export async function exportProjectsToExcel({
  sections,
  isColumnVisible,
  filename,
}: ExportOptions): Promise<void> {
  if (getVisibleColumns(isColumnVisible).length === 0) return;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Projects';
  wb.created = new Date();

  writeProjectsSheet(wb, 'Projects', sections, isColumnVisible);

  // ── Write & Download ──────────────────────────────────────────────

  const dateStr = new Date().toISOString().slice(0, 10);
  const outputName = filename || `Projects_${dateStr}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, outputName);
}
