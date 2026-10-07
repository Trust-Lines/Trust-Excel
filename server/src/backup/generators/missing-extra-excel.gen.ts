import * as ExcelJS from 'exceljs';
import { BORDERS_ALL, COLORS, fillBg, toNumber, applyStatusColor, formatDate } from './shared-styles';

export async function generateMissingExtraExcel(prisma: any): Promise<ExcelJS.Workbook> {
  const cases = await prisma.missingExtraCase.findMany({
    include: {
      items: {
        include: {
          vendor: { select: { id: true, code: true, name: true } },
          customType: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: [{ section: 'asc' }, { baseProjectNo: 'asc' }, { caseIndex: 'asc' }],
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Missing Extra');

  const COLS = [
    { header: 'Project', width: 16 },
    { header: 'Case', width: 12 },
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

  // Group by section
  const sectionMap = new Map<string, typeof cases>();
  for (const c of cases) {
    const s = c.section || 'OTHER';
    if (!sectionMap.has(s)) sectionMap.set(s, []);
    sectionMap.get(s)!.push(c);
  }

  for (const [sectionName, sectionCases] of sectionMap) {
    const secRow = ws.addRow([sectionName]);
    ws.mergeCells(secRow.number, 1, secRow.number, colCount);
    secRow.getCell(1).font = { bold: true, size: 14, color: { argb: COLORS.sectionHeader.fg } };
    secRow.getCell(1).fill = fillBg(COLORS.sectionHeader.bg);
    secRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    secRow.height = 28;

    let sUsd = 0, sTl = 0;

    for (const meCase of sectionCases) {
      const items = meCase.items || [];
      if (items.length === 0) continue;

      const caseLabel = `${meCase.baseProjectNo} - ${meCase.baseProjectName} (${meCase.derivedProjectCode})`;
      const projRow = ws.addRow([caseLabel]);
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
        const pfUsd = toNumber(item.pfUsd);
        const pfTl = toNumber(item.pfTl);
        const vendorStr = item.vendor ? `${item.vendor.code} - ${item.vendor.name}` : '';

        const row = ws.addRow([
          meCase.baseProjectNo,
          meCase.derivedProjectCode,
          item.customType?.code || item.type || '',
          item.pfCode || '',
          vendorStr,
          (item.pfSignStatus || '').replace(/_/g, ' '),
          (item.poSignStatus || '').replace(/_/g, ' '),
          (item.status || '').replace(/_/g, ' '),
          pfUsd || '', pfTl || '',
          formatDate(item.std), formatDate(item.etd), formatDate(item.rtd), formatDate(item.ftd),
          item.containerNo || '', item.paymentRule || '',
        ]);
        row.height = 18;
        const isAlt = idx % 2 === 1;
        row.eachCell((cell, cn) => {
          cell.font = { size: 10 };
          cell.border = BORDERS_ALL;
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (isAlt) cell.fill = fillBg(COLORS.dataRowAlt.bg);
          if (cn === 9) { cell.numFmt = '$#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
          if (cn === 10) { cell.numFmt = '₺#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
        });
        applyStatusColor(row.getCell(6), item.pfSignStatus);
        applyStatusColor(row.getCell(7), item.poSignStatus);
        applyStatusColor(row.getCell(8), item.status);
        pUsd += pfUsd; pTl += pfTl;
      });

      const ptV = new Array(colCount).fill('');
      ptV[0] = 'Total'; ptV[8] = pUsd || ''; ptV[9] = pTl || '';
      const ptRow = ws.addRow(ptV);
      ptRow.height = 20;
      ptRow.eachCell((cell, cn) => {
        cell.font = { bold: true, size: 10, color: { argb: COLORS.projectTotal.fg } };
        cell.fill = fillBg(COLORS.projectTotal.bg);
        cell.border = BORDERS_ALL;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (cn === 9) { cell.numFmt = '$#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
        if (cn === 10) { cell.numFmt = '₺#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
      });
      sUsd += pUsd; sTl += pTl;
    }

    const stV = new Array(colCount).fill('');
    stV[0] = `${sectionName} Total`; stV[8] = sUsd || ''; stV[9] = sTl || '';
    const stRow = ws.addRow(stV);
    stRow.height = 24;
    stRow.eachCell((cell, cn) => {
      cell.font = { bold: true, size: 12, color: { argb: COLORS.sectionTotal.fg } };
      cell.fill = fillBg(COLORS.sectionTotal.bg);
      cell.border = BORDERS_ALL;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (cn === 9) { cell.numFmt = '$#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
      if (cn === 10) { cell.numFmt = '₺#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
    });
    ws.addRow([]);
  }

  return wb;
}
