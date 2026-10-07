export class ProjectTotalMoney {
  pfUsd: number;
  pfTl: number;
}

export class ProjectTotalTab {
  label: string; // 'Projects' | 'Direct Order' | 'Missing & Extra'
  money: ProjectTotalMoney;
}

export class ProjectTotalCompany {
  bucket: string;       // e.g. 'TLINES_NE'
  displayName: string;  // e.g. 'TLines NE'
  tabs: ProjectTotalTab[];
  total: ProjectTotalMoney;
}

export class ExpensesTotalMoney {
  usd: number;
  tl: number;
}

export class ExpensesTotalBucket {
  bucket: string;
  projects: ExpensesTotalMoney;
  directOrder: ExpensesTotalMoney;
  missingExtra: ExpensesTotalMoney;
  trustExpenses: ExpensesTotalMoney;
}

export class ProjectTotalResponse {
  companies: ProjectTotalCompany[];
  grandTotal: {
    projects: ProjectTotalMoney;
    directOrder: ProjectTotalMoney;
    missingExtra: ProjectTotalMoney;
    total: ProjectTotalMoney;
  };
  trustExpenseTotals?: ProjectTotalMoney;
  expensesTotals?: ExpensesTotalBucket[];
}
