/**
 * Utility functions for normalizing and displaying project numbers
 */

/**
 * Normalize project number for display
 *
 * Examples:
 * - "P-12R" → "P-12R" (preserved as-is)
 * - "P301" → "P301" (preserved as-is)
 * - "301" → "301"
 * - "301-MS-1" → "301-MS-1" (string, for Missing & Extra)
 * - null/undefined → 0 (fallback)
 *
 * @param projectNo - Raw project number from backend (can be string or number)
 * @param mode - Display mode ('projects', 'missingExtra', or 'directOrder')
 * @returns Normalized project number (preserves full format including letters)
 */
export function normalizeProjectNoForDisplay(
  projectNo: string | number | null | undefined,
  mode: 'projects' | 'missingExtra' | 'directOrder' = 'projects'
): number | string {
  if (!projectNo) {
    return 0;
  }

  const projectNoStr = String(projectNo);

  // For Direct Order mode: return as-is (e.g., "DO-01", "DO-02")
  if (mode === 'directOrder') {
    return projectNoStr;
  }

  // For Missing & Extra mode with derived codes (e.g., "301-MS-1")
  if (mode === 'missingExtra' && projectNoStr.includes('-')) {
    return projectNoStr; // Return full derived code as string
  }

  // For Projects mode: return as-is to preserve full format (e.g., "P-12R", "P301", "12R")
  // Project numbers can contain letters and special characters
  return projectNoStr;
}

/**
 * Extract base project number (numeric only) from any project number format
 * 
 * Examples:
 * - "P301" → 301
 * - "301" → 301
 * - "301-MS-1" → 301
 * 
 * @param projectNo - Raw project number
 * @returns Base numeric project number
 */
export function extractBaseProjectNo(projectNo: string | number | null | undefined): number {
  if (!projectNo) {
    return 0;
  }

  const projectNoStr = String(projectNo);
  const match = projectNoStr.match(/\d+/);
  
  return match ? parseInt(match[0], 10) : 0;
}
