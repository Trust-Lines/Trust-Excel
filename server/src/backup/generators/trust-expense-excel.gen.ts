import * as ExcelJS from 'exceljs';
import { BORDERS_ALL, fillBg, toNumber, applyStatusColor, formatDate } from './shared-styles';

export async function generateTrustExpenseExcel(prisma: any): Promise<ExcelJS.Workbook> {
  const items = await prisma.trustExpenseItem.findMany({
    include: {
      vendor: { select: { id: true, code: true, name: true } },
      customType: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Trust Expenses');

  const MAIN_COLS = [
    { header: '#', width: 5 },
    { header: 'TYPE', width: 14 },
    { header: 'VENDOR', width: 20 },
    { header: 'ORDER TYPE', width: 14 },
    { header: 'STATUS', width: 16 },
    { header: 'STD', width: 12 },
    { header: 'ETD', width: 12 },
    { header: 'RTRD', width: 12 },
    { header: 'FTD', width: 12 },
    { header: 'EXPENSES/USD', width: 16 },
    { header: 'EXPENSES/TL', width: 16 },
    { header: 'SHELVES LOC.', width: 14 },
    { header: 'CONTAINER NO', width: 14 },
    { header: 'INVOICE', width: 14 },
  ];

  const ACCT_COLS = [
    { header: 'Paid/USD 1st', width: 14 },
    { header: 'Paid/USD 2nd', width: 14 },
    { header: 'Paid/TL 1st', width: 14 },
    { header: 'Paid/TL 2nd', width: 14 },
    { header: 'Remaining USD', width: 16 },
    { header: 'Remaining TL', width: 16 },
    { header: 'Not Ordered USD', width: 16 },
    { header: 'Not Ordered TL', width: 16 },
  ];

  const PAY_COLS = [
    { header: 'Due USD', width: 14 },
    { header: 'Due TL', width: 14 },
    { header: 'Payment1 USD', width: 14 },
    { header: 'Payment1 TL', width: 14 },
    { header: 'Payment2 USD', width: 14 },
    { header: 'Payment2 TL', width: 14 },
  ];

  const INV_COLS = [
    { header: 'Transaction No', width: 14 },
    { header: 'Invoice Number', width: 14 },
    { header: 'Quick Book', width: 12 },
  ];

  const GAP1 = MAIN_COLS.length + 1;
  const ACCT_START = GAP1 + 1;
  const GAP2 = ACCT_START + ACCT_COLS.length;
  const PAY_START = GAP2 + 1;
  const GAP3 = PAY_START + PAY_COLS.length;
  const INV_START = GAP3 + 1;
  const TOTAL_COLS = INV_START + INV_COLS.length - 1;

  const allWidths = [
    ...MAIN_COLS.map((c) => c.width), 2,
    ...ACCT_COLS.map((c) => c.width), 2,
    ...PAY_COLS.map((c) => c.width), 2,
    ...INV_COLS.map((c) => c.width),
  ];
  allWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  const ACCT_FMTS = ['$#,##0.00', '$#,##0.00', '₺#,##0.00', '₺#,##0.00', '$#,##0.00', '₺#,##0.00', '$#,##0.00', '₺#,##0.00'];

  let row = 1;

  // Header
  const headerRow = ws.getRow(row);
  ws.mergeCells(row, 1, row, TOTAL_COLS);
  headerRow.getCell(1).value = 'TRUST EXPENSES';
  headerRow.getCell(1).fill = fillBg('C41E3A');
  headerRow.getCell(1).font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
  headerRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 28;
  row++;

  // Group headers
  const groupRow = ws.getRow(row);
  ws.mergeCells(row, 1, row, 5);
  groupRow.getCell(1).value = 'DETAILS';
  groupRow.getCell(1).fill = fillBg('1A1A1A');
  groupRow.getCell(1).font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
  groupRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells(row, 6, row, 9);
  groupRow.getCell(6).value = 'DATES';
  groupRow.getCell(6).fill = fillBg('1A1A1A');
  groupRow.getCell(6).font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
  groupRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells(row, 10, row, 14);
  groupRow.getCell(10).value = 'FINANCIALS & LOGISTICS';
  groupRow.getCell(10).fill = fillBg('1A1A1A');
  groupRow.getCell(10).font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
  groupRow.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells(row, ACCT_START, row, ACCT_START + ACCT_COLS.length - 1);
  groupRow.getCell(ACCT_START).value = 'ACCOUNTING';
  groupRow.getCell(ACCT_START).fill = fillBg('D4AF37');
  groupRow.getCell(ACCT_START).font = { bold: true, size: 10, color: { argb: '000000' } };
  groupRow.getCell(ACCT_START).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells(row, PAY_START, row, PAY_START + PAY_COLS.length - 1);
  groupRow.getCell(PAY_START).value = 'PAYMENTS';
  groupRow.getCell(PAY_START).fill = fillBg('2F4B1F');
  groupRow.getCell(PAY_START).font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
  groupRow.getCell(PAY_START).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells(row, INV_START, row, INV_START + INV_COLS.length - 1);
  groupRow.getCell(INV_START).value = 'INVOICE & RECEIPT';
  groupRow.getCell(INV_START).fill = fillBg('696969');
  groupRow.getCell(INV_START).font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
  groupRow.getCell(INV_START).alignment = { horizontal: 'center', vertical: 'middle' };
  groupRow.height = 22;
  row++;

  // Column headers
  const colHeaderRow = ws.getRow(row);
  MAIN_COLS.forEach((col, i) => {
    const cell = colHeaderRow.getCell(i + 1);
    cell.value = col.header;
    cell.fill = fillBg('000000');
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDERS_ALL;
  });
  ACCT_COLS.forEach((col, i) => {
    const cell = colHeaderRow.getCell(ACCT_START + i);
    cell.value = col.header;
    cell.fill = fillBg('B88900');
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDERS_ALL;
  });
  PAY_COLS.forEach((col, i) => {
    const cell = colHeaderRow.getCell(PAY_START + i);
    cell.value = col.header;
    cell.fill = fillBg('1F3515');
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDERS_ALL;
  });
  INV_COLS.forEach((col, i) => {
    const cell = colHeaderRow.getCell(INV_START + i);
    cell.value = col.header;
    cell.fill = fillBg('696969');
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDERS_ALL;
  });
  colHeaderRow.height = 22;
  row++;

  // Data rows
  let totalExpUsd = 0, totalExpTl = 0;
  let totalPu1 = 0, totalPu2 = 0, totalPt1 = 0, totalPt2 = 0;
  let totalRemU = 0, totalRemT = 0, totalNoU = 0, totalNoT = 0;
  let totalDueU = 0, totalDueT = 0;
  let totalPayU1 = 0, totalPayT1 = 0, totalPayU2 = 0, totalPayT2 = 0;

  items.forEach((item: any, idx: number) => {
    const dataRow = ws.getRow(row);
    const expU = toNumber(item.expensesUsd);
    const expT = toNumber(item.expensesTl);
    totalExpUsd += expU; totalExpTl += expT;

    const mainValues: (string | number)[] = [
      idx + 1,
      item.teType || item.customType?.code || item.type || '',
      item.vendor ? `${item.vendor.code} - ${item.vendor.name}` : '',
      item.orderType || '',
      item.status ? item.status.replace(/_/g, ' ') : '',
      formatDate(item.std), formatDate(item.etd), formatDate(item.rtrd), formatDate(item.ftd),
      expU || '', expT || '',
      item.shelvesLocation || '', item.containerNo || '', item.invoice || '',
    ];

    mainValues.forEach((val, i) => {
      const cell = dataRow.getCell(i + 1);
      cell.value = val as any;
      cell.border = BORDERS_ALL;
      cell.font = { size: 10 };
      if (i === 9 && typeof val === 'number') cell.numFmt = '$#,##0.00';
      if (i === 10 && typeof val === 'number') cell.numFmt = '₺#,##0.00';
    });

    applyStatusColor(dataRow.getCell(5), item.status);

    if (item.colorHex) {
      const argb = item.colorHex.replace('#', '');
      dataRow.getCell(1).fill = fillBg(argb);
      dataRow.getCell(1).font = { size: 10, color: { argb } };
    }

    // Accounting
    const pu1 = toNumber(item.paidUsd1), pu2 = toNumber(item.paidUsd2);
    const pt1 = toNumber(item.paidTl1), pt2 = toNumber(item.paidTl2);
    const remU = Math.max(0, expU - pu1 - pu2);
    const remT = Math.max(0, expT - pt1 - pt2);
    const noU = item.status === 'NOT_ORDERED' ? expU : 0;
    const noT = item.status === 'NOT_ORDERED' ? expT : 0;
    totalPu1 += pu1; totalPu2 += pu2; totalPt1 += pt1; totalPt2 += pt2;
    totalRemU += remU; totalRemT += remT; totalNoU += noU; totalNoT += noT;

    [pu1, pu2, pt1, pt2, remU, remT, noU, noT].forEach((val, i) => {
      const cell = dataRow.getCell(ACCT_START + i);
      cell.value = val || '';
      cell.fill = fillBg('FFF8DC');
      cell.border = BORDERS_ALL;
      cell.font = { size: 10 };
      cell.alignment = { horizontal: 'right' };
      if (typeof val === 'number' && val !== 0) cell.numFmt = ACCT_FMTS[i];
    });

    // Payments
    const dueU = remU, dueT = remT;
    totalDueU += dueU; totalDueT += dueT;
    totalPayU1 += pu1; totalPayT1 += pt1; totalPayU2 += pu2; totalPayT2 += pt2;

    [dueU, dueT, pu1, pt1, pu2, pt2].forEach((val, i) => {
      const cell = dataRow.getCell(PAY_START + i);
      cell.value = val || '';
      cell.fill = fillBg('E8F5E9');
      cell.border = BORDERS_ALL;
      cell.font = { size: 10 };
      cell.alignment = { horizontal: 'right' };
      if (typeof val === 'number' && val !== 0) cell.numFmt = (i % 2 === 0) ? '$#,##0.00' : '₺#,##0.00';
    });

    // Invoice
    [item.invoiceTransactionNo || '', item.invoiceNumber || '', item.quickBook || ''].forEach((val, i) => {
      const cell = dataRow.getCell(INV_START + i);
      cell.value = val;
      cell.border = BORDERS_ALL;
      cell.font = { size: 10 };
    });

    dataRow.height = 20;
    row++;
  });

  // Grand total
  const totalRow = ws.getRow(row);
  ws.mergeCells(row, 1, row, 9);
  totalRow.getCell(1).value = 'GRAND TOTAL';
  totalRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
  totalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
  totalRow.getCell(1).fill = fillBg('404040');
  for (let c = 1; c <= 14; c++) {
    totalRow.getCell(c).border = BORDERS_ALL;
    totalRow.getCell(c).fill = fillBg('404040');
    totalRow.getCell(c).font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
  }
  totalRow.getCell(10).value = totalExpUsd;
  totalRow.getCell(10).numFmt = '$#,##0.00';
  totalRow.getCell(11).value = totalExpTl;
  totalRow.getCell(11).numFmt = '₺#,##0.00';

  const acctTotals = [totalPu1, totalPu2, totalPt1, totalPt2, totalRemU, totalRemT, totalNoU, totalNoT];
  acctTotals.forEach((val, i) => {
    const cell = totalRow.getCell(ACCT_START + i);
    cell.value = val;
    cell.fill = fillBg('D4AF37');
    cell.font = { bold: true, size: 10, color: { argb: '000000' } };
    cell.border = BORDERS_ALL;
    cell.alignment = { horizontal: 'right' };
    cell.numFmt = ACCT_FMTS[i];
  });

  const payTotals = [totalDueU, totalDueT, totalPayU1, totalPayT1, totalPayU2, totalPayT2];
  payTotals.forEach((val, i) => {
    const cell = totalRow.getCell(PAY_START + i);
    cell.value = val;
    cell.fill = fillBg('E8F5E9');
    cell.font = { bold: true, size: 10, color: { argb: '1F3515' } };
    cell.border = BORDERS_ALL;
    cell.alignment = { horizontal: 'right' };
    cell.numFmt = (i % 2 === 0) ? '$#,##0.00' : '₺#,##0.00';
  });

  totalRow.height = 24;

  return wb;
}
