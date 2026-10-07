import { apiClient } from './api';

export interface TrashEntry {
  id: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  moduleGroup: string;
  deletedAt: string;
  deletedByUserId: string | null;
  deletedByName: string | null;
  deletedReason: string | null;
  restoreUntil: string;
  parentId: string | null;
  parentLabel: string | null;
}

export interface TrashBinResponse {
  data: TrashEntry[];
  grouped: Record<string, TrashEntry[]>;
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const MODULE_GROUP_LABELS: Record<string, string> = {
  'projects': 'Projects',
  'project-items': 'Project Items',
  'direct-orders': 'Direct Orders',
  'direct-order-items': 'Direct Order Items',
  'missing-extra': 'Missing & Extra Cases',
  'missing-extra-items': 'Missing & Extra Items',
  'trust-expense-items': 'Trust Expense Items',
  'expenses-p': 'Expenses P Projects',
  'expenses-p-items': 'Expenses P Items',
  'expenses-direct-order': 'Expenses Direct Order Projects',
  'expenses-direct-order-items': 'Expenses Direct Order Items',
  'expenses-missing-extra': 'Expenses Missing & Extra Projects',
  'expenses-missing-extra-items': 'Expenses Missing & Extra Items',
  'users': 'Users',
};

export async function fetchTrashBin(moduleGroup?: string): Promise<TrashBinResponse> {
  const params = moduleGroup ? `?moduleGroup=${moduleGroup}` : '';
  return apiClient.get(`/api/trash-bin${params}`);
}

export async function restoreTrashEntry(trashId: string): Promise<{ message: string }> {
  return apiClient.post(`/api/trash-bin/${trashId}/restore`, {});
}

export async function permanentDeleteTrashEntry(trashId: string, force = false): Promise<{ message: string }> {
  return apiClient.delete(`/api/trash-bin/${trashId}/permanent${force ? '?force=true' : ''}`);
}
