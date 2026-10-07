import { Row } from '../types';

export type SortField =
  | 'vendor'
  | 'pfCode'
  | 'orderType'
  | 'poSignStatus'
  | 'pfSignStatus'
  | 'status'
  | 'std'
  | 'etd'
  | 'rtd'
  | 'ftd'
  | 'containerNo';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
  secondaryField?: SortField;
  secondaryDirection?: SortDirection;
}

// Smart ranking for PO/PF Sign Status
const SIGN_STATUS_RANKING = {
  'NOT SIGNED': 1,
  'READY TO SIGN': 2,
  'WAITING T TO SIGN': 3,
  'WAITING TLINES TO SIGN': 4,
  'SIGNED WITH EST PRICE': 4.5,
  'SIGNED': 5
};

// Smart ranking for Status (priority order)
const STATUS_RANKING = {
  'HOLD / T': 1,
  'HOLD / PM': 2,
  'HOLD BOOKS': 2.5,
  'NOT ORDERED': 3,
  'TO ORDER': 3.5,
  'BOOKS IN PROGRESS': 3.7,
  'QUOTE': 4,
  'SPECIFICATION': 5,
  'DESIGN': 6,
  'ORDERED': 7,
  'ASSEMBLY': 8,
  'SENT': 9,
  'SENT TO TLINES': 10,
  'READY': 11,
  'READY TO RECEIVE': 12,
  'RECEIVED': 13,
  'DELIVERED': 14,
  'PARTIAL SENT': 15
};

// Parse date safely (YYYY-MM-DD format)
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  return date;
}

// Get comparison value for a field
function getComparisonValue(row: Row, field: SortField): any {
  switch (field) {
    case 'vendor':
      return row.vendor.toLowerCase();

    case 'pfCode':
      return row.pfCode.toLowerCase();

    case 'orderType':
      return row.orderType.toLowerCase();

    case 'poSignStatus':
      // This will come from the project's poSignStatusByType, but we'll handle it in the main sort function
      return '';

    case 'pfSignStatus':
      return (SIGN_STATUS_RANKING as any)[row.pfSignStatus] || 999;

    case 'status':
      return (STATUS_RANKING as any)[row.status] || 999;

    case 'std':
    case 'etd':
    case 'rtd':
    case 'ftd':
      const date = parseDate(row[field]);
      return date ? date.getTime() : Number.MAX_SAFE_INTEGER; // Invalid dates go last when ascending

    case 'containerNo':
      return row.containerNo.toLowerCase();

    default:
      return '';
  }
}

// Get PO Sign Status for a row based on its type
function getPOSignStatusValue(row: Row, poSignStatusByType: Record<string, string>): number {
  const poSignStatus = poSignStatusByType[row.type];
  return SIGN_STATUS_RANKING[poSignStatus as keyof typeof SIGN_STATUS_RANKING] || 999;
}

// Enhanced row with original index for reset functionality
export interface RowWithIndex extends Row {
  originalIndex: number;
}

// Add original indices to rows for reset functionality
export function addOriginalIndices(rows: Row[]): RowWithIndex[] {
  return rows.map((row, index) => ({
    ...row,
    originalIndex: index
  }));
}

// Main sorting function
export function sortRows(
  rows: RowWithIndex[],
  sortConfig: SortConfig | null,
  poSignStatusByType: Record<string, string>
): RowWithIndex[] {
  if (!sortConfig) {
    // No sort config - sort by original index (reset)
    return [...rows].sort((a, b) => a.originalIndex - b.originalIndex);
  }

  return [...rows].sort((a, b) => {
    // Primary sort
    let aValue, bValue;

    if (sortConfig.field === 'poSignStatus') {
      aValue = getPOSignStatusValue(a, poSignStatusByType);
      bValue = getPOSignStatusValue(b, poSignStatusByType);
    } else {
      aValue = getComparisonValue(a, sortConfig.field);
      bValue = getComparisonValue(b, sortConfig.field);
    }

    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    else if (aValue > bValue) comparison = 1;

    // Apply primary sort direction
    comparison = sortConfig.direction === 'desc' ? -comparison : comparison;

    // If primary comparison is equal and we have secondary sort
    if (comparison === 0 && sortConfig.secondaryField) {
      let aSecondary, bSecondary;

      if (sortConfig.secondaryField === 'poSignStatus') {
        aSecondary = getPOSignStatusValue(a, poSignStatusByType);
        bSecondary = getPOSignStatusValue(b, poSignStatusByType);
      } else {
        aSecondary = getComparisonValue(a, sortConfig.secondaryField);
        bSecondary = getComparisonValue(b, sortConfig.secondaryField);
      }

      if (aSecondary < bSecondary) comparison = -1;
      else if (aSecondary > bSecondary) comparison = 1;

      // Apply secondary sort direction
      comparison = sortConfig.secondaryDirection === 'desc' ? -comparison : comparison;
    }

    return comparison;
  });
}

// Sort field options for dropdown
export const SORT_FIELD_OPTIONS = [
  { value: 'vendor' as SortField, label: 'Vendor' },
  { value: 'pfCode' as SortField, label: 'PF Code' },
  { value: 'orderType' as SortField, label: 'Order Type' },
  { value: 'poSignStatus' as SortField, label: 'PO Sign Status' },
  { value: 'pfSignStatus' as SortField, label: 'PF Sign Status' },
  { value: 'status' as SortField, label: 'Status' },
  { value: 'std' as SortField, label: 'STD' },
  { value: 'etd' as SortField, label: 'ETD' },
  { value: 'rtd' as SortField, label: 'RTD' },
  { value: 'ftd' as SortField, label: 'FTD' },
  { value: 'containerNo' as SortField, label: 'Container No' },
];