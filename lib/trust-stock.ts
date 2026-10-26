import { apiFetch, getToken } from './auth';
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

/* ── PF PDF import ─────────────────────────────────────────────────────────── */

export interface ParsedStockProduct {
  itemCode: string;
  description: string;
  category: string | null;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
}

export interface PfPdfPreview {
  stockCode: string | null;
  pfCode: string | null;
  supplierName: string | null;
  vendor: { id: string; code: string; name: string } | null;
  pfDate: string | null;
  type: string | null;
  currency: 'USD' | 'TL' | 'EUR';
  totalPrice: number | null;
  paymentRule: string | null;
  products: ParsedStockProduct[];
  warnings: string[];
  groupStatus: 'new' | 'exists' | 'in-trash';
  duplicateOf: { itemId: string; groupCode: string } | null;
}

export interface PfImportData {
  stockCode: string;
  pfCode: string;
  vendorId: string | null;
  type: string | null;
  orderNo?: string | null;
  pfDate: string | null;
  currency: 'USD' | 'TL' | 'EUR';
  totalPrice: number | null;
  paymentRule: string | null;
  products: ParsedStockProduct[];
}

// Multipart uploads can't go through apiFetch (it forces a JSON content type)
async function uploadForm(path: string, form: FormData) {
  const token = getToken();
  const base = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');
  const url = base ? `${base}${path.replace(/^\/api/, '')}` : path;
  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
    credentials: 'include',
  });
  return json<any>(res, 'Upload failed');
}

export async function previewTrustStockPdf(file: File): Promise<PfPdfPreview> {
  const form = new FormData();
  form.append('file', file);
  return uploadForm(`${API_BASE}/pdf/preview`, form);
}

export async function importTrustStockPdf(file: File, data: PfImportData): Promise<TrustStockItem> {
  const form = new FormData();
  form.append('file', file);
  form.append('data', JSON.stringify(data));
  return uploadForm(`${API_BASE}/pdf/import`, form);
}

/** Opens the stored PF PDF in a new tab. */
export async function openTrustStockPdf(itemId: string): Promise<void> {
  const win = window.open('', '_blank'); // open synchronously so popup blockers allow it
  const res = await apiFetch(`${API_BASE}/items/${itemId}/pdf`);
  if (!res.ok) {
    win?.close();
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'PDF not available');
  }
  const url = URL.createObjectURL(await res.blob());
  if (win) win.location.href = url; else window.open(url, '_blank');
}

/* ── Stock contents & usage ────────────────────────────────────────────────── */

export type StockMoveKind = 'TAKEN' | 'RETURNED' | 'RESERVED';
export type StockStatus = 'PENDING_VERIFICATION' | 'OUT_OF_STOCK' | 'REORDER_NOW' | 'WATCH' | 'HEALTHY';

export interface StockProductUsage {
  id: string;
  kind: StockMoveKind;
  quantity: number;
  note: string | null;
  takenBy: string | null;
  createdAt: string;
  projectItemId: string;
  projectNo: string;
  projectName: string;
  projectPfCode: string | null;
  rowDeleted: boolean;
}

export interface StockProduct {
  id: string;
  itemCode: string;
  description: string;
  dimensions: string | null;
  category: string | null;
  /** original ordered quantity */
  quantity: number;
  receivedAt: string | null;
  // stock-sheet figures (see TrustStockService.stats)
  ordered: number;
  received: number | null;
  taken: number;
  returned: number;
  netUsed: number;
  reserved: number;
  onHand: number | null;
  available: number | null;
  remainingPct: number | null;
  reorderThreshold: number | null;
  /** suggested re-order (ordered − available) once at the reorder point; 0 otherwise */
  reorderQty: number;
  status: StockStatus;
  /** what can still be taken/reserved (ordered qty is the cap until the receipt is confirmed) */
  takeable: number;
  unitPrice: number | null;
  totalPrice: number | null;
  currency: string;
  stockItem: {
    id: string;
    pfCode: string | null;
    orderNo: string | null;
    pfDate: string | null;
    type: string | null;
    hasPdf: boolean;
    vendor: { id: string; code: string; name: string } | null;
    group: { id: string; code: string };
  };
  usages: StockProductUsage[];
}

export async function getStockProducts(): Promise<StockProduct[]> {
  return json(await apiFetch(`${API_BASE}/products`), 'Failed to load stock contents');
}

/** Same list, readable with Projects access (used by the "Use from Trust Stock" picker). */
export async function getAvailableStockProducts(): Promise<StockProduct[]> {
  return json(await apiFetch(`${API_BASE}/usage/products`), 'Failed to load stock');
}

export async function updateStockProduct(id: string, data: Partial<Pick<StockProduct, 'itemCode' | 'description' | 'dimensions' | 'quantity' | 'unitPrice' | 'totalPrice'>> & { receivedQuantity?: number | null }) {
  return json(await apiFetch(`${API_BASE}/products/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }), 'Failed to update product');
}

export async function deleteStockProduct(id: string) {
  return json(await apiFetch(`${API_BASE}/products/${id}`, { method: 'DELETE' }), 'Failed to remove product');
}

export interface RowStockUsage {
  id: string;
  kind: StockMoveKind;
  quantity: number;
  note: string | null;
  takenBy: string | null;
  createdAt: string;
  productId: string;
  itemCode: string;
  description: string;
  unitPrice: number | null;
  currency: string;
  stockPfCode: string | null;
  stockCode: string;
}

export async function getRowStockUsage(projectItemId: string): Promise<RowStockUsage[]> {
  return json(await apiFetch(`${API_BASE}/usage?projectItemId=${encodeURIComponent(projectItemId)}`), 'Failed to load stock usage');
}

export async function addStockUsage(projectItemId: string, productId: string, quantity: number) {
  return json(await apiFetch(`${API_BASE}/usage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectItemId, productId, quantity }),
  }), 'Failed to use stock');
}

export interface StockMovementLine { productId: string; take?: number; reserve?: number; return?: number; note?: string }

/** Take / reserve / return several products for one Projects row in one go. */
export async function applyStockMovements(projectItemId: string, lines: StockMovementLine[], takenBy: string): Promise<RowStockUsage[]> {
  return json(await apiFetch(`${API_BASE}/usage/movements`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectItemId, takenBy, lines }),
  }), 'Failed to save stock movements');
}

export const STOCK_STATUS_STYLE: Record<StockStatus, { label: string; bg: string; fg: string }> = {
  HEALTHY: { label: 'HEALTHY', bg: '#dcfce7', fg: '#166534' },
  WATCH: { label: 'WATCH', bg: '#fef3c7', fg: '#92400e' },
  REORDER_NOW: { label: 'REORDER NOW', bg: '#fee2e2', fg: '#b91c1c' },
  OUT_OF_STOCK: { label: 'OUT OF STOCK', bg: '#7f1d1d', fg: '#ffffff' },
  PENDING_VERIFICATION: { label: 'PENDING VERIFICATION', bg: '#e5e7eb', fg: '#374151' },
};

export async function removeStockUsage(id: string) {
  return json(await apiFetch(`${API_BASE}/usage/${id}`, { method: 'DELETE' }), 'Failed to remove usage');
}

/** The Trust Stock company as a vendor in the Projects table ("TR-STOCK"). */
export function isStockVendorCode(code?: string | null): boolean {
  return !!code && code.toUpperCase().replace(/[^A-Z]/g, '') === 'TRSTOCK';
}

/** Names entered before as "taken by" (for the dropdown). */
export async function getStockPeople(): Promise<string[]> {
  return json(await apiFetch(`${API_BASE}/usage/people`), 'Failed to load names');
}
