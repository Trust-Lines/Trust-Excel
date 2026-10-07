import { Row, Project, ProjectType } from '../types';
import { FilterConfig } from '../components/FilterBar';
import { todayPfKey, todayPfItemKey } from '../lib/today-pf';

// Vendor string normalization
function normalizeVendorString(vendor: string): string {
  return vendor
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ') // Replace multiple spaces
    .replace(/–/g, '-'); // Replace em-dash with hyphen
}

/**
 * Check if a single item matches the current filters (CRITICAL: empty filters are ignored)
 * `projectId` + `todayPfActiveKeys` are only needed when `filters.todayPfOnly` is set.
 */
export function matchesFilters(
  item: Row,
  filters: FilterConfig,
  projectId?: string,
  todayPfActiveKeys?: Set<string> | null,
): boolean {
  // VENDOR FILTER: Try vendor code matching first, then fall back to vendor ID matching
  let vendorOk = true;
  if (filters.vendors.length > 0 || filters.vendorCodes?.length) {
    vendorOk = false;

    // Strategy 1: Vendor code string matching (if vendorCodes provided)
    if (!vendorOk && filters.vendorCodes?.length) {
      vendorOk = filters.vendorCodes.some(code => {
        // Object code match
        if ((item as any).vendor && typeof (item as any).vendor === 'object') {
          if ((item as any).vendor.code === code) return true;
        }
        // String vendor match ("YSM - Company Name")
        if (typeof item.vendor === 'string') {
          const normalizedVendor = normalizeVendorString(item.vendor);
          const normalizedCode = normalizeVendorString(code);
          if (normalizedVendor.startsWith(normalizedCode + ' ') ||
              normalizedVendor.startsWith(normalizedCode + '-') ||
              normalizedVendor.includes(' ' + normalizedCode + ' ')) {
            return true;
          }
        }
        return false;
      });
    }

    // Strategy 2: Vendor ID matching (fallback when code matching fails)
    if (!vendorOk && filters.vendors.length > 0) {
      vendorOk = filters.vendors.some(vendorId => {
        // Direct vendorId field match
        if ((item as any).vendorId && (item as any).vendorId === vendorId) return true;
        // Vendor object id match
        if ((item as any).vendor && typeof (item as any).vendor === 'object' && (item as any).vendor.id === vendorId) return true;
        return false;
      });
    }
  }

  // Type filter: ignore if empty, otherwise item must match
  const typeOk = (filters.types.length === 0) ||
                 (filters.types.includes(item.type as ProjectType));

  // Status filter: ignore if empty, otherwise item must match
  const statusOk = (filters.statuses.length === 0) ||
                   (filters.statuses.includes(item.status));

  // Container filter: ignore if empty, otherwise item must match
  const containerOk = (!filters.containers || filters.containers.length === 0) ||
                      (filters.containers.some(c =>
                        item.containerNo && item.containerNo.toUpperCase() === c.toUpperCase()
                      ));

  // Today's PFs filter: row's (project, type) must be in the active flags set
  const todayPfOk = !(filters.todayPfOnly || filters.followUpOnly) || !!(
    (projectId && todayPfActiveKeys?.has(todayPfKey(projectId, item.type))) ||
    (item.itemId && todayPfActiveKeys?.has(todayPfItemKey(item.itemId)))
  );

  // Sign/status "waiting" quick filters: row matches if ANY active chip matches
  const signOk = !filters.signWaiting?.length || filters.signWaiting.some(tok =>
    tok === 'PO_TLINES' ? item.poSignStatus === 'WAITING TLINES TO SIGN'
      : tok === 'PO_T' ? item.poSignStatus === 'WAITING T TO SIGN'
      : tok === 'TO_ORDER' ? item.status === 'TO ORDER'
      : tok === 'BOOKS_IN_PROGRESS' ? item.status === 'BOOKS IN PROGRESS'
      : item.pfSignStatus === 'WAITING T TO SIGN'
  );

  // ALL active filters must pass (AND logic)
  return vendorOk && typeOk && statusOk && containerOk && todayPfOk && signOk;
}

/**
 * Filter individual rows based on filter configuration
 */
export function filterRows(
  rows: Row[],
  filters: FilterConfig,
  projectId?: string,
  todayPfActiveKeys?: Set<string> | null,
): Row[] {
  if (
    !filters.vendors.length && !filters.vendorCodes?.length && !filters.types.length &&
    !filters.statuses.length && !(filters.containers?.length) && !filters.todayPfOnly && !filters.followUpOnly && !filters.signWaiting?.length
  ) {
    return rows; // No filters active, return all rows
  }

  return rows.filter(row => matchesFilters(row, filters, projectId, todayPfActiveKeys));
}

/**
 * Half filter is project-level (not row-level): does this project's year/half
 * token match one of the selected tokens? "UNASSIGNED" matches projects with
 * no half set yet.
 */
export function projectMatchesHalfFilter(project: Project, filters: FilterConfig): boolean {
  if (!filters.halves || filters.halves.length === 0) return true;
  const token = (project.halfOfYear && project.halfYear)
    ? `${project.halfYear}:${project.halfOfYear}`
    : 'UNASSIGNED';
  return filters.halves.includes(token);
}

/**
 * Filter projects and their rows, hiding entire projects that have no visible rows.
 * Pass keepEmpty=true to retain projects/cases that genuinely have 0 rows (not filtered out).
 */
export function filterProjects(
  projects: Project[],
  filters: FilterConfig,
  keepEmpty = false,
  todayPfActiveKeys?: Set<string> | null,
): Project[] {
  return projects
    .filter(project => projectMatchesHalfFilter(project, filters))
    .map(project => {
      const originalRowCount = project.rows.length;
      const filteredRows = filterRows(project.rows, filters, project.projectId, todayPfActiveKeys);

      return {
        ...project,
        rows: filteredRows,
        __originalRowCount: originalRowCount,
      };
    })
    .filter(project => {
      if ((project as any).__originalRowCount === 0 && keepEmpty) return true;
      return project.rows.length > 0;
    });
}

/**
 * Count total items across all projects
 */
export function countTotalItems(projects: Project[]): number {
  return projects.reduce((total, project) => total + project.rows.length, 0);
}

/**
 * Get filter summary for debugging
 */
export function getFilterSummary(filters: FilterConfig): string {
  const parts = [];

  if (filters.vendors.length > 0) {
    parts.push(`${filters.vendors.length} vendor(s)`);
  }

  if (filters.types.length > 0) {
    parts.push(`${filters.types.length} type(s)`);
  }

  if (filters.statuses.length > 0) {
    parts.push(`${filters.statuses.length} status(es)`);
  }

  return parts.length > 0 ? `Filtering by: ${parts.join(', ')}` : 'No filters active';
}

/**
 * Helper to check if any filters are active
 */
export function hasActiveFilters(filters: FilterConfig): boolean {
  return filters.vendors.length > 0 ||
         filters.types.length > 0 ||
         filters.statuses.length > 0 ||
         (filters.containers?.length || 0) > 0 ||
         (filters.halves?.length || 0) > 0 ||
         !!filters.todayPfOnly ||
         !!filters.followUpOnly ||
         (filters.signWaiting?.length || 0) > 0;
}