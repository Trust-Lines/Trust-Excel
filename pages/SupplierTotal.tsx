import React, { useState, useEffect } from 'react';
import { fetchSupplierTotals } from '../lib/supplierTotalApi';
import { exportSupplierTotalExcel } from '../utils/excel/exportSupplierTotalExcel';
import { useAuth } from '../contexts/AuthContext';
import type {
  SupplierTotalResponse,
  SupplierTotalMoney,
  SupplierTotalVendor,
} from '../types/supplierTotal';

// ── Constants ────────────────────────────────────────────────────────

const ROW_HEIGHT = 32;
const VENDOR_ROW_HEIGHT = 36;
const HEADER_HEIGHT = 34;
const COL_WIDTH = 130;
const SPACER_HEIGHT = 14;

// Block definitions: each block becomes its own table
const BLOCKS = [
  {
    key: 'production',
    title: 'PRODUCTION PRICE',
    headerBg: '#4472C4',
    cols: [
      { label: 'PF / USD', field: 'productionUsd' as const, fmt: 'usd' as const },
      { label: 'PF / TL', field: 'productionTl' as const, fmt: 'tl' as const },
    ],
  },
  {
    key: 'payments',
    title: 'PAYMENTS',
    headerBg: '#D4AF37',
    cols: [
      { label: 'Paid / USD', field: 'paidUsd' as const, fmt: 'usd' as const },
      { label: 'Paid / TL', field: 'paidTl' as const, fmt: 'tl' as const },
    ],
  },
  {
    key: 'remaining',
    title: 'REMAINING',
    headerBg: '#92400E',
    cols: [
      { label: 'USD', field: 'remainingUsd' as const, fmt: 'usd' as const },
      { label: 'TL', field: 'remainingTl' as const, fmt: 'tl' as const },
    ],
  },
  {
    key: 'future',
    title: 'FUTURE',
    headerBg: '#78350F',
    cols: [
      { label: 'USD', field: 'futureUsd' as const, fmt: 'usd' as const },
      { label: 'TL', field: 'futureTl' as const, fmt: 'tl' as const },
    ],
  },
] as const;

const TAB_LABELS = ['Projects', 'Direct Order', 'Missing & Extra'] as const;

// ── Formatters ───────────────────────────────────────────────────────

function fmtUsd(v: number): string {
  if (v === 0) return '-';
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtTl(v: number): string {
  if (v === 0) return '-';
  return '\u20BA' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtVal(v: number, fmt: 'usd' | 'tl'): string {
  return fmt === 'usd' ? fmtUsd(v) : fmtTl(v);
}

// ── Sub-components ───────────────────────────────────────────────────

interface BlockTableProps {
  block: typeof BLOCKS[number];
  vendors: SupplierTotalVendor[];
  grandTotal: SupplierTotalMoney;
  isFirst: boolean; // first block shows row labels
}

const BlockTable: React.FC<BlockTableProps> = ({ block, vendors, grandTotal, isFirst }) => {
  const tableWidth = isFirst
    ? 170 + block.cols.length * COL_WIDTH
    : block.cols.length * COL_WIDTH;

  return (
    <div className="st-block" style={{ width: tableWidth, flex: '0 0 auto' }}>
      {/* Section header — title centered across full width */}
      <div
        className="st-block-header"
        style={{ background: block.headerBg, height: HEADER_HEIGHT, position: 'relative' }}
      >
        <span className="st-block-title">{block.title}</span>
      </div>

      {/* Column headers */}
      <div className="st-col-headers" style={{ height: ROW_HEIGHT }}>
        {isFirst && <div className="st-row-label st-col-header-label" />}
        {block.cols.map((col) => (
          <div key={col.field} className="st-col-hdr" style={{ width: COL_WIDTH }}>
            {col.label}
          </div>
        ))}
      </div>

      {/* Vendor rows */}
      {vendors.map((vendor) => (
        <React.Fragment key={vendor.vendorId}>
          {/* Vendor name row */}
          <div className="st-vendor-row" style={{ height: VENDOR_ROW_HEIGHT }}>
            {isFirst ? (
              <div className="st-vendor-name-full">
                {vendor.vendorCode} - {vendor.vendorName}
              </div>
            ) : (
              <div className="st-vendor-name-bar" />
            )}
          </div>

          {/* Vendor sub-header row - repeats column labels for easy reference */}
          <div className="st-vendor-subheader" style={{ height: 24 }}>
            {isFirst && <div className="st-row-label st-vendor-subheader-label" />}
            {block.cols.map((col) => (
              <div key={col.field} className="st-vendor-subheader-col" style={{ width: COL_WIDTH }}>
                {col.label}
              </div>
            ))}
          </div>

          {/* Tab data rows */}
          {vendor.tabs.map((tab, ti) => (
            <div key={TAB_LABELS[ti]} className="st-data-row" style={{ height: ROW_HEIGHT }}>
              {isFirst && (
                <div className="st-row-label">{tab.label}</div>
              )}
              {block.cols.map((col) => (
                <div key={col.field} className="st-cell" style={{ width: COL_WIDTH }}>
                  {fmtVal(tab.money[col.field], col.fmt)}
                </div>
              ))}
            </div>
          ))}

          {/* Vendor total row */}
          <div className="st-vtotal-row" style={{ height: ROW_HEIGHT }}>
            {isFirst && <div className="st-row-label st-vtotal-label">TOTAL</div>}
            {block.cols.map((col) => (
              <div key={col.field} className="st-cell st-vtotal-cell" style={{ width: COL_WIDTH }}>
                {fmtVal(vendor.total[col.field], col.fmt)}
              </div>
            ))}
          </div>

          {/* Spacer row between vendors */}
          <div className="st-spacer-row" style={{ height: SPACER_HEIGHT }} />
        </React.Fragment>
      ))}

      {/* Grand total row */}
      <div className="st-grand-row" style={{ height: VENDOR_ROW_HEIGHT }}>
        {isFirst && <div className="st-row-label st-grand-label">GRAND TOTAL</div>}
        {block.cols.map((col) => (
          <div key={col.field} className="st-cell st-grand-cell" style={{ width: COL_WIDTH }}>
            {fmtVal(grandTotal[col.field], col.fmt)}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────

const SupplierTotal: React.FC = () => {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [data, setData] = useState<SupplierTotalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    fetchSupplierTotals()
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load data'))
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated]);

  const handleExport = () => {
    if (data) exportSupplierTotalExcel(data);
  };

  if (loading || authLoading) {
    return (
      <div className="st-container">
        <div className="st-loading">Loading supplier totals...</div>
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

  // Real check: items whose payments don't fit their price. (The old
  // "production − paid − remaining − future" check was always 0 by construction.)
  const issues = data.issues || [];
  const sourceLabel = { P: 'Projects', DO: 'Direct Order', ME: 'Missing & Extra' } as const;
  const fmtMoney = (currency: 'USD' | 'TL', v: number) => (currency === 'USD' ? fmtUsd(v) : fmtTl(v));

  return (
    <div className="st-container">
      <div className="st-page-header">
        <h1 className="st-title">Supplier Total</h1>
        <button className="st-export-btn" onClick={handleExport}>
          Export Excel
        </button>
      </div>

      <div className="st-scroll-area">
        <div className="st-blocks-row">
          {BLOCKS.map((block, i) => (
            <BlockTable
              key={block.key}
              block={block}
              vendors={data.vendors}
              grandTotal={data.grandTotal}
              isFirst={i === 0}
            />
          ))}
        </div>

        {/* Payment check: overpaid items and payments without a price */}
        <div style={{ marginTop: '16px', width: 'fit-content', maxWidth: '100%' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '10px 16px',
            borderRadius: issues.length ? '6px 6px 0 0' : '6px',
            fontWeight: 600,
            fontSize: '14px',
            color: '#fff',
            backgroundColor: issues.length ? '#b91c1c' : '#15803d',
          }}>
            <span>CHECK (Payments vs Prices)</span>
            <span style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '4px 12px', borderRadius: '4px' }}>
              {issues.length === 0
                ? 'All payments fit their prices ✓'
                : `${issues.length} item${issues.length === 1 ? '' : 's'} to fix`}
            </span>
          </div>
          {issues.length > 0 && (
            <table style={{ borderCollapse: 'collapse', fontSize: '13px', background: '#fff', border: '1px solid #e5e7eb', width: '100%' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                  {['Problem', 'Page', 'Project', 'PF Code', 'Supplier', 'Price', 'Paid', 'Difference'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {issues.map((it, i) => (
                  <tr key={`${it.pfCode}-${it.currency}-${i}`}>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6', color: '#b91c1c', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {it.kind === 'OVERPAID' ? 'Paid more than price' : `Paid in ${it.currency}, no ${it.currency} price`}
                    </td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6' }}>{sourceLabel[it.source]}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6' }}>{it.projectNo || '-'}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6', fontFamily: 'monospace' }}>{it.pfCode || '-'}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6' }}>{it.vendorCode}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{it.price > 0 ? fmtMoney(it.currency, it.price) : '-'}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{fmtMoney(it.currency, it.paid)}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontWeight: 600 }}>{fmtMoney(it.currency, it.paid - it.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierTotal;
