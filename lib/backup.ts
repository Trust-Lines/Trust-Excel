import { apiFetch, getToken } from './auth';

export interface FileRestoreResult {
  file: string;
  projectsCreated: number;
  projectsSkipped: number;
  itemsCreated: number;
  itemsSkipped: number;
  errors: string[];
}

export interface RestoreResult {
  results: FileRestoreResult[];
  totalDuration: number;
}

export async function getBackupDates(): Promise<string[]> {
  const res = await apiFetch('/api/backups');
  if (!res.ok) throw new Error('Failed to fetch backup dates');
  const data = await res.json();
  return data.dates;
}

export async function getBackupFiles(date: string): Promise<string[]> {
  const res = await apiFetch(`/api/backups/${date}`);
  if (!res.ok) throw new Error(`Failed to fetch files for ${date}`);
  const data = await res.json();
  return data.files;
}

export async function restoreFromBackup(date: string, files?: string[]): Promise<RestoreResult> {
  const res = await apiFetch(`/api/backups/restore/${date}`, {
    method: 'POST',
    body: JSON.stringify({ files }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Restore failed');
  }
  return res.json();
}

export async function restoreFromUpload(file: File, fileType: string): Promise<RestoreResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileType', fileType);

  // Can't use apiFetch because it forces Content-Type: application/json.
  // FormData needs browser to set multipart/form-data with boundary automatically.
  const token = getToken();
  const API_URL = import.meta.env.PROD
    ? ''
    : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');
  const fullUrl = API_URL ? `${API_URL}/backups/restore/upload` : '/api/backups/restore/upload';

  const res = await fetch(fullUrl, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Upload restore failed');
  }
  return res.json();
}

export async function triggerBackup(): Promise<{ message: string; directory: string }> {
  const res = await apiFetch('/api/backups/trigger');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Backup failed');
  }
  return res.json();
}

export const RESTORABLE_FILE_TYPES = [
  'Projects',
  'DirectOrders',
  'MissingExtra',
  'Expenses_P',
  'Expenses_DO',
  'Expenses_ME',
  'TrustExpenses',
] as const;
