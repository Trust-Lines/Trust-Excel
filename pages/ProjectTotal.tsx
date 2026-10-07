import React, { useState, useEffect } from 'react';
import { fetchProjectTotals } from '../lib/projectTotalApi';
import { exportProjectTotalExcel } from '../utils/excel/exportProjectTotalExcel';
import { calcTotalDolar } from '../utils/moneyUtils';
import { useAuth } from '../contexts/AuthContext';
import type {
  Money2,
  CategoryRows,
  CompanyTotals,
  CompanyDef,
} from '../types/projectTotal';

// ── Fixed company lists ──────────────────────────────────────────────

const PRODUCTION_COMPANIES: CompanyDef[] = [
  { key: 'TLINES_NE', label: 'T LINES NE' },
  { key: 'TLINES_SE', label: 'T LINES SE' },
  { key: 'TLINES_CVW', label: 'T LINES CVW' },
  { key: 'TLINES_NW', label: 'T LINES NW' },
  { key: 'TLINES_HQ', label: 'T LINES HQ' },
  { key: 'TRUST_TC', label: 'TRUST TC' },
];

const EXPENSES_COMPANIES: CompanyDef[] = [
  ...PRODUCTION_COMPANIES,
  { key: 'TRUST_EXP', label: 'TRUST Expenses' },
];

// ── USD/TRY rate persistence ─────────────────────────────────────────

const LS_KEY = 'PROJECT_TOTAL_USD_TRY_RATE';
const DEFAULT_RATE = 41.23;

function getStoredUsdTryRate(): number {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw !== null) {
      const v = parseFloat(raw);
      if (Number.isFinite(v) && v > 0) return v;
    }
  } catch { /* ignore */ }
  localStorage.setItem(LS_KEY, String(DEFAULT_RATE));
  return DEFAULT_RATE;
}

function setStoredUsdTryRate(value: number): void {
  if (Number.isFinite(value) && value > 0) {
    localStorage.setItem(LS_KEY, String(value));
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

const ZERO: Money2 = { usd: 0, tl: 0 };

function emptyRows(): CategoryRows {
  return {
    projects: { ...ZERO },
    directOrder: { ...ZERO },
    missingExtra: { ...ZERO },
  };
}

function sumRows(r: CategoryRows): Money2 {
  return {
    usd: r.projects.usd + r.directOrder.usd + r.missingExtra.usd + (r.trustExpenses?.usd || 0),
    tl: r.projects.tl + r.directOrder.tl + r.missingExtra.tl + (r.trustExpenses?.tl || 0),
  };
}

function addMoney(a: Money2, b: Money2): Money2 {
  return { usd: a.usd + b.usd, tl: a.tl + b.tl };
}

function addRows(a: CategoryRows, b: CategoryRows): CategoryRows {
  return {
    projects: addMoney(a.projects, b.projects),
    directOrder: addMoney(a.directOrder, b.directOrder),
    missingExtra: addMoney(a.missingExtra, b.missingExtra),
    trustExpenses: addMoney(
      a.trustExpenses || { usd: 0, tl: 0 },
      b.trustExpenses || { usd: 0, tl: 0 },
    ),
  };
}

// ── Data is fetched from backend via projectTotalApi.ts ──────────────

// ── Formatters ───────────────────────────────────────────────────────

function fmtUsd(v: number): string {
  if (v === 0) return '-';
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtTl(v: number): string {
  if (v === 0) return '-';
  return '\u20BA' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Constants ────────────────────────────────────────────────────────

const COL_W = 130;
const LABEL_W = 170;

// ── Production Block (LEFT) ─────────────────────────────────────────

interface ProductionBlockProps {
  data: CompanyTotals[];
  usdTryRate: number;
  onRateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProductionBlock: React.FC<ProductionBlockProps> = ({ data, usdTryRate, onRateChange }) => {
  // Only production-side companies
  const companies = data.filter((d) =>
    PRODUCTION_COMPANIES.some((c) => c.key === d.companyKey),
  );

  // Grand totals across all production companies
  const grandRows = companies.reduce<CategoryRows>(
    (acc, c) => addRows(acc, c.production),
    emptyRows(),
  );
  const grandTotal = sumRows(grandRows);

  const safeRate = usdTryRate > 0 ? usdTryRate : 0;
  const calcAll = (m: Money2) =>
    safeRate > 0 ? m.usd + m.tl / safeRate : 0;

  const blockW = LABEL_W + COL_W * 3 + 110; // label + usd + tl + ALL + rate area

  return (
    <div className="pt-block" style={{ minWidth: blockW }}>
      {/* Header */}
      <div className="pt-block-header" style={{ background: '#4472C4' }}>
        PRODUCTION PRICE
      </div>

      {/* Company cards */}
      {companies.map((c) => {
        const total = sumRows(c.production);
        const rows: { label: string; m: Money2 }[] = [
          { label: 'Projects', m: c.production.projects },
          { label: 'Direct Order', m: c.production.directOrder },
          { label: 'Missing & Extra', m: c.production.missingExtra },
        ];
        return (
          <div key={c.companyKey} className="pt-company-card">
            <div className="pt-company-name">{c.label}</div>
            <div className="pt-card-col-headers">
              <div className="pt-label-cell" />
              <div className="pt-data-cell pt-card-col-hdr">PF / USD</div>
              <div className="pt-data-cell pt-card-col-hdr">PF / TL</div>
              <div className="pt-data-cell pt-card-col-hdr">ALL</div>
              <div className="pt-rate-cell" />
            </div>
            {rows.map((r) => (
              <div key={r.label} className="pt-data-row">
                <div className="pt-label-cell">{r.label}</div>
                <div className="pt-data-cell">{fmtUsd(r.m.usd)}</div>
                <div className="pt-data-cell">{fmtTl(r.m.tl)}</div>
                <div className="pt-data-cell">{safeRate > 0 ? fmtUsd(calcAll(r.m)) : '-'}</div>
                <div className="pt-rate-cell" />
              </div>
            ))}
            <div className="pt-total-row">
              <div className="pt-label-cell">TOTAL</div>
              <div className="pt-data-cell">{fmtUsd(total.usd)}</div>
              <div className="pt-data-cell">{fmtTl(total.tl)}</div>
              <div className="pt-data-cell">{safeRate > 0 ? fmtUsd(calcAll(total)) : '-'}</div>
              <div className="pt-rate-cell" />
            </div>
          </div>
        );
      })}

      {/* Grand Total section */}
      <div className="pt-grand-section">
        {/* Category subtotals */}
        {[
          { label: 'Projects', m: grandRows.projects },
          { label: 'Direct Order', m: grandRows.directOrder },
          { label: 'Missing & Extra', m: grandRows.missingExtra },
        ].map((r) => (
          <div key={r.label} className="pt-grand-sub-row">
            <div className="pt-label-cell">{r.label}</div>
            <div className="pt-data-cell">{fmtUsd(r.m.usd)}</div>
            <div className="pt-data-cell">{fmtTl(r.m.tl)}</div>
            <div className="pt-data-cell">{safeRate > 0 ? fmtUsd(calcAll(r.m)) : '-'}</div>
            <div className="pt-rate-cell" />
          </div>
        ))}

        {/* TOTAL */}
        <div className="pt-grand-total-row">
          <div className="pt-label-cell">TOTAL</div>
          <div className="pt-data-cell">{fmtUsd(grandTotal.usd)}</div>
          <div className="pt-data-cell">{fmtTl(grandTotal.tl)}</div>
          <div className="pt-data-cell">{safeRate > 0 ? fmtUsd(calcAll(grandTotal)) : '-'}</div>
          <div className="pt-rate-cell" />
        </div>

        {/* TOTAL DOLAR */}
        <div className="pt-grand-total-row pt-total-dolar-row">
          <div className="pt-label-cell">TOTAL DOLAR</div>
          <div className="pt-data-cell">
            {calcTotalDolar(grandTotal, safeRate) != null
              ? fmtUsd(calcTotalDolar(grandTotal, safeRate)!)
              : '-'}
          </div>
          <div className="pt-data-cell" />
          <div className="pt-data-cell" />
          <div className="pt-rate-cell" />
        </div>

        {/* GRAND TOTAL DOLAR */}
        <div className="pt-grand-final-row">
          <div className="pt-label-cell">GRAND TOTAL DOLAR</div>
          <div className="pt-data-cell">
            {calcTotalDolar(grandTotal, safeRate) != null
              ? fmtUsd(calcTotalDolar(grandTotal, safeRate)!)
              : '-'}
          </div>
          <div className="pt-data-cell" />
          <div className="pt-data-cell" />
          <div className="pt-rate-cell pt-rate-display">
            <input
              type="number"
              step="0.01"
              min="0"
              className="pt-rate-input-bottom"
              value={usdTryRate}
              onChange={onRateChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Expenses Block (RIGHT) ──────────────────────────────────────────

interface ExpensesBlockProps {
  data: CompanyTotals[];
  usdTryRate: number;
  onRateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ExpensesBlock: React.FC<ExpensesBlockProps> = ({ data, usdTryRate, onRateChange }) => {
  // All expense-side companies (includes TRUST_EXP)
  const companies = data.filter((d) =>
    EXPENSES_COMPANIES.some((c) => c.key === d.companyKey),
  );

  const grandRows = companies.reduce<CategoryRows>(
    (acc, c) => addRows(acc, c.expenses),
    emptyRows(),
  );
  const grandTotal = sumRows(grandRows);

  const safeRate = usdTryRate > 0 ? usdTryRate : 0;
  const calcAll = (m: Money2) =>
    safeRate > 0 ? m.usd + m.tl / safeRate : 0;

  const blockW = LABEL_W + COL_W * 3 + 110;

  return (
    <div className="pt-block" style={{ minWidth: blockW }}>
      {/* Header */}
      <div className="pt-block-header" style={{ background: '#92400E' }}>
        EXPENSES
      </div>

      {/* Company cards */}
      {companies.map((c) => {
        const total = sumRows(c.expenses);
        const rows: { label: string; m: Money2 }[] = [
          { label: 'Projects', m: c.expenses.projects },
          { label: 'Direct Order', m: c.expenses.directOrder },
          { label: 'Missing & Extra', m: c.expenses.missingExtra },
        ];
        return (
          <div key={c.companyKey} className="pt-company-card">
            <div className="pt-company-name">{c.label}</div>
            <div className="pt-card-col-headers">
              <div className="pt-label-cell" />
              <div className="pt-data-cell pt-card-col-hdr">Expenses / USD</div>
              <div className="pt-data-cell pt-card-col-hdr">Expenses / TL</div>
              <div className="pt-data-cell pt-card-col-hdr">ALL</div>
              <div className="pt-rate-cell" />
            </div>
            {rows.map((r) => (
              <div key={r.label} className="pt-data-row">
                <div className="pt-label-cell">{r.label}</div>
                <div className="pt-data-cell">{fmtUsd(r.m.usd)}</div>
                <div className="pt-data-cell">{fmtTl(r.m.tl)}</div>
                <div className="pt-data-cell">{safeRate > 0 ? fmtUsd(calcAll(r.m)) : '-'}</div>
                <div className="pt-rate-cell" />
              </div>
            ))}
            <div className="pt-total-row">
              <div className="pt-label-cell">TOTAL</div>
              <div className="pt-data-cell">{fmtUsd(total.usd)}</div>
              <div className="pt-data-cell">{fmtTl(total.tl)}</div>
              <div className="pt-data-cell">{safeRate > 0 ? fmtUsd(calcAll(total)) : '-'}</div>
              <div className="pt-rate-cell" />
            </div>
          </div>
        );
      })}

      {/* Grand Total section */}
      <div className="pt-grand-section">
        {[
          { label: 'Projects', m: grandRows.projects },
          { label: 'Direct Order', m: grandRows.directOrder },
          { label: 'Missing & Extra', m: grandRows.missingExtra },
        ].map((r) => (
          <div key={r.label} className="pt-grand-sub-row">
            <div className="pt-label-cell">{r.label}</div>
            <div className="pt-data-cell">{fmtUsd(r.m.usd)}</div>
            <div className="pt-data-cell">{fmtTl(r.m.tl)}</div>
            <div className="pt-data-cell">{safeRate > 0 ? fmtUsd(calcAll(r.m)) : '-'}</div>
            <div className="pt-rate-cell" />
          </div>
        ))}

        <div className="pt-grand-total-row">
          <div className="pt-label-cell">TOTAL</div>
          <div className="pt-data-cell">{fmtUsd(grandTotal.usd)}</div>
          <div className="pt-data-cell">{fmtTl(grandTotal.tl)}</div>
          <div className="pt-data-cell">{safeRate > 0 ? fmtUsd(calcAll(grandTotal)) : '-'}</div>
          <div className="pt-rate-cell" />
        </div>

        <div className="pt-grand-total-row pt-total-dolar-row">
          <div className="pt-label-cell">TOTAL DOLAR</div>
          <div className="pt-data-cell">
            {calcTotalDolar(grandTotal, safeRate) != null
              ? fmtUsd(calcTotalDolar(grandTotal, safeRate)!)
              : '-'}
          </div>
          <div className="pt-data-cell" />
          <div className="pt-data-cell" />
          <div className="pt-rate-cell" />
        </div>

        <div className="pt-grand-final-row">
          <div className="pt-label-cell">GRAND TOTAL DOLAR</div>
          <div className="pt-data-cell">
            {calcTotalDolar(grandTotal, safeRate) != null
              ? fmtUsd(calcTotalDolar(grandTotal, safeRate)!)
              : '-'}
          </div>
          <div className="pt-data-cell" />
          <div className="pt-data-cell" />
          <div className="pt-rate-cell pt-rate-display">
            <input
              type="number"
              step="0.01"
              min="0"
              className="pt-rate-input-bottom"
              value={usdTryRate}
              onChange={onRateChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────

const ProjectTotal: React.FC = () => {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [data, setData] = useState<CompanyTotals[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usdTryRate, setUsdTryRate] = useState(getStoredUsdTryRate);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    fetchProjectTotals()
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load data'))
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated]);

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    const next = Number.isFinite(v) ? v : 0;
    setUsdTryRate(next);
    if (next > 0) setStoredUsdTryRate(next);
  };

  const handleExport = () => {
    if (data) exportProjectTotalExcel(data, usdTryRate, PRODUCTION_COMPANIES, EXPENSES_COMPANIES);
  };

  if (loading || authLoading) {
    return (
      <div className="st-container">
        <div className="st-loading">Loading project totals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="st-container">
        <div className="st-error">Error: {error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="st-container">
      <div className="st-page-header">
        <h1 className="st-title">Project Total</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <label className="pt-rate-input-label">
            USD/TRY:
            <input
              type="number"
              step="0.01"
              min="0"
              className="pt-rate-input"
              value={usdTryRate}
              onChange={handleRateChange}
            />
          </label>
          <button className="st-export-btn" onClick={handleExport}>
            Export Excel
          </button>
        </div>
      </div>

      <div className="pt-blocks-wrapper">
        <ProductionBlock data={data} usdTryRate={usdTryRate} onRateChange={handleRateChange} />
        <ExpensesBlock data={data} usdTryRate={usdTryRate} onRateChange={handleRateChange} />
      </div>
    </div>
  );
};

export default ProjectTotal;
