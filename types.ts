// Vendor interfaces
export interface Vendor {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorOption {
  id: string;
  code: string;
  name: string;
  displayName: string; // Formatted as "Code - Name"
}

// Data model interfaces
export interface Row {
  type: string; // Type name (flexible string for mapping compatibility)
  pfCode: string; // Format: VendorCode-P(ProjectNo)-TypeLetter-OrderIndex
  vendor: string; // Vendor name (display only)
  vendorId?: string; // Vendor ID for editing
  orderType: string;
  pfSignStatus: string; // Flexible string for mapping compatibility
  poSignStatus: string; // PO sign status for individual items
  status: string; // Flexible string for mapping compatibility
  std: string;
  etd: string; // Editable date
  rtd: string; // Editable date
  rtr: string; // Editable date - Ready To Receive
  rdy: string; // Read-only, auto-filled when READY
  ftd: string; // Editable date
  snd: string; // Read-only, auto-filled when SENT
  statusNote: string; // Note attached to status cell
  pfUsd: string; // PF USD amount (display as string)
  pfTl: string; // PF TL amount (display as string)
  paymentRule: string; // Payment rule (editable text)
  containerNo: string; // Editable text
  containerDate: string; // Container date (project-level, same for all rows)
  expensesUsd?: string; // Expenses USD amount (expenses-p mode only)
  expensesTl?: string; // Expenses TL amount (expenses-p mode only)
  customTypeId?: string | null; // Custom type ID (set for custom types, null for enum types)
  invoice?: string; // Invoice amount (decimal)
  itemId?: string; // Backend project item ID for editing
  isRestricted?: boolean; // True if this row's type is not in user's allowedTypes (blur display, no edit)
}

export interface TypeGroup {
  type: ProjectType;
  poSignStatus: PoSignStatus; // One per type group
  rows: Row[];
}

export interface Project {
  projectId: string;
  projectNumber: number | string; // Allow string for Direct Orders (DO-01, DO-02)
  projectNumberColor: 'orange' | 'blue' | 'green' | 'red';
  projectName: string;
  address: string;
  isUrgent?: boolean;
  region: string;
  rows: Row[];
  poSignStatusByType: Record<string, string>; // Type-level PO Sign Status storage (flexible for mapping)
  backendItems?: any[]; // Backend project items for editing (using any for now to avoid import cycles)
  halfOfYear?: 'FIRST_HALF' | 'SECOND_HALF' | null;
  halfYear?: number | null;
}

// Create project data interface for forms
export interface CreateProjectData {
  projectNo?: string;
  name: string;
  address: string;
  bucket: string;
  description?: string;
  status?: string;
  types?: string[]; // For Direct Order: selected types array
}

// Projects API response interface
export interface ProjectsData {
  sections: Array<{
    id: string;
    label: string;
    projects: any[];
  }>;
  lastUpdate: Date | null;
}

export type ProjectType = 'Millwork' | 'Shelving' | 'Ceiling' | 'Image' | 'Furniture' | 'Decoration';

// Status options
export type PoSignStatus = 'NOT SIGNED' | 'READY TO SIGN' | 'SIGNED' | 'WAITING TLINES TO SIGN' | 'WAITING T TO SIGN';

export type PfSignStatus = 'NOT SIGNED' | 'READY TO SIGN' | 'SIGNED' | 'WAITING T TO SIGN' | 'SIGNED WITH EST PRICE';

export type Status =
  | 'HOLD / T'
  | 'HOLD / PM'
  | 'HOLD BOOKS'
  | 'NOT ORDERED'
  | 'TO ORDER'
  | 'BOOKS IN PROGRESS'
  | 'ORDERED'
  | 'WAITING PAYMENT'
  | 'ASSEMBLY'
  | 'READY TO RECEIVE'
  | 'RECEIVED'
  | 'READY'
  | 'SENT TO TLINES'
  | 'PARTIAL SENT'
  | 'SENT';

// Vendor utility functions
export const formatVendorDisplayName = (vendor: Vendor): string => {
  return vendor.code ? `${vendor.code} - ${vendor.name}` : vendor.name;
};

export const createVendorOptions = (vendors: Vendor[]): VendorOption[] => {
  const pinnedVendorCode = "YSM"; // Pin Yaşam Plus to top

  return vendors
    .filter(vendor => vendor.isActive)
    .map(vendor => ({
      ...vendor,
      displayName: formatVendorDisplayName(vendor)
    }))
    .sort((a, b) => {
      // Pin YSM (Yaşam Plus) to the top
      if (a.code === pinnedVendorCode && b.code !== pinnedVendorCode) {
        return -1; // a comes first
      }
      if (b.code === pinnedVendorCode && a.code !== pinnedVendorCode) {
        return 1; // b comes first
      }
      // Both are pinned or both are not pinned - sort alphabetically
      return a.displayName.localeCompare(b.displayName);
    });
};

export const findVendorById = (vendors: Vendor[], vendorId: string): Vendor | undefined => {
  return vendors.find(vendor => vendor.id === vendorId);
};

// Project bucket/section constants (matching backend ProjectBucket enum)
export const PROJECT_BUCKETS = ['TLINES_NE', 'TLINES_SE', 'TLINES_NW', 'CVW', 'TLINES_HQ', 'TLINES_TC'];

// Section ordering for display
export const SECTION_ORDER = ['TLINES_NE', 'TLINES_SE', 'TLINES_NW', 'CVW', 'TLINES_HQ', 'TLINES_TC'];

// Filter configuration interface
export interface FilterConfig {
  vendors: string[]; // Vendor IDs (for backend integration)
  vendorCodes?: string[]; // Vendor codes (for Row.vendor string matching)
  types: ProjectType[]; // Project types
  statuses: string[]; // Status values
  containers: string[]; // Container names
  halves?: string[]; // "year:half" tokens, e.g. "2026:FIRST_HALF"
}

// Create empty filter configuration
export function createEmptyFilters(): FilterConfig {
  return {
    vendors: [],
    vendorCodes: [],
    types: [],
    statuses: [],
    containers: [],
    halves: []
  };
}

// Order Type options (can be expanded)
export const ORDER_TYPE_OPTIONS = [
  'Custom',
  'Standard',
  'Modular',
  'Suspended',
  'Executive',
  'Workstation',
  'Conference',
  'Specialized',
  'Cleanroom',
  'Interactive'
];

// Fixed ordering for types
export const TYPE_ORDER: ProjectType[] = ['Millwork', 'Shelving', 'Ceiling', 'Image', 'Furniture', 'Decoration'];

// Type letter mapping for PF Code generation
export const TYPE_LETTERS = {
  'Millwork': 'M',
  'Shelving': 'S',
  'Ceiling': 'C',
  'Image': 'I',
  'Furniture': 'F',
  'Decoration': 'D'
} as const;

// ==================== ID-BASED STATE UTILITIES ====================

// Helper function to extract PF code sequence number for sorting
export function extractPFSequence(pfCode: string | null): number {
  if (!pfCode) return Infinity;
  const match = pfCode.match(/-[MSCIFD](\d{2})$/); // Extract M01, S02, D01, etc.
  return match ? parseInt(match[1], 10) : Infinity;
}

// Priority vendors: YSM = 0 (highest), GOS = 1, others = 2
// If no YSM exists in the group, GOS floats to the top automatically.
const PRIORITY_VENDORS: Record<string, number> = { YSM: 0, GOS: 1 };

export function getVendorPriority(item: any): number {
  const code = item.vendor?.code as string | undefined;
  if (!code) return 2;
  return PRIORITY_VENDORS[code] ?? 2;
}

/**
 * Display order of project items (one rule used everywhere):
 *  1. by type (TYPE_ORDER; custom types after, each kept together)
 *  2. YSM first, then GOS (priority vendors)
 *  3. other vendors as blocks — all rows of one vendor together, blocks in the order the
 *     vendor first appeared in that type; rows without a vendor last
 *  4. inside a vendor: PF code number (M01, M02 …), then creation time
 */
export function sortItemsForDisplay<T = any>(items: T[]): T[] {
  const typeOrder = TYPE_ORDER.map(t => t.toUpperCase());
  const typeKey = (i: any) => (i.customTypeId ? `C:${i.customTypeId}` : `T:${(i.type || '').toUpperCase()}`);
  const typeIdx = (i: any) => { const x = typeOrder.indexOf((i.type || '').toUpperCase()); return x < 0 ? 999 : x; };
  const vendorKey = (i: any) => i.vendorId || i.vendor?.id || i.vendor?.code || '';
  const time = (i: any) => (i.createdAt ? new Date(i.createdAt).getTime() : 0);
  const firstSeen = new Map<string, number>();
  for (const i of items as any[]) {
    const k = `${typeKey(i)}|${vendorKey(i)}`;
    const t = time(i);
    if (!firstSeen.has(k) || t < (firstSeen.get(k) as number)) firstSeen.set(k, t);
  }
  return items.slice().sort((a: any, b: any) => {
    const ta = typeIdx(a), tb = typeIdx(b);
    if (ta !== tb) return ta - tb;
    if (ta === 999 && typeKey(a) !== typeKey(b)) return typeKey(a) < typeKey(b) ? -1 : 1;
    const pa = getVendorPriority(a), pb = getVendorPriority(b);
    if (pa !== pb) return pa - pb;
    const va = vendorKey(a), vb = vendorKey(b);
    if (va !== vb) {
      if (!va) return 1;
      if (!vb) return -1;
      const fa = firstSeen.get(`${typeKey(a)}|${va}`) as number, fb = firstSeen.get(`${typeKey(b)}|${vb}`) as number;
      if (fa !== fb) return fa - fb;
      return va < vb ? -1 : 1;
    }
    const sa = extractPFSequence(a.pfCode), sb = extractPFSequence(b.pfCode);
    if (sa !== sb) return sa - sb;
    return time(a) - time(b);
  });
}

// Kept for existing callers
export const sortProjectItemsInTypeGroup = (items: any[]): any[] => sortItemsForDisplay(items);
export const sortBackendItems = (items: any[]): any[] => sortItemsForDisplay(items);

// Create Map from items array for fast ID-based lookups
export function createItemsMap(items: any[]): Map<string, any> {
  const map = new Map<string, any>();
  items.forEach(item => {
    if (item.id) {
      map.set(item.id, item);
    }
  });
  return map;
}

// Update item in map and return new Map (immutable pattern)
export function updateItemInMap(
  itemsMap: Map<string, any>,
  itemId: string,
  updatedItem: any
): Map<string, any> {
  const newMap = new Map(itemsMap);
  newMap.set(itemId, updatedItem);
  return newMap;
}