/**
 * Excel Export for Trust Expenses - Flat List
 *
 * Layout: [Main Grid] [GAP] [Accounting] [GAP] [Payments] [GAP] [Invoice]
 * Red header band: "TRUST EXPENSES"
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { TrustExpenseItem } from '../../types/trustExpense';
import { getStatusExcelFill } from './statusColorsExcel';

function toNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch { return ''; }
}

const BORDER_THIN: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'D1D5DB' } };
const BORDERS_ALL = { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN };

// Main grid columns (14 cols: 1-14)
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

// Accounting columns (8 cols)
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

// Payments columns (6 cols)
const PAY_COLS = [
  { header: 'Due USD', width: 14 },
  { header: 'Due TL', width: 14 },
  { header: 'Payment1 USD', width: 14 },
  { header: 'Payment1 TL', width: 14 },
  { header: 'Payment2 USD', width: 14 },
  { header: 'Payment2 TL', width: 14 },
];

// Invoice columns (3 cols)
const INV_COLS = [
  { header: 'Transaction No', width: 14 },
  { header: 'Invoice Number', width: 14 },
  { header: 'Quick Book', width: 12 },
];

interface ExportParams {
  items: TrustExpenseItem[];
}

export async function exportTrustExpenseToExcel({ items }: ExportParams) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('TRUST_EXPENSES');

  // Column layout: [MAIN 14] [GAP 1] [ACCT 8] [GAP 1] [PAY 6] [GAP 1] [INV 3]
  const GAP1 = MAIN_COLS.length + 1; // col 15
  const ACCT_START = GAP1 + 1; // col 16
  const GAP2 = ACCT_START + ACCT_COLS.length; // col 24
  const PAY_START = GAP2 + 1; // col 25
  const GAP3 = PAY_START + PAY_COLS.length; // col 31
  const INV_START = GAP3 + 1; // col 32
  const TOTAL_COLS = INV_START + INV_COLS.length - 1; // col 34

  // Set column widths
  const allWidths = [
    ...MAIN_COLS.map(c => c.width),
    2, // gap
    ...ACCT_COLS.map(c => c.width),
    2, // gap
    ...PAY_COLS.map(c => c.width),
    2, // gap
    ...INV_COLS.map(c => c.width),
  ];
  allWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  let row = 1;

  // ===== SECTION HEADER (red band) =====
  const headerRow = ws.getRow(row);
  ws.mergeCells(row, 1, row, TOTAL_COLS);
  headerRow.getCell(1).value = 'TRUST EXPENSES';
  headerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C41E3A' } };
  headerRow.getCell(1).font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
  headerRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 28;
  row++;

  // ===== GROUP HEADERS =====
  const groupRow = ws.getRow(row);
  // Main: DETAILS group
  ws.mergeCells(row, 1, row, 5);
  groupRow.getCell(1).value = 'DETAILS';
  groupRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A1A1A' } };
  groupRow.getCell(1).font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
  groupRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  // Main: DATES group
  ws.mergeCells(row, 6, row, 9);
  groupRow.getCell(6).value = 'DATES';
  groupRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A1A1A' } };
  groupRow.getCell(6).font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
  groupRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
  // Main: FINANCIALS group
  ws.mergeCells(row, 10, row, 14);
  groupRow.getCell(10).value = 'FINANCIALS & LOGISTICS';
  groupRow.getCell(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A1A1A' } };
  groupRow.getCell(10).font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
  groupRow.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
  // Accounting group
  ws.mergeCells(row, ACCT_START, row, ACCT_START + ACCT_COLS.length - 1);
  groupRow.getCell(ACCT_START).value = 'ACCOUNTING';
  groupRow.getCell(ACCT_START).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D4AF37' } };
  groupRow.getCell(ACCT_START).font = { bold: true, size: 10, color: { argb: '000000' } };
  groupRow.getCell(ACCT_START).alignment = { horizontal: 'center', vertical: 'middle' };
  // Payments group
  ws.mergeCells(row, PAY_START, row, PAY_START + PAY_COLS.length - 1);
  groupRow.getCell(PAY_START).value = 'PAYMENTS';
  groupRow.getCell(PAY_START).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2F4B1F' } };
  groupRow.getCell(PAY_START).font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
  groupRow.getCell(PAY_START).alignment = { horizontal: 'center', vertical: 'middle' };
  // Invoice group
  ws.mergeCells(row, INV_START, row, INV_START + INV_COLS.length - 1);
  groupRow.getCell(INV_START).value = 'INVOICE & RECEIPT';
  groupRow.getCell(INV_START).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '696969' } };
  groupRow.getCell(INV_START).font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
  groupRow.getCell(INV_START).alignment = { horizontal: 'center', vertical: 'middle' };
  groupRow.height = 22;
  row++;

  // ===== COLUMN HEADERS =====
  const colHeaderRow = ws.getRow(row);
  // Main columns
  MAIN_COLS.forEach((col, i) => {
    const cell = colHeaderRow.getCell(i + 1);
    cell.value = col.header;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '000000' } };
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDERS_ALL;
  });
  // Accounting columns
  ACCT_COLS.forEach((col, i) => {
    const cell = colHeaderRow.getCell(ACCT_START + i);
    cell.value = col.header;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'B88900' } };
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDERS_ALL;
  });
  // Payments columns
  PAY_COLS.forEach((col, i) => {
    const cell = colHeaderRow.getCell(PAY_START + i);
    cell.value = col.header;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F3515' } };
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDERS_ALL;
  });
  // Invoice columns
  INV_COLS.forEach((col, i) => {
    const cell = colHeaderRow.getCell(INV_START + i);
    cell.value = col.header;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '696969' } };
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDERS_ALL;
  });
  colHeaderRow.height = 22;
  row++;

  // ===== DATA ROWS =====
  // Totals accumulators
  let totalExpUsd = 0, totalExpTl = 0;
  let totalPu1 = 0, totalPu2 = 0, totalPt1 = 0, totalPt2 = 0;
  let totalRemU = 0, totalRemT = 0, totalNoU = 0, totalNoT = 0;
  let totalDueU = 0, totalDueT = 0;
  let totalPayU1 = 0, totalPayT1 = 0, totalPayU2 = 0, totalPayT2 = 0;

  items.forEach((item, idx) => {
    const dataRow = ws.getRow(row);

    // Main grid
    const expU = toNumber(item.expensesUsd);
    const expT = toNumber(item.expensesTl);
    totalExpUsd += expU;
    totalExpTl += expT;

    const mainValues: (string | number)[] = [
      idx + 1,
      item.teType || item.type || '',
      item.vendor ? `${item.vendor.code} - ${item.vendor.name}` : '',
      item.orderType || '',
      item.status ? item.status.replace(/_/g, ' ') : '',
      formatDate(item.std),
      formatDate(item.etd),
      formatDate(item.rtrd),
      formatDate(item.ftd),
      expU || '',
      expT || '',
      item.shelvesLocation || '',
      item.containerNo || '',
      item.invoice || '',
    ];

    mainValues.forEach((val, i) => {
      const cell = dataRow.getCell(i + 1);
      cell.value = val as any;
      cell.border = BORDERS_ALL;
      cell.font = { size: 10 };
      if (i === 9 && typeof val === 'number') cell.numFmt = '$#,##0.00';
      if (i === 10 && typeof val === 'number') cell.numFmt = '₺#,##0.00';
    });

    // Status cell coloring (STATUS is column 5, index 4)
    const statusFill = getStatusExcelFill(item.status);
    if (statusFill) {
      const statusCell = dataRow.getCell(5);
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusFill.bg } };
      statusCell.font = { size: 10, color: { argb: statusFill.fg }, bold: true };
    }

    // Color indicator in # column
    if (item.colorHex) {
      dataRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.colorHex.replace('#', '') } };
      dataRow.getCell(1).font = { size: 10, color: { argb: item.colorHex.replace('#', '') } };
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

    const acctValues = [pu1, pu2, pt1, pt2, remU, remT, noU, noT];
    // Accounting numFmt: USD cols at index 0,1,4,6 — TL cols at index 2,3,5,7
    const ACCT_FMTS = ['$#,##0.00', '$#,##0.00', '₺#,##0.00', '₺#,##0.00', '$#,##0.00', '₺#,##0.00', '$#,##0.00', '₺#,##0.00'];
    acctValues.forEach((val, i) => {
      const cell = dataRow.getCell(ACCT_START + i);
      cell.value = val || '';
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8DC' } };
      cell.border = BORDERS_ALL;
      cell.font = { size: 10 };
      cell.alignment = { horizontal: 'right' };
      if (typeof val === 'number' && val !== 0) {
        cell.numFmt = ACCT_FMTS[i];
      }
    });

    // Payments
    const dueU = remU, dueT = remT;
    totalDueU += dueU; totalDueT += dueT;
    totalPayU1 += pu1; totalPayT1 += pt1; totalPayU2 += pu2; totalPayT2 += pt2;

    const payValues = [dueU, dueT, pu1, pt1, pu2, pt2];
    payValues.forEach((val, i) => {
      const cell = dataRow.getCell(PAY_START + i);
      cell.value = val || '';
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };
      cell.border = BORDERS_ALL;
      cell.font = { size: 10 };
      cell.alignment = { horizontal: 'right' };
      if (typeof val === 'number' && val !== 0) {
        cell.numFmt = (i % 2 === 0) ? '$#,##0.00' : '₺#,##0.00';
      }
    });

    // Invoice
    const invValues = [
      item.invoiceTransactionNo || '',
      item.invoiceNumber || '',
      item.quickBook || '',
    ];
    invValues.forEach((val, i) => {
      const cell = dataRow.getCell(INV_START + i);
      cell.value = val;
      cell.border = BORDERS_ALL;
      cell.font = { size: 10 };
    });

    dataRow.height = 20;
    row++;
  });

  // ===== GRAND TOTAL ROW =====
  const totalRow = ws.getRow(row);

  // Main grid total
  ws.mergeCells(row, 1, row, 9);
  totalRow.getCell(1).value = 'GRAND TOTAL';
  totalRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
  totalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
  totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '404040' } };
  for (let c = 1; c <= 14; c++) {
    totalRow.getCell(c).border = BORDERS_ALL;
    totalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '404040' } };
    totalRow.getCell(c).font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
  }
  totalRow.getCell(10).value = totalExpUsd;
  totalRow.getCell(10).numFmt = '$#,##0.00';
  totalRow.getCell(11).value = totalExpTl;
  totalRow.getCell(11).numFmt = '₺#,##0.00';

  // Accounting totals
  const acctTotals = [totalPu1, totalPu2, totalPt1, totalPt2, totalRemU, totalRemT, totalNoU, totalNoT];
  const ACCT_TOTAL_FMTS = ['$#,##0.00', '$#,##0.00', '₺#,##0.00', '₺#,##0.00', '$#,##0.00', '₺#,##0.00', '$#,##0.00', '₺#,##0.00'];
  acctTotals.forEach((val, i) => {
    const cell = totalRow.getCell(ACCT_START + i);
    cell.value = val;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D4AF37' } };
    cell.font = { bold: true, size: 10, color: { argb: '000000' } };
    cell.border = BORDERS_ALL;
    cell.alignment = { horizontal: 'right' };
    cell.numFmt = ACCT_TOTAL_FMTS[i];
  });

  // Payments totals
  const payTotals = [totalDueU, totalDueT, totalPayU1, totalPayT1, totalPayU2, totalPayT2];
  payTotals.forEach((val, i) => {
    const cell = totalRow.getCell(PAY_START + i);
    cell.value = val;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };
    cell.font = { bold: true, size: 10, color: { argb: '1F3515' } };
    cell.border = BORDERS_ALL;
    cell.alignment = { horizontal: 'right' };
    cell.numFmt = (i % 2 === 0) ? '$#,##0.00' : '₺#,##0.00';
  });

  totalRow.height = 24;

  // Save
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const timestamp = new Date().toISOString().slice(0, 10);
  saveAs(blob, `TrustExpenses_${timestamp}.xlsx`);
}
