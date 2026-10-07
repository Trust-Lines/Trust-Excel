import { apiFetch } from './auth';

export interface PaymentRule {
  id: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRuleRequest {
  value: string;
}

/**
 * Get all payment rules
 */
export const getPaymentRules = async (): Promise<PaymentRule[]> => {
  const response = await apiFetch('/api/payment-rules');

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch payment rules');
  }

  return response.json();
};

/**
 * Create a new payment rule
 */
export const createPaymentRule = async (request: CreatePaymentRuleRequest): Promise<PaymentRule> => {
  const response = await apiFetch('/api/payment-rules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create payment rule');
  }

  return response.json();
};