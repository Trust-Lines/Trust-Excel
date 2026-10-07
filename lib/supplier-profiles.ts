// Supplier Profile API functions
import { apiFetch } from './auth';

export interface SupplierProfile {
  id: string;
  vendorId: string;
  companyName: string | null;
  bankName: string | null;
  iban: string | null;
  officialName: string | null;
  noteDate: string | null; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSupplierProfileData {
  companyName?: string;
  bankName?: string;
  iban?: string;
  officialName?: string;
  noteDate?: string; // ISO date string
}

/**
 * Get supplier profile by vendor ID
 * Auto-creates empty profile if it doesn't exist
 */
export async function getSupplierProfile(vendorId: string): Promise<SupplierProfile> {
  const response = await apiFetch(`/api/supplier-profiles/${vendorId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch supplier profile: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update supplier profile by vendor ID
 */
export async function updateSupplierProfile(
  vendorId: string,
  data: UpdateSupplierProfileData
): Promise<SupplierProfile> {
  const response = await apiFetch(`/api/supplier-profiles/${vendorId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update supplier profile: ${response.statusText}`);
  }

  return response.json();
}
