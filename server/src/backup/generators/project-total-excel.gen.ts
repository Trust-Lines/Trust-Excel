import * as ExcelJS from 'exceljs';
import { BORDERS_ALL, fillBg, toNumber, SECTION_ORDER } from './shared-styles';

interface Money2 { usd: number; tl: number; }
interface CategoryRows { projects: Money2; directOrder: Money2; missingExtra: Money2; trustExpenses: Money2; }

function emptyRows(): CategoryRows {
  return { projects: { usd: 0, tl: 0 }, directOrder: { usd: 0, tl: 0 }, missingExtra: { usd: 0, tl: 0 }, trustExpenses: { usd: 0, tl: 0 } };
}
function addMoney(a: Money2, b: Money2): Money2 { return { usd: a.usd + b.usd, tl: a.tl + b.tl }; }
function addRows(a: CategoryRows, b: CategoryRows): CategoryRows {
  return { projects: addMoney(a.projects, b.projects), directOrder: addMoney(a.directOrder, b.directOrder), missingExtra: addMoney(a.missingExtra, b.missingExtra), trustExpenses: addMoney(a.trustExpenses, b.trustExpenses) };
}
function sumRows(r: CategoryRows): Money2 {
  return { usd: r.projects.usd + r.directOrder.usd + r.missingExtra.usd + r.trustExpenses.usd, tl: r.projects.tl + r.directOrder.tl + r.missingExtra.tl + r.trustExpenses.tl };
}

// Invoice (discounted price) replaces pf when entered
function effAmount(invoice: any, pf: any): number {
  const inv = toNumber(invoice);
  return inv > 0 ? inv : toNumber(pf);
}

export async function generateProjectTotalExcel(prisma: any): Promise<ExcelJS.Workbook> {
  const [projItems, doItems, meItems, teItems, expPItems, expDoItems, expMeItems] = await Promise.all([
    prisma.projectItem.findMany({ where: { deletedAt: null, project: { deletedAt: null } }, select: { pfUsd: true, pfTl: true, invoice: true, invoiceTl: true, project: { select: { bucket: true } } } }),
    prisma.directOrderItem.findMany({ where: { deletedAt: null, project: { deletedAt: null } }, select: { pfUsd: true, pfTl: true, invoice: true, invoiceTl: true, project: { select: { bucket: true } } } }),
    prisma.missingExtraItem.findMany({ where: { deletedAt: null, case: { deletedAt: null } }, select: { pfUsd: true, pfTl: true, invoice: true, invoiceTl: true, case: { select: { section: true } } } }),
    prisma.trustExpenseItem.findMany({ where: { deletedAt: null, project: { deletedAt: null } }, select: { expensesUsd: true, expensesTl: true, project: { select: { bucket: true } } } }),
    prisma.expensesPItem.findMany({ where: { deletedAt: null, project: { deletedAt: null } }, select: { expensesUsd: true, expensesTl: true, project: { select: { bucket: true } } } }),
    prisma.expensesDirectOrderItem.findMany({ where: { deletedAt: null, project: { deletedAt: null } }, select: { expensesUsd: true, expensesTl: true, project: { select: { bucket: true } } } }),
    prisma.expensesMissingExtraItem.findMany({ where: { deletedAt: null, project: { deletedAt: null } }, select: { expensesUsd: true, expensesTl: true, project: { select: { bucket: true } } } }),
  ]);

  // Aggregate by bucket
  const prodByBucket = new Map<string, CategoryRows>();
  const expByBucket = new Map<string, CategoryRows>();
  for (const s of SECTION_ORDER) {
    prodByBucket.set(s.id, emptyRows());
    expByBucket.set(s.id, emptyRows());
  }

  for (const i of projItems) {
    const b = i.project?.bucket; if (!b || !prodByBucket.has(b)) continue;
    const r = prodByBucket.get(b)!;
    r.projects.usd += effAmount(i.invoice, i.pfUsd); r.projects.tl += effAmount(i.invoiceTl, i.pfTl);
  }
  for (const i of doItems) {
    const b = i.project?.bucket; if (!b || !prodByBucket.has(b)) continue;
    const r = prodByBucket.get(b)!;
    r.directOrder.usd += effAmount(i.invoice, i.pfUsd); r.directOrder.tl += effAmount(i.invoiceTl, i.pfTl);
  }
  for (const i of meItems) {
    const b = i.case?.section; if (!b || !prodByBucket.has(b)) continue;
    const r = prodByBucket.get(b)!;
    r.missingExtra.usd += effAmount(i.invoice, i.pfUsd); r.missingExtra.tl += effAmount(i.invoiceTl, i.pfTl);
  }
  for (const i of teItems) {
    const b = i.project?.bucket; if (!b || !prodByBucket.has(b)) continue;
    const r = prodByBucket.get(b)!;
    r.trustExpenses.usd += toNumber(i.expensesUsd); r.trustExpenses.tl += toNumber(i.expensesTl);
  }
  for (const i of expPItems) {
    const b = i.project?.bucket; if (!b || !expByBucket.has(b)) continue;
    const r = expByBucket.get(b)!;
    r.projects.usd += toNumber(i.expensesUsd); r.projects.tl += toNumber(i.expensesTl);
  }
  for (const i of expDoItems) {
    const b = i.project?.bucket; if (!b || !expByBucket.has(b)) continue;
    const r = expByBucket.get(b)!;
    r.directOrder.usd += toNumber(i.expensesUsd); r.directOrder.tl += toNumber(i.expensesTl);
  }
  for (const i of expMeItems) {
    const b = i.project?.bucket; if (!b || !expByBucket.has(b)) continue;
    const r = expByBucket.get(b)!;
    r.missingExtra.usd += toNumber(i.expensesUsd); r.missingExtra.tl += toNumber(i.expensesTl);
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Project Total');

  const L = { label: 1, usd: 2, tl: 3, all: 4, rate: 5 };
  const R = { label: 7, usd: 8, tl: 9, all: 10, rate: 11 };
  const GAP_COL = 6;

  for (const side of [L, R]) {
    ws.getColumn(side.label).width = 22;
    ws.getColumn(side.usd).width = 16;
    ws.getColumn(side.tl).width = 16;
    ws.getColumn(side.all).width = 16;
    ws.getColumn(side.rate).width = 10;
  }
  ws.getColumn(GAP_COL).width = 3;

  let row = 1;
  const usdTryRate = 35; // Default rate, can be parameterized

  const sc = (r: number, c: number, value: any, opts: any = {}) => {
    const cell = ws.getRow(r).getCell(c);
    cell.value = value;
    if (opts.bg) cell.fill = fillBg(opts.bg);
    cell.font = { bold: opts.bold || false, color: opts.fg ? { argb: opts.fg } : undefined, size: opts.fontSize || 10 };
    cell.alignment = { horizontal: opts.align || 'center', vertical: 'middle' };
    cell.border = BORDERS_ALL;
    if (opts.numFmt) cell.numFmt = opts.numFmt;
  };

  const calcAll = (m: Money2) => usdTryRate > 0 ? m.usd + m.tl / usdTryRate : 0;
  const numOrNull = (v: number) => v === 0 ? null : v;

  // Section headers
  ws.mergeCells(row, L.label, row, L.rate);
  sc(row, L.label, 'PRODUCTION PRICE', { bg: '4472C4', fg: 'FFFFFF', bold: true, fontSize: 11 });
  ws.mergeCells(row, R.label, row, R.rate);
  sc(row, R.label, 'EXPENSES', { bg: '92400E', fg: 'FFFFFF', bold: true, fontSize: 11 });
  ws.getRow(row).height = 24;
  row++;

  // Column headers
  const writeColHeaders = (s: typeof L, labels: [string, string]) => {
    sc(row, s.label, '', { bg: '374151' });
    sc(row, s.usd, labels[0], { bg: '374151', fg: 'FFFFFF', bold: true });
    sc(row, s.tl, labels[1], { bg: '374151', fg: 'FFFFFF', bold: true });
    sc(row, s.all, 'ALL', { bg: '374151', fg: 'FFFFFF', bold: true });
    sc(row, s.rate, '', { bg: '374151' });
  };
  writeColHeaders(L, ['PF / USD', 'PF / TL']);
  writeColHeaders(R, ['Exp / USD', 'Exp / TL']);
  ws.getRow(row).height = 20;
  row++;

  const writeMoneyRow = (side: typeof L, label: string, m: Money2 | null, opts: { bg: string; fg?: string; bold?: boolean }) => {
    sc(row, side.label, label, { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'left' });
    if (m) {
      sc(row, side.usd, numOrNull(m.usd), { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'right', numFmt: '$#,##0.00' });
      sc(row, side.tl, numOrNull(m.tl), { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'right', numFmt: '₺#,##0.00' });
      sc(row, side.all, numOrNull(calcAll(m)), { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'right', numFmt: '$#,##0.00' });
    } else {
      sc(row, side.usd, '-', { bg: opts.bg, fg: opts.fg, align: 'right' });
      sc(row, side.tl, '-', { bg: opts.bg, fg: opts.fg, align: 'right' });
      sc(row, side.all, '-', { bg: opts.bg, fg: opts.fg, align: 'right' });
    }
    sc(row, side.rate, null, { bg: opts.bg });
  };

  // Company rows
  for (const section of SECTION_ORDER) {
    const prod = prodByBucket.get(section.id)!;
    const exp = expByBucket.get(section.id)!;

    ws.getRow(row).height = 22;
    ws.mergeCells(row, L.label, row, L.rate);
    sc(row, L.label, section.label, { bg: '4B5563', fg: 'FFFFFF', bold: true, align: 'left', fontSize: 11 });
    ws.mergeCells(row, R.label, row, R.rate);
    sc(row, R.label, section.label, { bg: '4B5563', fg: 'FFFFFF', bold: true, align: 'left', fontSize: 11 });
    row++;

    const cats: { label: string; key: keyof CategoryRows }[] = [
      { label: '  Projects', key: 'projects' },
      { label: '  Direct Order', key: 'directOrder' },
      { label: '  Missing & Extra', key: 'missingExtra' },
      { label: '  Trust Expenses', key: 'trustExpenses' },
    ];
    for (const cat of cats) {
      ws.getRow(row).height = 18;
      writeMoneyRow(L, cat.label, prod[cat.key], { bg: 'FFFFFF' });
      writeMoneyRow(R, cat.label, exp[cat.key], { bg: 'FFFFFF' });
      row++;
    }

    ws.getRow(row).height = 18;
    writeMoneyRow(L, '  TOTAL', sumRows(prod), { bg: '1E293B', fg: 'FFFFFF', bold: true });
    writeMoneyRow(R, '  TOTAL', sumRows(exp), { bg: '1E293B', fg: 'FFFFFF', bold: true });
    row++;
  }

  // Grand totals
  const prodGrand = Array.from(prodByBucket.values()).reduce((a, b) => addRows(a, b), emptyRows());
  const expGrand = Array.from(expByBucket.values()).reduce((a, b) => addRows(a, b), emptyRows());

  const grandCats: { label: string; key: keyof CategoryRows }[] = [
    { label: '  Projects', key: 'projects' },
    { label: '  Direct Order', key: 'directOrder' },
    { label: '  Missing & Extra', key: 'missingExtra' },
    { label: '  Trust Expenses', key: 'trustExpenses' },
  ];
  for (const gc of grandCats) {
    ws.getRow(row).height = 18;
    writeMoneyRow(L, gc.label, prodGrand[gc.key], { bg: '166534', fg: 'FFFFFF', bold: true });
    writeMoneyRow(R, gc.label, expGrand[gc.key], { bg: '166534', fg: 'FFFFFF', bold: true });
    row++;
  }

  ws.getRow(row).height = 18;
  writeMoneyRow(L, '  TOTAL', sumRows(prodGrand), { bg: '0F172A', fg: 'FFFFFF', bold: true });
  writeMoneyRow(R, '  TOTAL', sumRows(expGrand), { bg: '0F172A', fg: 'FFFFFF', bold: true });
  row++;

  // TOTAL DOLAR
  const prodTotal = sumRows(prodGrand);
  const expTotal = sumRows(expGrand);
  const prodTD = usdTryRate > 0 ? prodTotal.usd + prodTotal.tl / usdTryRate : null;
  const expTD = usdTryRate > 0 ? expTotal.usd + expTotal.tl / usdTryRate : null;

  ws.getRow(row).height = 18;
  sc(row, L.label, '  TOTAL DOLAR', { bg: '0F172A', fg: 'FFFFFF', bold: true, align: 'left' });
  sc(row, L.usd, prodTD, { bg: '0F172A', fg: 'FFFFFF', bold: true, align: 'right', numFmt: '$#,##0.00' });
  sc(row, L.tl, null, { bg: '0F172A' }); sc(row, L.all, null, { bg: '0F172A' }); sc(row, L.rate, null, { bg: '0F172A' });
  sc(row, R.label, '  TOTAL DOLAR', { bg: '0F172A', fg: 'FFFFFF', bold: true, align: 'left' });
  sc(row, R.usd, expTD, { bg: '0F172A', fg: 'FFFFFF', bold: true, align: 'right', numFmt: '$#,##0.00' });
  sc(row, R.tl, null, { bg: '0F172A' }); sc(row, R.all, null, { bg: '0F172A' }); sc(row, R.rate, null, { bg: '0F172A' });
  row++;

  // GRAND TOTAL DOLAR
  ws.getRow(row).height = 24;
  sc(row, L.label, 'GRAND TOTAL DOLAR', { bg: '111827', fg: 'FFFFFF', bold: true, align: 'left', fontSize: 11 });
  sc(row, L.usd, prodTD, { bg: '111827', fg: 'FFFFFF', bold: true, align: 'right', numFmt: '$#,##0.00' });
  sc(row, L.tl, null, { bg: '111827' }); sc(row, L.all, null, { bg: '111827' });
  sc(row, L.rate, usdTryRate > 0 ? usdTryRate : null, { bg: '111827', fg: 'FDE68A', bold: true });
  sc(row, R.label, 'GRAND TOTAL DOLAR', { bg: '111827', fg: 'FFFFFF', bold: true, align: 'left', fontSize: 11 });
  sc(row, R.usd, expTD, { bg: '111827', fg: 'FFFFFF', bold: true, align: 'right', numFmt: '$#,##0.00' });
  sc(row, R.tl, null, { bg: '111827' }); sc(row, R.all, null, { bg: '111827' });
  sc(row, R.rate, usdTryRate > 0 ? usdTryRate : null, { bg: '111827', fg: 'FDE68A', bold: true });

  return wb;
}
