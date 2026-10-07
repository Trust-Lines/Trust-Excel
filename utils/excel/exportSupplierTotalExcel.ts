import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { SupplierTotalResponse, SupplierTotalMoney, SupplierTotalVendor } from '../../types/supplierTotal';

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

// ── Block definitions (matches UI) ───────────────────────────────────

interface BlockDef {
  title: string;
  bg: string;
  cols: { label: string; field: keyof SupplierTotalMoney; fmt: string }[];
}

const BLOCKS: BlockDef[] = [
  {
    title: 'PRODUCTION PRICE',
    bg: '4472C4',
    cols: [
      { label: 'PF / USD', field: 'productionUsd', fmt: '$#,##0.00' },
      { label: 'PF / TL', field: 'productionTl', fmt: '₺#,##0.00' },
    ],
  },
  {
    title: 'PAYMENTS',
    bg: 'D4AF37',
    cols: [
      { label: 'Paid / USD', field: 'paidUsd', fmt: '$#,##0.00' },
      { label: 'Paid / TL', field: 'paidTl', fmt: '₺#,##0.00' },
    ],
  },
  {
    title: 'REMAINING',
    bg: '92400E',
    cols: [
      { label: 'USD', field: 'remainingUsd', fmt: '$#,##0.00' },
      { label: 'TL', field: 'remainingTl', fmt: '₺#,##0.00' },
    ],
  },
  {
    title: 'FUTURE',
    bg: '78350F',
    cols: [
      { label: 'USD', field: 'futureUsd', fmt: '$#,##0.00' },
      { label: 'TL', field: 'futureTl', fmt: '₺#,##0.00' },
    ],
  },
];

const COL_HEADER_BG = '374151';
const VENDOR_BG = '4B5563';
const VTOTAL_BG = '1E293B';
const GRAND_BG = '111827';
// ── Main export function ─────────────────────────────────────────────

/**
 * Write the Supplier Total sheet (as shown on /supplier-total) into an
 * existing workbook. Used by the standalone export and the all-suppliers export.
 */
export function writeSupplierTotalSheet(wb: ExcelJS.Workbook, data: SupplierTotalResponse): void {
  const ws = wb.addWorksheet('Supplier Total');

  // Layout: Label(1col) + Block1(2cols) + gap(1col) + Block2(2cols) + gap + Block3 + gap + Block4
  // Col A = row labels (for first block)
  // Each block = 2 data cols
  // Gaps between blocks

  const LABEL_WIDTH = 28;
  const DATA_WIDTH = 15;
  const GAP_WIDTH = 3;

  // Calculate column positions for each block
  // Col 1 = label column
  // Col 2-3 = production
  // Col 4 = gap
  // Col 5-6 = payments
  // Col 7 = gap
  // Col 8-9 = remaining
  // Col 10 = gap
  // Col 11-12 = future

  const blockStarts = [2, 5, 8, 11]; // 1-based column index where each block starts

  // Set column widths
  ws.getColumn(1).width = LABEL_WIDTH;
  for (let b = 0; b < 4; b++) {
    const start = blockStarts[b];
    ws.getColumn(start).width = DATA_WIDTH;
    ws.getColumn(start + 1).width = DATA_WIDTH;
    if (b < 3) ws.getColumn(start + 2).width = GAP_WIDTH; // gap column
  }

  let row = 1;

  // ── Helper: style a cell ──
  const styleCell = (
    r: number,
    c: number,
    value: string | number | null,
    opts: {
      bg?: string;
      fg?: string;
      bold?: boolean;
      align?: 'left' | 'center' | 'right';
      numFmt?: string;
      fontSize?: number;
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

  // ── Row 1: Section headers (merged per block) ──
  // Label cell
  styleCell(row, 1, '', { bg: '1F2937' });

  for (let b = 0; b < BLOCKS.length; b++) {
    const start = blockStarts[b];
    ws.mergeCells(row, start, row, start + 1);
    styleCell(row, start, BLOCKS[b].title, {
      bg: BLOCKS[b].bg,
      fg: 'FFFFFF',
      bold: true,
      align: 'center',
      fontSize: 11,
    });
  }
  ws.getRow(row).height = 24;
  row++;

  // ── Row 2: Column headers ──
  styleCell(row, 1, '', { bg: COL_HEADER_BG });

  for (let b = 0; b < BLOCKS.length; b++) {
    const start = blockStarts[b];
    for (let c = 0; c < BLOCKS[b].cols.length; c++) {
      styleCell(row, start + c, BLOCKS[b].cols[c].label, {
        bg: COL_HEADER_BG,
        fg: 'FFFFFF',
        bold: true,
        align: 'center',
      });
    }
  }
  ws.getRow(row).height = 20;
  row++;

  // ── Helper: write a money row across all 4 blocks ──
  const writeMoneyRow = (
    label: string,
    money: SupplierTotalMoney,
    opts: { bg: string; fg?: string; bold?: boolean; height?: number },
  ) => {
    const r = row;
    ws.getRow(r).height = opts.height || 18;

    styleCell(r, 1, label, {
      bg: opts.bg,
      fg: opts.fg,
      bold: opts.bold,
      align: 'left',
    });

    for (let b = 0; b < BLOCKS.length; b++) {
      const start = blockStarts[b];
      for (let c = 0; c < BLOCKS[b].cols.length; c++) {
        const col = BLOCKS[b].cols[c];
        const val = money[col.field];
        styleCell(r, start + c, val === 0 ? null : val, {
          bg: opts.bg,
          fg: opts.fg,
          bold: opts.bold,
          align: 'right',
          numFmt: col.fmt,
        });
      }
    }

    row++;
  };

  // ── Helper: write vendor name row (merged across full width per block) ──
  const writeVendorNameRow = (vendor: SupplierTotalVendor) => {
    const r = row;
    ws.getRow(r).height = 22;

    // Label column: vendor name
    styleCell(r, 1, `${vendor.vendorCode} - ${vendor.vendorName}`, {
      bg: VENDOR_BG,
      fg: 'FFFFFF',
      bold: true,
      align: 'left',
      fontSize: 11,
    });

    // Fill block columns with vendor bg
    for (let b = 0; b < BLOCKS.length; b++) {
      const start = blockStarts[b];
      ws.mergeCells(r, start, r, start + 1);
      styleCell(r, start, null, { bg: VENDOR_BG });
    }

    row++;
  };

  // ── Vendor data ──
  for (const vendor of data.vendors) {
    writeVendorNameRow(vendor);

    for (const tab of vendor.tabs) {
      writeMoneyRow(`  ${tab.label}`, tab.money, { bg: 'FFFFFF' });
    }

    writeMoneyRow('  TOTAL', vendor.total, {
      bg: VTOTAL_BG,
      fg: 'FFFFFF',
      bold: true,
    });
  }

  // ── Grand total ──
  writeMoneyRow('GRAND TOTAL', data.grandTotal, {
    bg: GRAND_BG,
    fg: 'FFFFFF',
    bold: true,
    height: 24,
  });
}

export async function exportSupplierTotalExcel(data: SupplierTotalResponse): Promise<void> {
  const wb = new ExcelJS.Workbook();
  writeSupplierTotalSheet(wb, data);

  // ── Save ──
  const today = new Date().toISOString().slice(0, 10);
  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf]), `Supplier_Total_${today}.xlsx`);
}
