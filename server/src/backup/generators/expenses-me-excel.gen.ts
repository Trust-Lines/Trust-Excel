import * as ExcelJS from 'exceljs';
import { BORDERS_ALL, COLORS, fillBg, toNumber, applyStatusColor, groupByBucket, formatDate } from './shared-styles';

export async function generateExpensesMeExcel(prisma: any): Promise<ExcelJS.Workbook> {
  const projects = await prisma.expensesMissingExtraProject.findMany({
    include: {
      items: {
        include: {
          vendor: { select: { id: true, code: true, name: true } },
          customType: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: [{ bucket: 'asc' }, { projectNo: 'asc' }],
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Expenses ME');

  const COLS = [
    { header: 'PF Code', width: 12 },
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

  ws.columns = COLS.map((c) => ({ width: c.width }));
  const colCount = COLS.length;
  const USD_COLS = [10, 16, 17, 20];
  const TL_COLS = [11, 18, 19, 21];

  const sections = groupByBucket(projects);

  for (const section of sections) {
    const secRow = ws.addRow([section.regionLabel]);
    ws.mergeCells(secRow.number, 1, secRow.number, colCount);
    secRow.getCell(1).font = { bold: true, size: 14, color: { argb: COLORS.sectionHeader.fg } };
    secRow.getCell(1).fill = fillBg(COLORS.sectionHeader.bg);
    secRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    secRow.height = 28;

    let sUsd = 0, sTl = 0;

    for (const proj of section.projects) {
      const items = proj.items || [];
      if (items.length === 0) continue;

      const projRow = ws.addRow([`${proj.projectNo} - ${proj.name}`]);
      ws.mergeCells(projRow.number, 1, projRow.number, colCount);
      projRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
      projRow.getCell(1).fill = fillBg(COLORS.projectOrange);
      projRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
      projRow.height = 24;

      const hdrRow = ws.addRow(COLS.map((c) => c.header));
      hdrRow.height = 22;
      hdrRow.eachCell((cell) => {
        cell.font = { bold: true, size: 10, color: { argb: COLORS.columnHeader.fg } };
        cell.fill = fillBg(COLORS.columnHeader.bg);
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = BORDERS_ALL;
      });

      let pUsd = 0, pTl = 0;

      items.forEach((item: any, idx: number) => {
        const eU = toNumber(item.expensesUsd);
        const eT = toNumber(item.expensesTl);
        const p1 = toNumber(item.paidUsd1), p2 = toNumber(item.paidUsd2);
        const t1 = toNumber(item.paidTl1), t2 = toNumber(item.paidTl2);
        const vendorStr = item.vendor ? `${item.vendor.code} - ${item.vendor.name}` : '';

        const row = ws.addRow([
          item.pfCode || '',
          item.customType?.code || item.type || '',
          vendorStr,
          item.orderType || '',
          (item.status || '').replace(/_/g, ' '),
          formatDate(item.std), formatDate(item.etd), formatDate(item.rtrd), formatDate(item.ftd),
          eU || '', eT || '',
          item.paymentRule || '', item.containerNo || '', item.shelvesLoc || '', item.invoiceSit || '',
          p1 || '', p2 || '', t1 || '', t2 || '',
          Math.max(0, eU - p1 - p2) || '', Math.max(0, eT - t1 - t2) || '',
          item.invoiceTransactionNo || '', item.invoiceNumber || '', item.quickBook || '',
        ]);
        row.height = 18;
        const isAlt = idx % 2 === 1;
        row.eachCell((cell, cn) => {
          cell.font = { size: 10 };
          cell.border = BORDERS_ALL;
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (isAlt) cell.fill = fillBg(COLORS.dataRowAlt.bg);
          if (USD_COLS.includes(cn)) { cell.numFmt = '$#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
          if (TL_COLS.includes(cn)) { cell.numFmt = '₺#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
        });
        applyStatusColor(row.getCell(5), item.status);
        pUsd += eU; pTl += eT;
      });

      const ptV = new Array(colCount).fill('');
      ptV[0] = 'Total'; ptV[9] = pUsd || ''; ptV[10] = pTl || '';
      const ptRow = ws.addRow(ptV);
      ptRow.height = 20;
      ptRow.eachCell((cell, cn) => {
        cell.font = { bold: true, size: 10, color: { argb: COLORS.projectTotal.fg } };
        cell.fill = fillBg(COLORS.projectTotal.bg);
        cell.border = BORDERS_ALL;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (USD_COLS.includes(cn)) { cell.numFmt = '$#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
        if (TL_COLS.includes(cn)) { cell.numFmt = '₺#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
      });
      sUsd += pUsd; sTl += pTl;
    }

    const stV = new Array(colCount).fill('');
    stV[0] = `${section.regionLabel} Total`; stV[9] = sUsd || ''; stV[10] = sTl || '';
    const stRow = ws.addRow(stV);
    stRow.height = 24;
    stRow.eachCell((cell, cn) => {
      cell.font = { bold: true, size: 12, color: { argb: COLORS.sectionTotal.fg } };
      cell.fill = fillBg(COLORS.sectionTotal.bg);
      cell.border = BORDERS_ALL;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (USD_COLS.includes(cn)) { cell.numFmt = '$#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
      if (TL_COLS.includes(cn)) { cell.numFmt = '₺#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
    });
    ws.addRow([]);
  }

  return wb;
}
