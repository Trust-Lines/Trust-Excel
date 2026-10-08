export interface SupplierTotalMoney {
  productionUsd: number;
  productionTl: number;
  paidUsd: number;
  paidTl: number;
  remainingUsd: number;
  remainingTl: number;
  futureUsd: number;
  futureTl: number;
}

export interface SupplierTotalTab {
  label: string; // 'Projects' | 'Direct Order' | 'Missing & Extra'
  money: SupplierTotalMoney;
}

export interface SupplierTotalVendor {
  vendorId: string;
  vendorName: string;
  vendorCode: string;
  tabs: SupplierTotalTab[];
  total: SupplierTotalMoney;
}

/**
 * An item whose payments don't fit its price. The page totals hide these
 * (an overpayment just turns into negative "remaining"), so they're listed
 * separately for someone to fix.
 *  - OVERPAID: paid more than the item's price in that currency
 *  - PAID_WITHOUT_PRICE: a payment was entered in a currency the item has no price in
 */
export interface SupplierTotalIssue {
  source: 'P' | 'DO' | 'ME';
  projectNo: string;
  pfCode: string;
  vendorCode: string;
  kind: 'OVERPAID' | 'PAID_WITHOUT_PRICE';
  currency: 'USD' | 'TL';
  price: number;
  paid: number;
}

export interface SupplierTotalResponse {
  vendors: SupplierTotalVendor[];
  grandTotal: SupplierTotalMoney;
  issues?: SupplierTotalIssue[];
}
