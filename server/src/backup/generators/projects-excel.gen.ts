import * as ExcelJS from 'exceljs';
import { BORDERS_ALL, COLORS, fillBg, toNumber, applyStatusColor, groupByBucket, formatDate } from './shared-styles';

export async function generateProjectsExcel(prisma: any): Promise<ExcelJS.Workbook> {
  const projects = await prisma.project.findMany({
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
  const ws = wb.addWorksheet('Projects');

  const COLS = [
    { header: 'Project No', width: 14 },
    { header: 'Type', width: 14 },
    { header: 'PF Code', width: 12 },
    { header: 'Vendor', width: 22 },
    { header: 'PF Sign', width: 14 },
    { header: 'PO Sign', width: 14 },
    { header: 'Status', width: 16 },
    { header: 'PF/USD', width: 14 },
    { header: 'PF/TL', width: 14 },
    { header: 'STD', width: 12 },
    { header: 'ETD', width: 12 },
    { header: 'RTD', width: 12 },
    { header: 'FTD', width: 12 },
    { header: 'Container No', width: 14 },
    { header: 'Payment Rule', width: 14 },
  ];

  ws.columns = COLS.map((c) => ({ width: c.width }));
  const colCount = COLS.length;

  const sections = groupByBucket(projects);

  for (const section of sections) {
    // Section header
    const secRow = ws.addRow([section.regionLabel]);
    ws.mergeCells(secRow.number, 1, secRow.number, colCount);
    secRow.getCell(1).font = { bold: true, size: 14, color: { argb: COLORS.sectionHeader.fg } };
    secRow.getCell(1).fill = fillBg(COLORS.sectionHeader.bg);
    secRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    secRow.height = 28;

    let sectionUsd = 0, sectionTl = 0;

    for (const project of section.projects) {
      const items = project.items || [];
      if (items.length === 0) continue;

      // Project header
      const projRow = ws.addRow([`${project.projectNo} - ${project.name}`]);
      ws.mergeCells(projRow.number, 1, projRow.number, colCount);
      projRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
      projRow.getCell(1).fill = fillBg(COLORS.projectOrange);
      projRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
      projRow.height = 24;

      // Column headers
      const hdrRow = ws.addRow(COLS.map((c) => c.header));
      hdrRow.height = 22;
      hdrRow.eachCell((cell) => {
        cell.font = { bold: true, size: 10, color: { argb: COLORS.columnHeader.fg } };
        cell.fill = fillBg(COLORS.columnHeader.bg);
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = BORDERS_ALL;
      });

      let projUsd = 0, projTl = 0;

      items.forEach((item: any, idx: number) => {
        const pfUsd = toNumber(item.pfUsd);
        const pfTl = toNumber(item.pfTl);
        const typeName = item.customType?.code || item.type || '';
        const vendorStr = item.vendor ? `${item.vendor.code} - ${item.vendor.name}` : '';

        const row = ws.addRow([
          project.projectNo,
          typeName,
          item.pfCode || '',
          vendorStr,
          (item.pfSignStatus || '').replace(/_/g, ' '),
          (item.poSignStatus || '').replace(/_/g, ' '),
          (item.status || '').replace(/_/g, ' '),
          pfUsd || '',
          pfTl || '',
          formatDate(item.std),
          formatDate(item.etd),
          formatDate(item.rtd),
          formatDate(item.ftd),
          item.containerNo || '',
          item.paymentRule || '',
        ]);
        row.height = 18;
        const isAlt = idx % 2 === 1;

        row.eachCell((cell, colNum) => {
          cell.font = { size: 10 };
          cell.border = BORDERS_ALL;
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (isAlt) cell.fill = fillBg(COLORS.dataRowAlt.bg);
          if (colNum === 8) { cell.numFmt = '$#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
          if (colNum === 9) { cell.numFmt = '₺#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
        });

        // Status coloring
        applyStatusColor(row.getCell(5), item.pfSignStatus);
        applyStatusColor(row.getCell(6), item.poSignStatus);
        applyStatusColor(row.getCell(7), item.status);

        projUsd += pfUsd;
        projTl += pfTl;
      });

      // Project total
      const ptVals = new Array(colCount).fill('');
      ptVals[0] = 'Total';
      ptVals[7] = projUsd || '';
      ptVals[8] = projTl || '';
      const ptRow = ws.addRow(ptVals);
      ptRow.height = 20;
      ptRow.eachCell((cell, colNum) => {
        cell.font = { bold: true, size: 10, color: { argb: COLORS.projectTotal.fg } };
        cell.fill = fillBg(COLORS.projectTotal.bg);
        cell.border = BORDERS_ALL;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (colNum === 8) { cell.numFmt = '$#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
        if (colNum === 9) { cell.numFmt = '₺#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
      });

      sectionUsd += projUsd;
      sectionTl += projTl;
    }

    // Section total
    const stVals = new Array(colCount).fill('');
    stVals[0] = `${section.regionLabel} Total`;
    stVals[7] = sectionUsd || '';
    stVals[8] = sectionTl || '';
    const stRow = ws.addRow(stVals);
    stRow.height = 24;
    stRow.eachCell((cell, colNum) => {
      cell.font = { bold: true, size: 12, color: { argb: COLORS.sectionTotal.fg } };
      cell.fill = fillBg(COLORS.sectionTotal.bg);
      cell.border = BORDERS_ALL;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (colNum === 8) { cell.numFmt = '$#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
      if (colNum === 9) { cell.numFmt = '₺#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
    });

    ws.addRow([]);
  }

  return wb;
}
