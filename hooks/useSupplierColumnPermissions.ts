import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  TABLE_KEYS,
  getColumnsByTableKey,
  TableKey
} from '../lib/permissionKeys';

type ColumnKey = string;

interface SupplierColumnPermissions {
  isColumnVisible: (columnKey: ColumnKey) => boolean;
  isColumnHidden: (columnKey: ColumnKey) => boolean;
  isColumnReadOnly: (columnKey: ColumnKey) => boolean;
  isColumnEditable: (columnKey: ColumnKey) => boolean;
  getVisibleColumns: () => ColumnKey[];
  getHiddenColumns: () => ColumnKey[];
  getReadOnlyColumns: () => ColumnKey[];
  getEditableColumns: () => ColumnKey[];
  hasPermission: (columnKey: ColumnKey, action: 'view' | 'edit') => boolean;
  // Table-specific functionality
  canAccessTable: (tableKey: TableKey) => boolean;
  getTablePolicy: (tableKey: TableKey) => { columnsHidden: string[], columnsReadOnly: string[] };
}

/**
 * Hook for supplier table column permissions
 * Mevcut useColumnPermissions pattern'ini kullanarak supplier tables için
 */
export const useSupplierColumnPermissions = (tableKey: TableKey): SupplierColumnPermissions => {
  const { userAccessPolicy } = useAuth();

  const permissions = useMemo((): SupplierColumnPermissions => {
    // Get columns for specific supplier table
    const tableColumns = getColumnsByTableKey(tableKey);
    const allColumnKeys = tableColumns.map(col => col.key);

    // ✅ FIX: Use same data structure as Projects (global columnsHidden/columnsReadOnly)
    const tableHiddenColumns = userAccessPolicy?.columnsHidden || [];
    const tableReadOnlyColumns = userAccessPolicy?.columnsReadOnly || [];


    // Helper function to check if column is hidden
    const isColumnHidden = (columnKey: ColumnKey): boolean => {
      return tableHiddenColumns.includes(columnKey);
    };

    // Helper function to check if column is visible
    const isColumnVisible = (columnKey: ColumnKey): boolean => {
      return !isColumnHidden(columnKey);
    };

    // Helper function to check if column is read-only
    const isColumnReadOnly = (columnKey: ColumnKey): boolean => {
      // If column is hidden, it's neither read-only nor editable
      if (isColumnHidden(columnKey)) {
        return false;
      }
      return tableReadOnlyColumns.includes(columnKey);
    };

    // Helper function to check if column is editable
    const isColumnEditable = (columnKey: ColumnKey): boolean => {
      // Column is editable if it's visible and not read-only
      return isColumnVisible(columnKey) && !isColumnReadOnly(columnKey);
    };

    // Helper function to get visible columns
    const getVisibleColumns = (): ColumnKey[] => {
      return allColumnKeys.filter(isColumnVisible);
    };

    // Helper function to get hidden columns
    const getHiddenColumns = (): ColumnKey[] => {
      return allColumnKeys.filter(isColumnHidden);
    };

    // Helper function to get read-only columns
    const getReadOnlyColumns = (): ColumnKey[] => {
      return allColumnKeys.filter(isColumnReadOnly);
    };

    // Helper function to get editable columns
    const getEditableColumns = (): ColumnKey[] => {
      return allColumnKeys.filter(isColumnEditable);
    };

    // Generic permission checker
    const hasPermission = (columnKey: ColumnKey, action: 'view' | 'edit'): boolean => {
      if (action === 'view') {
        return isColumnVisible(columnKey);
      } else if (action === 'edit') {
        return isColumnEditable(columnKey);
      }
      return false;
    };

    // Table access checker
    const canAccessTable = (_checkTableKey: TableKey): boolean => {
      // For now, assume all tables are accessible if user can access supplier page
      // This can be extended with table-level permissions later
      return true;
    };

    // Get table policy (use global policy for all tables)
    const getTablePolicy = (_checkTableKey: TableKey) => {
      return {
        columnsHidden: userAccessPolicy?.columnsHidden || [],
        columnsReadOnly: userAccessPolicy?.columnsReadOnly || []
      };
    };

    return {
      isColumnVisible,
      isColumnHidden,
      isColumnReadOnly,
      isColumnEditable,
      getVisibleColumns,
      getHiddenColumns,
      getReadOnlyColumns,
      getEditableColumns,
      hasPermission,
      canAccessTable,
      getTablePolicy,
    };
  }, [userAccessPolicy, tableKey]);

  return permissions;
};

/**
 * Helper hook to get all supplier table permissions at once
 */
export const useAllSupplierPermissions = () => {
  const { userAccessPolicy } = useAuth();

  return useMemo(() => {
    const tablePermissions = (userAccessPolicy as any)?.tablePermissions || {};

    return {
      pSheet: tablePermissions[TABLE_KEYS.SUPPLIER_P_SHEET] || { columnsHidden: [], columnsReadOnly: [] },
      meSheet: tablePermissions[TABLE_KEYS.SUPPLIER_ME_SHEET] || { columnsHidden: [], columnsReadOnly: [] },
      doSheet: tablePermissions[TABLE_KEYS.SUPPLIER_DO_SHEET] || { columnsHidden: [], columnsReadOnly: [] },
    };
  }, [userAccessPolicy]);
};