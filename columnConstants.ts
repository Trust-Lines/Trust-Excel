import { ColumnKey } from './lib/columns';

// Single source of truth for all column widths
export const COLS = {
  projectNo: 110,
  type: 140,
  pfCode: 180,
  vendor: 220,
  orderType: 200,
  poSign: 140,
  pfSign: 140,
  status: 140,
  std: 140,
  etd: 140,
  rtd: 140,
  ftd: 140,
  pfUsd: 120,
  pfTl: 120,
  paymentRule: 180,
  container: 140,
  containerDate: 140,
  invoice: 160
} as const;

// Map column keys to width constants (CANONICAL camelCase keys)
export const COLUMN_WIDTH_MAP: Record<ColumnKey, number> = {
  projectNo: COLS.projectNo,
  type: COLS.type,
  pfCode: COLS.pfCode,
  vendor: COLS.vendor,
  orderType: COLS.orderType,
  poSignStatus: COLS.poSign,
  pfSignStatus: COLS.pfSign,
  status: COLS.status,
  std: COLS.std,
  etd: COLS.etd,
  rtd: COLS.rtd,
  ftd: COLS.ftd,
  pfUsd: COLS.pfUsd,
  pfTl: COLS.pfTl,
  paymentRule: COLS.paymentRule,
  containerNo: COLS.container,
  containerDate: COLS.containerDate,
  invoice: COLS.invoice
};

// Generate unified grid template for scrollable section (pfCode -> container)
export const SCROLLABLE_GRID_TEMPLATE = `${COLS.pfCode}px ${COLS.vendor}px ${COLS.orderType}px ${COLS.poSign}px ${COLS.pfSign}px ${COLS.status}px ${COLS.std}px ${COLS.etd}px ${COLS.rtd}px ${COLS.ftd}px ${COLS.pfUsd}px ${COLS.pfTl}px ${COLS.invoice}px ${COLS.paymentRule}px ${COLS.container}px ${COLS.containerDate}px`;

// Calculate minimum width for data grid
export const MIN_GRID_WIDTH = COLS.projectNo + COLS.type + (COLS.pfCode + COLS.vendor + COLS.orderType + COLS.poSign + COLS.pfSign + COLS.status + COLS.std + COLS.etd + COLS.rtd + COLS.ftd + COLS.pfUsd + COLS.pfTl + COLS.invoice + COLS.paymentRule + COLS.container + COLS.containerDate);

// Dynamic grid template generators based on visible columns
export const generateScrollableGridTemplate = (visibleColumns: ColumnKey[]): string => {
  // Filter out fixed columns (projectno, type) and get scrollable columns in order
  const allScrollableColumns: ColumnKey[] = [
    'pfCode', 'vendor', 'orderType', 'poSignStatus', 'pfSignStatus',
    'status', 'std', 'etd', 'rtd', 'ftd', 'pfUsd', 'pfTl', 'invoice', 'paymentRule', 'containerNo', 'containerDate'
  ];
  const scrollableColumns = allScrollableColumns.filter(col => visibleColumns.includes(col));

  return scrollableColumns.map(col => `${COLUMN_WIDTH_MAP[col]}px`).join(' ');
};

export const generateFixedGridTemplate = (visibleColumns: ColumnKey[]): string => {
  const allFixedColumns: ColumnKey[] = ['projectNo', 'type'];
  const fixedColumns = allFixedColumns.filter(col => visibleColumns.includes(col));
  return fixedColumns.map(col => `${COLUMN_WIDTH_MAP[col]}px`).join(' ');
};

export const calculateDynamicGridWidth = (visibleColumns: ColumnKey[]): number => {
  return visibleColumns.reduce((total, col) => total + COLUMN_WIDTH_MAP[col], 0);
};

// Get column width for a specific column
export const getColumnWidth = (columnKey: ColumnKey): number => {
  return COLUMN_WIDTH_MAP[columnKey];
};