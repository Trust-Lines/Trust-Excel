/**
 * Enterprise Permission Hooks
 * Comprehensive permission system for React frontend
 */

// Core enterprise permission hooks
export {
  usePageAccess,
  useTableAccess,
  useTableColumnPermissions,
  type PageAccessPermissions,
  type TableAccessPermissions,
  type TableColumnPermissions,
  type EnterprisePermissions
} from '../useEnterprisePermissions';

// Convenience re-exports of existing hooks (for backward compatibility)
export { useColumnPermissions as useLegacyColumnPermissions } from '../useColumnPermissions';
export { usePagePermissions as useLegacyPagePermissions } from '../usePagePermissions';

/**
 * Hook Selection Guide:
 *
 * 1. usePageAccess(pageKey) - Check page-level access
 * 2. useTableAccess(tableKey) - Check table-level CRUD permissions
 * 3. useTableColumnPermissions(tableKey) - Column permissions with table context
 *
 * Legacy compatibility:
 * - useLegacyColumnPermissions() - Original column permissions hook
 * - useLegacyPagePermissions() - Original page permissions hook
 */
