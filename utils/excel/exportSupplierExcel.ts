/**
 * Excel Export for Supplier Sheets (P, ME, DO tabs)
 *
 * Layout mirrors React UI 1:1: each table block is SEPARATE with gap columns:
 *
 * [Projects Grid] [GAP] [Accounting Block] [GAP] [Payments Block] [GAP] [Invoice Block]
 *
 * Styling matches the app exactly:
 *  - Section separator: red #B02417, centered (like .section-separator)
 *  - Project header bar: dark gray #404040, centered (like .project-header)
 *  - Main column headers: black bg (like .column-header)
 *  - Project No merged vertically with project color (incl. TOTAL row)
 *  - TYPE cells merged per type group; green when all rows SENT (like UI)
 *  - Accounting: gold title #B88900, black col headers, #FFF8DC data
 *  - Payments: #2F4B1F title, #1F3515 col headers, #E8F5E9 data
 *  - Invoice: gray #696969 title/headers (like InvoiceReceiptGrid)
 *  - TOTAL row: dark gray #404040 (.total-grey), label before PF/USD
 *  - Blue SECTION TOTALS bar with invoice-priority (effective) totals
 *  - Red grand TOTAL bar + gold/green grand bars at the bottom (like the page)
 *  - Dates as real dates dd/mm/yyyy; money blank when 0
 *
 * Accepts already vendor-filtered regionSections data.
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { BackendProject, BackendProjectItem } from '../../lib/projects';
import { mapBackendTypeToFrontend, mapSignStatusToFrontend, mapItemStatusToFrontend } from '../../lib/projects';
import { OPERATIONAL_BOARD_COLUMNS, ColumnKey } from '../../lib/columns';
import { FIXED_COLUMNS, SCROLLABLE_COLUMNS, COLUMN_WIDTHS } from '../../lib/gridWidth';
import { TYPE_ORDER } from '../../types';
import { getProjectColor } from '../../lib/projectColor';
import { normalizeProjectNoForDisplay } from '../../lib/projectNoUtils';
import type { ProjectColor } from '../../lib/projectColor';
import { getStatusExcelFill } from './statusColorsExcel';
import { calculateRemaining } from '../../components/PaymentsGrid';

// ── Helpers ──────────────────────────────────────────────────────────

function toNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Parse an ISO-ish date value → JS Date at midnight, or null (UI shows dd/MM/yyyy) */
function parseDateValue(value: any): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function fmtUsdText(v: number): string {
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtTlText(v: number): string {
  return '₺' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function projectColorToArgb(color: ProjectColor): string {
  switch (color) {
    case 'orange': return 'DE8244';
    case 'blue':   return '6A99D1';
    case 'green':  return '9FCF63';
    case 'red':    return 'E53E3E';
    default:       return 'DE8244';
  }
}

/** Group items by type, known types first */
function groupItemsByType(items: BackendProjectItem[]): { type: string; items: BackendProjectItem[] }[] {
  const typeMap = new Map<string, BackendProjectItem[]>();
  items.forEach(item => {
    const t = mapBackendTypeToFrontend(item.type, item.customType);
    if (!typeMap.has(t)) typeMap.set(t, []);
    typeMap.get(t)!.push(item);
  });
  const known = TYPE_ORDER.filter(t => typeMap.has(t)).map(t => ({ type: t, items: typeMap.get(t)! }));
  const custom = Array.from(typeMap.keys()).filter(t => !(TYPE_ORDER as string[]).includes(t)).sort().map(t => ({ type: t, items: typeMap.get(t)! }));
  return [...known, ...custom];
}

// ── Styles (taken 1:1 from the React UI) ────────────────────────────

const COLORS = {
  sectionHeader:    { bg: 'B02417', fg: 'FFFFFF' },  // .section-separator
  columnHeader:     { bg: '000000', fg: 'FFFFFF' },  // .column-header (black)
  projectHeader:    { bg: '404040', fg: 'FFFFFF' },  // .project-header
  accountingTitle:  { bg: 'B88900', fg: 'FFFFFF' },  // Gold title bar
  accountingGroup:  { bg: 'D4AF37', fg: '000000' },  // Gold group row
  accountingHeader: { bg: '000000', fg: 'FFFFFF' },  // Black col header row
  accountingData:   { bg: 'FFF8DC' },                // Light yellow inputs
  paymentsTitle:    { bg: '2F4B1F', fg: 'FFFFFF' },  // Dark green title bar
  paymentsHeader:   { bg: '1F3515', fg: 'FFFFFF' },  // Very dark green col headers
  paymentsData:     { bg: 'E8F5E9' },                // Light green inputs
  invoiceTitle:     { bg: '696969', fg: 'FFFFFF' },  // Gray title bar
  invoiceHeader:    { bg: '696969', fg: 'FFFFFF' },  // Gray col headers
  projectTotal:     { bg: '404040', fg: 'FFFFFF' },  // .total-grey
  sectionTotal:     { bg: '2563EB', fg: 'FFFFFF' },  // Blue SECTION TOTALS bar
  grandTotal:       { bg: 'C41E3A', fg: 'FFFFFF' },  // Red grand TOTAL bar
  typeAllSent:      { bg: '15803D', fg: 'FFFFFF' },  // Type cell when all rows SENT
};

const BORDER_THIN: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'D1D5DB' } };
const BORDERS_ALL: Partial<ExcelJS.Borders> = {
  top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN,
};
const NO_BORDER: Partial<ExcelJS.Borders> = {};

function fillBg(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

const CENTER: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center' };
const RIGHT: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'right' };

// ── Column definitions ──────────────────────────────────────────────

// Main grid columns (filtered by permission)
function getVisibleMainCols(isColumnVisible: (key: ColumnKey) => boolean): ColumnKey[] {
  return [...FIXED_COLUMNS, ...SCROLLABLE_COLUMNS].filter(col => isColumnVisible(col));
}

const DATE_COLUMNS = ['std', 'etd', 'rtr', 'rtd', 'rdy', 'ftd', 'snd', 'containerDate'];
const USD_MAIN_COLUMNS = ['pfUsd', 'invoice', 'expensesUsd'];
const TL_MAIN_COLUMNS = ['pfTl', 'invoiceTl', 'expensesTl'];

const isDateCol = (c: string) => DATE_COLUMNS.includes(c);
const isUsdCol = (c: string) => USD_MAIN_COLUMNS.includes(c);
const isTlCol = (c: string) => TL_MAIN_COLUMNS.includes(c);
const isMoneyCol = (c: string) => isUsdCol(c) || isTlCol(c);

// Accounting columns (8 columns matching React UI)
const ACCOUNTING_COLS = [
  { key: 'paidUsd1',      label: 'Paid USD 1',      fmt: '$#,##0.00', group: '1st / 2nd' },
  { key: 'paidUsd2',      label: 'Paid USD 2',      fmt: '$#,##0.00', group: '1st / 2nd' },
  { key: 'paidTl1',       label: 'Paid TL 1',       fmt: '₺#,##0.00', group: '1st / 2nd' },
  { key: 'paidTl2',       label: 'Paid TL 2',       fmt: '₺#,##0.00', group: '1st / 2nd' },
  { key: 'remainingUsd',  label: 'Remaining USD',   fmt: '$#,##0.00', group: 'Remaining' },
  { key: 'remainingTl',   label: 'Remaining TL',    fmt: '₺#,##0.00', group: 'Remaining' },
  { key: 'notOrderedUsd', label: 'Not Ordered USD', fmt: '$#,##0.00', group: 'Not Ordered' },
  { key: 'notOrderedTl',  label: 'Not Ordered TL',  fmt: '₺#,##0.00', group: 'Not Ordered' },
];

// Payment columns (6 columns matching React UI PaymentsGrid)
const PAYMENT_COLS = [
  { key: 'dueUsd',  label: 'Due USD',        fmt: '$#,##0.00', group: 'DUE PAYMENT' },
  { key: 'dueTl',   label: 'Due TL',         fmt: '₺#,##0.00', group: 'DUE PAYMENT' },
  { key: 'payUsd1', label: 'Payments 1 USD', fmt: '$#,##0.00', group: 'PAYMENTS 1' },
  { key: 'payTl1',  label: 'Payments 1 TL',  fmt: '₺#,##0.00', group: 'PAYMENTS 1' },
  { key: 'payUsd2', label: 'Payments 2 USD', fmt: '$#,##0.00', group: 'PAYMENTS 2' },
  { key: 'payTl2',  label: 'Payments 2 TL',  fmt: '₺#,##0.00', group: 'PAYMENTS 2' },
];

// Invoice columns
const INVOICE_COLS = [
  { key: 'transactionNo', label: 'Transaction No', group: 'INVOICE' },
  { key: 'invoiceNumber', label: 'Invoice Number', group: 'INVOICE' },
  { key: 'quickBook',     label: 'QuickBook',      group: 'INVOICE' },
];

const GAP_WIDTH = 3; // Width of gap columns between blocks

/**
 * Get item values for extra columns — replicates the React logic exactly:
 *  - Accounting (AccountingRow): remaining/not-ordered based on INVOICE amounts
 *    (currency inferred from pfTl), payments deducted
 *  - Due payment: same calculateRemaining used by the green PaymentsGrid
 */
function getItemExtraValues(item: BackendProjectItem) {
  const paidUsd1 = toNumber(item.paidUsd1);
  const paidUsd2 = toNumber(item.paidUsd2);
  const paidTl1 = toNumber(item.paidTl1);
  const paidTl2 = toNumber(item.paidTl2);

  // Accounting remaining / not-ordered (same as AccountingRow.getAccountingValues)
  const pfTl = toNumber(item.pfTl);
  const invoice = toNumber((item as any).invoice);
  const invoiceAsUsd = pfTl > 0 ? 0 : invoice;
  const invoiceAsTl = pfTl > 0 ? invoice : 0;
  const isPfSigned = item.pfSignStatus === 'SIGNED';
  const isNotOrdered = item.status === 'NOT_ORDERED';

  let remainingUsd = 0, remainingTl = 0;
  let notOrderedUsd = 0, notOrderedTl = 0;

  if (!isPfSigned || isNotOrdered) {
    notOrderedUsd = invoiceAsUsd;
    notOrderedTl = invoiceAsTl;
  } else {
    remainingUsd = Math.max(0, invoiceAsUsd - paidUsd1 - paidUsd2);
    remainingTl = Math.max(0, invoiceAsTl - paidTl1 - paidTl2);
  }

  // Due payment — exact same function the green payments grid uses
  const due = calculateRemaining(item);

  return {
    paidUsd1, paidUsd2, paidTl1, paidTl2,
    remainingUsd, remainingTl,
    notOrderedUsd, notOrderedTl,
    dueUsd: due.remainingUsd,
    dueTl: due.remainingTl,
    payUsd1: paidUsd1,
    payTl1: paidTl1,
    payUsd2: paidUsd2,
    payTl2: paidTl2,
    transactionNo: item.invoiceTransactionNo || '',
    invoiceNumber: item.invoiceNumber || '',
    quickBook: item.quickBook || '',
  };
}

/** Effective production amount: invoice replaces pf when entered (same as the site totals) */
function effectiveUsd(item: BackendProjectItem): number {
  const inv = toNumber((item as any).invoice);
  return inv > 0 ? inv : toNumber(item.pfUsd);
}
function effectiveTl(item: BackendProjectItem): number {
  const inv = toNumber((item as any).invoiceTl);
  return inv > 0 ? inv : toNumber(item.pfTl);
}

// ── Region sections interface ────────────────────────────────────────

export interface RegionSection {
  regionLabel: string;
  bucket: string;
  projects: BackendProject[];
}

// ── Column position mapping ─────────────────────────────────────────

interface ColumnLayout {
  mainStart: number;
  mainEnd: number;
  gap1: number;
  acctStart: number;
  acctEnd: number;
  gap2: number;
  payStart: number;
  payEnd: number;
  gap3: number;
  invStart: number;
  invEnd: number;
  totalExcelCols: number;
}

function buildColumnLayout(mainCount: number, acctCount: number, payCount: number, invCount: number): ColumnLayout {
  const mainStart = 1;
  const mainEnd = mainCount;
  const gap1 = mainEnd + 1;
  const acctStart = gap1 + 1;
  const acctEnd = acctStart + acctCount - 1;
  const gap2 = acctEnd + 1;
  const payStart = gap2 + 1;
  const payEnd = payStart + payCount - 1;
  const gap3 = payEnd + 1;
  const invStart = gap3 + 1;
  const invEnd = invStart + invCount - 1;
  const totalExcelCols = invEnd;

  return { mainStart, mainEnd, gap1, acctStart, acctEnd, gap2, payStart, payEnd, gap3, invStart, invEnd, totalExcelCols };
}

// ── Main Export ──────────────────────────────────────────────────────

/** Total Excel column count of the supplier layout (used for full-width banner rows) */
export function getSupplierLayoutTotalCols(isColumnVisible: (key: ColumnKey) => boolean): number {
  const mainCols = getVisibleMainCols(isColumnVisible);
  return buildColumnLayout(mainCols.length, ACCOUNTING_COLS.length, PAYMENT_COLS.length, INVOICE_COLS.length).totalExcelCols;
}

interface SupplierExportOptions {
  regionSections: RegionSection[];
  vendorCode: string;
  mode: 'p' | 'me' | 'do';
  isColumnVisible: (key: ColumnKey) => boolean;
}

/**
 * Write supplier region sections (Projects + Accounting + Payments + Invoice
 * blocks) into an existing worksheet, appending after the current last row.
 * Used by the single-supplier export and the all-suppliers export.
 */
export function writeSupplierSectionsToSheet(
  ws: ExcelJS.Worksheet,
  regionSections: RegionSection[],
  mode: 'p' | 'me' | 'do',
  isColumnVisible: (key: ColumnKey) => boolean,
): void {
  const mainCols = getVisibleMainCols(isColumnVisible);
  if (mainCols.length === 0) return;

  const mainCount = mainCols.length;
  const acctCount = ACCOUNTING_COLS.length;
  const payCount = PAYMENT_COLS.length;
  const invCount = INVOICE_COLS.length;

  const layout = buildColumnLayout(mainCount, acctCount, payCount, invCount);
  const projNoColIdx = mainCols.indexOf('projectNo'); // -1 if hidden
  const typeColIdx = mainCols.indexOf('type');
  const pfUsdColIdx = mainCols.indexOf('pfUsd');
  // TOTAL label goes in the column just before PF/USD (like the UI)
  const totalLabelIdx = pfUsdColIdx > 0 ? pfUsdColIdx - 1 : 0;

  // ── Set column widths ──
  const colWidths: number[] = [];
  mainCols.forEach(col => colWidths.push(Math.round(COLUMN_WIDTHS[col] / 7)));
  colWidths.push(GAP_WIDTH);
  ACCOUNTING_COLS.forEach(() => colWidths.push(16));
  colWidths.push(GAP_WIDTH);
  PAYMENT_COLS.forEach(() => colWidths.push(16));
  colWidths.push(GAP_WIDTH);
  INVOICE_COLS.forEach(() => colWidths.push(20));
  ws.columns = colWidths.map(w => ({ width: w }));

  // Helper: style gap cells in a row (no border, no fill)
  function clearGapCells(row: ExcelJS.Row) {
    [layout.gap1, layout.gap2, layout.gap3].forEach(gapCol => {
      const cell = row.getCell(gapCol);
      cell.border = NO_BORDER;
      cell.value = '';
    });
  }

  // Money cell writer: blank when 0, right-aligned (like the UI inputs)
  function setMoney(cell: ExcelJS.Cell, value: number, fmt: string) {
    cell.value = value !== 0 ? value : null;
    cell.numFmt = fmt;
    cell.alignment = RIGHT;
  }

  // Grand totals across all sections (for the bottom bars, like the page)
  let grandEffUsd = 0, grandEffTl = 0;
  let grandPaidUsd = 0, grandPaidTl = 0;
  let grandDueUsd = 0, grandDueTl = 0;

  // ── Iterate sections ──────────────────────────────────────────────

  for (const section of regionSections) {
    if (section.projects.length === 0) continue;

    // ── Section Header (separated per block with gaps) ──
    const sectionRow = ws.addRow(new Array(layout.totalExcelCols).fill(''));
    sectionRow.height = 28;

    // Main block: section label (red, centered — like .section-separator)
    if (mainCount > 1) {
      ws.mergeCells(sectionRow.number, layout.mainStart, sectionRow.number, layout.mainEnd);
    }
    const secMainCell = sectionRow.getCell(layout.mainStart);
    secMainCell.value = section.regionLabel;
    secMainCell.font = { bold: true, size: 14, color: { argb: COLORS.sectionHeader.fg } };
    secMainCell.fill = fillBg(COLORS.sectionHeader.bg);
    secMainCell.alignment = CENTER;

    // Accounting block: "ACCOUNTING <section>" (gold, like the page)
    if (acctCount > 1) {
      ws.mergeCells(sectionRow.number, layout.acctStart, sectionRow.number, layout.acctEnd);
    }
    const secAcctCell = sectionRow.getCell(layout.acctStart);
    secAcctCell.value = `ACCOUNTING ${section.regionLabel.replace('TLines ', '').toUpperCase()}`;
    secAcctCell.font = { bold: true, size: 12, color: { argb: COLORS.accountingTitle.fg } };
    secAcctCell.fill = fillBg(COLORS.accountingTitle.bg);
    secAcctCell.alignment = CENTER;

    // Payments block: "PAYMENTS <section>" (dark green, like the page)
    if (payCount > 1) {
      ws.mergeCells(sectionRow.number, layout.payStart, sectionRow.number, layout.payEnd);
    }
    const secPayCell = sectionRow.getCell(layout.payStart);
    secPayCell.value = `PAYMENTS ${section.regionLabel.replace('TLines ', 'T LINES ').toUpperCase()}`;
    secPayCell.font = { bold: true, size: 12, color: { argb: COLORS.paymentsTitle.fg } };
    secPayCell.fill = fillBg(COLORS.paymentsTitle.bg);
    secPayCell.alignment = CENTER;

    // Invoice block: "INVOICE & RECEIPT <section>" (gray, like the page)
    if (invCount > 1) {
      ws.mergeCells(sectionRow.number, layout.invStart, sectionRow.number, layout.invEnd);
    }
    const secInvCell = sectionRow.getCell(layout.invStart);
    secInvCell.value = `INVOICE & RECEIPT ${section.regionLabel.replace('TLines ', 'T LINES ').toUpperCase()}`;
    secInvCell.font = { bold: true, size: 12, color: { argb: COLORS.invoiceTitle.fg } };
    secInvCell.fill = fillBg(COLORS.invoiceTitle.bg);
    secInvCell.alignment = CENTER;

    clearGapCells(sectionRow);

    // Section totals (blue bar uses invoice-priority effective amounts, like the site)
    let sectionEffUsd = 0;
    let sectionEffTl = 0;

    for (const project of section.projects) {
      const items = project.items || [];
      if (items.length === 0) continue;

      const projColor = projectColorToArgb(getProjectColor(project as any) as ProjectColor);
      const modeKey = mode === 'do' ? 'directOrder' : (mode === 'me' ? 'missingExtra' : 'projects');
      const projNumber = normalizeProjectNoForDisplay(project.projectNo, modeKey as any);

      // ── Project Name Header (dark gray, centered — like .project-header) ──
      const projLabel = `${projNumber} - ${project.name}`;
      const projRow = ws.addRow(new Array(layout.totalExcelCols).fill(''));
      projRow.getCell(1).value = projLabel;
      ws.mergeCells(projRow.number, 1, projRow.number, layout.totalExcelCols);
      const projCell = projRow.getCell(1);
      projCell.font = { bold: true, size: 11, color: { argb: COLORS.projectHeader.fg } };
      projCell.fill = fillBg(COLORS.projectHeader.bg);
      projCell.alignment = CENTER;
      projRow.height = 24;

      // ── Column Headers Row (per block, matching the app's header rows) ──
      const hdrRow = ws.addRow(new Array(layout.totalExcelCols).fill(''));
      hdrRow.height = 22;

      mainCols.forEach((col, i) => {
        const cell = hdrRow.getCell(layout.mainStart + i);
        cell.value = OPERATIONAL_BOARD_COLUMNS[col].label;
        cell.font = { bold: true, size: 10, color: { argb: COLORS.columnHeader.fg } };
        cell.fill = fillBg(COLORS.columnHeader.bg);
        cell.alignment = { ...CENTER, wrapText: true };
        cell.border = BORDERS_ALL;
      });

      ACCOUNTING_COLS.forEach((col, i) => {
        const cell = hdrRow.getCell(layout.acctStart + i);
        cell.value = col.label;
        cell.font = { bold: true, size: 10, color: { argb: COLORS.accountingHeader.fg } };
        cell.fill = fillBg(COLORS.accountingHeader.bg);
        cell.alignment = { ...CENTER, wrapText: true };
        cell.border = BORDERS_ALL;
      });

      PAYMENT_COLS.forEach((col, i) => {
        const cell = hdrRow.getCell(layout.payStart + i);
        cell.value = col.label;
        cell.font = { bold: true, size: 10, color: { argb: COLORS.paymentsHeader.fg } };
        cell.fill = fillBg(COLORS.paymentsHeader.bg);
        cell.alignment = { ...CENTER, wrapText: true };
        cell.border = BORDERS_ALL;
      });

      INVOICE_COLS.forEach((col, i) => {
        const cell = hdrRow.getCell(layout.invStart + i);
        cell.value = col.label;
        cell.font = { bold: true, size: 10, color: { argb: COLORS.invoiceHeader.fg } };
        cell.fill = fillBg(COLORS.invoiceHeader.bg);
        cell.alignment = { ...CENTER, wrapText: true };
        cell.border = BORDERS_ALL;
      });

      clearGapCells(hdrRow);

      // ── Data Rows (grouped by type, like ProjectBlock) ──
      const typeGroups = groupItemsByType(items);
      const firstDataRowNum = ws.lastRow!.number + 1;
      let projectTotalPfUsd = 0;
      let projectTotalPfTl = 0;
      let projectTotalInv = 0;
      let projectTotalInvTl = 0;
      let rowCount = 0;

      // Accounting / payments totals (per project, like the grids' totals rows)
      let totalPaidUsd1 = 0, totalPaidUsd2 = 0, totalPaidTl1 = 0, totalPaidTl2 = 0;
      let totalRemainingUsd = 0, totalRemainingTl = 0;
      let totalNotOrderedUsd = 0, totalNotOrderedTl = 0;
      let totalDueUsd = 0, totalDueTl = 0;
      let totalPayUsd1 = 0, totalPayTl1 = 0, totalPayUsd2 = 0, totalPayTl2 = 0;

      for (const group of typeGroups) {
        const groupStartRowNum = ws.lastRow!.number + 1;

        // Type cell green when ALL rows in this type are SENT / SENT TO TLINES (like UI)
        const isAllSent = group.items.length > 0 && group.items.every(it => {
          const s = String(it.status || '').toUpperCase().replace(/[\s-]/g, '_');
          return s === 'SENT_TO_TLINES' || s === 'SENT';
        });

        for (const item of group.items) {
          const extra = getItemExtraValues(item);
          const dataRow = ws.addRow(new Array(layout.totalExcelCols).fill(''));
          dataRow.height = 18;

          // ── Main columns ──
          mainCols.forEach((col, i) => {
            const cell = dataRow.getCell(layout.mainStart + i);
            cell.font = { size: 10 };
            cell.border = BORDERS_ALL;
            cell.alignment = CENTER;

            if (col === 'projectNo' || col === 'type') {
              cell.value = ''; // merged later
              return;
            }

            if (col === 'pfCode') cell.value = item.pfCode || '';
            else if (col === 'vendor') cell.value = item.vendor ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name) : '';
            else if (col === 'orderType') cell.value = item.orderType || '';
            else if (col === 'pfSignStatus') cell.value = mapSignStatusToFrontend(item.pfSignStatus);
            else if (col === 'poSignStatus') cell.value = mapSignStatusToFrontend(item.poSignStatus);
            else if (col === 'status') cell.value = mapItemStatusToFrontend(item.status || '');
            else if (col === 'paymentRule') cell.value = item.paymentRule || '';
            else if (col === 'containerNo') cell.value = item.containerNo || '';
            else if (isMoneyCol(col)) {
              const n = toNumber((item as any)[col]);
              setMoney(cell, n, isUsdCol(col) ? '$#,##0.00' : '₺#,##0.00');
              cell.alignment = CENTER; // main grid cells are centered like the UI
            }
            else if (isDateCol(col)) {
              const d = parseDateValue((item as any)[col]);
              cell.value = d ?? '';
              cell.numFmt = 'dd/mm/yyyy';
            }
            else cell.value = (item as any)[col] ?? '';

            // Status cell coloring (same palette as the UI)
            if (col === 'status' || col === 'pfSignStatus' || col === 'poSignStatus') {
              const rawStatus = col === 'status' ? item.status :
                               col === 'pfSignStatus' ? item.pfSignStatus : item.poSignStatus;
              const statusFill = getStatusExcelFill(rawStatus);
              if (statusFill) {
                cell.fill = fillBg(statusFill.bg);
                cell.font = { size: 10, color: { argb: statusFill.fg }, bold: true };
              }
            }
          });

          // ── Accounting columns (light yellow like the inputs) ──
          const acctValues = [
            extra.paidUsd1, extra.paidUsd2,
            extra.paidTl1, extra.paidTl2,
            extra.remainingUsd, extra.remainingTl,
            extra.notOrderedUsd, extra.notOrderedTl,
          ];
          ACCOUNTING_COLS.forEach((colDef, i) => {
            const cell = dataRow.getCell(layout.acctStart + i);
            cell.font = { size: 10 };
            cell.border = BORDERS_ALL;
            cell.fill = fillBg(COLORS.accountingData.bg);
            setMoney(cell, acctValues[i], colDef.fmt);
          });

          // ── Payment columns (light green like the inputs) ──
          const payValues = [extra.dueUsd, extra.dueTl, extra.payUsd1, extra.payTl1, extra.payUsd2, extra.payTl2];
          PAYMENT_COLS.forEach((colDef, i) => {
            const cell = dataRow.getCell(layout.payStart + i);
            cell.font = { size: 10 };
            cell.border = BORDERS_ALL;
            cell.fill = fillBg(COLORS.paymentsData.bg);
            setMoney(cell, payValues[i], colDef.fmt);
          });

          // ── Invoice columns (white like the grid) ──
          const invValues = [extra.transactionNo, extra.invoiceNumber, extra.quickBook];
          INVOICE_COLS.forEach((_colDef, i) => {
            const cell = dataRow.getCell(layout.invStart + i);
            cell.value = invValues[i] || '';
            cell.font = { size: 10 };
            cell.border = BORDERS_ALL;
            cell.alignment = CENTER;
          });

          clearGapCells(dataRow);

          // Accumulate totals
          projectTotalPfUsd += toNumber(item.pfUsd);
          projectTotalPfTl += toNumber(item.pfTl);
          projectTotalInv += toNumber((item as any).invoice);
          projectTotalInvTl += toNumber((item as any).invoiceTl);
          sectionEffUsd += effectiveUsd(item);
          sectionEffTl += effectiveTl(item);
          grandPaidUsd += extra.payUsd1 + extra.payUsd2;
          grandPaidTl += extra.payTl1 + extra.payTl2;
          grandDueUsd += extra.dueUsd;
          grandDueTl += extra.dueTl;
          totalPaidUsd1 += extra.paidUsd1;
          totalPaidUsd2 += extra.paidUsd2;
          totalPaidTl1 += extra.paidTl1;
          totalPaidTl2 += extra.paidTl2;
          totalRemainingUsd += extra.remainingUsd;
          totalRemainingTl += extra.remainingTl;
          totalNotOrderedUsd += extra.notOrderedUsd;
          totalNotOrderedTl += extra.notOrderedTl;
          totalDueUsd += extra.dueUsd;
          totalDueTl += extra.dueTl;
          totalPayUsd1 += extra.payUsd1;
          totalPayTl1 += extra.payTl1;
          totalPayUsd2 += extra.payUsd2;
          totalPayTl2 += extra.payTl2;
          rowCount++;
        }

        const groupEndRowNum = ws.lastRow!.number;

        // ── Merge TYPE cell per type group (like the UI spanning cell) ──
        if (typeColIdx >= 0 && group.items.length > 0) {
          const excelCol = layout.mainStart + typeColIdx;
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
      }

      // ── Project TOTAL Row (dark gray — like .total-grey) ──
      const ptRow = ws.addRow(new Array(layout.totalExcelCols).fill(''));
      ptRow.height = 20;

      // Main block total: label before PF/USD, PF + INV column sums (like the UI)
      for (let i = 0; i < mainCount; i++) {
        const cell = ptRow.getCell(layout.mainStart + i);
        cell.font = { bold: true, size: 10, color: { argb: COLORS.projectTotal.fg } };
        cell.fill = fillBg(COLORS.projectTotal.bg);
        cell.border = BORDERS_ALL;
        cell.alignment = CENTER;

        const colKey = mainCols[i];
        if (i === totalLabelIdx) cell.value = 'TOTAL';
        else if (colKey === 'pfUsd') { setMoney(cell, projectTotalPfUsd, '$#,##0.00'); cell.alignment = CENTER; }
        else if (colKey === 'pfTl') { setMoney(cell, projectTotalPfTl, '₺#,##0.00'); cell.alignment = CENTER; }
        else if (colKey === 'invoice') { setMoney(cell, projectTotalInv, '$#,##0.00'); cell.alignment = CENTER; }
        else if (colKey === 'invoiceTl') { setMoney(cell, projectTotalInvTl, '₺#,##0.00'); cell.alignment = CENTER; }
        if (isMoneyCol(colKey)) {
          cell.font = { bold: true, size: 10, color: { argb: COLORS.projectTotal.fg } };
          cell.fill = fillBg(COLORS.projectTotal.bg);
        }
      }

      // Accounting block totals (white bg, black bold — like the grid's totals row)
      const acctTotals = [totalPaidUsd1, totalPaidUsd2, totalPaidTl1, totalPaidTl2, totalRemainingUsd, totalRemainingTl, totalNotOrderedUsd, totalNotOrderedTl];
      ACCOUNTING_COLS.forEach((colDef, i) => {
        const cell = ptRow.getCell(layout.acctStart + i);
        cell.font = { bold: true, size: 10, color: { argb: '000000' } };
        cell.border = BORDERS_ALL;
        setMoney(cell, acctTotals[i], colDef.fmt);
        cell.font = { bold: true, size: 10, color: { argb: '000000' } };
      });

      // Payments block totals (light green bg, dark green bold — like the grid)
      const payTotals = [totalDueUsd, totalDueTl, totalPayUsd1, totalPayTl1, totalPayUsd2, totalPayTl2];
      PAYMENT_COLS.forEach((colDef, i) => {
        const cell = ptRow.getCell(layout.payStart + i);
        cell.fill = fillBg(COLORS.paymentsData.bg);
        cell.border = BORDERS_ALL;
        setMoney(cell, payTotals[i], colDef.fmt);
        cell.font = { bold: true, size: 10, color: { argb: '1F3515' } };
      });

      // Invoice block total (empty)
      INVOICE_COLS.forEach((_colDef, i) => {
        const cell = ptRow.getCell(layout.invStart + i);
        cell.value = '';
        cell.border = BORDERS_ALL;
      });

      clearGapCells(ptRow);

      // ── Merge Project No column vertically incl. TOTAL row (like the UI) ──
      if (projNoColIdx >= 0 && rowCount > 0) {
        const excelCol = layout.mainStart + projNoColIdx;
        if (ptRow.number > firstDataRowNum) {
          ws.mergeCells(firstDataRowNum, excelCol, ptRow.number, excelCol);
        }
        const mergedCell = ws.getCell(firstDataRowNum, excelCol);
        mergedCell.value = projNumber;
        mergedCell.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
        mergedCell.fill = fillBg(projColor);
        mergedCell.alignment = CENTER;
        mergedCell.border = BORDERS_ALL;
      }
    }

    grandEffUsd += sectionEffUsd;
    grandEffTl += sectionEffTl;

    // ── Section Total Row (blue bar with effective totals, like the site) ──
    const stRow = ws.addRow(new Array(layout.totalExcelCols).fill(''));
    stRow.height = 24;

    for (let i = 0; i < mainCount; i++) {
      const cell = stRow.getCell(layout.mainStart + i);
      cell.font = { bold: true, size: 12, color: { argb: COLORS.sectionTotal.fg } };
      cell.fill = fillBg(COLORS.sectionTotal.bg);
      cell.border = BORDERS_ALL;
      cell.alignment = CENTER;

      const colKey = mainCols[i];
      if (colKey === 'pfUsd') { setMoney(cell, sectionEffUsd, '$#,##0.00'); cell.alignment = CENTER; }
      else if (colKey === 'pfTl') { setMoney(cell, sectionEffTl, '₺#,##0.00'); cell.alignment = CENTER; }
      if (isMoneyCol(colKey)) {
        cell.font = { bold: true, size: 12, color: { argb: COLORS.sectionTotal.fg } };
        cell.fill = fillBg(COLORS.sectionTotal.bg);
      }
    }
    // Centered label merged across the columns before PF/USD (like the blue bar)
    const labelEnd = pfUsdColIdx > 1 ? pfUsdColIdx : 1;
    if (labelEnd > 1) {
      ws.mergeCells(stRow.number, layout.mainStart, stRow.number, layout.mainStart + labelEnd - 1);
    }
    const stLabelCell = ws.getCell(stRow.number, layout.mainStart);
    stLabelCell.value = `${section.regionLabel.replace('TLines ', '').toUpperCase()} TOTALS`;
    stLabelCell.alignment = CENTER;

    clearGapCells(stRow);

    // Empty spacer row
    ws.addRow([]);
  }

  // ── Bottom grand bars (red / gold / green — like the page footer bars) ──
  if (regionSections.some(s => s.projects.length > 0)) {
    const modeTotalLabels: Record<string, string> = {
      p: 'PROJECTS TOTAL',
      me: 'MISSING & EXTRA TOTAL',
      do: 'DIRECT ORDERS TOTAL',
    };

    const gtRow = ws.addRow(new Array(layout.totalExcelCols).fill(''));
    gtRow.height = 26;

    // Red grand TOTAL bar across main cols, totals in PF columns
    for (let i = 0; i < mainCount; i++) {
      const cell = gtRow.getCell(layout.mainStart + i);
      cell.font = { bold: true, size: 12, color: { argb: COLORS.grandTotal.fg } };
      cell.fill = fillBg(COLORS.grandTotal.bg);
      cell.border = BORDERS_ALL;
      cell.alignment = CENTER;

      const colKey = mainCols[i];
      if (colKey === 'pfUsd') { setMoney(cell, grandEffUsd, '$#,##0.00'); cell.alignment = CENTER; }
      else if (colKey === 'pfTl') { setMoney(cell, grandEffTl, '₺#,##0.00'); cell.alignment = CENTER; }
      if (isMoneyCol(colKey)) {
        cell.font = { bold: true, size: 12, color: { argb: COLORS.grandTotal.fg } };
        cell.fill = fillBg(COLORS.grandTotal.bg);
      }
    }
    const gtLabelEnd = pfUsdColIdx > 1 ? pfUsdColIdx : 1;
    if (gtLabelEnd > 1) {
      ws.mergeCells(gtRow.number, layout.mainStart, gtRow.number, layout.mainStart + gtLabelEnd - 1);
    }
    const gtLabelCell = ws.getCell(gtRow.number, layout.mainStart);
    gtLabelCell.value = modeTotalLabels[mode];
    gtLabelCell.alignment = CENTER;

    // Gold ACCOUNTING GRAND TOTAL bar (same effective totals, like the page)
    ws.mergeCells(gtRow.number, layout.acctStart, gtRow.number, layout.acctEnd);
    const acctGtCell = ws.getCell(gtRow.number, layout.acctStart);
    acctGtCell.value = `ACCOUNTING GRAND TOTAL   ${fmtUsdText(grandEffUsd)}   ${fmtTlText(grandEffTl)}`;
    acctGtCell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
    acctGtCell.fill = fillBg(COLORS.accountingTitle.bg);
    acctGtCell.alignment = CENTER;
    acctGtCell.border = BORDERS_ALL;

    // Green PAYMENTS GRAND TOTAL bar (due left, payments right — like the page)
    ws.mergeCells(gtRow.number, layout.payStart, gtRow.number, layout.payEnd);
    const payGtCell = ws.getCell(gtRow.number, layout.payStart);
    payGtCell.value = `PAYMENTS GRAND TOTAL   DUE: ${fmtUsdText(grandDueUsd)} ${fmtTlText(grandDueTl)}   PAID: ${fmtUsdText(grandPaidUsd)} ${fmtTlText(grandPaidTl)}`;
    payGtCell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
    payGtCell.fill = fillBg(COLORS.paymentsTitle.bg);
    payGtCell.alignment = CENTER;
    payGtCell.border = BORDERS_ALL;

    clearGapCells(gtRow);
    ws.addRow([]);
  }
}

export async function exportSupplierToExcel({
  regionSections,
  vendorCode,
  mode,
  isColumnVisible,
}: SupplierExportOptions): Promise<void> {
  if (getVisibleMainCols(isColumnVisible).length === 0) return;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Supplier Export';
  wb.created = new Date();

  const modeLabels: Record<string, string> = { p: 'Projects', me: 'Missing Extra', do: 'Direct Orders' };
  const sheetName = `${vendorCode} ${modeLabels[mode]}`;
  const ws = wb.addWorksheet(sheetName.substring(0, 31));

  writeSupplierSectionsToSheet(ws, regionSections, mode, isColumnVisible);

  // ── Write & Download ──────────────────────────────────────────────

  const modeFileLabels: Record<string, string> = { p: 'Projects', me: 'Missing_Extra', do: 'Direct_Orders' };
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${vendorCode}_${modeFileLabels[mode]}_${dateStr}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, filename);
}
