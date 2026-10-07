import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Define table keys for supplier sections
export const SUPPLIER_TABLE_KEYS = {
  SUPPLIER_PROJECTS: 'supplier-projects',
  SUPPLIER_MISSING_EXTRA: 'supplier-missing-extra',
  SUPPLIER_ACCOUNTING: 'supplier-accounting',
  SUPPLIER_DIRECT_ORDERS: 'supplier-direct-orders',
} as const;

// Define page keys - must match RoleBasedRoute pageKey values
export const PAGE_KEYS = {
  PROJECTS: 'projects',
  SUPPLIERS: 'suppliers',
  TRUST_EXPENSES: 'trust_expenses',
  EXPENSES_P: 'expenses_p',
  EXPENSES_DIRECT_ORDER: 'expenses_direct_order',
  EXPENSES_MISSING_EXTRA: 'expenses_missing_extra',
  ADMIN: 'admin',
} as const;

type TableKey = typeof SUPPLIER_TABLE_KEYS[keyof typeof SUPPLIER_TABLE_KEYS];
type PageKey = typeof PAGE_KEYS[keyof typeof PAGE_KEYS];

interface TablePermissions {
  [key: string]: boolean;
}

interface PagePermissions {
  [key: string]: boolean;
}

/**
 * Hook for checking table-level and page-level permissions
 * Integrates with the comprehensive permission system
 */
export const useTablePermissions = () => {
  const { user, role, getPagePermissions } = useAuth();
  const [tablePermissions, setTablePermissions] = useState<TablePermissions>({});
  const [pagePermissions, setPagePermissions] = useState<PagePermissions>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, [user?.id, role?.id]);

  const loadPermissions = async () => {
    if (!role?.id) {
      setLoading(false);
      return;
    }

    try {
      // For now, implement basic role-based permissions
      // This will be enhanced with the comprehensive API later

      // ✅ PURE DATABASE-DRIVEN: Use getPagePermissions from AuthContext (database-only)
      const databasePagePermissions = getPagePermissions();


      // ✅ PURE DATABASE-DRIVEN: Use database page permissions
      // For table permissions, check if user has page access first
      const hasSupplierAccess = databasePagePermissions[PAGE_KEYS.SUPPLIERS] || false;

      const databaseTablePerms: TablePermissions = {
        [SUPPLIER_TABLE_KEYS.SUPPLIER_PROJECTS]: hasSupplierAccess,
        [SUPPLIER_TABLE_KEYS.SUPPLIER_MISSING_EXTRA]: hasSupplierAccess,
        [SUPPLIER_TABLE_KEYS.SUPPLIER_ACCOUNTING]: hasSupplierAccess,
        [SUPPLIER_TABLE_KEYS.SUPPLIER_DIRECT_ORDERS]: hasSupplierAccess,
      };


      setPagePermissions(databasePagePermissions);
      setTablePermissions(databaseTablePerms);

    } catch (error) {
      console.error('Failed to load permissions:', error);
      // Set minimal permissions on error
      setPagePermissions({});
      setTablePermissions({});
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user has access to a specific table
   */
  const hasTableAccess = (tableKey: TableKey): boolean => {
    return tablePermissions[tableKey] ?? false;
  };

  /**
   * Check if user has access to a specific page
   */
  const hasPageAccess = (pageKey: PageKey): boolean => {
    return pagePermissions[pageKey] ?? false;
  };

  /**
   * Get filtered list of accessible supplier tabs
   */
  const getAccessibleSupplierTabs = () => {
    const tabs = [];

    if (hasTableAccess(SUPPLIER_TABLE_KEYS.SUPPLIER_PROJECTS)) {
      tabs.push({ key: 'p', label: 'Projects', tableKey: SUPPLIER_TABLE_KEYS.SUPPLIER_PROJECTS });
    }

    if (hasTableAccess(SUPPLIER_TABLE_KEYS.SUPPLIER_MISSING_EXTRA)) {
      tabs.push({ key: 'me', label: 'Missing/Extra', tableKey: SUPPLIER_TABLE_KEYS.SUPPLIER_MISSING_EXTRA });
    }

    if (hasTableAccess(SUPPLIER_TABLE_KEYS.SUPPLIER_DIRECT_ORDERS)) {
      tabs.push({ key: 'do', label: 'Direct Orders', tableKey: SUPPLIER_TABLE_KEYS.SUPPLIER_DIRECT_ORDERS });
    }

    return tabs;
  };

  /**
   * Check if current user can access supplier accounting data
   */
  const canAccessAccounting = (): boolean => {
    return hasTableAccess(SUPPLIER_TABLE_KEYS.SUPPLIER_ACCOUNTING);
  };

  return {
    tablePermissions,
    pagePermissions,
    loading,
    hasTableAccess,
    hasPageAccess,
    getAccessibleSupplierTabs,
    canAccessAccounting,
    refresh: loadPermissions,
  };
};