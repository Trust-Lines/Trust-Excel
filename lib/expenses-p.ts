import { apiFetch } from './auth';
import type { ExpensesPProject, ExpensesPItem, ExpensesPProjectsResponse } from '../types/expensesP';
import type { Project } from '../types';
import type { BackendProjectItem } from './projects';
import { mapBackendTypeToFrontend } from './projects';

const API_BASE = '/api/expenses-p';

export async function getExpensesPProjects(): Promise<ExpensesPProject[]> {
  const res = await apiFetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch expenses-p projects');
  const json: ExpensesPProjectsResponse = await res.json();
  return json.data;
}

export async function createExpensesPProject(data: {
  bucket: string;
  projectNo: string;
  name: string;
}): Promise<ExpensesPProject> {
  const res = await apiFetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create project');
  }
  return res.json();
}

export async function deleteExpensesPProject(projectId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/projects/${projectId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
}

export async function createExpensesPItem(
  projectId: string,
  data: Partial<ExpensesPItem>,
): Promise<ExpensesPItem> {
  const res = await apiFetch(`${API_BASE}/projects/${projectId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create item');
  return res.json();
}

export async function updateExpensesPItem(
  itemId: string,
  data: Partial<ExpensesPItem>,
): Promise<ExpensesPItem> {
  const res = await apiFetch(`${API_BASE}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update item');
  return res.json();
}

export async function deleteExpensesPItem(itemId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/items/${itemId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete item');
}

/**
 * Map an ExpensesPItem to BackendProjectItem-like shape for ProjectBlock compatibility.
 * ProjectBlock uses BackendProjectItem internally for state management.
 */
export function mapExpensesPItemToBackendItem(item: ExpensesPItem): BackendProjectItem {
  return {
    id: item.id,
    projectId: item.projectId,
    type: item.type as BackendProjectItem['type'],
    customTypeId: item.customTypeId,
    customType: item.customType,
    pfCode: null,
    vendorId: item.vendorId,
    orderType: item.orderType,
    pfSignStatus: 'NOT_SIGNED',
    poSignStatus: 'NOT_SIGNED',
    status: item.status as BackendProjectItem['status'],
    std: item.std,
    etd: item.etd,
    rtd: null,
    rtr: item.rtrd,  // expenses-p uses 'rtrd' → map to 'rtr' for ProjectBlock compatibility
    rdy: item.rdy,
    ftd: item.ftd,
    snd: item.snd,
    pfUsd: null,
    pfTl: null,
    paidUsd1: item.paidUsd1 as number | null,
    paidUsd2: item.paidUsd2 as number | null,
    paidTl1: item.paidTl1 as number | null,
    paidTl2: item.paidTl2 as number | null,
    invoiceTransactionNo: item.invoiceTransactionNo,
    invoiceNumber: item.invoiceNumber,
    quickBook: item.quickBook,
    containerNo: item.containerNo,
    containerDate: null,
    paymentRule: item.paymentRule,
    duePaid: false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    vendor: item.vendor ? { id: item.vendor.id, code: item.vendor.code, name: item.vendor.name } : undefined,
    // Expenses-specific fields (accessed via `as any` in ProjectBlock)
    expensesUsd: item.expensesUsd,
    expensesTl: item.expensesTl,
  } as BackendProjectItem & { expensesUsd: any; expensesTl: any };
}

/**
 * Map an ExpensesPProject to the Project format used by ProjectBlock.
 */
export function mapExpensesPToProject(ep: ExpensesPProject): Project {
  const items = ep.items || [];
  const rows = items.map(item => ({
    type: mapBackendTypeToFrontend(item.type, item.customType),
    pfCode: '',
    vendor: item.vendor
      ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name)
      : '',
    vendorId: item.vendorId || '',
    orderType: item.orderType || '',
    pfSignStatus: 'NOT SIGNED',
    poSignStatus: 'NOT SIGNED',
    status: (item.status || '').replace(/_/g, ' '),
    statusNote: (item as any).statusNote || '',
    std: item.std || '',
    etd: item.etd || '',
    rtd: '',
    rtr: '',
    rdy: item.rdy || '',
    ftd: item.ftd || '',
    snd: item.snd || '',
    pfUsd: '',
    pfTl: '',
    paymentRule: item.paymentRule || '',
    containerNo: item.containerNo || '',
    containerDate: '',
    expensesUsd: item.expensesUsd ? item.expensesUsd.toString() : '',
    expensesTl: item.expensesTl ? item.expensesTl.toString() : '',
    customTypeId: item.customTypeId || null,
    itemId: item.id,
  }));

  return {
    projectId: ep.id,
    projectNumber: ep.projectNo,
    projectNumberColor: 'orange',
    projectName: ep.name,
    address: ep.address || '',
    isUrgent: ep.isUrgent || false,
    region: ep.bucket,
    rows,
    poSignStatusByType: {},
    backendItems: items.map(mapExpensesPItemToBackendItem),
  };
}
