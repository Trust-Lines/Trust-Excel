import { apiFetch } from './auth';
import type { ExpensesMissingExtraProject, ExpensesMissingExtraItem, ExpensesMissingExtraProjectsResponse } from '../types/expensesMissingExtra';
import type { Project } from '../types';
import type { BackendProjectItem } from './projects';
import { mapBackendTypeToFrontend } from './projects';

const API_BASE = '/api/expenses-missing-extra';

export async function getExpensesMissingExtraProjects(): Promise<ExpensesMissingExtraProject[]> {
  const res = await apiFetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch expenses missing & extra projects');
  const json: ExpensesMissingExtraProjectsResponse = await res.json();
  return json.data;
}

export async function createExpensesMissingExtraProject(data: {
  bucket: string;
  projectNo: string;
  name: string;
}): Promise<ExpensesMissingExtraProject> {
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

export async function deleteExpensesMissingExtraProject(projectId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/projects/${projectId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
}

export async function createExpensesMissingExtraItem(
  projectId: string,
  data: Partial<ExpensesMissingExtraItem>,
): Promise<ExpensesMissingExtraItem> {
  const res = await apiFetch(`${API_BASE}/projects/${projectId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create item');
  return res.json();
}

export async function updateExpensesMissingExtraItem(
  itemId: string,
  data: Partial<ExpensesMissingExtraItem>,
): Promise<ExpensesMissingExtraItem> {
  const res = await apiFetch(`${API_BASE}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update item');
  return res.json();
}

export async function deleteExpensesMissingExtraItem(itemId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/items/${itemId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete item');
}

export function mapExpensesMEItemToBackendItem(item: ExpensesMissingExtraItem): BackendProjectItem {
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
    rtr: item.rtrd,
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
    expensesUsd: item.expensesUsd,
    expensesTl: item.expensesTl,
  } as BackendProjectItem & { expensesUsd: any; expensesTl: any };
}

export function mapExpensesMEToProject(ep: ExpensesMissingExtraProject): Project {
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
    backendItems: items.map(mapExpensesMEItemToBackendItem),
  };
}
