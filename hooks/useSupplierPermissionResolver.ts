import { useMemo } from 'react';

type MainTab = 'P' | 'ME' | 'DO';
type TableName = 'projects' | 'accounting' | 'payments' | 'invoice';
type ColumnRule = 'hidden' | 'readonly' | 'editable';

export interface SupplierPermissionsData {
  tableActionsByKey: Record<string, { view: boolean; edit: boolean; export: boolean }>;
  columnRulesByKey: Record<string, Record<string, ColumnRule>>;
}

interface SupplierPermissionResolver {
  canViewTable: (mainTab: MainTab, table: TableName) => boolean;
  canEditTable: (mainTab: MainTab, table: TableName) => boolean;
  getColumnRule: (mainTab: MainTab, table: TableName, columnKey: string) => ColumnRule;
  isColumnVisible: (mainTab: MainTab, table: TableName, columnKey: string) => boolean;
  isColumnEditable: (mainTab: MainTab, table: TableName, columnKey: string) => boolean;
  isColumnReadOnly: (mainTab: MainTab, table: TableName, columnKey: string) => boolean;
  getSupplierTableKey: (mainTab: MainTab, table: TableName) => string;
}

// Set to true temporarily when debugging permission issues
const DEBUG_PERMISSIONS = false;

/**
 * Supplier Permission Resolver
 *
 * Reads permissions from the database via the API payload.
 * No hardcoded bypasses. ADMIN obeys saved permissions like every other role.
 *
 * Key format: supplier:{P|ME|DO}:{projects|accounting|payments|invoice}
 *
 * Defaults (when no rule is saved for a key):
 *   - table view  = true
 *   - table edit  = true
 *   - column rule = 'editable'
 */
export const useSupplierPermissionResolver = (
  permissionsData: SupplierPermissionsData | null,
): SupplierPermissionResolver => {
  return useMemo(() => {
    const getSupplierTableKey = (mainTab: MainTab, table: TableName): string =>
      `supplier:${mainTab}:${table}`;

    const canViewTable = (mainTab: MainTab, table: TableName): boolean => {
      const tableKey = getSupplierTableKey(mainTab, table);
      const tableActions = permissionsData?.tableActionsByKey?.[tableKey];
      // Default: view=true when no explicit rule exists
      const result = tableActions?.view !== false;
      if (DEBUG_PERMISSIONS) {
      }
      return result;
    };

    const canEditTable = (mainTab: MainTab, table: TableName): boolean => {
      if (!canViewTable(mainTab, table)) return false;
      const tableKey = getSupplierTableKey(mainTab, table);
      const tableActions = permissionsData?.tableActionsByKey?.[tableKey];
      // Default: edit=true when no explicit rule exists
      return tableActions?.edit !== false;
    };

    const getColumnRule = (mainTab: MainTab, table: TableName, columnKey: string): ColumnRule => {
      const tableKey = getSupplierTableKey(mainTab, table);
      const columnRules = permissionsData?.columnRulesByKey?.[tableKey];
      return columnRules?.[columnKey] || 'editable';
    };

    const isColumnVisible = (mainTab: MainTab, table: TableName, columnKey: string): boolean =>
      getColumnRule(mainTab, table, columnKey) !== 'hidden';

    // AND rule: table edit=false → all columns read-only (except hidden stays hidden)
    const isColumnEditable = (mainTab: MainTab, table: TableName, columnKey: string): boolean => {
      const tableEditEnabled = canEditTable(mainTab, table);
      const columnRule = getColumnRule(mainTab, table, columnKey);
      return tableEditEnabled && columnRule === 'editable';
    };

    const isColumnReadOnly = (mainTab: MainTab, table: TableName, columnKey: string): boolean => {
      if (!isColumnVisible(mainTab, table, columnKey)) return false;
      const tableEditEnabled = canEditTable(mainTab, table);
      const columnRule = getColumnRule(mainTab, table, columnKey);
      return !tableEditEnabled || columnRule === 'readonly';
    };

    return {
      canViewTable,
      canEditTable,
      getColumnRule,
      isColumnVisible,
      isColumnEditable,
      isColumnReadOnly,
      getSupplierTableKey,
    };
  }, [permissionsData]);
};
