import { SetMetadata } from '@nestjs/common';

export const PAGE_ACCESS_KEY = 'page_access';
export const TABLE_ACCESS_KEY = 'table_access';
export const FIELD_AUTHORIZED_KEY = 'field_authorized';

/**
 * Page Access Decorator
 * Use this to protect routes at the page level
 *
 * @param pageIds - Array of page keys that the user must have access to
 *
 * @example
 * @PageAccess(['dashboard', 'project-tracking.projects'])
 * async getProjects() { ... }
 */
export const PageAccess = (...pageIds: string[]) => SetMetadata(PAGE_ACCESS_KEY, pageIds);

/**
 * Table Access Decorator
 * Use this to protect routes at the table/resource level
 *
 * @param tableId - Table key that the user must have access to
 * @param action - Action that the user must be able to perform
 *
 * @example
 * @TableAccess('operational-board-grid', 'view')
 * async getOperationalBoardData() { ... }
 *
 * @example
 * @TableAccess('operational-board-grid', 'edit')
 * async updateProjectItem() { ... }
 */
export const TableAccess = (tableId: string, action: string) =>
  SetMetadata(TABLE_ACCESS_KEY, { tableId, action });

/**
 * Field Authorized Decorator
 * Use this to mark methods that perform field-level authorization
 * This decorator indicates that the method will check field permissions internally
 *
 * @param tableId - Optional table key for context
 *
 * @example
 * @FieldAuthorized('operational-board-grid')
 * async updateProjectItemFields() {
 *   // Method should call AccessControlService.updateItemWithFieldAuthorization
 * }
 */
export const FieldAuthorized = (tableId?: string) =>
  SetMetadata(FIELD_AUTHORIZED_KEY, { tableId });

// Convenience decorators for common combinations
/**
 * Project Access - Convenience decorator for project-related operations
 */
export const ProjectAccess = (action: 'view' | 'create' | 'edit' | 'delete' = 'view') =>
  TableAccess('operational-board-grid', action);

/**
 * Supplier Access - Convenience decorator for supplier-related operations
 */
export const SupplierAccess = (action: 'view' | 'edit' = 'view') =>
  TableAccess('supplier-p-sheet', action);

/**
 * Admin Access - Convenience decorator for admin operations
 */
export const AdminAccess = (action: 'view' | 'create' | 'edit' | 'delete' = 'view') =>
  PageAccess('admin');