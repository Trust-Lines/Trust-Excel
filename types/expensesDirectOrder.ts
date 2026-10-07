export interface ExpensesDirectOrderProject {
  id: string;
  bucket: string;
  projectNo: string;
  name: string;
  address: string;
  types: string[];
  isUrgent: boolean;
  createdAt: string;
  updatedAt: string;
  items: ExpensesDirectOrderItem[];
}

export interface ExpensesDirectOrderItem {
  id: string;
  projectId: string;
  type: string | null;
  customTypeId: string | null;
  customType: { id: string; name: string; code: string; description?: string } | null;
  vendorId: string | null;
  vendor: { id: string; code: string; name: string } | null;
  orderType: string | null;
  status: string | null;
  std: string | null;
  etd: string | null;
  rtrd: string | null;
  rdy: string | null;
  ftd: string | null;
  snd: string | null;
  expensesUsd: number | string | null;
  expensesTl: number | string | null;
  shelvesLoc: string | null;
  containerNo: string | null;
  invoiceSit: string | null;
  paidUsd1: number | string | null;
  paidUsd2: number | string | null;
  paidTl1: number | string | null;
  paidTl2: number | string | null;
  invoiceTransactionNo: string | null;
  invoiceNumber: string | null;
  quickBook: string | null;
  statusNote: string | null;
  paymentRule: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpensesDirectOrderProjectsResponse {
  data: ExpensesDirectOrderProject[];
}
