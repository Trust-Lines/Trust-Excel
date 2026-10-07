/**
 * Display Helper Functions
 *
 * Utilities for formatting and displaying data consistently across the application.
 */

/**
 * Remove "P" prefix from project numbers for UI display
 *
 * @param projectNo - Project number (can be string or number)
 * @returns Project number without "P" prefix for display
 *
 * Examples:
 *   "P601" -> "601"
 *   "P0007" -> "0007" (preserves leading zeros)
 *   "601" -> "601" (no change if no P prefix)
 *   "PX12" -> "PX12" (no change if P is not followed by digits)
 */
export const displayProjectNo = (projectNo: string | number): string => {
  const str = String(projectNo || '');

  // Check if it starts with "P" followed by digits only
  if (str.match(/^P\d+$/)) {
    return str.substring(1); // Remove the "P" prefix
  }

  // Return as-is if it doesn't match the pattern
  return str;
};

/**
 * Detect the "_OLD_<timestamp>" suffix that the team uses to mark a project
 * that was kept around when the same project number was re-created from the UI.
 *
 *   "1185"                       -> { kind: 'active', cleanCode: '1185' }
 *   "1185_OLD_1778145894409"     -> { kind: 'old',    cleanCode: '1185', timestamp: 1778145894409 }
 *
 * The badge in the operational table renders off this. We never mutate data
 * here — purely a display-time classification.
 */
export interface DuplicateMarker {
  kind: 'old' | 'active';
  cleanCode: string;
  timestamp?: number;
}

const OLD_SUFFIX_RE = /^(.*)_OLD_(\d+)$/;

export const parseDuplicateMarker = (projectNo: string | number): DuplicateMarker => {
  const str = String(projectNo || '');
  const match = str.match(OLD_SUFFIX_RE);
  if (match) {
    return { kind: 'old', cleanCode: match[1], timestamp: Number(match[2]) };
  }
  return { kind: 'active', cleanCode: str };
};