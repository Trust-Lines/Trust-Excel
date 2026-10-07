// Direct Order API functions - mirrors projects.ts structure

import { Project, CreateProjectData, ProjectsData } from '../types';
import { apiFetch } from './auth';
import { mapTypeToEnum, ProjectHalf } from './projects';

// ===================== PROJECT API FUNCTIONS =====================

export async function getDirectOrders(bucket?: string): Promise<ProjectsData> {

  let url = '/api/direct-orders';
  if (bucket) {
    url += `?bucket=${bucket}`;
  }

  const response = await apiFetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ DIRECT_ORDER_FETCH_FAIL', {
      status: response.status,
      statusText: response.statusText,
      bodyPreview: errorText.substring(0, 200),
    });
    throw new Error(`Failed to fetch direct orders: ${response.statusText}`);
  }

  const data = await response.json();
  

  return data;
}

export async function bulkAssignDirectOrderHalf(
  projectIds: string[],
  halfOfYear: ProjectHalf | null,
  halfYear: number | null,
): Promise<{ updatedCount: number }> {
  const response = await apiFetch('/api/direct-orders/bulk/half', {
    method: 'PATCH',
    body: JSON.stringify({ projectIds, halfOfYear, halfYear }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to assign half');
  }

  return response.json();
}

export async function getDirectOrderById(projectId: string): Promise<Project> {

  const response = await apiFetch(`/api/direct-orders/${projectId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch direct order: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export async function createDirectOrder(data: CreateProjectData): Promise<Project> {

  // Convert frontend display types to backend enum values
  const backendTypes = data.types?.map(type => mapTypeToEnum(type)) || [];

  const response = await apiFetch('/api/direct-orders', {
    method: 'POST',
    body: JSON.stringify({
      projectNo: data.projectNo,
      name: data.name,
      address: data.address,
      bucket: data.bucket,
      description: data.description,
      status: data.status || 'PRE_PROJECT',
      types: backendTypes, // ✅ FIX: Convert display values to enum values
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ Direct order creation error:', errorData);
    throw new Error(errorData.message || `Failed to create direct order: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
}

export async function updateDirectOrder(projectId: string, data: Partial<CreateProjectData>): Promise<Project> {
  const response = await apiFetch(`/api/direct-orders/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update direct order: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteDirectOrder(projectId: string): Promise<void> {
  const response = await apiFetch(`/api/direct-orders/${projectId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete direct order: ${response.statusText}`);
  }
}

// ===================== ITEM API FUNCTIONS =====================

export async function createDirectOrderItem(projectId: string, data: any): Promise<any> {

  const response = await apiFetch(`/api/direct-orders/${projectId}/items`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ Direct order item creation error:', errorData);
    throw new Error(errorData.message || `Failed to create direct order item: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
}

export async function updateDirectOrderItem(
  projectId: string,
  itemId: string,
  data: Record<string, any>
): Promise<any> {

  const response = await apiFetch(`/api/direct-orders/${projectId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [DIRECT ORDER UPDATE] API Error:', {
      status: response.status,
      statusText: response.statusText,
      responseText: errorText,
      requestData: data,
      projectId,
      itemId,
      url: `/api/direct-orders/${projectId}/items/${itemId}`,
      timestamp: new Date().toISOString()
    });

    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.message || `Failed to update direct order item: ${response.statusText}`);
    } catch (parseError) {
      throw new Error(`Failed to update direct order item: ${response.statusText} - ${errorText}`);
    }
  }

  const result = await response.json();
  return result;
}

export async function deleteDirectOrderItem(projectId: string, itemId: string): Promise<void> {
  const response = await apiFetch(`/api/direct-orders/${projectId}/items/${itemId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete direct order item: ${response.statusText}`);
  }
}