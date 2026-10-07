import { apiFetch } from './auth';

export interface GlobalContainerDate {
  containerNo: string;
  containerDate: string | null;
  itemId: string;
  projectId: string;
  projectType: 'project' | 'directOrder' | 'missingExtra';
  itemType: string | null;
  updatedAt: string;
}

export interface SyncContainerDateResponse {
  updated: number;
  details: GlobalContainerDate[];
}

/**
 * 🔍 GLOBAL SEARCH: Find latest container date across all projects
 */
export async function getLatestContainerDate(containerNo: string): Promise<string | null> {
  try {

    const response = await apiFetch(`/api/containers/latest-date?containerNo=${encodeURIComponent(containerNo)}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch container date: ${response.status}`);
    }

    const data = await response.json();


    // ✅ FIX: Handle both possible response formats
    const latestDate = data?.latestDate || data?.containerDate || data;


    return latestDate;
  } catch (error) {
    console.error('❌ Failed to get latest container date:', error);
    return null;
  }
}

/**
 * 📊 SEARCH: Find all containers with dates across projects
 */
export async function searchContainers(containerNo?: string): Promise<GlobalContainerDate[]> {
  try {
    const url = containerNo
      ? `/api/containers/search?containerNo=${encodeURIComponent(containerNo)}`
      : '/api/containers/search';

    const response = await apiFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to search containers: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('❌ Failed to search containers:', error);
    return [];
  }
}

/**
 * 🔄 GLOBAL SYNC: Update all items with same container number across all projects
 */
export async function syncContainerDate(containerNo: string, containerDate: string | null): Promise<SyncContainerDateResponse> {
  try {

    const response = await apiFetch('/api/containers/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        containerNo,
        containerDate
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync container date: ${response.status}`);
    }

    const data = await response.json();


    return data;
  } catch (error) {
    console.error('❌ Failed to sync container date:', error);
    throw error;
  }
}

/**
 * ✏️ RENAME: Rename container globally across all item tables
 */
export async function renameContainerGlobally(oldName: string, newName: string): Promise<{ oldName: string; newName: string; updatedItems: number }> {
  try {

    const response = await apiFetch('/api/containers/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldName, newName }),
    });

    if (!response.ok) {
      throw new Error(`Failed to rename container: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to rename container:', error);
    throw error;
  }
}

/**
 * 📋 Get all unique container names currently in use
 */
export async function getContainerNames(): Promise<string[]> {
  try {
    const response = await apiFetch('/api/containers/names', { method: 'GET' });

    if (!response.ok) {
      throw new Error(`Failed to get container names: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get container names:', error);
    return [];
  }
}

/**
 * 📈 STATS: Get container statistics across all projects
 */
export async function getContainerStats(): Promise<{
  totalContainers: number;
  containersWithDates: number;
  uniqueContainerNumbers: number;
  projectTypes: {
    project: number;
    directOrder: number;
    missingExtra: number;
  }
}> {
  try {
    const response = await apiFetch('/api/containers/stats', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to get container stats: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Failed to get container stats:', error);
    return {
      totalContainers: 0,
      containersWithDates: 0,
      uniqueContainerNumbers: 0,
      projectTypes: {
        project: 0,
        directOrder: 0,
        missingExtra: 0
      }
    };
  }
}