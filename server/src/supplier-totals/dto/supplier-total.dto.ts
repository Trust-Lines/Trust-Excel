export class SupplierTotalMoney {
  productionUsd: number;
  productionTl: number;
  paidUsd: number;
  paidTl: number;
  remainingUsd: number;
  remainingTl: number;
  futureUsd: number;
  futureTl: number;
}

export class SupplierTotalTab {
  label: string; // 'Projects' | 'Direct Order' | 'Missing & Extra'
  money: SupplierTotalMoney;
}

export class SupplierTotalVendor {
  vendorId: string;
  vendorName: string;
  vendorCode: string;
  tabs: SupplierTotalTab[];
  total: SupplierTotalMoney;
}

export class SupplierTotalResponse {
  vendors: SupplierTotalVendor[];
  grandTotal: SupplierTotalMoney;
}
