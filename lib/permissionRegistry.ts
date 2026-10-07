/**
 * DYNAMIC PERMISSION REGISTRY
 * Tüm supplier table permissions için tek kaynak
 * Kolonlar otomatik gelir, hardcode değil
 */

import {
  PROJECTS_COLUMNS,
  SUPPLIER_P_COLUMNS,
} from './permissionKeys';

// ================== TABLE REGISTRY ==================

export interface TableDefinition {
  key: string;
  label: string;
  description: string;
  getColumns: () => ColumnDefinition[];
  supportedActions: ActionType[];
  category: 'supplier' | 'projects' | 'accounting' | 'other';
}

export interface ColumnDefinition {
  key: string;
  label: string;
  group: string;
  defaultVisible: boolean;
  defaultEditable: boolean;
}

export type ActionType = 'view' | 'edit' | 'export' | 'create' | 'delete' | 'approve';

// ================== SUPPLIER SPECIFIC TABLES ==================

// 🔥 KRİTİK: Supplier sayfasındaki 4 ana tablo
export const SUPPLIER_TABLE_REGISTRY: Record<string, TableDefinition> = {
  'supplier-projects': {
    key: 'supplier-projects',
    label: 'Projects (P Sheet)',
    description: 'Main projects data for this vendor',
    getColumns: () => SUPPLIER_P_COLUMNS,
    supportedActions: ['view', 'edit', 'export'], // NO CREATE
    category: 'supplier'
  },

  'supplier-accounting': {
    key: 'supplier-accounting',
    label: 'Accounting',
    description: 'Financial accounting data (paid amounts, remaining, etc.)',
    getColumns: () => [
      { key: 'paidUsd1', label: 'Paid USD 1', group: 'money', defaultVisible: true, defaultEditable: true },
      { key: 'paidUsd2', label: 'Paid USD 2', group: 'money', defaultVisible: true, defaultEditable: true },
      { key: 'paidTl1', label: 'Paid TL 1', group: 'money', defaultVisible: true, defaultEditable: true },
      { key: 'paidTl2', label: 'Paid TL 2', group: 'money', defaultVisible: true, defaultEditable: true },
      { key: 'remainingUsd', label: 'Remaining USD', group: 'money', defaultVisible: true, defaultEditable: false },
      { key: 'remainingTl', label: 'Remaining TL', group: 'money', defaultVisible: true, defaultEditable: false },
      { key: 'notOrderedUsd', label: 'Not Ordered USD', group: 'money', defaultVisible: true, defaultEditable: false },
      { key: 'notOrderedTl', label: 'Not Ordered TL', group: 'money', defaultVisible: true, defaultEditable: false },
    ],
    supportedActions: ['view', 'edit', 'export'],
    category: 'supplier'
  },

  'supplier-payments': {
    key: 'supplier-payments',
    label: 'Payments (Yellow)',
    description: 'Payment tracking and due payment information',
    getColumns: () => [
      { key: 'dueUsd', label: 'Due Payment USD', group: 'money', defaultVisible: true, defaultEditable: false },
      { key: 'dueTl', label: 'Due Payment TL', group: 'money', defaultVisible: true, defaultEditable: false },
      { key: 'payUsd1', label: 'Payment 1 USD', group: 'money', defaultVisible: true, defaultEditable: true },
      { key: 'payTl1', label: 'Payment 1 TL', group: 'money', defaultVisible: true, defaultEditable: true },
      { key: 'payUsd2', label: 'Payment 2 USD', group: 'money', defaultVisible: true, defaultEditable: true },
      { key: 'payTl2', label: 'Payment 2 TL', group: 'money', defaultVisible: true, defaultEditable: true },
    ],
    supportedActions: ['view', 'edit', 'export'],
    category: 'supplier'
  },

  'supplier-invoice': {
    key: 'supplier-invoice',
    label: 'Invoice (Green)',
    description: 'Invoice and receipt tracking information',
    getColumns: () => [
      { key: 'transactionNo', label: 'Transaction No', group: 'invoice', defaultVisible: true, defaultEditable: true },
      { key: 'invoiceNumber', label: 'Invoice Number', group: 'invoice', defaultVisible: true, defaultEditable: true },
      { key: 'quickBook', label: 'Quick Book', group: 'invoice', defaultVisible: true, defaultEditable: true },
    ],
    supportedActions: ['view', 'edit', 'export'],
    category: 'supplier'
  },

  // Legacy Projects (DOKUNMA!)
  'operational-board-grid': {
    key: 'operational-board-grid',
    label: 'Projects Grid',
    description: 'Main operational board projects grid',
    getColumns: () => PROJECTS_COLUMNS,
    supportedActions: ['view', 'edit', 'export', 'create', 'delete', 'approve'],
    category: 'projects'
  }
};

// ================== HELPER FUNCTIONS ==================

/**
 * Get table definition by key
 */
export const getTableDefinition = (tableKey: string): TableDefinition | undefined => {
  return SUPPLIER_TABLE_REGISTRY[tableKey];
};

/**
 * Get all supplier table keys (excluding Projects)
 */
export const getSupplierTableKeys = (): string[] => {
  return Object.keys(SUPPLIER_TABLE_REGISTRY).filter(key =>
    SUPPLIER_TABLE_REGISTRY[key].category === 'supplier'
  );
};

/**
 * Get columns for a specific table
 */
export const getColumnsForTable = (tableKey: string): ColumnDefinition[] => {
  const table = getTableDefinition(tableKey);
  return table ? table.getColumns() : [];
};

/**
 * Get supported actions for a table
 */
export const getSupportedActions = (tableKey: string): ActionType[] => {
  const table = getTableDefinition(tableKey);
  return table ? table.supportedActions : [];
};

/**
 * Check if table supports an action
 */
export const tableSupportsAction = (tableKey: string, action: ActionType): boolean => {
  const supportedActions = getSupportedActions(tableKey);
  return supportedActions.includes(action);
};

/**
 * Get all tables by category
 */
export const getTablesByCategory = (category: 'supplier' | 'projects' | 'accounting' | 'other') => {
  return Object.values(SUPPLIER_TABLE_REGISTRY).filter(table => table.category === category);
};

/**
 * Validate table key exists
 */
export const isValidTableKey = (tableKey: string): boolean => {
  return tableKey in SUPPLIER_TABLE_REGISTRY;
};

// ================== BACKEND COMPATIBILITY ==================

/**
 * Export table registry for backend endpoint
 * GET /admin/permissions/registry/tables
 */
export const getTableRegistryForAPI = () => {
  const registry: Record<string, { label: string, columns: string[], actions: string[] }> = {};

  Object.values(SUPPLIER_TABLE_REGISTRY).forEach(table => {
    registry[table.key] = {
      label: table.label,
      columns: table.getColumns().map(col => col.key),
      actions: table.supportedActions
    };
  });

  return registry;
};