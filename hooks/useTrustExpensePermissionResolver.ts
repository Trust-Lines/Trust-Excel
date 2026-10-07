import { useMemo } from 'react';

type TableName = 'projects' | 'accounting' | 'payments' | 'invoice';
type ColumnRule = 'hidden' | 'readonly' | 'editable';

export interface TrustExpensePermissionsData {
  tableActionsByKey: Record<string, { view: boolean; edit: boolean; export: boolean }>;
  columnRulesByKey: Record<string, Record<string, ColumnRule>>;
}

interface TrustExpensePermissionResolver {
  canViewTable: (table: TableName) => boolean;
  canEditTable: (table: TableName) => boolean;
  getColumnRule: (table: TableName, columnKey: string) => ColumnRule;
  isColumnVisible: (table: TableName, columnKey: string) => boolean;
  isColumnEditable: (table: TableName, columnKey: string) => boolean;
  isColumnReadOnly: (table: TableName, columnKey: string) => boolean;
  getTableKey: (table: TableName) => string;
}

/**
 * Trust Expense Permission Resolver
 *
 * Mirrors useSupplierPermissionResolver but with trustExpense: prefix.
 * Key format: trustExpense:{projects|accounting|payments|invoice}
 *
 * Defaults (when no rule is saved):
 *   - table view  = true
 *   - table edit  = true
 *   - column rule = 'editable'
 */
export const useTrustExpensePermissionResolver = (
  permissionsData: TrustExpensePermissionsData | null,
): TrustExpensePermissionResolver => {
  return useMemo(() => {
    const getTableKey = (table: TableName): string =>
      `trustExpense:${table}`;

    const canViewTable = (table: TableName): boolean => {
      const tableKey = getTableKey(table);
      const tableActions = permissionsData?.tableActionsByKey?.[tableKey];
      return tableActions?.view !== false;
    };

    const canEditTable = (table: TableName): boolean => {
      if (!canViewTable(table)) return false;
      const tableKey = getTableKey(table);
      const tableActions = permissionsData?.tableActionsByKey?.[tableKey];
      return tableActions?.edit !== false;
    };

    const getColumnRule = (table: TableName, columnKey: string): ColumnRule => {
      const tableKey = getTableKey(table);
      const columnRules = permissionsData?.columnRulesByKey?.[tableKey];
      return columnRules?.[columnKey] || 'editable';
    };

    const isColumnVisible = (table: TableName, columnKey: string): boolean =>
      getColumnRule(table, columnKey) !== 'hidden';

    const isColumnEditable = (table: TableName, columnKey: string): boolean => {
      const tableEditEnabled = canEditTable(table);
      const columnRule = getColumnRule(table, columnKey);
      return tableEditEnabled && columnRule === 'editable';
    };

    const isColumnReadOnly = (table: TableName, columnKey: string): boolean => {
      if (!isColumnVisible(table, columnKey)) return false;
      const tableEditEnabled = canEditTable(table);
      const columnRule = getColumnRule(table, columnKey);
      return !tableEditEnabled || columnRule === 'readonly';
    };

    return {
      canViewTable,
      canEditTable,
      getColumnRule,
      isColumnVisible,
      isColumnEditable,
      isColumnReadOnly,
      getTableKey,
    };
  }, [permissionsData]);
};
