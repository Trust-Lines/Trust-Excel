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

  // Sanity check: production − paid − remaining − future must equal 0 per currency
  const checkUsd = data.grandTotal.productionUsd - data.grandTotal.paidUsd
    - data.grandTotal.remainingUsd - data.grandTotal.futureUsd;
  const checkTl = data.grandTotal.productionTl - data.grandTotal.paidTl
    - data.grandTotal.remainingTl - data.grandTotal.futureTl;
  const usdOk = Math.abs(checkUsd) < 0.01;
  const tlOk = Math.abs(checkTl) < 0.01;

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

        {/* Sanity check: Production − Payments − Remaining − Future = 0 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginTop: '16px',
          padding: '10px 16px',
          borderRadius: '6px',
          fontWeight: 600,
          fontSize: '14px',
          color: '#fff',
          width: 'fit-content',
          backgroundColor: usdOk && tlOk ? '#15803d' : '#b91c1c',
        }}>
          <span>CHECK (Production − Payments − Remaining − Future)</span>
          <span style={{
            backgroundColor: 'rgba(0,0,0,0.25)',
            padding: '4px 12px',
            borderRadius: '4px',
            minWidth: '110px',
            textAlign: 'center',
          }}>
            {usdOk ? 'USD OK ✓' : 'USD DIFF: ' + fmtUsd(checkUsd)}
          </span>
          <span style={{
            backgroundColor: 'rgba(0,0,0,0.25)',
            padding: '4px 12px',
            borderRadius: '4px',
            minWidth: '110px',
            textAlign: 'center',
          }}>
            {tlOk ? 'TL OK ✓' : 'TL DIFF: ' + fmtTl(checkTl)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SupplierTotal;
