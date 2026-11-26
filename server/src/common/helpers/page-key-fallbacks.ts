/**
 * Pages that used to share the `operational_board` permission and now have their own key.
 *
 * Until an admin sets one of these explicitly for a role (which creates a RolePageAccess
 * row), the page inherits the role's `operational_board` value, so existing roles keep
 * exactly the access they had before the split. Once set, the explicit value wins.
 */
export const PAGES_SPLIT_FROM_OPERATIONAL_BOARD = ['reports', 'price_list', 'pending_approvals'];

/** Fills missing split page keys from `operational_board` (mutates and returns `permissions`). */
export function applySplitPageFallbacks(permissions: Record<string, boolean>): Record<string, boolean> {
  for (const key of PAGES_SPLIT_FROM_OPERATIONAL_BOARD) {
    if (!Object.prototype.hasOwnProperty.call(permissions, key)) {
      permissions[key] = !!permissions.operational_board;
    }
  }
  return permissions;
}
