export interface Money2 {
  usd: number;
  tl: number;
}

export interface CategoryRows {
  projects: Money2;
  directOrder: Money2;
  missingExtra: Money2;
  trustExpenses?: Money2;
}

export interface CompanyTotals {
  companyKey: string;
  label: string;
  production: CategoryRows;
  expenses: CategoryRows;
}

export interface CompanyDef {
  key: string;
  label: string;
}
