/**
 * CANONICAL COLUMN REGISTRY - Single Source of Truth
 *
 * This is the authoritative definition of all columns used in the Operational Board.
 * Any column changes must be made here first.
 *
 * Used by:
 * - Operational Board header render
 * - Body render
 * - Total row render
 * - Permission UI generation
 * - Backend validation
 */

export interface ColumnDefinition {
  key: string;
  label: string;
  group: 'project' | 'vendor' | 'status' | 'dates' | 'money' | 'logistics';
  width: string;
  isMoney: boolean;
  isEditableByDefault: boolean;
  description?: string;
}

// CANONICAL COLUMN REGISTRY
export const OPERATIONAL_BOARD_COLUMNS: Record<string, ColumnDefinition> = {
  projectNo: {
    key: 'projectNo',
    label: 'Project No',
    group: 'project',
    width: '120px',
    isMoney: false,
    isEditableByDefault: false,
    description: 'Project identifier number'
  },
  type: {
    key: 'type',
    label: 'Type',
    group: 'project',
    width: '100px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Project item type (Millwork, Shelving, etc.)'
  },
  pfCode: {
    key: 'pfCode',
    label: 'PF Code',
    group: 'project',
    width: '120px',
    isMoney: false,
    isEditableByDefault: false,
    description: 'Auto-generated project code'
  },
  vendor: {
    key: 'vendor',
    label: 'Vendor',
    group: 'vendor',
    width: '150px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Assigned vendor for this item'
  },
  orderType: {
    key: 'orderType',
    label: 'Order Type',
    group: 'vendor',
    width: '140px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Type of order (Standard, Custom, etc.)'
  },
  poSignStatus: {
    key: 'poSignStatus',
    label: 'PO Sign Status',
    group: 'status',
    width: '130px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Purchase order signature status'
  },
  pfSignStatus: {
    key: 'pfSignStatus',
    label: 'PF Sign Status',
    group: 'status',
    width: '130px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Project form signature status'
  },
  status: {
    key: 'status',
    label: 'Status',
    group: 'status',
    width: '140px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Current project status'
  },
  std: {
    key: 'std',
    label: 'STD',
    group: 'dates',
    width: '140px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Start To Deliver date'
  },
  etd: {
    key: 'etd',
    label: 'ETD',
    group: 'dates',
    width: '140px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Expected To Deliver date'
  },
  rtd: {
    key: 'rtd',
    label: 'RTD',
    group: 'dates',
    width: '140px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Ready To Deliver date'
  },
  rtr: {
    key: 'rtr',
    label: 'RTR',
    group: 'dates',
    width: '140px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Ready To Receive date'
  },
  rdy: {
    key: 'rdy',
    label: 'RDY',
    group: 'dates',
    width: '140px',
    isMoney: false,
    isEditableByDefault: false,
    description: 'Ready date (auto-set when status → READY)'
  },
  ftd: {
    key: 'ftd',
    label: 'FTD',
    group: 'dates',
    width: '140px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Final Target Delivery date'
  },
  snd: {
    key: 'snd',
    label: 'SND',
    group: 'dates',
    width: '140px',
    isMoney: false,
    isEditableByDefault: false,
    description: 'Sent date (auto-set when status → SENT)'
  },
  pfUsd: {
    key: 'pfUsd',
    label: 'PF USD',
    group: 'money',
    width: '120px',
    isMoney: true,
    isEditableByDefault: true,
    description: 'Project fee in USD'
  },
  pfTl: {
    key: 'pfTl',
    label: 'PF TL',
    group: 'money',
    width: '120px',
    isMoney: true,
    isEditableByDefault: true,
    description: 'Project fee in Turkish Lira'
  },
  paymentRule: {
    key: 'paymentRule',
    label: 'Payment Rule',
    group: 'logistics',
    width: '180px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Payment agreement terms (e.g., 50/50, 100% upfront)'
  },
  containerNo: {
    key: 'containerNo',
    label: 'Container No',
    group: 'logistics',
    width: '130px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Container number for shipping'
  },
  containerDate: {
    key: 'containerDate',
    label: 'Container Date',
    group: 'logistics',
    width: '140px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Container shipping date'
  },
  expensesUsd: {
    key: 'expensesUsd',
    label: 'EXPENSES / USD',
    group: 'money',
    width: '160px',
    isMoney: true,
    isEditableByDefault: true,
    description: 'Expenses amount in USD'
  },
  expensesTl: {
    key: 'expensesTl',
    label: 'EXPENSES / TL',
    group: 'money',
    width: '160px',
    isMoney: true,
    isEditableByDefault: true,
    description: 'Expenses amount in Turkish Lira'
  },
  invoice: {
    key: 'invoice',
    label: 'INV/USD',
    group: 'money',
    width: '160px',
    isMoney: true,
    isEditableByDefault: true,
    description: 'Invoice amount in USD'
  },
  invoiceTl: {
    key: 'invoiceTl',
    label: 'INV/TL',
    group: 'money',
    width: '160px',
    isMoney: true,
    isEditableByDefault: true,
    description: 'Invoice amount in Turkish Lira'
  },
} as const;

// Type exports
export type ColumnKey = keyof typeof OPERATIONAL_BOARD_COLUMNS;
export type ColumnGroup = 'project' | 'vendor' | 'status' | 'dates' | 'money' | 'logistics';

// Helper functions
export const getColumnDefinition = (key: ColumnKey): ColumnDefinition => {
  return OPERATIONAL_BOARD_COLUMNS[key];
};

export const getColumnsByGroup = (group: ColumnGroup): ColumnDefinition[] => {
  return Object.values(OPERATIONAL_BOARD_COLUMNS).filter(col => col.group === group);
};

export const getMoneyColumns = (): ColumnDefinition[] => {
  return Object.values(OPERATIONAL_BOARD_COLUMNS).filter(col => col.isMoney);
};

export const getEditableColumns = (): ColumnDefinition[] => {
  return Object.values(OPERATIONAL_BOARD_COLUMNS).filter(col => col.isEditableByDefault);
};

export const getAllColumnKeys = (): ColumnKey[] => {
  return Object.keys(OPERATIONAL_BOARD_COLUMNS) as ColumnKey[];
};

export const isValidColumnKey = (key: string): key is ColumnKey => {
  return key in OPERATIONAL_BOARD_COLUMNS;
};

export const validateColumnKeys = (keys: string[]): { valid: ColumnKey[], invalid: string[] } => {
  const valid: ColumnKey[] = [];
  const invalid: string[] = [];

  keys.forEach(key => {
    if (isValidColumnKey(key)) {
      valid.push(key);
    } else {
      invalid.push(key);
    }
  });

  return { valid, invalid };
};

// Generate grid template columns for CSS Grid
export const generateGridTemplateColumns = (visibleColumns: ColumnKey[]): string => {
  return visibleColumns
    .map(key => OPERATIONAL_BOARD_COLUMNS[key].width)
    .join(' ');
};