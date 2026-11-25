/**
 * Opt-in Projects columns.
 *
 * Normal Projects columns are visible unless a role has a "hidden" record
 * (deny-list). Opt-in columns work the other way round: they stay HIDDEN for
 * every role until an admin explicitly grants them in Admin → Roles → Projects
 * Columns. A grant is stored as a RoleColumnVisibility row with isHidden=false
 * (isReadOnly=true → view only, isReadOnly=false → view + edit).
 *
 * System roles cannot be edited from the admin screen, so they get the column
 * by default.
 */
export const OPT_IN_PROJECT_COLUMNS = ['poUsd'];

type VisibilityRow = { columnKey: string; isHidden: boolean; isReadOnly?: boolean };

/** Adds every opt-in column the role was not explicitly granted to `columnsHidden` (mutates and returns it). */
export function applyOptInColumns(
  roleColumnVisibility: VisibilityRow[],
  columnsHidden: string[],
  isSystemRole = false,
): string[] {
  if (isSystemRole) return columnsHidden;
  for (const key of OPT_IN_PROJECT_COLUMNS) {
    const granted = roleColumnVisibility.some((cv) => cv.columnKey === key && !cv.isHidden);
    if (!granted && !columnsHidden.includes(key)) columnsHidden.push(key);
  }
  return columnsHidden;
}
