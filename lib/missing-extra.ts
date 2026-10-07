// Missing & Extra API helper
import { apiFetch } from './auth';
import { sanitizeProjectItemPayload } from './sanitizePayload';
import { ProjectHalf } from './projects';

// Backend interfaces for Missing & Extra
export interface BackendMissingExtraCase {
  id: string;
  baseProjectId: string | null;
  baseProjectNo: string;
  baseProjectName: string;
  section: 'TLINES_NE' | 'TLINES_SE' | 'TLINES_NW' | 'CVW' | 'TLINES_HQ' | 'TLINES_TC';
  caseType: 'MISSING' | 'EXTRA' | 'REPLACEMENT';
  caseIndex: number;
  derivedProjectCode: string; // e.g., '301-MS-1'
  types: string[];
  isUrgent?: boolean; // ✅ ADD: Urgent status
  containerDate?: string | null; // ✅ ADD: Container date
  halfOfYear?: ProjectHalf | null;
  halfYear?: number | null;
  createdAt: string;
  updatedAt: string;
  baseProject?: {
    id: string;
    projectNo: string;
    name: string;
  } | null;
  items?: BackendMissingExtraItem[];
}

export interface BackendMissingExtraItem {
  id: string;
  caseId: string;
  type: 'MILLWORK' | 'SHELVING' | 'CEILING' | 'IMAGE' | 'FURNITURE' | null;
  customTypeId: string | null;
  pfCode: string | null;
  vendorId: string | null;
  orderType: string | null;
  pfSignStatus: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED';
  poSignStatus: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED';
  status: 'HOLD_T' | 'HOLD_PM' | 'HOLD_BOOKS' | 'NOT_ORDERED' | 'TO_ORDER' | 'ORDERED' | 'ASSEMBLY' | 'READY_TO_RECEIVE' | 'RECEIVED' | 'READY' | 'SENT_TO_TLINES' | 'PARTIAL_SENT' | 'SENT' | null;
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
  containerDate: string | null;
  paymentRule: string | null;
  invoice: number | null;
  invoiceTl: number | null;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    code: string;
    name: string;
  } | null;
  customType?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface CreateMissingExtraCaseRequest {
  section: 'TLINES_NE' | 'TLINES_SE' | 'TLINES_NW' | 'CVW' | 'TLINES_HQ' | 'TLINES_TC';
  caseType: 'MISSING' | 'EXTRA' | 'REPLACEMENT';
  types: string[]; // Selected types for the case
  // Mode 1: From existing project
  baseProjectId?: string;
  // Mode 2: Legacy/manual project
  legacyProjectNo?: string;
  legacyProjectName?: string;
  // Optional custom case index (if not provided, auto-incremented)
  caseIndex?: number;
}

export interface CreateMissingExtraItemRequest {
  type?: 'MILLWORK' | 'SHELVING' | 'CEILING' | 'IMAGE' | 'FURNITURE';
  customTypeId?: string;
  vendorId?: string;
  orderType?: string;
  pfSignStatus?: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED';
  poSignStatus?: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED';
  status?: 'HOLD_T' | 'HOLD_PM' | 'HOLD_BOOKS' | 'NOT_ORDERED' | 'TO_ORDER' | 'ORDERED' | 'ASSEMBLY' | 'READY_TO_RECEIVE' | 'RECEIVED' | 'READY' | 'SENT_TO_TLINES' | 'PARTIAL_SENT' | 'SENT';
  std?: string; // ISO date string
  etd?: string; // ISO date string
  rtd?: string; // ISO date string
  ftd?: string; // ISO date string
  containerNo?: string;
  containerDate?: string;
}

export interface UpdateMissingExtraItemRequest {
  vendorId?: string;
  orderType?: string;
  pfSignStatus?: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED';
  poSignStatus?: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED';
  status?: 'HOLD_T' | 'HOLD_PM' | 'HOLD_BOOKS' | 'NOT_ORDERED' | 'TO_ORDER' | 'ORDERED' | 'ASSEMBLY' | 'READY_TO_RECEIVE' | 'RECEIVED' | 'READY' | 'SENT_TO_TLINES' | 'PARTIAL_SENT' | 'SENT';
  std?: string; // ISO date string
  etd?: string; // ISO date string
  rtd?: string; // ISO date string
  ftd?: string; // ISO date string
  rdy?: string; // ISO date string
  snd?: string; // ISO date string
  pfUsd?: number; // PF USD amount
  pfTl?: number; // PF TL amount
  containerNo?: string;
  containerDate?: string;
  paymentRule?: string; // Payment rule value
  invoice?: number | null;
  invoiceTl?: number | null;
}

export interface GroupedMissingExtraCasesResponse {
  TLINES_NE?: BackendMissingExtraCase[];
  TLINES_SE?: BackendMissingExtraCase[];
  TLINES_NW?: BackendMissingExtraCase[];
  CVW?: BackendMissingExtraCase[];
  TLINES_HQ?: BackendMissingExtraCase[];
  TLINES_TC?: BackendMissingExtraCase[];
}

// ==================== MISSING EXTRA CASE API FUNCTIONS ====================

export const getMissingExtraCases = async (): Promise<GroupedMissingExtraCasesResponse> => {
  const response = await apiFetch(`/api/missing-extra/cases`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch Missing & Extra cases');
  }

  const data = await response.json();
  return data;
};

export const getMissingExtraCase = async (caseId: string): Promise<BackendMissingExtraCase> => {
  const response = await apiFetch(`/api/missing-extra/cases/${caseId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch Missing & Extra case');
  }

  const data = await response.json();
  return data;
};

export const createMissingExtraCase = async (caseData: CreateMissingExtraCaseRequest): Promise<BackendMissingExtraCase> => {
  const response = await apiFetch(`/api/missing-extra/cases`, {
    method: 'POST',
    body: JSON.stringify(caseData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create Missing & Extra case');
  }

  const data = await response.json();
  return data;
};

export const updateMissingExtraCase = async (caseId: string, updates: { isUrgent?: boolean; containerDate?: string | null }): Promise<BackendMissingExtraCase> => {
  const response = await apiFetch(`/api/missing-extra/cases/${caseId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update Missing & Extra case');
  }

  const data = await response.json();
  return data;
};

export const bulkAssignMissingExtraHalf = async (
  caseIds: string[],
  halfOfYear: ProjectHalf | null,
  halfYear: number | null,
): Promise<{ updatedCount: number }> => {
  const response = await apiFetch(`/api/missing-extra/cases/bulk/half`, {
    method: 'PATCH',
    body: JSON.stringify({ caseIds, halfOfYear, halfYear }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to assign half');
  }

  return response.json();
};

export const getMissingExtraCaseItems = async (caseId: string): Promise<BackendMissingExtraItem[]> => {
  const response = await apiFetch(`/api/missing-extra/cases/${caseId}/items`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch Missing & Extra case items');
  }

  const data = await response.json();
  return data;
};

// ==================== MISSING EXTRA ITEM API FUNCTIONS ====================

export const createMissingExtraItem = async (caseId: string, itemData: CreateMissingExtraItemRequest): Promise<BackendMissingExtraItem> => {
  // Sanitize payload to remove UI-only fields
  const sanitizedData = sanitizeProjectItemPayload(itemData);

  const response = await apiFetch(`/api/missing-extra/cases/${caseId}/items`, {
    method: 'POST',
    body: JSON.stringify(sanitizedData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create Missing & Extra item');
  }

  const data = await response.json();
  return data;
};

export const updateMissingExtraItem = async (itemId: string, itemData: UpdateMissingExtraItemRequest): Promise<BackendMissingExtraItem> => {
  // Sanitize payload to remove UI-only fields
  const sanitizedData = sanitizeProjectItemPayload(itemData);

  const requestUrl = `/api/missing-extra/items/${itemId}`;
  const requestPayload = JSON.stringify(sanitizedData);

  // Frontend request logging

  const response = await apiFetch(requestUrl, {
    method: 'PATCH',
    body: requestPayload,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ [FRONTEND ERROR] Missing & Extra update failed:', {
      status: response.status,
      errorData,
      requestUrl,
      payload: itemData
    });
    throw new Error(errorData.message || 'Failed to update Missing & Extra item');
  }

  const data = await response.json();


  return data;
};

export const deleteMissingExtraItem = async (itemId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`/api/missing-extra/items/${itemId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete Missing & Extra item');
  }

  const data = await response.json();
  return data;
};

export const deleteMissingExtraCase = async (caseId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`/api/missing-extra/cases/${caseId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete Missing & Extra case');
  }

  const data = await response.json();
  return data;
};