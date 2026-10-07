/**
 * TrustExpensePSheet - Flat list trust expense grid
 *
 * Single flat list of items (no project grouping).
 * Column 1: Color box (fixed-left, 50px)
 * 13 scrollable columns: TYPE, VENDOR, ORDER TYPE, STATUS, STD, ETD, RTRD, FTD, EXPENSES/USD, EXPENSES/TL, SHELVES LOC., CONTAINER NO, INVOICE
 * Right-side blocks: Accounting, Payments, Invoice - all share same items array
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getTrustExpenseItems, updateTrustExpenseItem, createTrustExpenseItemDirect, deleteTrustExpenseItem, reorderTrustExpenseItems } from '../../lib/trust-expenses';
import type { TrustExpenseItem } from '../../types/trustExpense';
import { ROW_HEIGHT, TOTAL_ROW_HEIGHT } from '../../constants';
import { formatDateCell } from '../../lib/dateUtils';
import { getStatusStyle } from '../../utils/statusStyles';
import { formatMoneyDisplay } from '../../utils/moneyUtils';
import { CellVendorAutocomplete, CellOrderTypeAutocomplete, CellStatusAutocomplete, DateEditor } from '../../components/InlineEditors';
import ContainerCellEditor from '../../components/ContainerCellEditor';
import TrustExpenseContextMenu, { COLOR_PALETTE } from '../../components/TrustExpenseContextMenu';
import TrustExpensePaymentsGrid from './TrustExpensePaymentsGrid';
import TrustExpenseInvoiceGrid from './TrustExpenseInvoiceGrid';
import { exportTrustExpenseToExcel } from '../../utils/excel/exportTrustExpenseExcel';

// Safe numeric conversion
const toNumber = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const cleaned = v.replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof v === 'object' && typeof (v as any).toNumber === 'function') return (v as any).toNumber();
  return 0;
};

const formatDisplayMoney = (value: number, currency: 'USD' | 'TL'): string => {
  if (value <= 0) return '-';
  const formatted = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency === 'USD' ? `$${formatted}` : `\u20BA${formatted}`;
};

// Column widths
const COL_WIDTHS = {
  colorBox: 50,
  teType: 140,
  vendor: 200,
  orderType: 160,
  status: 140,
  std: 120,
  etd: 120,
  rtrd: 120,
  rdy: 120,
  ftd: 120,
  snd: 120,
  expensesUsd: 140,
  expensesTl: 140,
  shelves: 140,
  containerNo: 140,
  invoice: 140,
};

const SCROLLABLE_WIDTH = COL_WIDTHS.teType + COL_WIDTHS.vendor + COL_WIDTHS.orderType +
  COL_WIDTHS.status + COL_WIDTHS.std + COL_WIDTHS.etd + COL_WIDTHS.rtrd + COL_WIDTHS.rdy + COL_WIDTHS.ftd + COL_WIDTHS.snd +
  COL_WIDTHS.expensesUsd + COL_WIDTHS.expensesTl + COL_WIDTHS.shelves + COL_WIDTHS.containerNo + COL_WIDTHS.invoice;

const GRID_WIDTH = COL_WIDTHS.colorBox + SCROLLABLE_WIDTH;

// Accounting total width
const ACCT_COL_W = 120;
const ACCT_TOTAL = 8 * ACCT_COL_W;

// ==================== ACCOUNTING BLOCK ====================

interface AccountingBlockProps {
  items: TrustExpenseItem[];
  onItemUpdate: (itemId: string, patch: Partial<TrustExpenseItem>) => void;
}

const AccountingBlock: React.FC<AccountingBlockProps> = ({ items, onItemUpdate }) => {
  const [paidAmounts, setPaidAmounts] = useState<Record<string, { usd1: number; usd2: number; tl1: number; tl2: number }>>({});

  useEffect(() => {
    const init: typeof paidAmounts = {};
    items.forEach(item => {
      if (!paidAmounts[item.id]) {
        init[item.id] = {
          usd1: toNumber(item.paidUsd1),
          usd2: toNumber(item.paidUsd2),
          tl1: toNumber(item.paidTl1),
          tl2: toNumber(item.paidTl2),
        };
      }
    });
    if (Object.keys(init).length > 0) {
      setPaidAmounts(prev => ({ ...prev, ...init }));
    }
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const updatePaidAmount = useCallback(async (itemId: string, field: string, value: number) => {
    setPaidAmounts(prev => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || { usd1: 0, usd2: 0, tl1: 0, tl2: 0 }), [field]: value }
    }));

    const fieldMap: Record<string, string> = { usd1: 'paidUsd1', usd2: 'paidUsd2', tl1: 'paidTl1', tl2: 'paidTl2' };
    const backendField = fieldMap[field];
    if (!backendField) return;

    try {
      const updated = await updateTrustExpenseItem(itemId, { [backendField]: value } as any);
      onItemUpdate(itemId, updated);
    } catch (error) {
      console.error('Failed to save paid amount:', error);
    }
  }, [onItemUpdate]);

  const getAccountingValues = (item: TrustExpenseItem) => {
    const paid = paidAmounts[item.id] || { usd1: 0, usd2: 0, tl1: 0, tl2: 0 };
    const expUsd = toNumber(item.expensesUsd);
    const expTl = toNumber(item.expensesTl);
    const totalPaidUsd = paid.usd1 + paid.usd2;
    const totalPaidTl = paid.tl1 + paid.tl2;

    return {
      paid,
      remainingUsd: Math.max(0, expUsd - totalPaidUsd),
      remainingTl: Math.max(0, expTl - totalPaidTl),
      notOrderedUsd: item.status === 'NOT_ORDERED' ? expUsd : 0,
      notOrderedTl: item.status === 'NOT_ORDERED' ? expTl : 0,
    };
  };

  const sectionTotals = useMemo(() => {
    let paidUsd1 = 0, paidUsd2 = 0, paidTl1 = 0, paidTl2 = 0;
    let remainingUsd = 0, remainingTl = 0, notOrderedUsd = 0, notOrderedTl = 0;
    items.forEach(item => {
      const paid = paidAmounts[item.id] || { usd1: 0, usd2: 0, tl1: 0, tl2: 0 };
      const acct = getAccountingValues(item);
      paidUsd1 += paid.usd1; paidUsd2 += paid.usd2;
      paidTl1 += paid.tl1; paidTl2 += paid.tl2;
      remainingUsd += acct.remainingUsd; remainingTl += acct.remainingTl;
      notOrderedUsd += acct.notOrderedUsd; notOrderedTl += acct.notOrderedTl;
    });
    return { paidUsd1, paidUsd2, paidTl1, paidTl2, remainingUsd, remainingTl, notOrderedUsd, notOrderedTl };
  }, [items, paidAmounts]); // eslint-disable-line react-hooks/exhaustive-deps

  const fmtMoney = (v: number, sym: string) =>
    v > 0 ? `${sym}${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';

  return (
    <div style={{ minWidth: `${ACCT_TOTAL}px` }}>
      {/* Top Label Row (gold) */}
      <div style={{
        backgroundColor: '#D4AF37', color: '#000', display: 'flex', alignItems: 'center',
        fontSize: '12px', fontWeight: '600', padding: '4px 0', height: '34px', boxSizing: 'border-box',
      }}>
        <div style={{ width: ACCT_COL_W, textAlign: 'center', borderRight: '1px solid #000' }}>1st</div>
        <div style={{ width: ACCT_COL_W, textAlign: 'center', borderRight: '1px solid #000' }}>2nd</div>
        <div style={{ width: ACCT_COL_W, textAlign: 'center', borderRight: '1px solid #000' }}>1st</div>
        <div style={{ width: ACCT_COL_W, textAlign: 'center', borderRight: '1px solid #000' }}>2nd</div>
        <div style={{ width: ACCT_COL_W, textAlign: 'center', borderRight: '1px solid #000' }}>Remaining</div>
        <div style={{ width: ACCT_COL_W, textAlign: 'center', borderRight: '1px solid #000' }}>Remaining</div>
        <div style={{ width: ACCT_COL_W, textAlign: 'center', borderRight: '1px solid #000' }}>Not Ordered</div>
        <div style={{ width: ACCT_COL_W, textAlign: 'center' }}>Not Ordered</div>
      </div>
      {/* Column Headers (black) */}
      <div style={{
        backgroundColor: '#000', color: 'white', display: 'flex', height: '34px',
        alignItems: 'center', fontSize: '12px', fontWeight: '600', boxSizing: 'border-box',
      }}>
        <div style={{ width: ACCT_COL_W, textAlign: 'center', borderRight: '1px solid #333' }}>Paid/USD</div>
        <div style={{ width: ACCT_COL_W, textAlign: 'center', borderRight: '1px solid #333' }}>Paid/USD</div>
        <div style={{ width: ACCT_COL_W, textAlign: 'center', borderRight: '1px solid #333' }}>Paid/TL</div>
        <div style={{ width: ACCT_COL_W, textAlign: 'center', borderRight: '1px solid #333' }}>Paid/TL</div>
        <div style={{ width: ACCT_COL_W, textAlign: 'center', borderRight: '1px solid #333' }}>USD</div>
        <div style={{ width: ACCT_COL_W, textAlign: 'center', borderRight: '1px solid #333' }}>TL</div>
        <div style={{ width: ACCT_COL_W, textAlign: 'center', borderRight: '1px solid #333' }}>USD</div>
        <div style={{ width: ACCT_COL_W, textAlign: 'center' }}>TL</div>
      </div>
      {/* Data Rows */}
      {items.map(item => {
        const acct = getAccountingValues(item);
        return (
          <div key={item.id} style={{
            display: 'flex', height: `${ROW_HEIGHT}px`, alignItems: 'center',
            fontSize: '12px', backgroundColor: '#FFF8DC', borderBottom: '1px solid #ddd'
          }}>
            {['usd1', 'usd2', 'tl1', 'tl2'].map(field => (
              <input
                key={field}
                type="number"
                value={acct.paid[field as keyof typeof acct.paid] || ''}
                onChange={(e) => updatePaidAmount(item.id, field, parseFloat(e.target.value) || 0)}
                style={{
                  width: ACCT_COL_W, height: '100%', padding: '4px', border: 'none',
                  borderRight: '1px solid #ccc', textAlign: 'right',
                  backgroundColor: '#FFF8DC', fontSize: '12px'
                }}
              />
            ))}
            <div style={{ width: ACCT_COL_W, height: '100%', padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderRight: '1px solid #ccc' }}>
              {fmtMoney(acct.remainingUsd, '$')}
            </div>
            <div style={{ width: ACCT_COL_W, height: '100%', padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderRight: '1px solid #ccc' }}>
              {fmtMoney(acct.remainingTl, '\u20BA')}
            </div>
            <div style={{ width: ACCT_COL_W, height: '100%', padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderRight: '1px solid #ccc' }}>
              {fmtMoney(acct.notOrderedUsd, '$')}
            </div>
            <div style={{ width: ACCT_COL_W, height: '100%', padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              {fmtMoney(acct.notOrderedTl, '\u20BA')}
            </div>
          </div>
        );
      })}
      {/* Totals Row */}
      <div style={{
        display: 'flex', height: `${TOTAL_ROW_HEIGHT}px`, alignItems: 'center',
        fontSize: '14px', fontWeight: '700', backgroundColor: '#D4AF37', color: '#000',
        borderTop: '2px solid #000', borderBottom: '1px solid #000'
      }}>
        {[
          { v: sectionTotals.paidUsd1, s: '$' }, { v: sectionTotals.paidUsd2, s: '$' },
          { v: sectionTotals.paidTl1, s: '\u20BA' }, { v: sectionTotals.paidTl2, s: '\u20BA' },
          { v: sectionTotals.remainingUsd, s: '$' }, { v: sectionTotals.remainingTl, s: '\u20BA' },
          { v: sectionTotals.notOrderedUsd, s: '$' }, { v: sectionTotals.notOrderedTl, s: '\u20BA' },
        ].map((cell, i) => (
          <div key={i} style={{
            width: ACCT_COL_W, textAlign: 'right', padding: '0 8px',
            borderRight: i < 7 ? '1px solid #000' : 'none'
          }}>
            {cell.s}{cell.v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== EDITING STATE ====================

interface EditingState {
  itemId: string;
  field: string;
}

// ==================== MAIN SHEET COMPONENT ====================

interface TrustExpensePSheetProps {
  onRefreshRef?: (fn: () => void) => void;
  onExportRef?: (fn: () => void) => void;
}

const TrustExpensePSheet: React.FC<TrustExpensePSheetProps> = ({ onRefreshRef, onExportRef }) => {
  const [items, setItems] = useState<TrustExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<EditingState | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string } | null>(null);

  // Cell refs for anchored dropdowns
  const cellRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});
  const getCellRef = (cellKey: string) => {
    if (!cellRefs.current[cellKey]) {
      cellRefs.current[cellKey] = React.createRef<HTMLDivElement>();
    }
    return cellRefs.current[cellKey];
  };

  // Distinct teType values for autocomplete
  const distinctTeTypes = useMemo(() => {
    const types = new Set<string>();
    items.forEach(item => { if (item.teType) types.add(item.teType); });
    return Array.from(types).sort();
  }, [items]);

  // Used colors for context menu
  const usedColors = useMemo(() => {
    const colors = new Set<string>();
    items.forEach(item => { if (item.colorHex) colors.add(item.colorHex); });
    return Array.from(colors);
  }, [items]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTrustExpenseItems();
      setItems(data || []);
    } catch (err: any) {
      console.error('Error loading trust expense data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (onRefreshRef) onRefreshRef(loadData);
  }, [onRefreshRef, loadData]);

  const handleExportExcel = useCallback(() => {
    if (items.length === 0) return;
    exportTrustExpenseToExcel({ items });
  }, [items]);

  useEffect(() => {
    if (onExportRef) onExportRef(handleExportExcel);
  }, [onExportRef, handleExportExcel]);

  const updateItem = useCallback((itemId: string, patch: Partial<TrustExpenseItem>) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...patch } : item));
  }, []);

  const handleCellSave = useCallback(async (itemId: string, field: string, value: any) => {
    setEditingCell(null);
    try {
      let payload: any = {};
      if (['expensesUsd', 'expensesTl'].includes(field)) {
        payload[field] = value ? parseFloat(value) : null;
      } else if (['std', 'etd', 'rtrd', 'ftd'].includes(field)) {
        payload[field] = value || null;
      } else {
        payload[field] = value || null;
      }
      const updated = await updateTrustExpenseItem(itemId, payload);
      updateItem(itemId, updated);
    } catch (error) {
      console.error('Failed to update field:', error);
    }
  }, [updateItem]);

  // ==================== CONTEXT MENU HANDLERS ====================

  const handleContextMenu = useCallback((e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, itemId });
  }, []);

  const handleAddRowSameColor = useCallback(async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const idx = items.indexOf(item);
    const nextItem = items[idx + 1];
    let newSortOrder: number;

    if (nextItem) {
      const gap = nextItem.sortOrder - item.sortOrder;
      if (gap < 2) {
        // Full reorder needed
        const reordered = items.map((it, i) => ({ id: it.id, sortOrder: (i + 1) * 1000 }));
        await reorderTrustExpenseItems(reordered);
        newSortOrder = (idx + 1) * 1000 + 500;
      } else {
        newSortOrder = Math.floor((item.sortOrder + nextItem.sortOrder) / 2);
      }
    } else {
      newSortOrder = item.sortOrder + 1000;
    }

    try {
      const created = await createTrustExpenseItemDirect({
        colorHex: item.colorHex,
        sortOrder: newSortOrder,
        status: 'NOT_ORDERED' as any,
      });
      setItems(prev => {
        const newItems = [...prev, created];
        newItems.sort((a, b) => a.sortOrder - b.sortOrder || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return newItems;
      });
    } catch (err) {
      console.error('Failed to add row:', err);
    }
  }, [items]);

  const handleAddRowNewColor = useCallback(async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Find next unused color
    const nextColor = COLOR_PALETTE.find(c => !usedColors.includes(c)) || COLOR_PALETTE[0];

    const idx = items.indexOf(item);
    const nextItem = items[idx + 1];
    let newSortOrder: number;

    if (nextItem) {
      const gap = nextItem.sortOrder - item.sortOrder;
      if (gap < 2) {
        const reordered = items.map((it, i) => ({ id: it.id, sortOrder: (i + 1) * 1000 }));
        await reorderTrustExpenseItems(reordered);
        newSortOrder = (idx + 1) * 1000 + 500;
      } else {
        newSortOrder = Math.floor((item.sortOrder + nextItem.sortOrder) / 2);
      }
    } else {
      newSortOrder = item.sortOrder + 1000;
    }

    try {
      const created = await createTrustExpenseItemDirect({
        colorHex: nextColor,
        sortOrder: newSortOrder,
        status: 'NOT_ORDERED' as any,
      });
      setItems(prev => {
        const newItems = [...prev, created];
        newItems.sort((a, b) => a.sortOrder - b.sortOrder || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return newItems;
      });
    } catch (err) {
      console.error('Failed to add row:', err);
    }
  }, [items, usedColors]);

  const handleDeleteRow = useCallback(async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this row?')) return;
    try {
      await deleteTrustExpenseItem(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      console.error('Failed to delete row:', err);
    }
  }, []);

  // ==================== RENDER CELL ====================

  const renderCell = (item: TrustExpenseItem, field: string, displayValue: string, className: string, editable: boolean, cellRef: React.RefObject<HTMLDivElement>) => {
    const isEditing = editingCell?.itemId === item.id && editingCell?.field === field;

    // Status cell with color
    if (field === 'status') {
      const statusStyle = getStatusStyle(item.status);
      if (isEditing) {
        return (
          <div key={field} ref={cellRef} className={`row-cell ${className}`} style={{ position: 'relative' }}>
            <CellStatusAutocomplete
              value={item.status || ''}
              onSave={(v) => handleCellSave(item.id, 'status', v)}
              onCancel={() => setEditingCell(null)}
              triggerRef={cellRef}
              itemId={item.id}
              projectId={item.projectId}
            />
          </div>
        );
      }
      return (
        <div key={field} ref={cellRef} className={`row-cell ${className}`}
          style={{ backgroundColor: statusStyle.backgroundColor, color: statusStyle.color, cursor: editable ? 'pointer' : 'default' }}
          onClick={() => editable && setEditingCell({ itemId: item.id, field })}
        >
          {displayValue ? displayValue.replace(/_/g, ' ') : ''}
        </div>
      );
    }

    // Vendor cell
    if (field === 'vendor') {
      if (isEditing) {
        return (
          <div key={field} ref={cellRef} className={`row-cell ${className}`} style={{ position: 'relative' }}>
            <CellVendorAutocomplete
              value={item.vendor?.code || ''}
              onSave={(v) => handleCellSave(item.id, 'vendorId', v)}
              onCancel={() => setEditingCell(null)}
              triggerRef={cellRef}
              itemId={item.id}
              projectId={item.projectId}
            />
          </div>
        );
      }
      return (
        <div key={field} ref={cellRef} className={`row-cell ${className}`}
          style={{ cursor: editable ? 'pointer' : 'default' }}
          onClick={() => editable && setEditingCell({ itemId: item.id, field })}
        >
          {displayValue}
        </div>
      );
    }

    // Order type cell
    if (field === 'orderType') {
      if (isEditing) {
        return (
          <div key={field} ref={cellRef} className={`row-cell ${className}`} style={{ position: 'relative' }}>
            <CellOrderTypeAutocomplete
              value={item.orderType || ''}
              onSave={(v) => handleCellSave(item.id, 'orderType', v)}
              onCancel={() => setEditingCell(null)}
              triggerRef={cellRef}
              itemId={item.id}
              projectId={item.projectId}
            />
          </div>
        );
      }
      return (
        <div key={field} ref={cellRef} className={`row-cell ${className}`}
          style={{ cursor: editable ? 'pointer' : 'default' }}
          onClick={() => editable && setEditingCell({ itemId: item.id, field })}
        >
          {displayValue}
        </div>
      );
    }

    // Date cells
    if (['std', 'etd', 'rtrd', 'ftd'].includes(field)) {
      if (isEditing) {
        const rawValue = (item as any)[field] ? new Date((item as any)[field]).toISOString().split('T')[0] : '';
        return (
          <div key={field} ref={cellRef} className={`row-cell ${className}`} style={{ position: 'relative' }}>
            <DateEditor
              value={rawValue}
              onSave={(v) => handleCellSave(item.id, field, v)}
              onCancel={() => setEditingCell(null)}
            />
          </div>
        );
      }
      return (
        <div key={field} ref={cellRef} className={`row-cell ${className}`}
          style={{ cursor: editable ? 'pointer' : 'default' }}
          onClick={() => editable && setEditingCell({ itemId: item.id, field })}
        >
          {displayValue}
        </div>
      );
    }

    // Money cells
    if (['expensesUsd', 'expensesTl'].includes(field)) {
      const numValue = toNumber((item as any)[field]);
      const sym = field === 'expensesUsd' ? '$' : '\u20BA';
      if (isEditing) {
        return (
          <div key={field} ref={cellRef} className={`row-cell ${className}`} style={{ position: 'relative' }}>
            <input
              autoFocus type="text" inputMode="decimal"
              defaultValue={numValue > 0 ? numValue.toString() : ''}
              onBlur={(e) => handleCellSave(item.id, field, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCellSave(item.id, field, (e.target as HTMLInputElement).value);
                if (e.key === 'Escape') setEditingCell(null);
              }}
              style={{
                width: '100%', height: '100%', padding: '4px 8px', border: '2px solid #3b82f6',
                borderRadius: '4px', textAlign: 'right', fontSize: '12px', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
        );
      }
      return (
        <div key={field} ref={cellRef} className={`row-cell ${className}`}
          style={{
            cursor: editable ? 'pointer' : 'default',
            textAlign: 'right', justifyContent: 'flex-end',
            backgroundColor: 'rgba(147, 197, 253, 0.1)'
          }}
          onClick={() => editable && setEditingCell({ itemId: item.id, field })}
        >
          {numValue > 0 ? `${sym}${formatMoneyDisplay(numValue)}` : ''}
        </div>
      );
    }

    // Container NO cell with ContainerCellEditor
    if (field === 'containerNo') {
      if (isEditing) {
        return (
          <div key={field} ref={cellRef} className={`row-cell ${className}`} style={{ position: 'relative' }}>
            <ContainerCellEditor
              value={item.containerNo || ''}
              onSave={(v) => handleCellSave(item.id, 'containerNo', v)}
              onCancel={() => setEditingCell(null)}
              triggerRef={cellRef}
            />
          </div>
        );
      }
      return (
        <div key={field} ref={cellRef} className={`row-cell ${className}`}
          style={{ cursor: editable ? 'pointer' : 'default' }}
          onClick={() => editable && setEditingCell({ itemId: item.id, field })}
        >
          {displayValue}
        </div>
      );
    }

    // teType cell - free text with autocomplete datalist
    if (field === 'teType') {
      if (isEditing) {
        return (
          <div key={field} ref={cellRef} className={`row-cell ${className}`} style={{ position: 'relative' }}>
            <input
              autoFocus type="text" list="te-type-suggestions"
              defaultValue={item.teType || ''}
              onBlur={(e) => handleCellSave(item.id, 'teType', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCellSave(item.id, 'teType', (e.target as HTMLInputElement).value);
                if (e.key === 'Escape') setEditingCell(null);
              }}
              style={{
                width: '100%', height: '100%', padding: '4px 8px', border: '2px solid #3b82f6',
                borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
        );
      }
      return (
        <div key={field} ref={cellRef} className={`row-cell ${className}`}
          style={{ cursor: editable ? 'pointer' : 'default' }}
          onClick={() => editable && setEditingCell({ itemId: item.id, field })}
        >
          {displayValue}
        </div>
      );
    }

    // Generic text cells (shelves, invoice)
    if (isEditing) {
      return (
        <div key={field} ref={cellRef} className={`row-cell ${className}`} style={{ position: 'relative' }}>
          <input
            autoFocus type="text"
            defaultValue={displayValue}
            onBlur={(e) => handleCellSave(item.id, field, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave(item.id, field, (e.target as HTMLInputElement).value);
              if (e.key === 'Escape') setEditingCell(null);
            }}
            style={{
              width: '100%', height: '100%', padding: '4px 8px', border: '2px solid #3b82f6',
              borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>
      );
    }

    return (
      <div key={field} ref={cellRef} className={`row-cell ${className}`}
        style={{ cursor: editable ? 'pointer' : 'default' }}
        onClick={() => editable && setEditingCell({ itemId: item.id, field })}
      >
        {displayValue}
      </div>
    );
  };

  // ==================== TOTALS ====================

  const totals = useMemo(() => {
    let usd = 0, tl = 0;
    items.forEach(i => { usd += toNumber(i.expensesUsd); tl += toNumber(i.expensesTl); });
    return { usd, tl };
  }, [items]);

  const handleAddFirstRow = useCallback(async () => {
    try {
      const created = await createTrustExpenseItemDirect({
        colorHex: COLOR_PALETTE[0],
        sortOrder: 1000,
        status: 'NOT_ORDERED' as any,
      });
      setItems([created]);
    } catch (err) {
      console.error('Failed to add first row:', err);
    }
  }, []);

  // ==================== RENDER ====================

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading trust expense data...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 20, backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: 4 }}>
        <h3>Error Loading Data</h3>
        <p style={{ color: '#c00' }}>{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '80px 40px', backgroundColor: '#1a1a1a', borderRadius: 8, gap: 16,
      }}>
        <div style={{ fontSize: 40, opacity: 0.3 }}>📋</div>
        <h3 style={{ margin: 0, color: '#ccc', fontWeight: 600 }}>No Trust Expense Items</h3>
        <p style={{ margin: 0, color: '#888', fontSize: 14 }}>Get started by adding your first row</p>
        <button
          onClick={handleAddFirstRow}
          style={{
            marginTop: 8, padding: '10px 28px', backgroundColor: '#D4AF37', color: '#000',
            border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          + Add Row
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: 'max-content', minWidth: '100%' }}>
      {/* Hidden datalist for teType autocomplete */}
      <datalist id="te-type-suggestions">
        {distinctTeTypes.map(t => <option key={t} value={t} />)}
      </datalist>

      <div style={{
        display: 'flex', alignItems: 'flex-start',
        flexWrap: 'nowrap', width: 'fit-content',
      }}>
        {/* ==================== MAIN GRID ==================== */}
        <div style={{ flex: '0 0 auto' }}>
          {/* Red Section Header */}
          <div className="te-section-header" style={{ width: `${GRID_WIDTH}px` }}>
            TRUST EXPENSES
          </div>

          {/* Group Header Row */}
          <div style={{
            display: 'flex', height: '34px', width: `${GRID_WIDTH}px`,
          }}>
            <div style={{ width: `${COL_WIDTHS.colorBox}px`, backgroundColor: '#1a1a1a', flexShrink: 0 }} />
            <div style={{ width: `${COL_WIDTHS.teType + COL_WIDTHS.vendor + COL_WIDTHS.orderType + COL_WIDTHS.status}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', color: 'white', fontSize: '11px', fontWeight: '600', borderRight: '1px solid #333' }}>DETAILS</div>
            <div style={{ width: `${COL_WIDTHS.std + COL_WIDTHS.etd + COL_WIDTHS.rtrd + COL_WIDTHS.ftd}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', color: 'white', fontSize: '11px', fontWeight: '600', borderRight: '1px solid #333' }}>DATES</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', color: 'white', fontSize: '11px', fontWeight: '600' }}>FINANCIALS & LOGISTICS</div>
          </div>

          {/* Column Headers */}
          <div style={{
            display: 'flex', height: '34px', width: `${GRID_WIDTH}px`,
            backgroundColor: '#000', color: 'white', fontSize: '11px', fontWeight: '600',
            borderBottom: '2px solid #333',
          }}>
            <div style={{ width: `${COL_WIDTHS.colorBox}px`, flexShrink: 0 }} />
            <div className="column-header-cell col-te-type">TYPE</div>
            <div className="column-header-cell col-te-vendor">VENDOR</div>
            <div className="column-header-cell col-te-order-type">ORDER TYPE</div>
            <div className="column-header-cell col-te-status">STATUS</div>
            <div className="column-header-cell col-te-std">STD</div>
            <div className="column-header-cell col-te-etd">ETD</div>
            <div className="column-header-cell col-te-rtrd">RTRD</div>
            <div className="column-header-cell col-te-rdy">RDY</div>
            <div className="column-header-cell col-te-ftd">FTD</div>
            <div className="column-header-cell col-te-snd">SND</div>
            <div className="column-header-cell col-te-expenses-usd te-expense-header">EXPENSES/USD</div>
            <div className="column-header-cell col-te-expenses-tl te-expense-header">EXPENSES/TL</div>
            <div className="column-header-cell col-te-shelves te-expense-header">SHELVES LOC.</div>
            <div className="column-header-cell col-te-container-no te-expense-header">CONTAINER NO</div>
            <div className="column-header-cell col-te-invoice te-expense-header">INVOICE</div>
          </div>

          {/* Data Rows */}
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', height: `${ROW_HEIGHT}px`, width: `${GRID_WIDTH}px` }} onContextMenu={(e) => handleContextMenu(e, item.id)}>
              <div style={{ width: `${COL_WIDTHS.colorBox}px`, flexShrink: 0, backgroundColor: item.colorHex || '#e0e0e0', borderBottom: '1px solid rgba(0,0,0,0.1)', cursor: 'context-menu' }} />
              {renderCell(item, 'teType', item.teType || '', 'col-te-type', true, getCellRef(`${item.id}-teType`))}
              {renderCell(item, 'vendor', item.vendor ? `${item.vendor.code} - ${item.vendor.name}` : '', 'col-te-vendor', true, getCellRef(`${item.id}-vendor`))}
              {renderCell(item, 'orderType', item.orderType || '', 'col-te-order-type', true, getCellRef(`${item.id}-orderType`))}
              {renderCell(item, 'status', item.status || '', 'col-te-status', true, getCellRef(`${item.id}-status`))}
              {renderCell(item, 'std', formatDateCell(item.std), 'col-te-std', true, getCellRef(`${item.id}-std`))}
              {renderCell(item, 'etd', formatDateCell(item.etd), 'col-te-etd', true, getCellRef(`${item.id}-etd`))}
              {renderCell(item, 'rtrd', formatDateCell(item.rtrd), 'col-te-rtrd', true, getCellRef(`${item.id}-rtrd`))}
              {renderCell(item, 'rdy', formatDateCell(item.rdy), 'col-te-rdy', true, getCellRef(`${item.id}-rdy`))}
              {renderCell(item, 'ftd', formatDateCell(item.ftd), 'col-te-ftd', true, getCellRef(`${item.id}-ftd`))}
              {renderCell(item, 'snd', formatDateCell(item.snd), 'col-te-snd', true, getCellRef(`${item.id}-snd`))}
              {renderCell(item, 'expensesUsd', '', 'col-te-expenses-usd', true, getCellRef(`${item.id}-expensesUsd`))}
              {renderCell(item, 'expensesTl', '', 'col-te-expenses-tl', true, getCellRef(`${item.id}-expensesTl`))}
              {renderCell(item, 'shelvesLocation', item.shelvesLocation || '', 'col-te-shelves', true, getCellRef(`${item.id}-shelvesLocation`))}
              {renderCell(item, 'containerNo', item.containerNo || '', 'col-te-container-no', true, getCellRef(`${item.id}-containerNo`))}
              {renderCell(item, 'invoice', item.invoice || '', 'col-te-invoice', true, getCellRef(`${item.id}-invoice`))}
            </div>
          ))}

          {/* TOTAL Row */}
          <div style={{
            display: 'flex', height: `${TOTAL_ROW_HEIGHT}px`, width: `${GRID_WIDTH}px`,
            backgroundColor: '#404040', borderTop: '2px solid #333',
          }}>
            <div style={{ width: `${COL_WIDTHS.colorBox}px`, flexShrink: 0 }} />
            <div style={{ width: `${COL_WIDTHS.teType}px`, flexShrink: 0 }} />
            <div style={{ width: `${COL_WIDTHS.vendor}px`, flexShrink: 0 }} />
            <div style={{ width: `${COL_WIDTHS.orderType}px`, flexShrink: 0 }} />
            <div style={{ width: `${COL_WIDTHS.status}px`, flexShrink: 0 }} />
            <div style={{ width: `${COL_WIDTHS.std}px`, flexShrink: 0 }} />
            <div style={{ width: `${COL_WIDTHS.etd}px`, flexShrink: 0 }} />
            <div style={{ width: `${COL_WIDTHS.rtrd}px`, flexShrink: 0 }} />
            <div style={{
              width: `${COL_WIDTHS.ftd}px`, flexShrink: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'flex-end', paddingRight: '12px', color: '#fff',
              fontWeight: '700', fontSize: '11px',
            }}>
              TOTAL
            </div>
            <div style={{
              width: `${COL_WIDTHS.expensesUsd}px`, flexShrink: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'flex-end', paddingRight: '8px', color: '#fff',
              fontWeight: '800', fontSize: '13px',
            }}>
              {formatDisplayMoney(totals.usd, 'USD')}
            </div>
            <div style={{
              width: `${COL_WIDTHS.expensesTl}px`, flexShrink: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'flex-end', paddingRight: '8px', color: '#fff',
              fontWeight: '800', fontSize: '13px',
            }}>
              {formatDisplayMoney(totals.tl, 'TL')}
            </div>
            <div style={{ width: `${COL_WIDTHS.shelves}px`, flexShrink: 0 }} />
            <div style={{ width: `${COL_WIDTHS.containerNo}px`, flexShrink: 0 }} />
            <div style={{ width: `${COL_WIDTHS.invoice}px`, flexShrink: 0 }} />
          </div>
        </div>

        {/* Gap */}
        <div style={{ width: 4, flexShrink: 0 }} />

        {/* ==================== ACCOUNTING BLOCK ==================== */}
        <div>
          <div style={{
            height: 44, backgroundColor: '#D4AF37', color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: '14px', letterSpacing: '1px',
          }}>
            ACCOUNTING
          </div>
          <AccountingBlock items={items} onItemUpdate={updateItem} />
        </div>

        {/* Gap */}
        <div style={{ width: 4, flexShrink: 0 }} />

        {/* ==================== PAYMENTS BLOCK ==================== */}
        <div>
          <div style={{
            height: 44, backgroundColor: '#2f4b1f', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: '14px', letterSpacing: '1px',
          }}>
            PAYMENTS
          </div>
          <TrustExpensePaymentsGrid
            items={items}
            showSectionHeader={false}
            sectionLabel=""
            updateGlobalItem={updateItem}
          />
        </div>

        {/* Gap */}
        <div style={{ width: 4, flexShrink: 0 }} />

        {/* ==================== INVOICE BLOCK ==================== */}
        <div>
          <div style={{
            height: 44, backgroundColor: '#696969', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: '14px', letterSpacing: '1px',
          }}>
            INVOICE & RECEIPT
          </div>
          <TrustExpenseInvoiceGrid
            items={items}
            showSectionHeader={false}
            sectionLabel=""
            updateGlobalItem={updateItem}
          />
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <TrustExpenseContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          itemId={contextMenu.itemId}
          itemColorHex={items.find(i => i.id === contextMenu.itemId)?.colorHex || null}
          usedColors={usedColors}
          onClose={() => setContextMenu(null)}
          onAddRowSameColor={handleAddRowSameColor}
          onAddRowNewColor={handleAddRowNewColor}
          onDeleteRow={handleDeleteRow}
        />
      )}
    </div>
  );
};

export default TrustExpensePSheet;
