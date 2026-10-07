// Projects API helper
import { apiFetch } from './auth';
import { extractPFSequence, getVendorPriority } from '../types';
import { getProjectColor } from './projectColor';
import { sanitizeProjectItemPayload } from './sanitizePayload';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Vendor interfaces
export interface Vendor {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  fixedMillworkCodes?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorRequest {
  name: string;
  code?: string; // Optional, auto-generated if not provided
  fixedMillworkCodes?: boolean; // Millwork PF codes follow the order-type M01/M02/M03 rule
}

export interface UpdateVendorRequest {
  name?: string;
  code?: string;
  isActive?: boolean;
}

// Half-year assignment
export type ProjectHalf = 'FIRST_HALF' | 'SECOND_HALF';

// Backend API interfaces
export interface BackendProject {
  id: string;
  bucket: 'TLINES_NE' | 'TLINES_SE' | 'TLINES_NW' | 'CVW' | 'TLINES_HQ' | 'TLINES_TC';
  projectNo: string;
  name: string;
  address: string | null;
  description: string | null;
  types: string[]; // Metadata: types that were selected when creating project
  status: string;
  isUrgent?: boolean; // ✅ ADD: Urgent status
  containerDate?: string | null; // ✅ ADD: Container date
  halfOfYear?: ProjectHalf | null;
  halfYear?: number | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    email: string;
    name: string;
  };
  items?: BackendProjectItem[]; // Project line items with vendor relations
}

// Line item structure
export interface BackendProjectItem {
  id: string;
  projectId: string;
  type: 'MILLWORK' | 'SHELVING' | 'CEILING' | 'IMAGE' | 'FURNITURE' | 'DECORATION' | null;
  customTypeId: string | null;
  customType?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
  } | null;
  pfCode: string | null;
  vendorId: string | null; // Foreign key to vendor
  orderType: string | null;
  pfSignStatus: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN' | 'SIGNED_WITH_EST_PRICE';
  poSignStatus: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN';
  status: 'HOLD_T' | 'HOLD_PM' | 'HOLD_BOOKS' | 'NOT_ORDERED' | 'TO_ORDER' | 'ORDERED' | 'WAITING_PAYMENT' | 'ASSEMBLY' | 'READY_TO_RECEIVE' | 'RECEIVED' | 'READY' | 'SENT_TO_TLINES' | 'PARTIAL_SENT' | 'SENT' | null;
  std: string | null;
  etd: string | null;
  rtd: string | null;
  rtr: string | null;
  rdy: string | null;
  ftd: string | null;
  snd: string | null;
  pfUsd: number | null;
  pfTl: number | null;
  paidUsd1: number | null;
  paidUsd2: number | null;
  paidTl1: number | null;
  paidTl2: number | null;
  invoiceTransactionNo: string | null;
  invoiceNumber: string | null;
  quickBook: string | null;
  containerNo: string | null;
  containerDate: string | null; // ✅ ADD: Container date for individual items
  paymentRule: string | null;
  statusNote: string | null;
  priceNotes?: Record<string, string> | null;
  duePaid: boolean;
  paidUsd1Date: string | null;
  paidUsd2Date: string | null;
  paidTl1Date: string | null;
  paidTl2Date: string | null;
  invoiceDate: string | null;
  invoice: number | null;
  invoiceTl: number | null;
  createdAt: string;
  updatedAt: string;
  vendor?: { // Vendor relation when included
    id: string;
    code: string;
    name: string;
  } | null;
}

// Frontend mapping interfaces
export interface ApiSection {
  id: string;
  label: string;
  projects: ApiProject[];
}

export interface ApiProject {
  projectId: string;
  projectNumber: number | string; // Allow string for Direct Orders (DO-01, DO-02)
  projectNumberColor: 'orange' | 'blue' | 'green' | 'red';
  projectName: string;
  address: string;
  region: string;
  isUrgent?: boolean; // ✅ ADD: Urgent status
  containerDate?: string | null; // ✅ ADD: Container date
  halfOfYear?: ProjectHalf | null;
  halfYear?: number | null;
  rows: ApiRow[];
  poSignStatusByType: Record<string, string>;
  backendItems?: BackendProjectItem[]; // Preserve raw backend items for editing
}

export interface ApiRow {
  type: string;
  pfCode: string;
  vendor: string;
  vendorId?: string;
  orderType: string;
  pfSignStatus: string;
  poSignStatus: string; // PO sign status (added for type groups)
  status: string;
  std: string;
  etd: string;
  rtd: string;
  rtr: string;
  rdy: string;
  ftd: string;
  snd: string;
  statusNote: string;
  pfUsd: string;
  pfTl: string;
  paymentRule: string;
  containerNo: string;
  containerDate: string; // Container date (project-level, same for all rows)
  itemId?: string; // 🚨 CRITICAL: Backend item ID for click handlers
}

export interface CreateProjectRequest {
  bucket: 'TLINES_NE' | 'TLINES_SE' | 'TLINES_NW' | 'CVW' | 'TLINES_HQ' | 'TLINES_TC';
  projectNo: string;
  name: string;
  address?: string;
  description?: string;
  types: string[]; // Selected types that will create placeholder line items
}

export interface ProjectsResponse {
  data: BackendProject[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API calls
// `getProjects()` does NOT rely on a generous backend default — the server
// caps every response, on purpose (performance, browser stability, API
// protection). Instead, this helper explicitly paginates: it asks for one
// page at a time and walks `meta.totalPages` until the full operational set
// has been collected.
//
// PAGE_SIZE is intentionally aligned with the server's safe default. Don't
// crank it up to "fetch all in one go" — that defeats the cap.
// MAX_PAGES is a runaway guard: if we ever blow past it the loop stops and
// surfaces a console warning so the truncation is never silent.
export const getProjects = async (): Promise<ProjectsResponse> => {
  const PAGE_SIZE = 50;
  const MAX_PAGES = 50; // 50 * 50 = 2 500 projects before truncation kicks in

  const fetchPage = async (page: number): Promise<ProjectsResponse> => {
    const response = await apiFetch(`${API_URL}/projects?page=${page}&limit=${PAGE_SIZE}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch projects');
    }
    return response.json();
  };

  const first = await fetchPage(1);
  const all: BackendProject[] = [...first.data];
  const backendTotalPages = first.meta?.totalPages ?? 1;
  const pagesToWalk = Math.min(backendTotalPages, MAX_PAGES);

  for (let p = 2; p <= pagesToWalk; p++) {
    const next = await fetchPage(p);
    all.push(...next.data);
  }

  // ── TEMP DEV LOG: prove pagination is doing its job, never silent.
  // Disable with `window.__PROJECT_LIST_DEBUG__ = false` from the console.
  if (typeof window !== 'undefined' && (window as any).__PROJECT_LIST_DEBUG__ !== false) {
    // eslint-disable-next-line no-console
    const backendTotal = first.meta?.total ?? all.length;
    if (all.length < backendTotal) {
      // eslint-disable-next-line no-console
      console.warn(
        `[PROJECT_LIST_FE] WARNING — pagination truncated: fetched ${all.length} of ${backendTotal} projects (MAX_PAGES=${MAX_PAGES}, PAGE_SIZE=${PAGE_SIZE}). Raise MAX_PAGES or trim the data set.`
      );
    } else if (backendTotalPages > MAX_PAGES) {
      // eslint-disable-next-line no-console
      console.warn(
        `[PROJECT_LIST_FE] WARNING — backend reported ${backendTotalPages} pages, frontend cap is ${MAX_PAGES}. Tail pages were skipped.`
      );
    }
  }

  return {
    data: all,
    meta: {
      total: first.meta?.total ?? all.length,
      page: 1,
      limit: all.length,
      totalPages: 1,
    },
  };
};

export const getProject = async (projectId: string): Promise<BackendProject> => {
  const response = await apiFetch(`${API_URL}/projects/${projectId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch project');
  }

  const data = await response.json();
  return data;
};

export const createProject = async (projectData: CreateProjectRequest): Promise<BackendProject> => {
  const response = await apiFetch(`${API_URL}/projects`, {
    method: 'POST',
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create project');
  }

  const data = await response.json();
  return data;
};

// ==================== VENDOR API FUNCTIONS ====================

export const getVendors = async (): Promise<Vendor[]> => {
  const response = await apiFetch(`${API_URL}/vendors`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch vendors');
  }

  const data = await response.json();
  return data;
};

export const createVendor = async (vendorData: CreateVendorRequest): Promise<Vendor> => {
  const response = await apiFetch(`${API_URL}/vendors`, {
    method: 'POST',
    body: JSON.stringify(vendorData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create vendor');
  }

  const data = await response.json();
  return data;
};

export const updateVendor = async (vendorId: string, vendorData: UpdateVendorRequest): Promise<Vendor> => {
  const response = await apiFetch(`${API_URL}/vendors/${vendorId}`, {
    method: 'PATCH',
    body: JSON.stringify(vendorData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update vendor');
  }

  const data = await response.json();
  return data;
};

export const deleteVendor = async (vendorId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/vendors/${vendorId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete vendor');
  }

  const data = await response.json();
  return data;
};

// ==================== ORDER TYPE API FUNCTIONS ====================

// Order type interfaces
export interface OrderType {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderTypeRequest {
  name: string;
}

export interface UpdateOrderTypeRequest {
  name?: string;
  isActive?: boolean;
}

export const getOrderTypes = async (): Promise<OrderType[]> => {
  const response = await apiFetch(`${API_URL}/order-types`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch order types');
  }

  const data = await response.json();
  return data;
};

export const createOrderType = async (orderTypeData: CreateOrderTypeRequest): Promise<OrderType> => {
  const response = await apiFetch(`${API_URL}/order-types`, {
    method: 'POST',
    body: JSON.stringify(orderTypeData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create order type');
  }

  const data = await response.json();
  return data;
};

export const updateOrderType = async (orderTypeId: string, orderTypeData: UpdateOrderTypeRequest): Promise<OrderType> => {
  const response = await apiFetch(`${API_URL}/order-types/${orderTypeId}`, {
    method: 'PATCH',
    body: JSON.stringify(orderTypeData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update order type');
  }

  const data = await response.json();
  return data;
};

export const deleteOrderType = async (orderTypeId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/order-types/${orderTypeId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete order type');
  }

  const data = await response.json();
  return data;
};

// Project Item API interfaces
export interface CreateProjectItemRequest {
  type: 'MILLWORK' | 'SHELVING' | 'CEILING' | 'IMAGE' | 'FURNITURE';
  vendorId?: string; // Vendor ID reference
  orderType?: string;
  pfSignStatus?: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN' | 'SIGNED_WITH_EST_PRICE';
  poSignStatus?: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN';
  status?: 'HOLD_T' | 'HOLD_PM' | 'HOLD_BOOKS' | 'NOT_ORDERED' | 'TO_ORDER' | 'ORDERED' | 'ASSEMBLY' | 'READY_TO_RECEIVE' | 'RECEIVED' | 'READY' | 'SENT_TO_TLINES' | 'PARTIAL_SENT' | 'SENT';
  std?: string; // ISO date string
  etd?: string; // ISO date string
  rtd?: string; // ISO date string
  ftd?: string; // ISO date string
  containerNo?: string;
}

export interface UpdateProjectItemRequest {
  vendorId?: string;
  orderType?: string;
  pfSignStatus?: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN' | 'SIGNED_WITH_EST_PRICE';
  poSignStatus?: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN';
  status?: 'HOLD_T' | 'HOLD_PM' | 'HOLD_BOOKS' | 'NOT_ORDERED' | 'TO_ORDER' | 'ORDERED' | 'ASSEMBLY' | 'READY_TO_RECEIVE' | 'RECEIVED' | 'READY' | 'SENT_TO_TLINES' | 'PARTIAL_SENT' | 'SENT';
  std?: string; // ISO date string
  etd?: string; // ISO date string
  rtd?: string; // ISO date string
  ftd?: string; // ISO date string
  pfUsd?: number; // PF USD amount
  pfTl?: number; // PF TL amount
  paidUsd1?: number; // First USD payment
  paidUsd2?: number; // Second USD payment
  paidTl1?: number; // First TL payment
  paidTl2?: number; // Second TL payment
  containerNo?: string;
  invoice?: number | null;
  invoiceTl?: number | null;
}

// ==================== PROJECT ITEM API FUNCTIONS ====================

export const createProjectItem = async (projectId: string, itemData: CreateProjectItemRequest): Promise<BackendProjectItem> => {
  // Sanitize payload to remove UI-only fields
  const sanitizedData = sanitizeProjectItemPayload(itemData);

  const response = await apiFetch(`/api/projects/${projectId}/items`, {
    method: 'POST',
    body: JSON.stringify(sanitizedData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create project item');
  }

  const data = await response.json();
  return data;
};

export const updateProjectItem = async (itemId: string, itemData: UpdateProjectItemRequest): Promise<BackendProjectItem> => {
  // Sanitize payload to remove UI-only fields
  const sanitizedData = sanitizeProjectItemPayload(itemData);

  const requestUrl = `/api/projects/items/${itemId}`;
  const requestPayload = JSON.stringify(sanitizedData);

  // 🚨 FRONTEND REQUEST LOGGING - Capture exact request details

  // Special logging for poSignStatus updates to verify enum values
  if (itemData.poSignStatus) {
  }

  const response = await apiFetch(requestUrl, {
    method: 'PATCH',
    body: requestPayload,
  });

  // Log response status

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ [FRONTEND ERROR] Update failed:', {
      status: response.status,
      errorData,
      requestUrl,
      payload: itemData
    });
    throw new Error(errorData.message || 'Failed to update project item');
  }

  const data = await response.json();

  // Log successful response data

  return data;
};

export const deleteProjectItem = async (projectId: string, itemId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/projects/${projectId}/items/${itemId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete project item');
  }

  const data = await response.json();
  return data;
};

export const getProjectItems = async (projectId: string): Promise<BackendProjectItem[]> => {
  const response = await apiFetch(`${API_URL}/projects/${projectId}/items`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch project items');
  }

  const data = await response.json();
  return data;
};

export const getProjectItem = async (projectId: string, itemId: string): Promise<BackendProjectItem> => {
  const response = await apiFetch(`${API_URL}/projects/${projectId}/items/${itemId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch project item');
  }

  const data = await response.json();
  return data;
};

// DEBUG: Get raw DB values for a project item (Admin only)
export const debugProjectItemRawDB = async (itemId: string): Promise<{
  id: string;
  poSignStatus: string;
  pfSignStatus: string;
  status: string | null;
  std: string | null;
  rtd: string | null;
  etd: string | null;
  ftd: string | null;
  updatedAt: string;
}> => {
  const response = await apiFetch(`${API_URL}/projects/items/${itemId}/debug`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch debug item data');
  }

  const data = await response.json();


  return data;
};

export const bulkAssignProjectHalf = async (
  projectIds: string[],
  halfOfYear: ProjectHalf | null,
  halfYear: number | null,
): Promise<{ updatedCount: number }> => {
  const response = await apiFetch(`${API_URL}/projects/bulk/half`, {
    method: 'PATCH',
    body: JSON.stringify({ projectIds, halfOfYear, halfYear }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to assign half');
  }

  return response.json();
};

export const deleteProject = async (projectId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/projects/${projectId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete project');
  }

  const data = await response.json();
  return data;
};

// Utility function to map backend data to frontend format
export const mapBackendProjectsToSections = (backendProjects: BackendProject[]): ApiSection[] => {
  // Group projects by bucket
  const projectsByBucket = backendProjects.reduce((acc, project) => {
    if (!acc[project.bucket]) {
      acc[project.bucket] = [];
    }
    acc[project.bucket].push(project);
    return acc;
  }, {} as Record<string, BackendProject[]>);

  // Map buckets to sections
  const sections: ApiSection[] = [
    {
      id: 'tlines-ne',
      label: 'TLines NE',
      projects: (projectsByBucket['TLINES_NE'] || []).map(mapBackendProjectToFrontend)
    },
    {
      id: 'tlines-se',
      label: 'TLines SE',
      projects: (projectsByBucket['TLINES_SE'] || []).map(mapBackendProjectToFrontend)
    },
    {
      id: 'tlines-sc',
      label: 'TLines NW',
      projects: (projectsByBucket['TLINES_NW'] || []).map(mapBackendProjectToFrontend)
    },
    {
      id: 'cvw',
      label: 'TLines CVW',
      projects: (projectsByBucket['CVW'] || []).map(mapBackendProjectToFrontend)
    },
    {
      id: 'tlines-hq',
      label: 'TLines HQ',
      projects: (projectsByBucket['TLINES_HQ'] || []).map(mapBackendProjectToFrontend)
    },
    {
      id: 'tlines-tc',
      label: 'TLines TC',
      projects: (projectsByBucket['TLINES_TC'] || []).map(mapBackendProjectToFrontend)
    }
  ];

  return sections;
};

// Helper function to map backend project to frontend format
export const mapBackendProjectToFrontend = (backendProject: BackendProject): ApiProject => {
  // Generate project color using global business rules
  const projectNumberColor = getProjectColor(backendProject);

  // CRITICAL: Apply YSM + PF sorting to backend items before mapping to rows
  const sortedBackendItems = (backendProject.items || []).slice() // Copy to avoid mutation
    .sort((a, b) => {
      // First: Group by type (maintain type order)
      const typeOrder = ['MILLWORK', 'SHELVING', 'CEILING', 'IMAGE', 'FURNITURE'];
      const aTypeIndex = typeOrder.indexOf(a.type || '');
      const bTypeIndex = typeOrder.indexOf(b.type || '');
      if (aTypeIndex !== bTypeIndex) {
        return aTypeIndex - bTypeIndex;
      }

      // Within same type: priority vendors first (YSM=0, GOS=1, others=2)
      const aPri = getVendorPriority(a);
      const bPri = getVendorPriority(b);
      if (aPri !== bPri) return aPri - bPri;

      // PF sequence within same priority vendor
      if (aPri < 2) {
        return extractPFSequence(a.pfCode) - extractPFSequence(b.pfCode);
      }

      // Others: vendor name alphabetical
      return (a.vendor?.name || '').localeCompare(b.vendor?.name || '');
    });

  // Map sorted line items to rows
  const rows: ApiRow[] = sortedBackendItems.map(item => ({
    type: mapBackendTypeToFrontend(item.type, item.customType),
    pfCode: item.pfCode || '',
    vendor: item.vendor
      ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name)
      : '', // Include code for consistency, fallback to name only if code is missing
    vendorId: item.vendorId || '',
    orderType: item.orderType || '',
    pfSignStatus: mapSignStatusToFrontend(item.pfSignStatus),
    poSignStatus: mapSignStatusToFrontend(item.poSignStatus), // ADDED: Map PO sign status from backend
    status: mapItemStatusToFrontend(item.status || 'NOT_ORDERED'),
    std: item.std || '',
    etd: item.etd || '',
    rtd: item.rtd || '',
    rtr: item.rtr || '',
    rdy: item.rdy || '',
    ftd: item.ftd || '',
    snd: item.snd || '',
    statusNote: item.statusNote || '',
    pfUsd: item.pfUsd ? item.pfUsd.toString() : '',
    pfTl: item.pfTl ? item.pfTl.toString() : '',
    paymentRule: item.paymentRule || '',
    containerNo: item.containerNo || '',
    containerDate: backendProject.containerDate ? new Date(backendProject.containerDate).toISOString().split('T')[0] : '', // Project-level field, same for all rows
    itemId: item.id // 🚨 CRITICAL FIX: Add itemId for click handlers
  }));

  // Build PO Sign Status by type from actual items (FIXED: Proper aggregation)
  const poSignStatusByType: Record<string, string> = {};
  const typeGroups: Record<string, string[]> = {};

  // First, group items by type and collect their PO statuses
  (backendProject.items || []).forEach(item => {
    const frontendType = mapBackendTypeToFrontend(item.type, item.customType);
    const mappedStatus = mapSignStatusToFrontend(item.poSignStatus);

    if (!typeGroups[frontendType]) {
      typeGroups[frontendType] = [];
    }
    typeGroups[frontendType].push(mappedStatus);
  });

  // Then, determine type-level status using business rules
  Object.keys(typeGroups).forEach(frontendType => {
    const statuses = typeGroups[frontendType];

    // Business rule: Type-level status priority
    if (statuses.includes('SIGNED')) {
      // If ANY item is SIGNED, type-level shows SIGNED
      poSignStatusByType[frontendType] = 'SIGNED';
    } else if (statuses.includes('WAITING TLINES TO SIGN')) {
      poSignStatusByType[frontendType] = 'WAITING TLINES TO SIGN';
    } else if (statuses.includes('WAITING T TO SIGN')) {
      poSignStatusByType[frontendType] = 'WAITING T TO SIGN';
    } else if (statuses.includes('READY TO SIGN')) {
      // If ANY item is READY TO SIGN (but none SIGNED), show READY TO SIGN
      poSignStatusByType[frontendType] = 'READY TO SIGN';
    } else {
      // All items are NOT SIGNED
      poSignStatusByType[frontendType] = 'NOT SIGNED';
    }

  });

  return {
    projectId: backendProject.id,
    projectNumber: backendProject.projectNo, // Keep original projectNo (e.g., "DO-01", "P-123")
    projectNumberColor,
    projectName: backendProject.name,
    address: backendProject.address || '',
    region: 'Generated', // Default region since backend doesn't have this field
    rows, // Map from backend items
    poSignStatusByType, // Built from actual line items
    backendItems: backendProject.items || [], // Preserve raw backend items for editing
    isUrgent: backendProject.isUrgent || false, // Preserve urgent status from backend
    containerDate: backendProject.containerDate || null, // Preserve container date from backend
    halfOfYear: backendProject.halfOfYear || null,
    halfYear: backendProject.halfYear || null
  };
};

// (Removed old hash-based color generation - now using shared business rules)

// Helper functions to map backend enums to frontend strings - EXPORTED for use in components
export const mapBackendTypeToFrontend = (backendType: string | null, customType?: { name: string } | null): string => {
  // If custom type exists, use its name
  if (customType?.name) {
    return customType.name;
  }

  // Otherwise use enum mapping
  if (!backendType) return 'Unknown';

  const typeMap: Record<string, string> = {
    'MILLWORK': 'Millwork',
    'SHELVING': 'Shelving',
    'CEILING': 'Ceiling',
    'IMAGE': 'Image',
    'FURNITURE': 'Furniture',
    'DECORATION': 'Decoration'
  };
  return typeMap[backendType] || backendType;
};

export const mapSignStatusToFrontend = (backendStatus: string): string => {
  const statusMap: Record<string, string> = {
    'NOT_SIGNED': 'NOT SIGNED',
    'READY_TO_SIGN': 'READY TO SIGN',
    'SIGNED': 'SIGNED',
    'WAITING_TLINES_TO_SIGN': 'WAITING TLINES TO SIGN',
    'WAITING_T_TO_SIGN': 'WAITING T TO SIGN',
    'SIGNED_WITH_EST_PRICE': 'SIGNED WITH EST PRICE',
    // Retired price variants (data was migrated to SIGNED) — display as SIGNED if any linger
    'SIGNED_NO_PRICE': 'SIGNED',
    'SIGNED_WITH_PRICE': 'SIGNED',
  };
  return statusMap[backendStatus] || backendStatus;
};

// 🚨 NEW: Map display values back to backend enum values for PATCH requests
export const mapSignStatusToEnum = (displayValue: string): string => {
  const enumMap: Record<string, string> = {
    'NOT SIGNED': 'NOT_SIGNED',
    'READY TO SIGN': 'READY_TO_SIGN',
    'SIGNED': 'SIGNED',
    'WAITING TLINES TO SIGN': 'WAITING_TLINES_TO_SIGN',
    'WAITING T TO SIGN': 'WAITING_T_TO_SIGN',
    'SIGNED WITH EST PRICE': 'SIGNED_WITH_EST_PRICE',
  };
  return enumMap[displayValue] || displayValue;
};

// 🚨 NEW: Map frontend display types back to backend enum values
export const mapTypeToEnum = (displayValue: string): string => {
  const enumMap: Record<string, string> = {
    'Millwork': 'MILLWORK',
    'Shelving': 'SHELVING',
    'Ceiling': 'CEILING',
    'Image': 'IMAGE',
    'Furniture': 'FURNITURE',
    'Decoration': 'DECORATION'
  };
  return enumMap[displayValue] || displayValue;
};

export const mapItemStatusToFrontend = (backendStatus: string | null): string => {
  if (!backendStatus) return '';

  const statusMap: Record<string, string> = {
    'HOLD_T': 'HOLD / T',
    'HOLD_PM': 'HOLD / PM',
    'HOLD_BOOKS': 'HOLD BOOKS',
    'NOT_ORDERED': 'NOT ORDERED',
    'TO_ORDER': 'TO ORDER',
    'BOOKS_IN_PROGRESS': 'BOOKS IN PROGRESS',
    'ORDERED': 'ORDERED',
    'ASSEMBLY': 'ASSEMBLY',
    'READY_TO_RECEIVE': 'READY TO RECEIVE',
    'RECEIVED': 'RECEIVED',
    'READY': 'READY',
    'SENT_TO_TLINES': 'SENT TO TLINES',
    'PARTIAL_SENT': 'PARTIAL SENT',
    'SENT': 'SENT'
  };
  return statusMap[backendStatus] || backendStatus;
};

// Helper function to map frontend section to backend bucket
export const mapSectionToBucket = (sectionId: string): 'TLINES_NE' | 'TLINES_SE' | 'TLINES_NW' | 'CVW' | 'TLINES_HQ' | 'TLINES_TC' => {
  switch (sectionId) {
    case 'tlines-ne':
      return 'TLINES_NE';
    case 'tlines-se':
      return 'TLINES_SE';
    case 'tlines-sc':
      return 'TLINES_NW';
    case 'cvw':
      return 'CVW';
    case 'tlines-hq':
      return 'TLINES_HQ';
    case 'tlines-tc':
      return 'TLINES_TC';
    default:
      throw new Error(`Unknown section ID: ${sectionId}`);
  }
};