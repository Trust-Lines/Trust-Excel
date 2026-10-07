import { apiClient } from './api';
import type { SupplierTotalResponse } from '../types/supplierTotal';

export async function fetchSupplierTotals(): Promise<SupplierTotalResponse> {
  const resp = await apiClient.get('/api/supplier-totals');
  if (!resp) {
    throw new Error('Invalid response from supplier-totals endpoint');
  }
  return resp;
}
