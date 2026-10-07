import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { ExpensesDirectOrderProject } from '../../types/expensesDirectOrder';
import { getStatusExcelFill } from './statusColorsExcel';

const toNumber = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') { const n = Number(v.replace(/[^0-9.-]/g, '')); return Number.isFinite(n) ? n : 0; }
  if (typeof v === 'object' && typeof (v as any).toNumber === 'function') return (v as any).toNumber();
  return 0;
};

function fillBg(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

const BORDER_THIN: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'D1D5DB' } };
const BORDERS_ALL: Partial<ExcelJS.Borders> = {
  top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN,
};

interface RegionSection {
  regionLabel: string;
  projects: ExpensesDirectOrderProject[];
}

const COLUMNS = [
  { header: 'Type', width: 14 },
  { header: 'Vendor', width: 22 },
  { header: 'Order Type', width: 13 },
  { header: 'Status', width: 16 },
  { header: 'STD', width: 12 },
  { header: 'ETD', width: 12 },
  { header: 'RTRD', width: 12 },
  { header: 'FTD', width: 12 },
  { header: 'Expenses/USD', width: 16 },
  { header: 'Expenses/TL', width: 16 },
  { header: 'Payment Rule', width: 14 },
  { header: 'Container No', width: 14 },
  { header: 'Shelves Loc.', width: 14 },
  { header: 'Invoice Sit.', width: 14 },
  { header: 'Paid USD 1', width: 14 },
  { header: 'Paid USD 2', width: 14 },
  { header: 'Paid TL 1', width: 14 },
  { header: 'Paid TL 2', width: 14 },
  { header: 'Remaining USD', width: 16 },
  { header: 'Remaining TL', width: 16 },
  { header: 'Invoice Trans. No', width: 16 },
  { header: 'Invoice Number', width: 16 },
  { header: 'QuickBook', width: 14 },
];

const COL_COUNT = COLUMNS.length;
const STATUS_COL = 4;
const EXP_USD_COL = 9;
const EXP_TL_COL = 10;
const PAID_USD1_COL = 15;
const PAID_USD2_COL = 16;
const PAID_TL1_COL = 17;
const PAID_TL2_COL = 18;
const REM_USD_COL = 19;
const REM_TL_COL = 20;

const MONEY_USD_COLS = [EXP_USD_COL, PAID_USD1_COL, PAID_USD2_COL, REM_USD_COL];
const MONEY_TL_COLS = [EXP_TL_COL, PAID_TL1_COL, PAID_TL2_COL, REM_TL_COL];

const COLORS = {
  sectionHeader: { bg: 'B02417', fg: 'FFFFFF' },
  projectHeader: { fg: 'FFFFFF' },
  columnHeader:  { bg: '374151', fg: 'FFFFFF' },
  dataRowAlt:    { bg: 'F9FAFB' },
  projectTotal:  { bg: '1E40AF', fg: 'FFFFFF' },
  sectionTotal:  { bg: '2563EB', fg: 'FFFFFF' },
};

export async function exportExpensesDirectOrderExcel({
  regionSections,
}: {
  projects?: ExpensesDirectOrderProject[];
  regionSections: RegionSection[];
}): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Expenses DO');

  ws.columns = COLUMNS.map(col => ({ width: col.width }));

  for (const section of regionSections) {
    if (section.projects.length === 0) continue;

    // ── Section Header ──
    const sectionRow = ws.addRow([section.regionLabel]);
    ws.mergeCells(sectionRow.number, 1, sectionRow.number, COL_COUNT);
    const secCell = sectionRow.getCell(1);
    secCell.font = { bold: true, size: 14, color: { argb: COLORS.sectionHeader.fg } };
    secCell.fill = fillBg(COLORS.sectionHeader.bg);
    secCell.alignment = { vertical: 'middle', horizontal: 'left' };
    sectionRow.height = 28;

    let sectionTotalUsd = 0;
    let sectionTotalTl = 0;

    for (const project of section.projects) {
      const items = project.items || [];
      if (items.length === 0) continue;

      // ── Project Header ──
      const projLabel = `${project.projectNo} - ${project.name}`;
      const projRow = ws.addRow([projLabel]);
      ws.mergeCells(projRow.number, 1, projRow.number, COL_COUNT);
      const projCell = projRow.getCell(1);
      projCell.font = { bold: true, size: 11, color: { argb: COLORS.projectHeader.fg } };
      projCell.fill = fillBg('DE8244');
      projCell.alignment = { vertical: 'middle', horizontal: 'left' };
      projRow.height = 24;

      // ── Column Headers ──
      const hdrRow = ws.addRow(COLUMNS.map(c => c.header));
      hdrRow.height = 22;
      hdrRow.eachCell((cell) => {
        cell.font = { bold: true, size: 10, color: { argb: COLORS.columnHeader.fg } };
        cell.fill = fillBg(COLORS.columnHeader.bg);
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = BORDERS_ALL;
      });

      // ── Data Rows ──
      let projectTotalUsd = 0;
      let projectTotalTl = 0;

      items.forEach((item, idx) => {
        const eU = toNumber(item.expensesUsd);
        const eT = toNumber(item.expensesTl);
        const p1 = toNumber(item.paidUsd1), p2 = toNumber(item.paidUsd2);
        const t1 = toNumber(item.paidTl1), t2 = toNumber(item.paidTl2);

        const dataRow = ws.addRow([
          item.type || item.customType?.code || '',
          item.vendor ? `${item.vendor.code} - ${item.vendor.name}` : '',
          item.orderType || '',
          item.status?.replace(/_/g, ' ') || '',
          item.std ? new Date(item.std).toLocaleDateString() : '',
          item.etd ? new Date(item.etd).toLocaleDateString() : '',
          item.rtrd ? new Date(item.rtrd).toLocaleDateString() : '',
          item.ftd ? new Date(item.ftd).toLocaleDateString() : '',
          eU || '', eT || '',
          item.paymentRule || '',
          item.containerNo || '',
          item.shelvesLoc || '',
          item.invoiceSit || '',
          p1 || '', p2 || '', t1 || '', t2 || '',
          Math.max(0, eU - p1 - p2) || '',
          Math.max(0, eT - t1 - t2) || '',
          item.invoiceTransactionNo || '',
          item.invoiceNumber || '',
          item.quickBook || '',
        ]);
        dataRow.height = 18;
        const isAlt = idx % 2 === 1;

        dataRow.eachCell((cell, colNumber) => {
          cell.font = { size: 10 };
          cell.border = BORDERS_ALL;
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (isAlt) cell.fill = fillBg(COLORS.dataRowAlt.bg);
          if (MONEY_USD_COLS.includes(colNumber)) {
            cell.numFmt = '$#,##0.00';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
          } else if (MONEY_TL_COLS.includes(colNumber)) {
            cell.numFmt = '₺#,##0.00';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
          }
        });

        // Status coloring
        const statusCell = dataRow.getCell(STATUS_COL);
        const statusFill = getStatusExcelFill(item.status);
        if (statusFill) {
          statusCell.fill = fillBg(statusFill.bg);
          statusCell.font = { size: 10, color: { argb: statusFill.fg }, bold: true };
        }

        projectTotalUsd += eU;
        projectTotalTl += eT;
      });

      // ── Project Total ──
      const ptValues = new Array(COL_COUNT).fill('');
      ptValues[0] = 'Total';
      ptValues[EXP_USD_COL - 1] = projectTotalUsd || '';
      ptValues[EXP_TL_COL - 1] = projectTotalTl || '';

      const ptRow = ws.addRow(ptValues);
      ptRow.height = 20;
      ptRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true, size: 10, color: { argb: COLORS.projectTotal.fg } };
        cell.fill = fillBg(COLORS.projectTotal.bg);
        cell.border = BORDERS_ALL;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (MONEY_USD_COLS.includes(colNumber)) {
          cell.numFmt = '$#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (MONEY_TL_COLS.includes(colNumber)) {
          cell.numFmt = '₺#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        }
      });

      sectionTotalUsd += projectTotalUsd;
      sectionTotalTl += projectTotalTl;
    }

    // ── Section Total ──
    const stValues = new Array(COL_COUNT).fill('');
    stValues[0] = `${section.regionLabel} Total`;
    stValues[EXP_USD_COL - 1] = sectionTotalUsd || '';
    stValues[EXP_TL_COL - 1] = sectionTotalTl || '';

    const stRow = ws.addRow(stValues);
    stRow.height = 24;
    stRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 12, color: { argb: COLORS.sectionTotal.fg } };
      cell.fill = fillBg(COLORS.sectionTotal.bg);
      cell.border = BORDERS_ALL;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (MONEY_USD_COLS.includes(colNumber)) {
        cell.numFmt = '$#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (MONEY_TL_COLS.includes(colNumber)) {
        cell.numFmt = '₺#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    });

    ws.addRow([]);
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Expenses_DO_${dateStr}.xlsx`);
}
