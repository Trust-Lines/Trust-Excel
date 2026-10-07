// Today's PFs API helper
import { apiFetch } from './auth';

export type TodayPfKind = 'PF' | 'ORDER' | 'FOLLOWUP';

export interface TodayPfFlag {
  id: string;
  kind: TodayPfKind;
  projectId: string;
  projectNo: string;
  projectName: string;
  bucket: string;
  type: string | null;
  customTypeId: string | null;
  typeLabel: string;
  createdAt: string;
  completedAt: string | null;
  itemId: string | null; // ORDER flags target one specific PF; PF flags are type-level (null)
  pfCode: string | null;
  vendorName: string | null;
  itemStatus: string | null;
  totalItems: number;
  filledItems: number;
}

export const getTodayPfFlags = async (): Promise<TodayPfFlag[]> => {
  const response = await apiFetch('/api/today-pf');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch Today's PFs");
  }
  return response.json();
};

export const createTodayPfFlag = async (data: { projectId: string; type?: string; customTypeId?: string; kind?: TodayPfKind; itemId?: string }): Promise<TodayPfFlag> => {
  const response = await apiFetch('/api/today-pf', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create flag');
  }
  return response.json();
};

export const deleteTodayPfFlag = async (id: string): Promise<{ message: string }> => {
  const response = await apiFetch(`/api/today-pf/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to remove flag');
  }
  return response.json();
};

/**
 * Token used to match a flag against a grid row: projectId + the same display
 * type label shown in the TYPE column (e.g. "Millwork", "Image", or a custom
 * type's name) — this is what a Row's `type` field already carries, so no
 * raw enum/customTypeId reconciliation is needed on the frontend.
 */
export const todayPfKey = (projectId: string, typeLabel: string): string => `${projectId}:${typeLabel}`;

/** Token for an item-level (To Order) flag — matched against a Row's itemId. */
export const todayPfItemKey = (itemId: string): string => `item:${itemId}`;

export const todayPfActiveKeys = (flags: TodayPfFlag[]): Set<string> =>
  new Set(flags.map(f => (f.itemId ? todayPfItemKey(f.itemId) : todayPfKey(f.projectId, f.typeLabel))));
