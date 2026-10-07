import React, { useState, useCallback, useEffect } from 'react';
import type { BackendProjectItem } from '../lib/projects';
import { ROW_HEIGHT, TOTAL_ROW_HEIGHT } from '../constants';
import { apiFetch } from '../lib/auth';

interface AccountingGridProps {
  items: BackendProjectItem[];
  sectionLabel: string;
  showSectionHeader?: boolean;
  mode?: 'projects' | 'expenses-p' | 'expenses-do' | 'expenses-me';
  updateGlobalItem?: (itemId: string, patch: Partial<BackendProjectItem>) => void;
  onItemUpdated?: (updatedItem: BackendProjectItem) => void;
}

// Column widths
const COL_W = {
  paid: 120,
  remaining: 140,
  notOrdered: 140,
  invoice: 150,
  gap: 18,
};

const TOTAL_WIDTH = (COL_W.paid * 4) + (COL_W.gap) + (COL_W.remaining * 2) + (COL_W.gap) + (COL_W.notOrdered * 2) + (COL_W.gap) + COL_W.invoice;

// Heights matching ProjectBlock
const SECTION_HEADER_HEIGHT = 56;
const PROJECT_HEADER_HEIGHT = 60;
const COLUMN_HEADER_HEIGHT = 32;

const toNumber = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') { const p = parseFloat(v); return Number.isFinite(p) ? p : 0; }
  return 0;
};

const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getEndpoint = (mode: string, itemId: string) => {
  if (mode === 'expenses-p') return `/api/expenses-p/items/${itemId}`;
  if (mode === 'expenses-do') return `/api/expenses-direct-order/items/${itemId}`;
  if (mode === 'expenses-me') return `/api/expenses-missing-extra/items/${itemId}`;
  return `/api/projects/items/${itemId}`;
};

const AccountingGrid: React.FC<AccountingGridProps> = ({
  items,
  sectionLabel,
  showSectionHeader = false,
  mode = 'projects',
  updateGlobalItem,
  onItemUpdated,
}) => {
  const isExpensesPMode = mode === 'expenses-p' || mode === 'expenses-do' || mode === 'expenses-me';
  const sectionName = sectionLabel.replace('TLines ', '');

  // Get paid amounts from items (reactive - comes from globalItemsById via props)
  const getPaid = useCallback((item: BackendProjectItem) => ({
    usd1: toNumber(item.paidUsd1),
    usd2: toNumber(item.paidUsd2),
    tl1: toNumber(item.paidTl1),
    tl2: toNumber(item.paidTl2),
  }), []);

  const getAccountingValues = useCallback((item: BackendProjectItem) => {
    const paid = getPaid(item);
    const itemAny = item as any;
    const pfTl = isExpensesPMode ? toNumber(itemAny.expensesTl) : toNumber(item.pfTl);
    const invoice = toNumber(itemAny.invoice);
    // Invoice is a single amount: TL deal if pfTl > 0, otherwise USD
    const invoiceAsTl = pfTl > 0 ? invoice : 0;
    const invoiceAsUsd = pfTl > 0 ? 0 : invoice;
    const totalPaidUsd = paid.usd1 + paid.usd2;
    const totalPaidTl = paid.tl1 + paid.tl2;
    const isPfSigned = isExpensesPMode ? true : (item.pfSignStatus === 'SIGNED');
    const isNotOrdered = item.status === 'NOT_ORDERED';

    let remainingUsd = 0, remainingTl = 0, notOrderedUsd = 0, notOrderedTl = 0;
    let showNotSignedLabel = false;

    if (!isPfSigned) {
      showNotSignedLabel = true;
      notOrderedUsd = invoiceAsUsd;
      notOrderedTl = invoiceAsTl;
    } else if (isNotOrdered) {
      notOrderedUsd = invoiceAsUsd;
      notOrderedTl = invoiceAsTl;
    } else {
      remainingUsd = Math.max(0, invoiceAsUsd - totalPaidUsd);
      remainingTl = Math.max(0, invoiceAsTl - totalPaidTl);
    }

    return { paid, remainingUsd, remainingTl, notOrderedUsd, notOrderedTl, showNotSignedLabel };
  }, [isExpensesPMode, getPaid]);

  // ═══ API SAVE: Save paid amount to backend + trigger cross-table sync ═══
  const savePaidAmount = useCallback(async (itemId: string, field: string, value: number) => {
    const fieldMap: Record<string, string> = {
      usd1: 'paidUsd1', usd2: 'paidUsd2',
      tl1: 'paidTl1', tl2: 'paidTl2',
    };
    const backendField = fieldMap[field];
    if (!backendField) return;

    const numericValue = (value === null || value === undefined || isNaN(value)) ? null : value;
    const endpoint = getEndpoint(mode, itemId);

    try {
      const response = await apiFetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [backendField]: numericValue }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to save ${field}:`, response.status, errorText);
        return;
      }

      const updatedItem = await response.json();

      // Cross-table sync via global state
      if (updateGlobalItem) {
        updateGlobalItem(itemId, updatedItem);
      }
      if (onItemUpdated && 'projectId' in updatedItem) {
        onItemUpdated(updatedItem as BackendProjectItem);
      }
    } catch (error) {
      console.error('Failed to save paid amount:', error);
    }
  }, [mode, updateGlobalItem, onItemUpdated]);

  // Calculate totals reactively from items (which come from globalItemsById)
  const sectionTotals = React.useMemo(() => {
    let t = { paidUsd1: 0, paidUsd2: 0, paidTl1: 0, paidTl2: 0, remainingUsd: 0, remainingTl: 0, notOrderedUsd: 0, notOrderedTl: 0, invoice: 0 };
    items.forEach(item => {
      const paid = getPaid(item);
      const a = getAccountingValues(item);
      t.paidUsd1 += paid.usd1; t.paidUsd2 += paid.usd2;
      t.paidTl1 += paid.tl1; t.paidTl2 += paid.tl2;
      t.remainingUsd += a.remainingUsd; t.remainingTl += a.remainingTl;
      t.notOrderedUsd += a.notOrderedUsd; t.notOrderedTl += a.notOrderedTl;
      t.invoice += toNumber((item as any).invoice);
    });
    return t;
  }, [items, getPaid, getAccountingValues]);

  const inputStyle: React.CSSProperties = {
    height: '100%', padding: '4px 8px', border: 'none',
    borderRight: '1px solid #ccc', textAlign: 'right',
    backgroundColor: '#fef3c7', fontSize: '11px', fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const readonlyStyle: React.CSSProperties = {
    height: '100%', padding: '0 8px',
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
    borderRight: '1px solid #ccc', fontSize: '11px', boxSizing: 'border-box',
  };

  const totalCellStyle: React.CSSProperties = {
    backgroundColor: '#D4AF37', color: '#000', fontWeight: 700,
    fontSize: '11px', padding: '0 8px', borderRight: '1px solid #b8960c',
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
    textAlign: 'right', boxSizing: 'border-box',
  };

  return (
    <div style={{ width: `${TOTAL_WIDTH}px`, minWidth: `${TOTAL_WIDTH}px` }}>

      {/* ═══ SECTION HEADER ═══ Gold bar matching SectionSeparator (56px) */}
      {showSectionHeader && (
        <div style={{
          height: `${SECTION_HEADER_HEIGHT}px`,
          backgroundColor: '#D4AF37',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#000', fontWeight: 700, fontSize: '16px', letterSpacing: '1px',
          borderBottom: '2px solid #000',
        }}>
          ACCOUNTING {sectionName}
        </div>
      )}

      {/* ═══ GROUP HEADERS ═══ Matches ProjectHeader height (60px) */}
      <div style={{
        height: `${PROJECT_HEADER_HEIGHT}px`,
        backgroundColor: '#e8c547', color: '#000',
        display: 'flex', alignItems: 'center',
        fontSize: '12px', fontWeight: 600,
        borderBottom: '1px solid #b8960c',
      }}>
        <div style={{ width: `${COL_W.paid * 2}px`, textAlign: 'center', borderRight: '2px solid #b8960c', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '11px' }}>PAID USD</div>
          <div style={{ fontSize: '10px', opacity: 0.7 }}>(1st / 2nd)</div>
        </div>
        <div style={{ width: `${COL_W.gap}px`, backgroundColor: 'transparent' }} />
        <div style={{ width: `${COL_W.paid * 2}px`, textAlign: 'center', borderRight: '2px solid #b8960c', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '11px' }}>PAID TL</div>
          <div style={{ fontSize: '10px', opacity: 0.7 }}>(1st / 2nd)</div>
        </div>
        <div style={{ width: `${COL_W.gap}px`, backgroundColor: 'transparent' }} />
        <div style={{ width: `${COL_W.remaining * 2}px`, textAlign: 'center', borderRight: '2px solid #b8960c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px' }}>
          REMAINING
        </div>
        <div style={{ width: `${COL_W.gap}px`, backgroundColor: 'transparent' }} />
        <div style={{ width: `${COL_W.notOrdered * 2}px`, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px' }}>
          NOT ORDERED
        </div>
        <div style={{ width: `${COL_W.gap}px`, backgroundColor: 'transparent' }} />
        <div style={{ width: `${COL_W.invoice}px`, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px', color: '#1e40af', backgroundColor: '#dbeafe', borderRadius: '4px' }}>
          INVOICE
        </div>
      </div>

      {/* ═══ COLUMN HEADERS ═══ Black bar matching column-header-height (32px) */}
      <div style={{
        height: `${COLUMN_HEADER_HEIGHT}px`,
        backgroundColor: '#000', color: '#fff',
        display: 'flex', alignItems: 'center',
        fontSize: '11px', fontWeight: 600,
      }}>
        <div style={{ width: `${COL_W.paid}px`, textAlign: 'center', borderRight: '1px solid #333' }}>Paid/USD</div>
        <div style={{ width: `${COL_W.paid}px`, textAlign: 'center', borderRight: '1px solid #333' }}>Paid/USD</div>
        <div style={{ width: `${COL_W.gap}px` }} />
        <div style={{ width: `${COL_W.paid}px`, textAlign: 'center', borderRight: '1px solid #333' }}>Paid/TL</div>
        <div style={{ width: `${COL_W.paid}px`, textAlign: 'center', borderRight: '1px solid #333' }}>Paid/TL</div>
        <div style={{ width: `${COL_W.gap}px` }} />
        <div style={{ width: `${COL_W.remaining}px`, textAlign: 'center', borderRight: '1px solid #333' }}>USD</div>
        <div style={{ width: `${COL_W.remaining}px`, textAlign: 'center', borderRight: '1px solid #333' }}>TL</div>
        <div style={{ width: `${COL_W.gap}px` }} />
        <div style={{ width: `${COL_W.notOrdered}px`, textAlign: 'center', borderRight: '1px solid #333' }}>USD</div>
        <div style={{ width: `${COL_W.notOrdered}px`, textAlign: 'center', borderRight: '1px solid #333' }}>TL</div>
        <div style={{ width: `${COL_W.gap}px` }} />
        <div style={{ width: `${COL_W.invoice}px`, textAlign: 'center' }}>Invoice</div>
      </div>

      {/* ═══ DATA ROWS ═══ Each row = ROW_HEIGHT (40px) matching ProjectBlock */}
      {items.map((item) => {
        const a = getAccountingValues(item);
        return (
          <AccountingRow
            key={item.id}
            item={item}
            paid={a.paid}
            remainingUsd={a.remainingUsd}
            remainingTl={a.remainingTl}
            notOrderedUsd={a.notOrderedUsd}
            notOrderedTl={a.notOrderedTl}
            invoice={toNumber((item as any).invoice)}
            showNotSignedLabel={a.showNotSignedLabel}
            onSave={savePaidAmount}
            inputStyle={inputStyle}
            readonlyStyle={readonlyStyle}
          />
        );
      })}

      {/* ═══ TOTALS ROW ═══ Height = TOTAL_ROW_HEIGHT (32px) matching ProjectBlock */}
      <div style={{
        display: 'flex', height: `${TOTAL_ROW_HEIGHT}px`,
        alignItems: 'center', fontSize: '11px', fontWeight: 700,
        backgroundColor: '#D4AF37', color: '#000',
        borderTop: '2px solid #000',
      }}>
        <div style={{ ...totalCellStyle, width: `${COL_W.paid}px` }}>${fmt(sectionTotals.paidUsd1)}</div>
        <div style={{ ...totalCellStyle, width: `${COL_W.paid}px` }}>${fmt(sectionTotals.paidUsd2)}</div>
        <div style={{ width: `${COL_W.gap}px`, backgroundColor: '#D4AF37' }} />
        <div style={{ ...totalCellStyle, width: `${COL_W.paid}px` }}>₺{fmt(sectionTotals.paidTl1)}</div>
        <div style={{ ...totalCellStyle, width: `${COL_W.paid}px` }}>₺{fmt(sectionTotals.paidTl2)}</div>
        <div style={{ width: `${COL_W.gap}px`, backgroundColor: '#D4AF37' }} />
        <div style={{ ...totalCellStyle, width: `${COL_W.remaining}px` }}>${fmt(sectionTotals.remainingUsd)}</div>
        <div style={{ ...totalCellStyle, width: `${COL_W.remaining}px` }}>₺{fmt(sectionTotals.remainingTl)}</div>
        <div style={{ width: `${COL_W.gap}px`, backgroundColor: '#D4AF37' }} />
        <div style={{ ...totalCellStyle, width: `${COL_W.notOrdered}px` }}>${fmt(sectionTotals.notOrderedUsd)}</div>
        <div style={{ ...totalCellStyle, width: `${COL_W.notOrdered}px` }}>₺{fmt(sectionTotals.notOrderedTl)}</div>
        <div style={{ width: `${COL_W.gap}px`, backgroundColor: '#D4AF37' }} />
        <div style={{ ...totalCellStyle, width: `${COL_W.invoice}px`, borderRight: 'none', backgroundColor: '#1d4ed8', color: 'white', border: '1px solid #1e40af' }}>
          {fmt(sectionTotals.invoice)}
        </div>
      </div>
    </div>
  );
};

// ═══ ACCOUNTING ROW: Individual row with editable paid cells + blur-to-save ═══
interface AccountingRowProps {
  item: BackendProjectItem;
  paid: { usd1: number; usd2: number; tl1: number; tl2: number };
  remainingUsd: number;
  remainingTl: number;
  notOrderedUsd: number;
  notOrderedTl: number;
  invoice: number;
  showNotSignedLabel: boolean;
  onSave: (itemId: string, field: string, value: number) => Promise<void>;
  inputStyle: React.CSSProperties;
  readonlyStyle: React.CSSProperties;
}

const AccountingRow: React.FC<AccountingRowProps> = React.memo(({
  item, paid, remainingUsd, remainingTl, notOrderedUsd, notOrderedTl,
  invoice, showNotSignedLabel, onSave, inputStyle, readonlyStyle,
}) => {
  // Local display values for editing
  const [localValues, setLocalValues] = useState({
    usd1: paid.usd1 ? paid.usd1.toString() : '',
    usd2: paid.usd2 ? paid.usd2.toString() : '',
    tl1: paid.tl1 ? paid.tl1.toString() : '',
    tl2: paid.tl2 ? paid.tl2.toString() : '',
  });

  // Sync when props change (after save or cross-table update)
  useEffect(() => {
    setLocalValues({
      usd1: paid.usd1 ? paid.usd1.toString() : '',
      usd2: paid.usd2 ? paid.usd2.toString() : '',
      tl1: paid.tl1 ? paid.tl1.toString() : '',
      tl2: paid.tl2 ? paid.tl2.toString() : '',
    });
  }, [paid.usd1, paid.usd2, paid.tl1, paid.tl2]);

  const handleChange = (field: string, value: string) => {
    setLocalValues(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: string) => {
    const numValue = parseFloat(localValues[field as keyof typeof localValues]) || 0;
    const currentBackend = paid[field as keyof typeof paid] || 0;
    // Only save if value actually changed
    if (numValue !== currentBackend) {
      onSave(item.id, field, numValue);
    }
  };

  return (
    <div style={{
      display: 'flex', height: `${ROW_HEIGHT}px`,
      alignItems: 'center', fontSize: '11px',
      backgroundColor: '#fef3c7', borderBottom: '1px solid #e5e7eb',
    }}>
      <input type="number" value={localValues.usd1} onChange={(e) => handleChange('usd1', e.target.value)} onBlur={() => handleBlur('usd1')} style={{ ...inputStyle, width: `${COL_W.paid}px` }} />
      <input type="number" value={localValues.usd2} onChange={(e) => handleChange('usd2', e.target.value)} onBlur={() => handleBlur('usd2')} style={{ ...inputStyle, width: `${COL_W.paid}px` }} />
      <div style={{ width: `${COL_W.gap}px`, height: '100%' }} />
      <input type="number" value={localValues.tl1} onChange={(e) => handleChange('tl1', e.target.value)} onBlur={() => handleBlur('tl1')} style={{ ...inputStyle, width: `${COL_W.paid}px` }} />
      <input type="number" value={localValues.tl2} onChange={(e) => handleChange('tl2', e.target.value)} onBlur={() => handleBlur('tl2')} style={{ ...inputStyle, width: `${COL_W.paid}px` }} />
      <div style={{ width: `${COL_W.gap}px`, height: '100%' }} />
      <div style={{ ...readonlyStyle, width: `${COL_W.remaining}px` }}>
        {showNotSignedLabel
          ? <span style={{ color: '#c00', fontWeight: 700, fontSize: '10px' }}>NOT SIGNED</span>
          : remainingUsd > 0 ? `$${fmt(remainingUsd)}` : '-'}
      </div>
      <div style={{ ...readonlyStyle, width: `${COL_W.remaining}px` }}>
        {showNotSignedLabel ? '' : remainingTl > 0 ? `₺${fmt(remainingTl)}` : '-'}
      </div>
      <div style={{ width: `${COL_W.gap}px`, height: '100%' }} />
      <div style={{ ...readonlyStyle, width: `${COL_W.notOrdered}px` }}>
        {notOrderedUsd > 0 ? `$${fmt(notOrderedUsd)}` : '-'}
      </div>
      <div style={{ ...readonlyStyle, width: `${COL_W.notOrdered}px` }}>
        {notOrderedTl > 0 ? `₺${fmt(notOrderedTl)}` : '-'}
      </div>
      <div style={{ width: `${COL_W.gap}px`, height: '100%' }} />
      <div style={{ ...readonlyStyle, width: `${COL_W.invoice}px`, borderRight: 'none', backgroundColor: '#eff6ff', fontWeight: 600, color: '#1e40af' }}>
        {invoice !== 0 ? fmt(invoice) : '-'}
      </div>
    </div>
  );
});

export default AccountingGrid;
