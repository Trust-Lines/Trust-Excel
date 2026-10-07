/**
 * Global Project Color System
 *
 * Implements unified color rules across all project types:
 * - Projects board / operational board (normal projects)
 * - Missing Extra board
 * - Direct Orders board
 * - Supplier sheets (P / ME / DO)
 * - Any dashboard project cards/blocks that show project color
 *
 * Color Rules (precedence order):
 * 1. GREEN: All items SENT (normal SENT, not "SENT TO TLINES")
 * 2. RED: isUrgent=true OR containerDate ≤ 10 days (GREEN overrides)
 * 3. BLUE: At least one item ORDERED
 * 4. ORANGE: Default fallback
 */

import { BackendProjectItem } from './projects';

export type ProjectColor = 'orange' | 'blue' | 'green' | 'red';

// Type for items with debug source tracking - allows both status and orderStatus for flexibility
type ItemWithSource = (BackendProjectItem & { orderStatus?: string | null }) & { __source: string };

// Type for basic items from getProjectItems function
type BasicProjectItem = { status?: string | null; orderStatus?: string | null; };

interface ProjectLike {
  // Core project fields
  id?: string;
  isUrgent?: boolean;
  containerDate?: string | Date | null;

  // Items can be in different locations depending on data source
  backendItems?: Array<{ status?: string | null; orderStatus?: string | null; }>;
  items?: Array<{ status?: string | null; orderStatus?: string | null; }>;
  rows?: Array<{ status?: string | null; orderStatus?: string | null; }>;
}

/**
 * Normalize status values to handle different string formats and enums
 */
const normalizeStatus = (status: any): string => {
  return String(status || '').trim().toUpperCase();
};

/**
 * Check if status represents ORDERED state
 */
const isOrdered = (status: any): boolean => {
  const norm = normalizeStatus(status);
  return norm === 'ORDERED';
};

/**
 * Check if status represents normal SENT state (not SENT_TO_TLINES)
 */
const isSentNormal = (status: any): boolean => {
  const norm = normalizeStatus(status);
  return norm === 'SENT';
};

/**
 * Check if status represents SENT_TO_TLINES state (does NOT count for GREEN)
 */
const isSentToTlines = (status: any): boolean => {
  const norm = normalizeStatus(status);
  // Handle various formats: "SENT_TO_TLINES", "SENT TO TLINES", "SENT-TO-TLINES"
  return norm.includes('SENT') && norm.includes('TLINES');
};

/**
 * Extract items from project object, handling different data structures
 */
export const getProjectItems = (project: ProjectLike): Array<{ status?: string | null; orderStatus?: string | null; }> => {
  return project?.backendItems ?? project?.items ?? project?.rows ?? [];
};

/**
 * Calculate days remaining until container date
 * Uses start-of-day comparison to avoid timezone issues
 */
const getDaysLeft = (containerDate: string | Date | null): number | null => {
  if (!containerDate) return null;

  try {
    // Parse container date and set to start of day
    const targetDate = new Date(containerDate);
    if (isNaN(targetDate.getTime())) return null;
    targetDate.setHours(0, 0, 0, 0);

    // Get today at start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate difference in days
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    console.error('Error calculating days left:', error);
    return null;
  }
};

/**
 * Calculate minimum days remaining from all item-level container dates
 * Returns null if no valid container dates found
 */
const getMinDaysRemainingFromItems = (items: any[]): { minDays: number | null; earliestDate: string | null } => {
  if (!items || items.length === 0) {
    return { minDays: null, earliestDate: null };
  }

  let minDays: number | null = null;
  let earliestDate: string | null = null;

  for (const item of items) {
    // Check multiple possible field names for container date
    const itemDate = item.containerDate ?? item.container_date ?? item.containerETA ?? null;
    if (!itemDate) continue;

    const daysLeft = getDaysLeft(itemDate);
    if (daysLeft === null) continue;

    if (minDays === null || daysLeft < minDays) {
      minDays = daysLeft;
      earliestDate = itemDate;
    }
  }

  return { minDays, earliestDate };
};

/**
 * NEW: Map-only color calculation - NEVER uses stale arrays
 *
 * @param params Object with project, itemsById Map, and optional urgent override
 * @returns Project color token
 */
export const getProjectColorFromMap = (params: {
  project: any;
  itemsById: Map<string, BackendProjectItem>;
  isUrgentOverride?: boolean;
}): ProjectColor => {
  const { project, itemsById, isUrgentOverride } = params;

  if (!project) return 'orange';

  // 🔧 EXTRACT ITEM IDS from project structure
  const itemIds = project.rows?.map((row: any) => row.itemId).filter(Boolean) || [];

  // 🔧 BUILD ITEMS ARRAY from authoritative Map ONLY
  const items = itemIds
    .map((id: string) => {
      const item = itemsById.get(id);
      if (!item) return null;

      // 🧩 PROOF: Add source tracking on-the-fly (don't mutate original)
      return {
        ...item,
        __source: "itemsById_lookup"
      };
    })
    .filter(Boolean);

  // A. GREEN (highest precedence): All items SENT (normal)
  const allSentNormal = items.length > 0 && items.every((item: ItemWithSource) => {
    const status = item.status ?? item.orderStatus;
    return isSentNormal(status);
  });

  if (allSentNormal) return 'green';

  // B. RED (second precedence): Urgent flag OR container deadline ≤ 10 days
  const urgent = isUrgentOverride ?? !!project.isUrgent;

  // ✅ CHECK ITEM-LEVEL CONTAINER DATES (not just project.containerDate)
  const { minDays, earliestDate: _earliestDate } = getMinDaysRemainingFromItems(items);
  const containerWindowActive = minDays !== null && minDays <= 10 && minDays >= 0;

  if (urgent || containerWindowActive) {
    // 🔍 DEBUG: Log when project turns red
    if (import.meta.env.DEV) {
      if (containerWindowActive) {
      } else if (urgent) {
      }
    }
    return 'red';
  }

  // C. BLUE: At least one item has PO signed (SIGNED or READY_TO_SIGN)
  const hasPoSigned = items.some((item: ItemWithSource) => {
    const poStatus = item.poSignStatus;
    return poStatus === 'SIGNED' || poStatus === 'READY_TO_SIGN';
  });

  if (hasPoSigned) {
    return 'blue';
  }

  // D. ORANGE: Default fallback
  return 'orange';
};

/**
 * Core function: Calculate project color based on business rules
 *
 * @param project Project-like object with items and metadata
 * @returns Project color token
 */
export const getProjectColor = (project: ProjectLike): ProjectColor => {
  if (!project) return 'orange';

  const items = getProjectItems(project);

  // A. GREEN (highest precedence): All items are SENT (normal)
  const allSentNormal = items.length > 0 && items.every((item: BasicProjectItem) => {
    const status = item.status ?? item.orderStatus;
    return isSentNormal(status);
  });

  if (allSentNormal) return 'green';

  // B. RED (second precedence): Urgent flag OR container deadline ≤ 10 days
  const urgent = !!project.isUrgent;
  
  // ✅ CHECK ITEM-LEVEL CONTAINER DATES (not just project.containerDate)
  const { minDays, earliestDate: _earliestDate } = getMinDaysRemainingFromItems(items);
  const containerWindowActive = minDays !== null && minDays <= 10 && minDays >= 0;

  if (urgent || containerWindowActive) {
    // 🔍 DEBUG: Log when project turns red
    if (import.meta.env.DEV) {
      if (containerWindowActive) {
      } else if (urgent) {
      }
    }
    return 'red';
  }

  // C. BLUE: At least one item has PO signed
  const hasPoSigned2 = items.some((item: BasicProjectItem) => {
    const poStatus = (item as any).poSignStatus;
    return poStatus === 'SIGNED' || poStatus === 'READY_TO_SIGN';
  });

  if (hasPoSigned2) {
    return 'blue';
  }

  // D. ORANGE: Default fallback
  return 'orange';
};

/**
 * Optional: Get detailed color metadata for debugging
 */
export interface ProjectColorMeta {
  color: ProjectColor;
  reason: string;
  itemsTotal: number;
  itemsOrdered: number;
  itemsSentNormal: number;
  itemsSentToTlines: number;
  isUrgent: boolean;
  containerDate: string | null;
  daysLeft: number | null;
}

export const getProjectColorMeta = (project: ProjectLike): ProjectColorMeta => {
  const items = getProjectItems(project);
  const color = getProjectColor(project);

  let itemsOrdered = 0;
  let itemsSentNormal = 0;
  let itemsSentToTlines = 0;

  items.forEach(item => {
    const status = item.status ?? item.orderStatus;
    if (isOrdered(status)) itemsOrdered++;
    if (isSentNormal(status)) itemsSentNormal++;
    if (isSentToTlines(status)) itemsSentToTlines++;
  });

  const daysLeft = getDaysLeft(project.containerDate || null);

  let reason: string;
  if (color === 'green') reason = 'All items SENT (normal)';
  else if (color === 'red' && project.isUrgent) reason = 'Marked as urgent';
  else if (color === 'red' && daysLeft !== null && daysLeft <= 10) reason = `Container deadline in ${daysLeft} days`;
  else if (color === 'blue') reason = 'Has ORDERED items';
  else reason = 'Default state';

  return {
    color,
    reason,
    itemsTotal: items.length,
    itemsOrdered,
    itemsSentNormal,
    itemsSentToTlines,
    isUrgent: !!project.isUrgent,
    containerDate: project.containerDate ? String(project.containerDate) : null,
    daysLeft,
  };
};

/**
 * Map project color to CSS class name
 */
export const getProjectColorClass = (color: ProjectColor): string => {
  return `project-number-${color}`;
};

/**
 * Map project color to hex value (matches existing CSS)
 */
export const getProjectColorHex = (color: ProjectColor): string => {
  switch (color) {
    case 'orange': return '#DE8244';
    case 'blue': return '#6A99D1';
    case 'green': return '#9FCF63';
    case 'red': return '#E53E3E'; // New red color
    default: return '#DE8244';
  }
};