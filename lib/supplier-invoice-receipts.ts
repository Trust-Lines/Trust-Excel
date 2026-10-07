import { apiFetch } from './auth';

export interface InvoiceReceiptRow {
  id: string;
  itemId: string;
  mode: string;
  vendorId: string;
  region: string;
  projectId: string; // ✅ NEW: Project-based
  transactionNo: string;
  invoiceNumber: string;
  quickBook: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceReceiptData {
  vendorCode: string;
  mode: string;
  itemMap: Record<string, InvoiceReceiptRow>;
  regions: Record<string, InvoiceReceiptRow[]>;
}

export async function getInvoiceReceiptsByMode(vendorCode: string, mode: string, projectId?: string): Promise<InvoiceReceiptData> {
  let url = `/api/supplier-invoice-receipts?vendorCode=${vendorCode}&mode=${mode}`;
  if (projectId) {
    url += `&projectId=${projectId}`;
  }
  const response = await apiFetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch invoice receipt rows');
  }
  return response.json();
}

export async function upsertInvoiceReceiptByItem(itemId: string, data: {
  itemId: string;
  mode: string;
  vendorCode: string;
  region: string;
  projectId: string; // ✅ NEW: Project-based
  transactionNo?: string;
  invoiceNumber?: string;
  quickBook?: string;
}): Promise<InvoiceReceiptRow> {
  const response = await apiFetch(`/api/supplier-invoice-receipts/item/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to upsert invoice receipt row');
  }
  return response.json();
}

export async function updateInvoiceReceiptRow(
  id: string,
  data: {
    transactionNo?: string;
    invoiceNumber?: string;
    quickBook?: string;
  }
): Promise<InvoiceReceiptRow> {
  const response = await apiFetch(`/api/supplier-invoice-receipts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update invoice receipt row');
  }
  return response.json();
}

export async function deleteInvoiceReceiptRow(id: string): Promise<void> {
  const response = await apiFetch(`/api/supplier-invoice-receipts/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete invoice receipt row');
  }
}

// ✅ Backward compatibility functions for legacy components
export async function getInvoiceReceiptRows(vendorCode: string): Promise<InvoiceReceiptData> {
  return getInvoiceReceiptsByMode(vendorCode, 'PROJECT'); // Default to PROJECT mode
}

export async function createInvoiceReceiptRow(data: {
  vendorCode: string;
  region: string;
  blockIndex: number;
  transactionNo?: string;
  invoiceNumber?: string;
  quickBook?: string;
}): Promise<InvoiceReceiptRow> {
  // Create a temporary itemId for this operation
  const tempItemId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return upsertInvoiceReceiptByItem(tempItemId, {
    itemId: tempItemId,
    mode: 'PROJECT',
    vendorCode: data.vendorCode,
    region: data.region,
    projectId: 'temp', // Temporary projectId
    transactionNo: data.transactionNo || '',
    invoiceNumber: data.invoiceNumber || '',
    quickBook: data.quickBook || '',
  });
}
