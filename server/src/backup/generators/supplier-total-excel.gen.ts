import * as ExcelJS from 'exceljs';
import { BORDERS_ALL, fillBg, toNumber } from './shared-styles';

interface VendorAgg {
  vendorCode: string;
  vendorName: string;
  tabs: { label: string; money: MoneyFields }[];
  total: MoneyFields;
}

interface MoneyFields {
  productionUsd: number;
  productionTl: number;
  paidUsd: number;
  paidTl: number;
  remainingUsd: number;
  remainingTl: number;
  futureUsd: number;
  futureTl: number;
}

function emptyMoney(): MoneyFields {
  return { productionUsd: 0, productionTl: 0, paidUsd: 0, paidTl: 0, remainingUsd: 0, remainingTl: 0, futureUsd: 0, futureTl: 0 };
}

function addMoney(a: MoneyFields, b: MoneyFields): MoneyFields {
  return {
    productionUsd: a.productionUsd + b.productionUsd,
    productionTl: a.productionTl + b.productionTl,
    paidUsd: a.paidUsd + b.paidUsd,
    paidTl: a.paidTl + b.paidTl,
    remainingUsd: a.remainingUsd + b.remainingUsd,
    remainingTl: a.remainingTl + b.remainingTl,
    futureUsd: a.futureUsd + b.futureUsd,
    futureTl: a.futureTl + b.futureTl,
  };
}

function calcVendorMoney(items: any[]): MoneyFields {
  const m = emptyMoney();
  for (const item of items) {
    // Invoice (discounted price) replaces pf when entered
    const invUsd = toNumber(item.invoice);
    const invTl = toNumber(item.invoiceTl);
    const pfUsd = invUsd > 0 ? invUsd : toNumber(item.pfUsd);
    const pfTl = invTl > 0 ? invTl : toNumber(item.pfTl);
    const pu1 = toNumber(item.paidUsd1);
    const pu2 = toNumber(item.paidUsd2);
    const pt1 = toNumber(item.paidTl1);
    const pt2 = toNumber(item.paidTl2);
    const isSigned = item.pfSignStatus === 'SIGNED';
    const isNotOrdered = item.status === 'NOT_ORDERED';

    m.productionUsd += pfUsd;
    m.productionTl += pfTl;
    m.paidUsd += pu1 + pu2;
    m.paidTl += pt1 + pt2;

    if (!isSigned || isNotOrdered) {
      m.futureUsd += pfUsd;
      m.futureTl += pfTl;
    } else {
      m.remainingUsd += Math.max(0, pfUsd - pu1 - pu2);
      m.remainingTl += Math.max(0, pfTl - pt1 - pt2);
    }
  }
  return m;
}

export async function generateSupplierTotalExcel(prisma: any): Promise<ExcelJS.Workbook> {
  const [vendors, projItems, doItems, meItems] = await Promise.all([
    prisma.vendor.findMany({ orderBy: [{ code: 'asc' }], select: { id: true, code: true, name: true } }),
    prisma.projectItem.findMany({ where: { vendorId: { not: null }, deletedAt: null, project: { deletedAt: null } }, select: { vendorId: true, pfUsd: true, pfTl: true, invoice: true, invoiceTl: true, paidUsd1: true, paidUsd2: true, paidTl1: true, paidTl2: true, status: true, pfSignStatus: true } }),
    prisma.directOrderItem.findMany({ where: { vendorId: { not: null }, deletedAt: null, project: { deletedAt: null } }, select: { vendorId: true, pfUsd: true, pfTl: true, invoice: true, invoiceTl: true, paidUsd1: true, paidUsd2: true, paidTl1: true, paidTl2: true, status: true, pfSignStatus: true } }),
    prisma.missingExtraItem.findMany({ where: { vendorId: { not: null }, deletedAt: null, case: { deletedAt: null } }, select: { vendorId: true, pfUsd: true, pfTl: true, invoice: true, invoiceTl: true, paidUsd1: true, paidUsd2: true, paidTl1: true, paidTl2: true, status: true, pfSignStatus: true } }),
  ]);

  // Group items by vendor
  const vendorItemsMap = new Map<string, { proj: any[]; do: any[]; me: any[] }>();
  for (const v of vendors) vendorItemsMap.set(v.id, { proj: [], do: [], me: [] });
  for (const i of projItems) vendorItemsMap.get(i.vendorId)?.proj.push(i);
  for (const i of doItems) vendorItemsMap.get(i.vendorId)?.do.push(i);
  for (const i of meItems) vendorItemsMap.get(i.vendorId)?.me.push(i);

  const vendorAggs: VendorAgg[] = [];
  let grandTotal = emptyMoney();

  for (const v of vendors) {
    const data = vendorItemsMap.get(v.id);
    if (!data) continue;
    const projMoney = calcVendorMoney(data.proj);
    const doMoney = calcVendorMoney(data.do);
    const meMoney = calcVendorMoney(data.me);
    const total = addMoney(addMoney(projMoney, doMoney), meMoney);
    if (total.productionUsd === 0 && total.productionTl === 0 && total.paidUsd === 0 && total.paidTl === 0) continue;
    vendorAggs.push({
      vendorCode: v.code,
      vendorName: v.name,
      tabs: [
        { label: 'Projects', money: projMoney },
        { label: 'Direct Order', money: doMoney },
        { label: 'Missing & Extra', money: meMoney },
      ],
      total,
    });
    grandTotal = addMoney(grandTotal, total);
  }

  // Build Excel
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Supplier Total');

  const BLOCKS = [
    { title: 'PRODUCTION PRICE', bg: '4472C4', cols: [{ label: 'PF / USD', field: 'productionUsd' as const, fmt: '$#,##0.00' }, { label: 'PF / TL', field: 'productionTl' as const, fmt: '₺#,##0.00' }] },
    { title: 'PAYMENTS', bg: 'D4AF37', cols: [{ label: 'Paid / USD', field: 'paidUsd' as const, fmt: '$#,##0.00' }, { label: 'Paid / TL', field: 'paidTl' as const, fmt: '₺#,##0.00' }] },
    { title: 'REMAINING', bg: '92400E', cols: [{ label: 'USD', field: 'remainingUsd' as const, fmt: '$#,##0.00' }, { label: 'TL', field: 'remainingTl' as const, fmt: '₺#,##0.00' }] },
    { title: 'FUTURE', bg: '78350F', cols: [{ label: 'USD', field: 'futureUsd' as const, fmt: '$#,##0.00' }, { label: 'TL', field: 'futureTl' as const, fmt: '₺#,##0.00' }] },
  ];

  const blockStarts = [2, 5, 8, 11];
  ws.getColumn(1).width = 28;
  for (let b = 0; b < 4; b++) {
    ws.getColumn(blockStarts[b]).width = 15;
    ws.getColumn(blockStarts[b] + 1).width = 15;
    if (b < 3) ws.getColumn(blockStarts[b] + 2).width = 3;
  }

  const sc = (r: number, c: number, value: any, opts: any = {}) => {
    const cell = ws.getRow(r).getCell(c);
    cell.value = value;
    if (opts.bg) cell.fill = fillBg(opts.bg);
    cell.font = { bold: opts.bold || false, color: opts.fg ? { argb: opts.fg } : undefined, size: opts.fontSize || 10 };
    cell.alignment = { horizontal: opts.align || 'center', vertical: 'middle' };
    cell.border = BORDERS_ALL;
    if (opts.numFmt) cell.numFmt = opts.numFmt;
  };

  let row = 1;

  // Block titles
  sc(row, 1, '', { bg: '1F2937' });
  for (let b = 0; b < 4; b++) {
    ws.mergeCells(row, blockStarts[b], row, blockStarts[b] + 1);
    sc(row, blockStarts[b], BLOCKS[b].title, { bg: BLOCKS[b].bg, fg: 'FFFFFF', bold: true, fontSize: 11 });
  }
  ws.getRow(row).height = 24;
  row++;

  // Column headers
  sc(row, 1, '', { bg: '374151' });
  for (let b = 0; b < 4; b++) {
    BLOCKS[b].cols.forEach((col, c) => {
      sc(row, blockStarts[b] + c, col.label, { bg: '374151', fg: 'FFFFFF', bold: true });
    });
  }
  ws.getRow(row).height = 20;
  row++;

  const writeMoneyRow = (label: string, money: MoneyFields, opts: { bg: string; fg?: string; bold?: boolean; height?: number }) => {
    ws.getRow(row).height = opts.height || 18;
    sc(row, 1, label, { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'left' });
    for (let b = 0; b < 4; b++) {
      BLOCKS[b].cols.forEach((col, c) => {
        const val = money[col.field];
        sc(row, blockStarts[b] + c, val === 0 ? null : val, { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'right', numFmt: col.fmt });
      });
    }
    row++;
  };

  for (const vendor of vendorAggs) {
    ws.getRow(row).height = 22;
    sc(row, 1, `${vendor.vendorCode} - ${vendor.vendorName}`, { bg: '4B5563', fg: 'FFFFFF', bold: true, align: 'left', fontSize: 11 });
    for (let b = 0; b < 4; b++) {
      ws.mergeCells(row, blockStarts[b], row, blockStarts[b] + 1);
      sc(row, blockStarts[b], null, { bg: '4B5563' });
    }
    row++;

    for (const tab of vendor.tabs) {
      writeMoneyRow(`  ${tab.label}`, tab.money, { bg: 'FFFFFF' });
    }
    writeMoneyRow('  TOTAL', vendor.total, { bg: '1E293B', fg: 'FFFFFF', bold: true });
  }

  writeMoneyRow('GRAND TOTAL', grandTotal, { bg: '111827', fg: 'FFFFFF', bold: true, height: 24 });

  return wb;
}
