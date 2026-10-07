export interface TrustExpenseProject {
  id: string;
  bucket: 'TLINES_NE' | 'TLINES_SE' | 'TLINES_NW' | 'CVW' | 'TLINES_HQ' | 'TLINES_TC';
  projectNo: string;
  name: string;
  address: string | null;
  description: string | null;
  types: string[];
  status: string;
  isUrgent?: boolean;
  containerDate?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: TrustExpenseItem[];
}

export interface TrustExpenseItem {
  id: string;
  projectId: string;
  type: 'MILLWORK' | 'SHELVING' | 'CEILING' | 'IMAGE' | 'FURNITURE' | 'DECORATION' | null;
  customTypeId: string | null;
  customType?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
  } | null;
  vendorId: string | null;
  orderType: string | null;
  status: 'HOLD_T' | 'HOLD_PM' | 'HOLD_BOOKS' | 'NOT_ORDERED' | 'TO_ORDER' | 'ORDERED' | 'ASSEMBLY' | 'READY_TO_RECEIVE' | 'RECEIVED' | 'READY' | 'SENT_TO_TLINES' | 'PARTIAL_SENT' | 'SENT' | null;
  std: string | null;
  etd: string | null;
  rtrd: string | null;
  rdy: string | null;
  ftd: string | null;
  snd: string | null;
  expensesUsd: number | null;
  expensesTl: number | null;
  shelvesLocation: string | null;
  containerNo: string | null;
  invoice: string | null;
  // Accounting
  paidUsd1: number | null;
  paidUsd2: number | null;
  paidTl1: number | null;
  paidTl2: number | null;
  // Invoice
  invoiceTransactionNo: string | null;
  invoiceNumber: string | null;
  quickBook: string | null;
  paymentRule: string | null;
  // Flat list fields
  colorHex: string | null;
  sortOrder: number;
  teType: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface TrustExpenseProjectsResponse {
  data: TrustExpenseProject[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type TrustExpenseItemsResponse = TrustExpenseItem[];
