/**
 * Supplier Permissions Registry - Dynamic Column Source of Truth
 *
 * Structure: 3 main tabs (P/ME/DO) × 4 tables each = 12 unique combinations
 */

// Define column types
interface ColumnDef {
  key: string;
  label: string;
  group?: string;
}

// P Tab Columns
const P_PROJECTS_COLUMNS: ColumnDef[] = [
  { key: 'projectNo', label: 'Project No', group: 'project' },
  { key: 'type', label: 'Type', group: 'project' },
  { key: 'pfCode', label: 'PF Code', group: 'project' },
  { key: 'vendor', label: 'Vendor', group: 'vendor' },
  { key: 'orderType', label: 'Order Type', group: 'vendor' },
  { key: 'poSignStatus', label: 'PO Sign Status', group: 'status' },
  { key: 'pfSignStatus', label: 'PF Sign Status', group: 'status' },
  { key: 'status', label: 'Status', group: 'status' },
  { key: 'std', label: 'STD', group: 'dates' },
  { key: 'etd', label: 'ETD', group: 'dates' },
  { key: 'rtd', label: 'RTD', group: 'dates' },
  { key: 'ftd', label: 'FTD', group: 'dates' },
  { key: 'pfUsd', label: 'PF USD', group: 'money' },
  { key: 'pfTl', label: 'PF TL', group: 'money' },
  { key: 'containerNo', label: 'Container No', group: 'logistics' },
];

const P_ACCOUNTING_COLUMNS: ColumnDef[] = [
  { key: 'paidUsd1', label: 'Paid USD 1', group: 'payments' },
  { key: 'paidUsd2', label: 'Paid USD 2', group: 'payments' },
  { key: 'paidTl1', label: 'Paid TL 1', group: 'payments' },
  { key: 'paidTl2', label: 'Paid TL 2', group: 'payments' },
  { key: 'remainingUsd', label: 'Remaining USD', group: 'remaining' },
  { key: 'remainingTl', label: 'Remaining TL', group: 'remaining' },
  { key: 'notOrderedUsd', label: 'Not Ordered USD', group: 'notOrdered' },
  { key: 'notOrderedTl', label: 'Not Ordered TL', group: 'notOrdered' },
];

const P_PAYMENTS_COLUMNS: ColumnDef[] = [
  { key: 'dueUsd', label: 'Due Payment USD', group: 'due' },
  { key: 'dueTl', label: 'Due Payment TL', group: 'due' },
  { key: 'payUsd1', label: 'Payment 1 USD', group: 'payment1' },
  { key: 'payTl1', label: 'Payment 1 TL', group: 'payment1' },
  { key: 'payUsd2', label: 'Payment 2 USD', group: 'payment2' },
  { key: 'payTl2', label: 'Payment 2 TL', group: 'payment2' },
];

const P_INVOICE_COLUMNS: ColumnDef[] = [
  { key: 'transactionNo', label: 'Transaction No', group: 'invoice' },
  { key: 'invoiceNumber', label: 'Invoice Number', group: 'invoice' },
  { key: 'quickBook', label: 'Quick Book', group: 'tracking' },
];

// ME Tab Columns (similar structure but different data context)
const ME_PROJECTS_COLUMNS: ColumnDef[] = [
  { key: 'caseIndex', label: 'Case #', group: 'project' },
  { key: 'type', label: 'Type', group: 'project' },
  { key: 'pfCode', label: 'PF Code', group: 'project' },
  { key: 'orderType', label: 'Order Type', group: 'vendor' },
  { key: 'poSignStatus', label: 'PO Sign Status', group: 'status' },
  { key: 'pfSignStatus', label: 'PF Sign Status', group: 'status' },
  { key: 'status', label: 'Status', group: 'status' },
  { key: 'etd', label: 'ETD', group: 'dates' },
  { key: 'rtd', label: 'RTD', group: 'dates' },
  { key: 'ftd', label: 'FTD', group: 'dates' },
  { key: 'pfUsd', label: 'PF USD', group: 'money' },
  { key: 'pfTl', label: 'PF TL', group: 'money' },
  { key: 'containerNo', label: 'Container No', group: 'logistics' },
];

// ME Accounting/Payments/Invoice columns (reuse from P for now - can be different if needed)
const ME_ACCOUNTING_COLUMNS = P_ACCOUNTING_COLUMNS;
const ME_PAYMENTS_COLUMNS = P_PAYMENTS_COLUMNS;
const ME_INVOICE_COLUMNS = P_INVOICE_COLUMNS;

// DO Tab Columns
const DO_PROJECTS_COLUMNS: ColumnDef[] = [
  { key: 'doNumber', label: 'DO Number', group: 'project' },
  { key: 'type', label: 'Type', group: 'project' },
  { key: 'description', label: 'Description', group: 'project' },
  { key: 'quantity', label: 'Quantity', group: 'order' },
  { key: 'unitPrice', label: 'Unit Price', group: 'money' },
  { key: 'totalPrice', label: 'Total Price', group: 'money' },
  { key: 'orderDate', label: 'Order Date', group: 'dates' },
  { key: 'deliveryDate', label: 'Delivery Date', group: 'dates' },
  { key: 'status', label: 'Status', group: 'status' },
  { key: 'notes', label: 'Notes', group: 'project' },
  { key: 'containerNo', label: 'Container No', group: 'logistics' },
  { key: 'containerDate', label: 'Container Date', group: 'logistics' },
];

// DO Accounting/Payments/Invoice columns (reuse from P for now)
const DO_ACCOUNTING_COLUMNS = P_ACCOUNTING_COLUMNS;
const DO_PAYMENTS_COLUMNS = P_PAYMENTS_COLUMNS;
const DO_INVOICE_COLUMNS = P_INVOICE_COLUMNS;

// Table definition interface
interface TableDef {
  key: string;
  label: string;
  description: string;
  getColumns: () => ColumnDef[];
  actions: string[]; // view, edit, export
}

// Main tab interface
interface MainTabDef {
  key: string;
  label: string;
  description: string;
  tables: Record<string, TableDef>;
}

// Complete Supplier Registry
export const SUPPLIER_REGISTRY: Record<string, MainTabDef> = {
  P: {
    key: 'P',
    label: 'Projects',
    description: 'Main projects data and tracking',
    tables: {
      projects: {
        key: 'projects',
        label: 'Projects',
        description: 'Project details and status',
        getColumns: () => P_PROJECTS_COLUMNS,
        actions: ['view', 'edit', 'export'],
      },
      accounting: {
        key: 'accounting',
        label: 'Accounting',
        description: 'Financial accounting data',
        getColumns: () => P_ACCOUNTING_COLUMNS,
        actions: ['view', 'edit', 'export'],
      },
      payments: {
        key: 'payments',
        label: 'Payments',
        description: 'Payment tracking information',
        getColumns: () => P_PAYMENTS_COLUMNS,
        actions: ['view', 'edit', 'export'],
      },
      invoice: {
        key: 'invoice',
        label: 'Invoice',
        description: 'Invoice and receipt tracking',
        getColumns: () => P_INVOICE_COLUMNS,
        actions: ['view', 'edit', 'export'],
      },
    },
  },
  ME: {
    key: 'ME',
    label: 'Missing/Extra',
    description: 'Missing and extra items tracking',
    tables: {
      projects: {
        key: 'projects',
        label: 'Projects',
        description: 'Missing/extra project items',
        getColumns: () => ME_PROJECTS_COLUMNS,
        actions: ['view', 'edit', 'export'],
      },
      accounting: {
        key: 'accounting',
        label: 'Accounting',
        description: 'Financial data for missing/extra',
        getColumns: () => ME_ACCOUNTING_COLUMNS,
        actions: ['view', 'edit', 'export'],
      },
      payments: {
        key: 'payments',
        label: 'Payments',
        description: 'Payment data for missing/extra',
        getColumns: () => ME_PAYMENTS_COLUMNS,
        actions: ['view', 'edit', 'export'],
      },
      invoice: {
        key: 'invoice',
        label: 'Invoice',
        description: 'Invoice data for missing/extra',
        getColumns: () => ME_INVOICE_COLUMNS,
        actions: ['view', 'edit', 'export'],
      },
    },
  },
  DO: {
    key: 'DO',
    label: 'Direct Orders',
    description: 'Direct order items and quantities',
    tables: {
      projects: {
        key: 'projects',
        label: 'Projects',
        description: 'Direct order project items',
        getColumns: () => DO_PROJECTS_COLUMNS,
        actions: ['view', 'edit', 'export'],
      },
      accounting: {
        key: 'accounting',
        label: 'Accounting',
        description: 'Financial data for direct orders',
        getColumns: () => DO_ACCOUNTING_COLUMNS,
        actions: ['view', 'edit', 'export'],
      },
      payments: {
        key: 'payments',
        label: 'Payments',
        description: 'Payment data for direct orders',
        getColumns: () => DO_PAYMENTS_COLUMNS,
        actions: ['view', 'edit', 'export'],
      },
      invoice: {
        key: 'invoice',
        label: 'Invoice',
        description: 'Invoice data for direct orders',
        getColumns: () => DO_INVOICE_COLUMNS,
        actions: ['view', 'edit', 'export'],
      },
    },
  },
};

// Helper functions
export const getMainTabs = () => Object.values(SUPPLIER_REGISTRY);
export const getTabTables = (tabKey: string) => SUPPLIER_REGISTRY[tabKey]?.tables ? Object.values(SUPPLIER_REGISTRY[tabKey].tables) : [];
export const getTableColumns = (tabKey: string, tableKey: string) => SUPPLIER_REGISTRY[tabKey]?.tables[tableKey]?.getColumns() || [];
export const getSupplierTableKey = (tabKey: string, tableKey: string) => `supplier:${tabKey}:${tableKey}`;

// Export column definitions for external use
export type { ColumnDef, TableDef, MainTabDef };