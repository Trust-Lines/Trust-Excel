import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type {
  Money2,
  CategoryRows,
  CompanyTotals,
  CompanyDef,
} from '../../types/projectTotal';
import { calcTotalDolar } from '../moneyUtils';

// ── Helpers ──────────────────────────────────────────────────────────

function fillBg(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

const BORDER_THIN: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'D1D5DB' } };
const BORDERS_ALL: Partial<ExcelJS.Borders> = {
  top: BORDER_THIN,
  bottom: BORDER_THIN,
  left: BORDER_THIN,
  right: BORDER_THIN,
};

function sumRows(r: CategoryRows): Money2 {
  return {
    usd: r.projects.usd + r.directOrder.usd + r.missingExtra.usd + (r.trustExpenses?.usd || 0),
    tl: r.projects.tl + r.directOrder.tl + r.missingExtra.tl + (r.trustExpenses?.tl || 0),
  };
}

function addMoney(a: Money2, b: Money2): Money2 {
  return { usd: a.usd + b.usd, tl: a.tl + b.tl };
}

function addRows(a: CategoryRows, b: CategoryRows): CategoryRows {
  return {
    projects: addMoney(a.projects, b.projects),
    directOrder: addMoney(a.directOrder, b.directOrder),
    missingExtra: addMoney(a.missingExtra, b.missingExtra),
    trustExpenses: addMoney(
      a.trustExpenses || { usd: 0, tl: 0 },
      b.trustExpenses || { usd: 0, tl: 0 },
    ),
  };
}

function emptyRows(): CategoryRows {
  return {
    projects: { usd: 0, tl: 0 },
    directOrder: { usd: 0, tl: 0 },
    missingExtra: { usd: 0, tl: 0 },
  };
}

// Colors
const COL_HEADER_BG = '374151';
const COMPANY_BG = '4B5563';
const TOTAL_BG = '1E293B';
const GRAND_SUB_BG = '166534';
const GRAND_TOTAL_BG = '0F172A';
const GRAND_FINAL_BG = '111827';
const PF_HEADER_BG = '4472C4';
const EXP_HEADER_BG = '92400E';

// Column layout:
// LEFT:  A=Label(1), B=PF/USD(2), C=PF/TL(3), D=ALL(4), E=Rate(5)
// GAP:   F(6)
// RIGHT: G=Label(7), H=Exp/USD(8), I=Exp/TL(9), J=ALL(10), K=Rate(11)

const L = { label: 1, usd: 2, tl: 3, all: 4, rate: 5 };
const R = { label: 7, usd: 8, tl: 9, all: 10, rate: 11 };
const GAP_COL = 6;

// ── Main export ─────────────────────────────────────────────────────

/**
 * Write the Project Total sheet (as shown on /project-total) into an
 * existing workbook. Used by the standalone export and the multi-tab export.
 */
export function writeProjectTotalSheet(
  wb: ExcelJS.Workbook,
  data: CompanyTotals[],
  usdTryRate: number,
  productionCompanies: CompanyDef[],
  expensesCompanies: CompanyDef[],
): void {
  const ws = wb.addWorksheet('Project Total');

  const LABEL_W = 22;
  const DATA_W = 16;
  const RATE_W = 10;
  const GAP_W = 3;

  // Set column widths
  for (const side of [L, R]) {
    ws.getColumn(side.label).width = LABEL_W;
    ws.getColumn(side.usd).width = DATA_W;
    ws.getColumn(side.tl).width = DATA_W;
    ws.getColumn(side.all).width = DATA_W;
    ws.getColumn(side.rate).width = RATE_W;
  }
  ws.getColumn(GAP_COL).width = GAP_W;

  let row = 1;
  const safeRate = usdTryRate > 0 ? usdTryRate : 0;
  const calcAll = (m: Money2) => (safeRate > 0 ? m.usd + m.tl / safeRate : 0);

  // Helper: style a cell
  const sc = (
    r: number,
    c: number,
    value: string | number | null,
    opts: {
      bg?: string; fg?: string; bold?: boolean;
      align?: 'left' | 'center' | 'right';
      numFmt?: string; fontSize?: number;
    } = {},
  ) => {
    const cell = ws.getRow(r).getCell(c);
    cell.value = value;
    if (opts.bg) cell.fill = fillBg(opts.bg);
    cell.font = {
      bold: opts.bold || false,
      color: opts.fg ? { argb: opts.fg } : undefined,
      size: opts.fontSize || 10,
    };
    cell.alignment = { horizontal: opts.align || 'center', vertical: 'middle' };
    cell.border = BORDERS_ALL;
    if (opts.numFmt) cell.numFmt = opts.numFmt;
  };

  const numOrNull = (v: number) => (v === 0 ? null : v);

  // ── Row 1: Section headers ──
  ws.mergeCells(row, L.label, row, L.rate);
  sc(row, L.label, 'PRODUCTION PRICE', { bg: PF_HEADER_BG, fg: 'FFFFFF', bold: true, fontSize: 11 });
  ws.mergeCells(row, R.label, row, R.rate);
  sc(row, R.label, 'EXPENSES', { bg: EXP_HEADER_BG, fg: 'FFFFFF', bold: true, fontSize: 11 });
  ws.getRow(row).height = 24;
  row++;

  // ── Row 2: Column headers ──
  const writeColHeaders = (s: typeof L, labels: [string, string]) => {
    sc(row, s.label, '', { bg: COL_HEADER_BG });
    sc(row, s.usd, labels[0], { bg: COL_HEADER_BG, fg: 'FFFFFF', bold: true });
    sc(row, s.tl, labels[1], { bg: COL_HEADER_BG, fg: 'FFFFFF', bold: true });
    sc(row, s.all, 'ALL', { bg: COL_HEADER_BG, fg: 'FFFFFF', bold: true });
    sc(row, s.rate, '', { bg: COL_HEADER_BG });
  };
  writeColHeaders(L, ['PF / USD', 'PF / TL']);
  writeColHeaders(R, ['Exp / USD', 'Exp / TL']);
  ws.getRow(row).height = 20;
  row++;

  // ── Helper: write a company name row ──
  const writeCompanyHeader = (label: string, side: typeof L) => {
    ws.mergeCells(row, side.label, row, side.rate);
    sc(row, side.label, label, { bg: COMPANY_BG, fg: 'FFFFFF', bold: true, align: 'left', fontSize: 11 });
  };

  // ── Helper: write a money row for one side ──
  const writeMoneyRow = (
    side: typeof L,
    label: string,
    m: Money2 | null | undefined,
    opts: { bg: string; fg?: string; bold?: boolean },
  ) => {
    sc(row, side.label, label, { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'left' });
    if (m) {
      sc(row, side.usd, numOrNull(m.usd), { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'right', numFmt: '$#,##0.00' });
      sc(row, side.tl, numOrNull(m.tl), { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'right', numFmt: '₺#,##0.00' });
      const all = calcAll(m);
      sc(row, side.all, numOrNull(all), { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'right', numFmt: '$#,##0.00' });
    } else {
      sc(row, side.usd, '-', { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'right' });
      sc(row, side.tl, '-', { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'right' });
      sc(row, side.all, '-', { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'right' });
    }
    sc(row, side.rate, null, { bg: opts.bg });
  };

  // ── Company data (left & right side-by-side where both exist) ──
  const prodCompanies = data.filter((d) => productionCompanies.some((c) => c.key === d.companyKey));
  const expCompanies = data.filter((d) => expensesCompanies.some((c) => c.key === d.companyKey));
  const maxLen = Math.max(prodCompanies.length, expCompanies.length);

  for (let i = 0; i < maxLen; i++) {
    const pc = prodCompanies[i];
    const ec = expCompanies[i];

    // Company header row
    ws.getRow(row).height = 22;
    if (pc) writeCompanyHeader(pc.label, L);
    if (ec) writeCompanyHeader(ec.label, R);
    row++;

    // 4 category rows (including Trust Expenses)
    const categories: (keyof CategoryRows)[] = ['projects', 'directOrder', 'missingExtra', 'trustExpenses'];
    const catLabels = ['  Projects', '  Direct Order', '  Missing & Extra', '  Trust Expenses'];

    for (let ci = 0; ci < categories.length; ci++) {
      ws.getRow(row).height = 18;
      if (pc) writeMoneyRow(L, catLabels[ci], pc.production[categories[ci]], { bg: 'FFFFFF' });
      if (ec) writeMoneyRow(R, catLabels[ci], ec.expenses[categories[ci]], { bg: 'FFFFFF' });
      row++;
    }

    // TOTAL row
    ws.getRow(row).height = 18;
    if (pc) writeMoneyRow(L, '  TOTAL', sumRows(pc.production), { bg: TOTAL_BG, fg: 'FFFFFF', bold: true });
    if (ec) writeMoneyRow(R, '  TOTAL', sumRows(ec.expenses), { bg: TOTAL_BG, fg: 'FFFFFF', bold: true });
    row++;
  }

  // ── Grand Total section ──
  const prodGrandRows = prodCompanies.reduce<CategoryRows>((acc, c) => addRows(acc, c.production), emptyRows());
  const expGrandRows = expCompanies.reduce<CategoryRows>((acc, c) => addRows(acc, c.expenses), emptyRows());
  const prodGrandTotal = sumRows(prodGrandRows);
  const expGrandTotal = sumRows(expGrandRows);

  // Category subtotals (green)
  const grandCats: { label: string; key: keyof CategoryRows }[] = [
    { label: '  Projects', key: 'projects' },
    { label: '  Direct Order', key: 'directOrder' },
    { label: '  Missing & Extra', key: 'missingExtra' },
    { label: '  Trust Expenses', key: 'trustExpenses' },
  ];

  for (const gc of grandCats) {
    ws.getRow(row).height = 18;
    writeMoneyRow(L, gc.label, prodGrandRows[gc.key], { bg: GRAND_SUB_BG, fg: 'FFFFFF', bold: true });
    writeMoneyRow(R, gc.label, expGrandRows[gc.key], { bg: GRAND_SUB_BG, fg: 'FFFFFF', bold: true });
    row++;
  }

  // TOTAL row
  ws.getRow(row).height = 18;
  writeMoneyRow(L, '  TOTAL', prodGrandTotal, { bg: GRAND_TOTAL_BG, fg: 'FFFFFF', bold: true });
  writeMoneyRow(R, '  TOTAL', expGrandTotal, { bg: GRAND_TOTAL_BG, fg: 'FFFFFF', bold: true });
  row++;

  // TOTAL DOLAR row
  const writeTotalDolar = (side: typeof L, gt: Money2) => {
    const td = calcTotalDolar(gt, safeRate);
    sc(row, side.label, '  TOTAL DOLAR', { bg: GRAND_TOTAL_BG, fg: 'FFFFFF', bold: true, align: 'left' });
    sc(row, side.usd, td != null ? numOrNull(td) : null, { bg: GRAND_TOTAL_BG, fg: 'FFFFFF', bold: true, align: 'right', numFmt: '$#,##0.00' });
    sc(row, side.tl, null, { bg: GRAND_TOTAL_BG });
    sc(row, side.all, null, { bg: GRAND_TOTAL_BG });
    sc(row, side.rate, null, { bg: GRAND_TOTAL_BG });
  };
  ws.getRow(row).height = 18;
  writeTotalDolar(L, prodGrandTotal);
  writeTotalDolar(R, expGrandTotal);
  row++;

  // GRAND TOTAL DOLAR row
  const writeGrandFinal = (side: typeof L, gt: Money2) => {
    const td = calcTotalDolar(gt, safeRate);
    sc(row, side.label, 'GRAND TOTAL DOLAR', { bg: GRAND_FINAL_BG, fg: 'FFFFFF', bold: true, align: 'left', fontSize: 11 });
    sc(row, side.usd, td != null ? numOrNull(td) : null, { bg: GRAND_FINAL_BG, fg: 'FFFFFF', bold: true, align: 'right', numFmt: '$#,##0.00' });
    sc(row, side.tl, null, { bg: GRAND_FINAL_BG });
    sc(row, side.all, null, { bg: GRAND_FINAL_BG });
    sc(row, side.rate, safeRate > 0 ? safeRate : null, { bg: GRAND_FINAL_BG, fg: 'FDE68A', bold: true, align: 'center' });
  };
  ws.getRow(row).height = 24;
  writeGrandFinal(L, prodGrandTotal);
  writeGrandFinal(R, expGrandTotal);
  row++;
}

export async function exportProjectTotalExcel(
  data: CompanyTotals[],
  usdTryRate: number,
  productionCompanies: CompanyDef[],
  expensesCompanies: CompanyDef[],
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  writeProjectTotalSheet(wb, data, usdTryRate, productionCompanies, expensesCompanies);

  // ── Save ──
  const today = new Date().toISOString().slice(0, 10);
  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf]), `Project_Total_${today}.xlsx`);
}
