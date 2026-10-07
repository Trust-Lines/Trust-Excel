import * as ExcelJS from 'exceljs';

// ── Status Colors (mirrors frontend/utils/statusStyles.ts) ──

export interface ExcelFillColor {
  bg: string;
  fg: string;
}

export function getStatusFill(status: string | null | undefined): ExcelFillColor | null {
  if (!status) return null;
  const s = status.toUpperCase().trim();
  switch (s) {
    case 'NOT ORDERED':
    case 'NOT_ORDERED':
      return { bg: 'dc2626', fg: 'FFFFFF' };
    case 'TO ORDER':
    case 'TO_ORDER':
      return { bg: 'fb7185', fg: '000000' };
    case 'HOLD BOOKS':
    case 'HOLD_BOOKS':
      return { bg: 'ea580c', fg: 'FFFFFF' };
    case 'BOOKS IN PROGRESS':
    case 'BOOKS_IN_PROGRESS':
      return { bg: '0ea5e9', fg: 'FFFFFF' };
    case 'ORDERED':
      return { bg: '2563eb', fg: 'FFFFFF' };
    case 'WAITING PAYMENT':
    case 'WAITING_PAYMENT':
      return { bg: 'a855f7', fg: 'FFFFFF' };
    case 'ASSEMBLY':
      return { bg: 'fbbf24', fg: '000000' };
    case 'READY TO RECEIVE':
    case 'READY_TO_RECEIVE':
      return { bg: 'f97316', fg: 'FFFFFF' };
    case 'RECEIVED':
      return { bg: 'fb923c', fg: '000000' };
    case 'READY':
      return { bg: '86efac', fg: '000000' };
    case 'SENT TO TLINES':
    case 'SENT_TO_TLINES':
    case 'SENT':
      return { bg: '15803d', fg: 'FFFFFF' };
    case 'NOT SIGNED':
    case 'NOT_SIGNED':
      return { bg: 'ff0000', fg: '000000' };
    case 'READY TO SIGN':
    case 'READY_TO_SIGN':
      return { bg: 'ffff00', fg: '000000' };
    case 'SIGNED':
      return { bg: '92d050', fg: '000000' };
    case 'WAITING TLINES TO SIGN':
    case 'WAITING_TLINES_TO_SIGN':
      return { bg: 'fb923c', fg: '000000' };
    case 'WAITING T TO SIGN':
    case 'WAITING_T_TO_SIGN':
      return { bg: 'a78bfa', fg: '000000' };
    case 'SIGNED WITH EST PRICE':
    case 'SIGNED_WITH_EST_PRICE':
      return { bg: '4ade80', fg: '000000' };
    default:
      return null;
  }
}

// ── Shared Excel Styles ──

export const BORDER_THIN: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'D1D5DB' } };
export const BORDERS_ALL: Partial<ExcelJS.Borders> = {
  top: BORDER_THIN,
  bottom: BORDER_THIN,
  left: BORDER_THIN,
  right: BORDER_THIN,
};

export function fillBg(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

// ── Shared Colors ──

export const COLORS = {
  sectionHeader: { bg: 'B02417', fg: 'FFFFFF' },
  columnHeader: { bg: '374151', fg: 'FFFFFF' },
  dataRowAlt: { bg: 'F9FAFB' },
  projectTotal: { bg: '1E40AF', fg: 'FFFFFF' },
  sectionTotal: { bg: '2563EB', fg: 'FFFFFF' },
  projectOrange: 'DE8244',
};

// ── Helpers ──

export function toNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'object' && typeof v.toNumber === 'function') return v.toNumber();
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function formatDate(d: Date | string | null): string {
  if (!d) return '';
  try {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch {
    return '';
  }
}

export function applyStatusColor(cell: ExcelJS.Cell, status: string | null | undefined): void {
  const sf = getStatusFill(status);
  if (sf) {
    cell.fill = fillBg(sf.bg);
    cell.font = { ...cell.font, color: { argb: sf.fg }, bold: true };
  }
}

export const SECTION_ORDER = [
  { id: 'TLINES_NE', label: 'TLines NE' },
  { id: 'TLINES_SE', label: 'TLines SE' },
  { id: 'TLINES_NW', label: 'TLines NW' },
  { id: 'CVW', label: 'TLines CVW' },
  { id: 'TLINES_HQ', label: 'TLines HQ' },
  { id: 'TLINES_TC', label: 'TLines TC' },
];

export function groupByBucket(
  projects: any[],
): { regionLabel: string; projects: any[] }[] {
  return SECTION_ORDER
    .map((s) => ({
      regionLabel: s.label,
      projects: projects.filter((p) => p.bucket === s.id),
    }))
    .filter((s) => s.projects.length > 0);
}
