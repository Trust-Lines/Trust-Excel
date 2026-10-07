import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Types for the enterprise permission system
export interface PageAccessPermissions {
  [pageKey: string]: boolean;
}

export interface TableAccessPermissions {
  [tableKey: string]: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
    canApprove: boolean;
    canSign: boolean;
    allowedActions: string[];
  };
}

export interface TableColumnPermissions {
  visible: string[];
  hidden: string[];
  readOnly: string[];
  editable: string[];
  requiresApproval: string[];
}

export interface EnterprisePermissions {
  pages: PageAccessPermissions;
  tables: TableAccessPermissions;
  columnsByTable: Record<string, TableColumnPermissions>;
  globalColumns: TableColumnPermissions;
}

/**
 * Enhanced Page Access Hook
 * Supports both legacy page permissions and new page registry system
 * FEATURE FLAG AWARE: Only activates for V2-enabled contexts
 */
export const usePageAccess = (pageKey?: string) => {
  const { userAccessPolicy } = useAuth();

  return useMemo(() => {
    // Legacy page permissions (existing system) - PRESERVE YSM BEHAVIOR
    const legacyPermissions = userAccessPolicy?.pagePermissions || {};

    // Extended page permissions (new system) - behind feature flag
    const extendedPagePermissions: PageAccessPermissions = {
      // Map legacy permissions to new page keys - PRESERVE EXISTING BEHAVIOR
      'dashboard': legacyPermissions.operationalBoardView ?? true,
      'project-tracking': legacyPermissions.operationalBoardView ?? true,
      'project-tracking.projects': legacyPermissions.operationalBoardView ?? true,
      'project-tracking.missing-extra': legacyPermissions.canAddItems ?? true,
      'project-tracking.direct-order': legacyPermissions.operationalBoardView ?? true,
      'supplier-tracking': legacyPermissions.canManageMasterData ?? false,
      'supplier-tracking.p-tab': legacyPermissions.canManageMasterData ?? false,
      'supplier-tracking.me-tab': legacyPermissions.canManageMasterData ?? false,
      'supplier-tracking.do-tab': legacyPermissions.canManageMasterData ?? false,
      'admin': legacyPermissions.canManageMasterData ?? false,
      'admin.roles': legacyPermissions.canManageMasterData ?? false,
      'admin.users': legacyPermissions.canManageMasterData ?? false,
      // Add any custom page permissions from userAccessPolicy
      ...(userAccessPolicy?.pagePermissions || {})
    };

    const hasPageAccess = (key: string): boolean => {
      return extendedPagePermissions[key] ?? false;
    };

    const checkPageAccess = (keys: string[]): boolean => {
      return keys.every(key => hasPageAccess(key));
    };

    const getAccessiblePages = (): string[] => {
      return Object.entries(extendedPagePermissions)
        .filter(([_, hasAccess]) => hasAccess)
        .map(([pageKey]) => pageKey);
    };

    return {
      hasPageAccess,
      checkPageAccess,
      getAccessiblePages,
      pagePermissions: extendedPagePermissions,
      // For backward compatibility - PRESERVE YSM BEHAVIOR
      canAccessOperationalBoard: hasPageAccess('project-tracking.projects'),
      canCreateProject: legacyPermissions.createProject ?? true,
      canAddItems: legacyPermissions.canAddItems ?? true,
      canManageMasterData: legacyPermissions.canManageMasterData ?? false,
      // Specific page access (if pageKey provided)
      hasAccess: pageKey ? hasPageAccess(pageKey) : true
    };
  }, [userAccessPolicy, pageKey]);
};

/**
 * Table Access Hook - FEATURE FLAG AWARE
 * Provides table-level permissions for CRUD operations
 * Only enforces V2 permissions for enabled tables (operational-board-grid by default)
 */
export const useTableAccess = (tableKey?: string) => {
  const { userAccessPolicy, role } = useAuth();

  return useMemo(() => {
    // Check if V2 permissions should be used for this table
    const v2EnabledTables = process.env.REACT_APP_PERMISSIONS_V2_ENABLED_TABLES?.split(',') || ['operational-board-grid'];
    const useV2ForTable = tableKey && v2EnabledTables.includes(tableKey);

    // DB-driven table permissions - no hardcoded role-name defaults
    const getDefaultTablePermissions = (_tableName: string) => {
      // Table permissions are controlled by DB via RoleTableAccess
      // If no DB permissions found, return empty (fail-closed)
      const pagePerms = userAccessPolicy?.pagePermissions || {};
      // Derive basic actions from page-level permissions as fallback
      const actions: string[] = [];
      if (Object.keys(pagePerms).length > 0) {
        actions.push('view');
        if (pagePerms.canAddItems) actions.push('create');
        if (pagePerms.operationalBoardView) actions.push('edit');
        if (pagePerms.canManageMasterData) {
          actions.push('delete', 'export', 'approve');
        }
      }
      return actions;
    };

    // Build table permissions
    const tablePermissions: TableAccessPermissions = {};

    const tableKeys = [
      'operational-board-grid',
      'operational-board-missing-extra-grid',
      'operational-board-direct-order-grid',
      'supplier-p-sheet',
      'supplier-me-sheet',
      'supplier-do-sheet',
      'payments-grid',
      'accounting-grid',
      'invoice-receipt-grid',
      'admin-roles-grid',
      'admin-users-grid',
      'project-block'
    ];

    for (const table of tableKeys) {
      const allowedActions = getDefaultTablePermissions(table);

      tablePermissions[table] = {
        canView: allowedActions.includes('view') || allowedActions.length > 0, // View implied by any action
        canCreate: allowedActions.includes('create'),
        canEdit: allowedActions.includes('edit'),
        canDelete: allowedActions.includes('delete'),
        canExport: allowedActions.includes('export'),
        canApprove: allowedActions.includes('approve'),
        canSign: allowedActions.includes('sign'),
        allowedActions
      };
    }

    const hasTableAccess = (table: string, action: string): boolean => {
      const tablePermission = tablePermissions[table];
      if (!tablePermission) return false;

      // Check action hierarchy - view is implied by other actions
      if (action === 'view') {
        return tablePermission.canView;
      }

      return tablePermission.allowedActions.includes(action);
    };

    const getTablePermissions = (table: string) => {
      return tablePermissions[table] || {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExport: false,
        canApprove: false,
        canSign: false,
        allowedActions: []
      };
    };

    const getAccessibleTables = (): string[] => {
      return Object.entries(tablePermissions)
        .filter(([_, permissions]) => permissions.canView)
        .map(([tableKey]) => tableKey);
    };

    return {
      hasTableAccess,
      getTablePermissions,
      getAccessibleTables,
      tablePermissions,
      // V2 context
      useV2ForTable,
      // Specific table access (if tableKey provided)
      tableAccess: tableKey ? getTablePermissions(tableKey) : undefined
    };
  }, [userAccessPolicy, role, tableKey]);
};

/**
 * Table Column Permissions Hook - FEATURE FLAG AWARE
 * Provides column-level permissions for specific tables
 * Only enforces V2 permissions for enabled tables
 */
export const useTableColumnPermissions = (tableKey?: string) => {
  const { userAccessPolicy } = useAuth();

  return useMemo(() => {
    // Check if V2 permissions should be used for this table
    const v2EnabledTables = process.env.REACT_APP_PERMISSIONS_V2_ENABLED_TABLES?.split(',') || ['operational-board-grid'];
    const useV2ForTable = tableKey && v2EnabledTables.includes(tableKey);

    // Get global column permissions (existing system) - PRESERVE YSM BEHAVIOR
    const globalHidden = userAccessPolicy?.columnsHidden || [];
    const globalReadOnly = userAccessPolicy?.columnsReadOnly || [];

    // Build global column permissions
    const globalColumns: TableColumnPermissions = {
      hidden: globalHidden,
      readOnly: globalReadOnly,
      visible: [], // Will be computed when needed
      editable: [], // Will be computed when needed
      requiresApproval: [] // TODO: Implement approval system
    };

    // Build table-specific column permissions - ONLY if V2 enabled for this table
    const columnsByTable: Record<string, TableColumnPermissions> = {};

    const getTableColumnPermissions = (table: string): TableColumnPermissions => {
      if (columnsByTable[table]) {
        return columnsByTable[table];
      }

      // Use global permissions as fallback - PRESERVE EXISTING BEHAVIOR
      return {
        hidden: globalHidden,
        readOnly: globalReadOnly,
        visible: [],
        editable: [],
        requiresApproval: []
      };
    };

    const isColumnVisible = (table: string, columnKey: string): boolean => {
      const tablePermissions = getTableColumnPermissions(table);
      return !tablePermissions.hidden.includes(columnKey);
    };

    const isColumnEditable = (table: string, columnKey: string): boolean => {
      const tablePermissions = getTableColumnPermissions(table);
      return isColumnVisible(table, columnKey) &&
             !tablePermissions.readOnly.includes(columnKey);
    };

    const isColumnReadOnly = (table: string, columnKey: string): boolean => {
      const tablePermissions = getTableColumnPermissions(table);
      return isColumnVisible(table, columnKey) &&
             tablePermissions.readOnly.includes(columnKey);
    };

    const requiresApproval = (table: string, columnKey: string): boolean => {
      const tablePermissions = getTableColumnPermissions(table);
      return tablePermissions.requiresApproval.includes(columnKey);
    };

    return {
      getTableColumnPermissions,
      isColumnVisible,
      isColumnEditable,
      isColumnReadOnly,
      requiresApproval,
      globalColumns,
      columnsByTable,
      // V2 context
      useV2ForTable,
      // Specific table column permissions (if tableKey provided)
      tableColumnPermissions: tableKey ? getTableColumnPermissions(tableKey) : undefined
    };
  }, [userAccessPolicy, tableKey]);
};