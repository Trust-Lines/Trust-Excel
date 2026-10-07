/**
 * Grid Width Calculation - Single Source of Truth
 * 
 * This file calculates the dynamic grid width based on visible columns.
 * Used to ensure headers match the exact width of the grid.
 */

import { ColumnKey } from './columns';

// Column width mapping - MUST match CSS values in styles.css
export const COLUMN_WIDTHS: Record<ColumnKey, number> = {
  projectNo: 110,
  type: 140,
  pfCode: 180,
  vendor: 220,
  orderType: 200,
  poSignStatus: 140,
  pfSignStatus: 140,
  status: 140,
  std: 140,
  etd: 140,
  rtd: 140,
  rtr: 140,
  rdy: 140,
  ftd: 140,
  snd: 140,
  pfUsd: 160,
  pfTl: 160,
  invoice: 160,
  invoiceTl: 160,
  paymentRule: 180,
  containerNo: 140,
  containerDate: 140,
  expensesUsd: 160,
  expensesTl: 160,
};

// Fixed columns that are always visible (sticky left section)
export const FIXED_COLUMNS: ColumnKey[] = ['projectNo', 'type'];

// Scrollable columns (right section)
export const SCROLLABLE_COLUMNS: ColumnKey[] = [
  'pfCode',
  'vendor',
  'orderType',
  'poSignStatus',
  'pfSignStatus',
  'status',
  'std',
  'etd',
  'rtd',
  'rtr',
  'rdy',
  'ftd',
  'snd',
  'pfUsd',
  'pfTl',
  'invoice',
  'invoiceTl',
  'expensesUsd',
  'expensesTl',
  'paymentRule',
  'containerNo',
  'containerDate',
];

/**
 * Calculate the total grid width based on visible columns
 * @param isColumnVisible - Function to check if a column is visible
 * @param isSupplierMode - Whether we're in supplier mode (hides PO Sign Status)
 * @returns Total width in pixels
 */
export const calculateGridWidth = (
  isColumnVisible: (key: ColumnKey) => boolean,
  isSupplierMode: boolean = false
): number => {
  let totalWidth = 0;

  // Add fixed columns (always visible)
  FIXED_COLUMNS.forEach((col) => {
    if (isColumnVisible(col)) {
      totalWidth += COLUMN_WIDTHS[col];
    }
  });

  // Add scrollable columns (conditionally visible)
  SCROLLABLE_COLUMNS.forEach((col) => {
    // Skip PO Sign Status in supplier mode
    if (isSupplierMode && col === 'poSignStatus') {
      return;
    }

    if (isColumnVisible(col)) {
      totalWidth += COLUMN_WIDTHS[col];
    }
  });

  return totalWidth;
};

/**
 * Get grid width as CSS string (e.g., "2210px")
 */
export const getGridWidthPx = (
  isColumnVisible: (key: ColumnKey) => boolean,
  isSupplierMode: boolean = false
): string => {
  return `${calculateGridWidth(isColumnVisible, isSupplierMode)}px`;
};
