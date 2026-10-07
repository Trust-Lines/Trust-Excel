import { apiFetch } from './auth';
import type { TrustExpenseProject, TrustExpenseItem, TrustExpenseProjectsResponse, TrustExpenseItemsResponse } from '../types/trustExpense';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ==================== PROJECT API ====================

export const getTrustExpenseProjects = async (): Promise<TrustExpenseProjectsResponse> => {
  const response = await apiFetch(`${API_URL}/trust-expenses/projects`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch trust expense projects');
  }
  return response.json();
};

export const createTrustExpenseProject = async (data: {
  bucket: string;
  projectNo: string;
  name: string;
  address?: string;
  description?: string;
  types?: string[];
}): Promise<TrustExpenseProject> => {
  const response = await apiFetch(`${API_URL}/trust-expenses/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create trust expense project');
  }
  return response.json();
};

// ==================== FLAT ITEM API ====================

export const getTrustExpenseItems = async (): Promise<TrustExpenseItemsResponse> => {
  const response = await apiFetch(`${API_URL}/trust-expenses/items`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch trust expense items');
  }
  return response.json();
};

export const createTrustExpenseItemDirect = async (
  data: Partial<TrustExpenseItem>,
): Promise<TrustExpenseItem> => {
  const response = await apiFetch(`${API_URL}/trust-expenses/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create trust expense item');
  }
  return response.json();
};

export const reorderTrustExpenseItems = async (
  items: { id: string; sortOrder: number }[],
): Promise<{ message: string; count: number }> => {
  const response = await apiFetch(`${API_URL}/trust-expenses/items/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to reorder trust expense items');
  }
  return response.json();
};

// ==================== ITEM API ====================

export const addTrustExpenseItem = async (
  projectId: string,
  data: Partial<TrustExpenseItem>,
): Promise<TrustExpenseItem> => {
  const response = await apiFetch(`${API_URL}/trust-expenses/projects/${projectId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to add trust expense item');
  }
  return response.json();
};

export const updateTrustExpenseItem = async (
  itemId: string,
  data: Partial<TrustExpenseItem>,
): Promise<TrustExpenseItem> => {
  const response = await apiFetch(`${API_URL}/trust-expenses/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update trust expense item');
  }
  return response.json();
};

export const deleteTrustExpenseItem = async (itemId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/trust-expenses/items/${itemId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete trust expense item');
  }
  return response.json();
};
