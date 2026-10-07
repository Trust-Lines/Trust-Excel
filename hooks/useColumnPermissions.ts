import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  OPERATIONAL_BOARD_COLUMNS,
  ColumnKey,
  getMoneyColumns,
  getAllColumnKeys
} from '../lib/columns';

interface ColumnPermissions {
  isColumnVisible: (columnKey: ColumnKey) => boolean;
  isColumnHidden: (columnKey: ColumnKey) => boolean;
  isColumnReadOnly: (columnKey: ColumnKey) => boolean;
  isColumnEditable: (columnKey: ColumnKey) => boolean;
  getVisibleColumns: () => ColumnKey[];
  getHiddenColumns: () => ColumnKey[];
  getReadOnlyColumns: () => ColumnKey[];
  getEditableColumns: () => ColumnKey[];
  hasPermission: (columnKey: ColumnKey, action: 'view' | 'edit') => boolean;
  // Money column specific functionality
  isAnyMoneyColumnHidden: () => boolean;
  areAllMoneyColumnsHidden: () => boolean;
  shouldShowMoneyTotals: () => boolean;
  getVisibleMoneyColumns: () => ColumnKey[];
}


export const useColumnPermissions = (): ColumnPermissions => {
  const { userAccessPolicy } = useAuth();

  // Use userAccessPolicy from auth context (role-based + user-specific merged)

  const permissions = useMemo((): ColumnPermissions => {
    // Get all available column keys from canonical registry
    const allColumnKeys = getAllColumnKeys();

    // Extract user-specific permission arrays
    const userHiddenColumns = userAccessPolicy?.columnsHidden || [];
    const userReadOnlyColumns = userAccessPolicy?.columnsReadOnly || [];

    // Helper function to check if column is hidden
    const isColumnHidden = (columnKey: ColumnKey): boolean => {
      return userHiddenColumns.includes(columnKey);
    };

    // Helper function to check if column is visible
    const isColumnVisible = (columnKey: ColumnKey): boolean => {
      return !isColumnHidden(columnKey);
    };

    // Helper function to check if column is read-only
    const isColumnReadOnly = (columnKey: ColumnKey): boolean => {
      // If column is hidden, it's neither read-only nor editable in the traditional sense
      if (isColumnHidden(columnKey)) {
        return false;
      }
      return userReadOnlyColumns.includes(columnKey);
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

    // Money column specific functionality
    const moneyColumns = getMoneyColumns();

    const isAnyMoneyColumnHidden = (): boolean => {
      return moneyColumns.some(col => isColumnHidden(col.key as ColumnKey));
    };

    const areAllMoneyColumnsHidden = (): boolean => {
      return moneyColumns.every(col => isColumnHidden(col.key as ColumnKey));
    };

    const shouldShowMoneyTotals = (): boolean => {
      // If ALL money columns are hidden, hide entire money total cluster
      // If ANY money column is visible, show totals (but only for visible columns)
      return !areAllMoneyColumnsHidden();
    };

    const getVisibleMoneyColumns = (): ColumnKey[] => {
      return moneyColumns
        .map(col => col.key as ColumnKey)
        .filter(isColumnVisible);
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
      isAnyMoneyColumnHidden,
      areAllMoneyColumnsHidden,
      shouldShowMoneyTotals,
      getVisibleMoneyColumns,
    };
  }, [userAccessPolicy]);

  return permissions;
};

// Additional utility functions for debugging and development
export const useColumnPermissionsDebug = () => {
  const { user } = useAuth();
  const permissions = useColumnPermissions();

  return {
    ...permissions,
    debug: {
      user,
      userAccessPolicy: (user as any)?.userAccessPolicy,
      allColumns: Object.keys(OPERATIONAL_BOARD_COLUMNS),
      visibleColumns: permissions.getVisibleColumns(),
      hiddenColumns: permissions.getHiddenColumns(),
      readOnlyColumns: permissions.getReadOnlyColumns(),
      editableColumns: permissions.getEditableColumns(),
    },
  };
};

// Hook for specific column permission checking (for performance in components)
export const useColumnPermission = (columnKey: ColumnKey) => {
  const permissions = useColumnPermissions();

  return useMemo(() => ({
    isVisible: permissions.isColumnVisible(columnKey),
    isHidden: permissions.isColumnHidden(columnKey),
    isReadOnly: permissions.isColumnReadOnly(columnKey),
    isEditable: permissions.isColumnEditable(columnKey),
    canView: permissions.hasPermission(columnKey, 'view'),
    canEdit: permissions.hasPermission(columnKey, 'edit'),
  }), [permissions, columnKey]);
};

export default useColumnPermissions;