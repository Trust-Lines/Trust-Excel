import { apiFetch } from './auth';
import type { Project } from '../types';
import type { BackendProjectItem } from './projects';
import { mapBackendTypeToFrontend, mapSignStatusToFrontend } from './projects';

/* ============================================================================
 * Trust Stock — purchases Trust makes for its own stock (Trust Stock company).
 * Groups ("STOCK 1", "STOCK 2" …) play the role of projects; items mirror
 * project items so the shared ProjectBlock table can render/edit them.
 * ========================================================================== */

const API_BASE = '/api/trust-stock';

export interface TrustStockItem {
  id: string;
  groupId: string;
  type: string | null;
  customTypeId: string | null;
  customType?: { id: string; name: string; code: string; description?: string | null } | null;
  vendorId: string | null;
  vendor?: { id: string; code: string; name: string } | null;
  pfCode: string | null;
  orderNo: string | null;
  orderType: string | null;
  pfSignStatus: string;
  poSignStatus: string;
  status: string | null;
  std: string | null;
  etd: string | null;
  rtr: string | null;
  rtd: string | null;
  rdy: string | null;
  ftd: string | null;
  snd: string | null;
  pfUsd: string | number | null;
  pfTl: string | number | null;
  invoice: string | number | null;
  invoiceTl: string | number | null;
  paidUsd1: string | number | null;
  paidUsd2: string | number | null;
  paidTl1: string | number | null;
  paidTl2: string | number | null;
  paidUsd1Date: string | null;
  paidUsd2Date: string | null;
  paidTl1Date: string | null;
  paidTl2Date: string | null;
  paymentRule: string | null;
  statusNote: string | null;
  priceNotes: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrustStockGroup {
  id: string;
  code: string;
  name: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: TrustStockItem[];
}

async function json<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || fallback);
  }
  return res.json();
}

export async function getTrustStockGroups(): Promise<TrustStockGroup[]> {
  const data = await json<{ data: TrustStockGroup[] }>(await apiFetch(`${API_BASE}/groups`), 'Failed to load Trust Stock');
  return data.data;
}

/** Leave `code` empty to get the next "STOCK n". */
export async function createTrustStockGroup(data: { code?: string; name?: string }): Promise<TrustStockGroup> {
  return json(await apiFetch(`${API_BASE}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }), 'Failed to create stock group');
}

export async function deleteTrustStockGroup(groupId: string): Promise<void> {
  await json(await apiFetch(`${API_BASE}/groups/${groupId}`, { method: 'DELETE' }), 'Failed to delete stock group');
}

export async function createTrustStockItem(groupId: string, data: Record<string, any>): Promise<BackendProjectItem> {
  const item = await json<TrustStockItem>(await apiFetch(`${API_BASE}/groups/${groupId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }), 'Failed to create stock item');
  return mapTrustStockItemToBackendItem(item);
}

export async function updateTrustStockItem(itemId: string, data: Record<string, any>): Promise<BackendProjectItem> {
  const item = await json<TrustStockItem>(await apiFetch(`${API_BASE}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }), 'Failed to update stock item');
  return mapTrustStockItemToBackendItem(item);
}

export async function deleteTrustStockItem(itemId: string): Promise<void> {
  await json(await apiFetch(`${API_BASE}/items/${itemId}`, { method: 'DELETE' }), 'Failed to delete stock item');
}

/** Stock item → the BackendProjectItem shape ProjectBlock / AccountingGrid work with. */
export function mapTrustStockItemToBackendItem(item: TrustStockItem): BackendProjectItem {
  return {
    ...(item as any),
    projectId: item.groupId,
    vendor: item.vendor ? { id: item.vendor.id, code: item.vendor.code, name: item.vendor.name } : undefined,
    containerNo: null,
    containerDate: null,
    duePaid: false,
  } as BackendProjectItem;
}

/** Stock group → the Project shape ProjectBlock renders ("STOCK 1" in the project-number column). */
export function mapTrustStockGroupToProject(group: TrustStockGroup): Project {
  const items = group.items || [];
  return {
    projectId: group.id,
    projectNumber: group.code,
    projectNumberColor: 'green',
    projectName: group.name || group.code,
    address: '',
    isUrgent: false,
    region: 'TRUST_STOCK',
    poSignStatusByType: {},
    rows: items.map(item => ({
      type: mapBackendTypeToFrontend(item.type as any, item.customType as any),
      pfCode: item.pfCode || '',
      vendor: item.vendor ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name) : '',
      vendorId: item.vendorId || '',
      orderType: item.orderType || '',
      pfSignStatus: mapSignStatusToFrontend(item.pfSignStatus as any),
      poSignStatus: mapSignStatusToFrontend(item.poSignStatus as any),
      status: (item.status || '').replace(/_/g, ' '),
      statusNote: item.statusNote || '',
      std: item.std || '',
      etd: item.etd || '',
      rtd: item.rtd || '',
      rtr: item.rtr || '',
      rdy: item.rdy || '',
      ftd: item.ftd || '',
      snd: item.snd || '',
      pfUsd: item.pfUsd != null ? String(item.pfUsd) : '',
      pfTl: item.pfTl != null ? String(item.pfTl) : '',
      paymentRule: item.paymentRule || '',
      containerNo: '',
      containerDate: '',
      customTypeId: item.customTypeId || null,
      itemId: item.id,
    })) as any,
    backendItems: items.map(mapTrustStockItemToBackendItem),
  } as Project;
}
