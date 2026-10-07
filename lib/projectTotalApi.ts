import { apiClient } from './api';
import type { CompanyTotals, CategoryRows, Money2 } from '../types/projectTotal';

// Backend response types (from /project-totals endpoint)
interface BackendMoney { pfUsd: number; pfTl: number; }
interface BackendTab { label: string; money: BackendMoney; }
interface BackendCompany { bucket: string; displayName: string; tabs: BackendTab[]; total: BackendMoney; }
interface BackendExpenseBucket {
  bucket: string;
  projects: { usd: number; tl: number };
  directOrder: { usd: number; tl: number };
  missingExtra: { usd: number; tl: number };
  trustExpenses: { usd: number; tl: number };
}

interface BackendResponse {
  companies: BackendCompany[];
  grandTotal: {
    projects: BackendMoney;
    directOrder: BackendMoney;
    missingExtra: BackendMoney;
    total: BackendMoney;
  };
  trustExpenseTotals?: BackendMoney;
  expensesTotals?: BackendExpenseBucket[];
}

// Map backend bucket enum → frontend company key
const BUCKET_TO_KEY: Record<string, string> = {
  TLINES_NE: 'TLINES_NE',
  TLINES_SE: 'TLINES_SE',
  CVW: 'TLINES_CVW',
  TLINES_NW: 'TLINES_NW',
  TLINES_HQ: 'TLINES_HQ',
  TLINES_TC: 'TRUST_TC',
};

const FRONTEND_LABELS: Record<string, string> = {
  TLINES_NE: 'T LINES NE',
  TLINES_SE: 'T LINES SE',
  TLINES_CVW: 'T LINES CVW',
  TLINES_NW: 'T LINES NW',
  TLINES_HQ: 'T LINES HQ',
  TRUST_TC: 'TRUST TC',
  TRUST_EXP: 'TRUST Expenses',
};

function toMoney2(bm: BackendMoney): Money2 {
  return { usd: bm.pfUsd || 0, tl: bm.pfTl || 0 };
}

function emptyRows(): CategoryRows {
  return {
    projects: { usd: 0, tl: 0 },
    directOrder: { usd: 0, tl: 0 },
    missingExtra: { usd: 0, tl: 0 },
  };
}

export async function fetchProjectTotals(): Promise<CompanyTotals[]> {
  const resp: BackendResponse = await apiClient.get('/api/project-totals');
  if (!resp || !resp.companies) {
    throw new Error('Invalid response from project-totals endpoint');
  }

  // Build a map of frontend key → production data from backend
  const prodMap = new Map<string, CategoryRows>();
  for (const bc of resp.companies) {
    const frontendKey = BUCKET_TO_KEY[bc.bucket];
    if (!frontendKey) continue;
    const rows: CategoryRows = {
      projects: toMoney2(bc.tabs[0]?.money || { pfUsd: 0, pfTl: 0 }),
      directOrder: toMoney2(bc.tabs[1]?.money || { pfUsd: 0, pfTl: 0 }),
      missingExtra: toMoney2(bc.tabs[2]?.money || { pfUsd: 0, pfTl: 0 }),
    };
    prodMap.set(frontendKey, rows);
  }

  // Build the full CompanyTotals[] with all frontend companies
  const allKeys = [
    'TLINES_NE', 'TLINES_SE', 'TLINES_CVW', 'TLINES_NW',
    'TLINES_HQ', 'TRUST_TC', 'TRUST_EXP',
  ];

  // Build expenses map from expensesTotals (keyed by frontend key)
  const expMap = new Map<string, CategoryRows>();
  if (resp.expensesTotals) {
    for (const eb of resp.expensesTotals) {
      const frontendKey = BUCKET_TO_KEY[eb.bucket];
      if (!frontendKey) continue;
      expMap.set(frontendKey, {
        projects: { usd: eb.projects.usd || 0, tl: eb.projects.tl || 0 },
        directOrder: { usd: eb.directOrder.usd || 0, tl: eb.directOrder.tl || 0 },
        missingExtra: { usd: eb.missingExtra.usd || 0, tl: eb.missingExtra.tl || 0 },
        trustExpenses: { usd: eb.trustExpenses.usd || 0, tl: eb.trustExpenses.tl || 0 },
      });
    }
  }

  // Trust Expenses totals for TRUST_EXP company
  const teMoney = resp.trustExpenseTotals
    ? toMoney2(resp.trustExpenseTotals)
    : { usd: 0, tl: 0 };

  return allKeys.map((key) => {
    let expenses: CategoryRows;
    if (key === 'TRUST_EXP') {
      // TRUST_EXP gets trust expenses totals in the expenses.projects field
      expenses = { projects: teMoney, directOrder: { usd: 0, tl: 0 }, missingExtra: { usd: 0, tl: 0 } };
    } else {
      expenses = expMap.get(key) || emptyRows();
    }

    return {
      companyKey: key,
      label: FRONTEND_LABELS[key] || key,
      production: prodMap.get(key) || emptyRows(),
      expenses,
    };
  });
}
