// PF Grouping API helper
import { apiFetch } from './auth';

export interface PfGroupMember {
  id: string;
  groupId: string;
  rank: number;
  projectId: string;
  projectNo: string;
  projectName: string;
  bucket: string;
  type: string | null;
  customTypeId: string | null;
  typeLabel: string;
}

export interface PfGroup {
  id: string;
  number: number;
  createdAt: string;
  members: PfGroupMember[];
}

export interface PfGroupTarget {
  projectId: string;
  type?: string;
  customTypeId?: string;
  rank?: number; // addPfGroupMember only: which existing tier to join
}

export const getPfGroups = async (): Promise<PfGroup[]> => {
  const response = await apiFetch('/api/pf-groups');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch groups');
  }
  return response.json();
};

/** Creates a brand-new group whose first member is this target. */
export const createPfGroup = async (target: PfGroupTarget): Promise<{ id: string; number: number }> => {
  const response = await apiFetch('/api/pf-groups', {
    method: 'POST',
    body: JSON.stringify(target),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create group');
  }
  return response.json();
};

/** Appends a target as the next member of an existing group. */
export const addPfGroupMember = async (groupId: string, target: PfGroupTarget): Promise<PfGroupMember> => {
  const response = await apiFetch(`/api/pf-groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify(target),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to add to group');
  }
  return response.json();
};

export const reorderPfGroupMember = async (memberId: string, direction: 'up' | 'down'): Promise<{ message: string }> => {
  const response = await apiFetch(`/api/pf-groups/members/${memberId}/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ direction }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to reorder');
  }
  return response.json();
};

export const removePfGroupMember = async (memberId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`/api/pf-groups/members/${memberId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to remove member');
  }
  return response.json();
};

export const deletePfGroup = async (groupId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`/api/pf-groups/${groupId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete group');
  }
  return response.json();
};

/** Token to match a group member against a grid row: projectId + the same display type label. */
export const pfGroupKey = (projectId: string, typeLabel: string): string => `${projectId}:${typeLabel}`;

/**
 * Buckets a group's members by rank (priority tier), sorted ascending — several
 * members (different projects, or different types) can share one tier, so this
 * is a grouping, not a 1:1 index.
 */
export const tiersOfGroup = (group: PfGroup): [number, PfGroupMember[]][] => {
  const byRank = new Map<number, PfGroupMember[]>();
  group.members.forEach(m => {
    const arr = byRank.get(m.rank) || [];
    arr.push(m);
    byRank.set(m.rank, arr);
  });
  return [...byRank.entries()].sort(([a], [b]) => a - b);
};
