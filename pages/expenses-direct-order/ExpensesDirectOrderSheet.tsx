/**
 * ExpensesDirectOrderSheet - Clone of ExpensesPSheet for Direct Order domain
 *
 * Layout: [Main Grid] [24px gap] [Accounting] [24px gap] [Payments] [24px gap] [Invoice]
 * NO PF CODE, NO SIGNATURES, NO ROW ADD/DELETE
 * Money: expensesUsd / expensesTl (instead of pfUsd / pfTl)
 * Projects: sourced from Direct Orders (default) or Legacy manual entry
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  getExpensesDirectOrderProjects,
  createExpensesDirectOrderProject,
  createExpensesDirectOrderItem,
  updateExpensesDirectOrderItem,
  deleteExpensesDirectOrderProject,
} from '../../lib/expenses-direct-order';
import { getDirectOrders } from '../../lib/direct-orders';
import type { ExpensesDirectOrderProject, ExpensesDirectOrderItem } from '../../types/expensesDirectOrder';
import { formatDateCell } from '../../lib/dateUtils';
import { getStatusStyle } from '../../utils/statusStyles';
import { formatMoneyDisplay, parseMoneyInput } from '../../utils/moneyUtils';
import {
  CellVendorAutocomplete,
  CellOrderTypeAutocomplete,
  CellStatusAutocomplete,
  DateEditor,
} from '../../components/InlineEditors';
import ContainerCellEditor from '../../components/ContainerCellEditor';

// ── Helpers ──────────────────────────────────────────────────────────

const toNumber = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof v === 'object' && typeof (v as any).toNumber === 'function') return (v as any).toNumber();
  return 0;
};

const fmtMoney = (v: number, currency: 'USD' | 'TL'): string => {
  if (v <= 0) return '-';
  const formatted = v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency === 'USD' ? `$${formatted}` : `₺${formatted}`;
};

const sanitizeMoneyInput = (value: string): string => {
  let s = value.replace(/[^0-9.,]/g, '');
  const parts = s.split('.');
  if (parts.length > 2) s = parts[0] + '.' + parts.slice(1).join('');
  return s;
};

// ── Region helpers ───────────────────────────────────────────────────

const REGION_ORDER = ['TLines NE', 'TLines SE', 'TLines CVW', 'TLines NW', 'TLines HQ', 'TLines TC'];
const BUCKET_OPTIONS = [
  { value: 'TLINES_NE', label: 'TLines NE' },
  { value: 'TLINES_SE', label: 'TLines SE' },
  { value: 'CVW', label: 'TLines CVW' },
  { value: 'TLINES_NW', label: 'TLines NW' },
  { value: 'TLINES_HQ', label: 'TLines HQ' },
  { value: 'TLINES_TC', label: 'TLines TC' },
];

const getRegionLabel = (bucket: string): string => {
  const map: Record<string, string> = {
    TLINES_NE: 'TLines NE', TLINES_SE: 'TLines SE', CVW: 'TLines CVW',
    TLINES_NW: 'TLines NW', TLINES_HQ: 'TLines HQ', TLINES_TC: 'TLines TC',
  };
  return map[bucket] || bucket;
};

// ── Layout constants (matching Supplier P Sheet exactly) ─────────────

// Main grid columns (NO PF CODE, NO SIGNATURES)
const COL = {
  projectNo: 80,
  type: 140,
  vendor: 220,
  orderType: 200,
  status: 140,
  std: 120,
  etd: 120,
  rtrd: 120,
  rdy: 120,
  ftd: 120,
  snd: 120,
  expensesUsd: 140,
  expensesTl: 140,
  paymentRule: 120,
  containerNo: 120,
  shelvesLoc: 120,
  invoiceSit: 120,
};
const GRID_WIDTH = Object.values(COL).reduce((s, w) => s + w, 0);

// Accounting (matching Supplier exactly)
const ACCT_W = {
  paid: 120,
  remaining: 140,
  notOrdered: 140,
  gap: 30,
  get total() { return (4 * this.paid) + (2 * this.remaining) + (2 * this.notOrdered) + (3 * this.gap); }
};

// Payments (matching Supplier exactly)
const PAY_W = {
  col: 120,
  gap: 16,
  get total() { return (6 * this.col) + (2 * this.gap); }
};

// Invoice (matching Supplier exactly)
const INV_W = {
  transactionNo: 140,
  invoiceNumber: 140,
  quickBook: 120,
  gap: 16,
  get total() { return this.transactionNo + this.invoiceNumber + this.quickBook + (2 * this.gap); }
};

// Row heights (matching Supplier exactly)
const H = {
  sectionHeader: 44,
  projectHeader: 52,
  topGroup: 34,
  colHead: 34,
  dataRow: 44,
  totalsRow: 36,
};

const LAYOUT_GAP = 24;

// ── Type options for project creation ────────────────────────────────

type ProjectType = 'Millwork' | 'Shelving' | 'Ceiling' | 'Furniture' | 'Image';

const TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: 'Millwork', label: 'Millwork' },
  { value: 'Shelving', label: 'Shelving' },
  { value: 'Ceiling', label: 'Ceiling' },
  { value: 'Furniture', label: 'Furniture' },
  { value: 'Image', label: 'Image' },
];

// ── Editing state ────────────────────────────────────────────────────

interface EditingState { itemId: string; field: string }

// ── Add Project Modal (From Direct Orders / Legacy) ──────────────────

const AddProjectModal: React.FC<{
  onClose: () => void;
  onCreated: (p: ExpensesDirectOrderProject) => void;
}> = ({ onClose, onCreated }) => {
  const [bucket, setBucket] = useState('');
  const [projectSource, setProjectSource] = useState<'fromDirectOrders' | 'legacy'>('fromDirectOrders');
  const [availableDirectOrders, setAvailableDirectOrders] = useState<any[]>([]);
  const [selectedDOId, setSelectedDOId] = useState('');
  const [legacyProjectNo, setLegacyProjectNo] = useState('');
  const [legacyProjectName, setLegacyProjectName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ProjectType[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const response: any = await getDirectOrders();
        setAvailableDirectOrders(((response as any).data || []).map((p: any) => ({
          id: p.id,
          projectNo: p.projectNo,
          name: p.name,
          bucket: p.bucket,
        })));
      } catch { setAvailableDirectOrders([]); }
    })();
  }, []);

  const handleTypeToggle = (type: ProjectType) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  // Auto-fill bucket when selecting a direct order
  const handleDOSelect = (doId: string) => {
    setSelectedDOId(doId);
    if (doId) {
      const sel = availableDirectOrders.find(p => p.id === doId);
      if (sel && sel.bucket) {
        setBucket(sel.bucket);
      }
    }
  };

  const isValid = (() => {
    if (!bucket || selectedTypes.length === 0) return false;
    if (projectSource === 'fromDirectOrders' && !selectedDOId) return false;
    if (projectSource === 'legacy' && (!legacyProjectNo.trim() || !legacyProjectName.trim())) return false;
    return true;
  })();

  const handleSubmit = async () => {
    if (!isValid) return;
    setSaving(true); setError('');
    try {
      let projectNo: string, name: string;
      if (projectSource === 'fromDirectOrders') {
        const sel = availableDirectOrders.find(p => p.id === selectedDOId);
        if (!sel) { setError('Please select a direct order'); setSaving(false); return; }
        projectNo = sel.projectNo; name = sel.name;
      } else {
        projectNo = legacyProjectNo.trim(); name = legacyProjectName.trim();
      }
      const created = await createExpensesDirectOrderProject({ bucket, projectNo, name });
      const items: ExpensesDirectOrderItem[] = [];
      for (const type of selectedTypes) {
        const item = await createExpensesDirectOrderItem(created.id, { type: type.toUpperCase() } as any);
        items.push(item);
      }
      onCreated({ ...created, items });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
      <div style={{ background: 'white', padding: 24, borderRadius: 8, minWidth: 500, maxWidth: 600, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Add Expenses Direct Order Project</h3>
        {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: 12, borderRadius: 4, marginBottom: 20, border: '1px solid #f5c6cb' }}>{error}</div>}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Region *</label>
          <select value={bucket} onChange={e => setBucket(e.target.value)} style={inputStyle}>
            <option value="">-- Select Region --</option>
            {BUCKET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 500 }}>Project Source</label>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input type="radio" name="edoSrc" checked={projectSource === 'fromDirectOrders'} onChange={() => setProjectSource('fromDirectOrders')} style={{ marginRight: 8 }} />
              From Direct Orders (default)
            </label>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input type="radio" name="edoSrc" checked={projectSource === 'legacy'} onChange={() => setProjectSource('legacy')} style={{ marginRight: 8 }} />
              Legacy project (manual)
            </label>
          </div>
        </div>

        {projectSource === 'fromDirectOrders' ? (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Select Direct Order *</label>
            <select value={selectedDOId} onChange={e => handleDOSelect(e.target.value)} style={inputStyle}>
              <option value="">-- Select Direct Order --</option>
              {availableDirectOrders.map(p => <option key={p.id} value={p.id}>{p.projectNo} - {p.name}</option>)}
            </select>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Project Number *</label>
              <input type="text" value={legacyProjectNo} onChange={e => setLegacyProjectNo(e.target.value)} placeholder="e.g., EDO-001" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Project Name *</label>
              <input type="text" value={legacyProjectName} onChange={e => setLegacyProjectName(e.target.value)} placeholder="e.g., Office Renovation" style={inputStyle} />
            </div>
          </>
        )}

        <div style={{ marginBottom: 30 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Types <span style={{ color: '#dc2626' }}>*</span></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
            {TYPE_OPTIONS.map(t => (
              <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={selectedTypes.includes(t.value)} onChange={() => handleTypeToggle(t.value)} style={{ cursor: 'pointer' }} />
                <span>{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 4, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !isValid} style={{ padding: '10px 20px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: 4, fontSize: 14, cursor: (saving || !isValid) ? 'not-allowed' : 'pointer', opacity: (saving || !isValid) ? 0.6 : 1 }}>
            {saving ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════

interface ExpensesDirectOrderSheetProps {
  onExportRef?: (fn: () => void) => void;
}

const ExpensesDirectOrderSheet: React.FC<ExpensesDirectOrderSheetProps> = ({ onExportRef }) => {
  const [projects, setProjects] = useState<ExpensesDirectOrderProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<EditingState | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Status note state
  const [noteMenu, setNoteMenu] = useState<{ x: number; y: number; itemId: string; hasNote: boolean } | null>(null);
  const [noteDialog, setNoteDialog] = useState<{ itemId: string; text: string; mode: 'view' | 'edit' } | null>(null);

  // Paid amounts local state (accounting inputs)
  const [paidAmounts, setPaidAmounts] = useState<Record<string, { usd1: string; usd2: string; tl1: string; tl2: string }>>({});
  // Invoice local state
  const [invoiceValues, setInvoiceValues] = useState<Record<string, { transactionNo: string; invoiceNumber: string; quickBook: string }>>({});

  const cellRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});
  const getCellRef = (key: string) => {
    if (!cellRefs.current[key]) cellRefs.current[key] = React.createRef<HTMLDivElement>();
    return cellRefs.current[key];
  };

  // ── Data loading ────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await getExpensesDirectOrderProjects();
      setProjects(data || []);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Init paid/invoice state when projects change
  useEffect(() => {
    const newPaid: typeof paidAmounts = {};
    const newInv: typeof invoiceValues = {};
    projects.forEach(p => p.items.forEach(item => {
      const k = item.id;
      if (!paidAmounts[k]) {
        const u1 = toNumber(item.paidUsd1), u2 = toNumber(item.paidUsd2);
        const t1 = toNumber(item.paidTl1), t2 = toNumber(item.paidTl2);
        newPaid[k] = {
          usd1: u1 > 0 ? formatMoneyDisplay(u1) : '',
          usd2: u2 > 0 ? formatMoneyDisplay(u2) : '',
          tl1: t1 > 0 ? formatMoneyDisplay(t1) : '',
          tl2: t2 > 0 ? formatMoneyDisplay(t2) : '',
        };
      }
      if (!invoiceValues[k]) {
        newInv[k] = {
          transactionNo: item.invoiceTransactionNo || '',
          invoiceNumber: item.invoiceNumber || '',
          quickBook: item.quickBook || '',
        };
      }
    }));
    if (Object.keys(newPaid).length) setPaidAmounts(prev => ({ ...prev, ...newPaid }));
    if (Object.keys(newInv).length) setInvoiceValues(prev => ({ ...prev, ...newInv }));
  }, [projects]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Export ──────────────────────────────────────────────────────────

  const handleExportExcel = useCallback(() => {
    const { exportExpensesDirectOrderExcel } = require('../../utils/excel/exportExpensesDirectOrderExcel');
    const regionSections = groupByRegion(projects);
    if (regionSections.length === 0) return;
    exportExpensesDirectOrderExcel({ regionSections });
  }, [projects]);

  useEffect(() => { if (onExportRef) onExportRef(handleExportExcel); }, [onExportRef, handleExportExcel]);

  // ── Item update ────────────────────────────────────────────────────

  const updateItemInState = useCallback((itemId: string, patch: Partial<ExpensesDirectOrderItem>) => {
    setProjects(prev => prev.map(p => ({
      ...p,
      items: p.items.map(i => i.id === itemId ? { ...i, ...patch } : i),
    })));
  }, []);

  const handleCellSave = useCallback(async (itemId: string, field: string, value: any) => {
    setEditingCell(null);
    try {
      const payload: any = {};
      if (['expensesUsd', 'expensesTl'].includes(field)) {
        payload[field] = value ? parseFloat(value) : null;
      } else {
        payload[field] = value || null;
      }
      const updated = await updateExpensesDirectOrderItem(itemId, payload);
      updateItemInState(itemId, updated);
    } catch (err) { console.error('Failed to update:', err); }
  }, [updateItemInState]);

  // Status note save
  const handleStatusNoteSave = useCallback(async (itemId: string, noteText: string) => {
    const value = noteText.trim();
    try {
      const updated = await updateExpensesDirectOrderItem(itemId, { statusNote: value } as any);
      updateItemInState(itemId, updated);
    } catch (err) { console.error('Failed to save status note:', err); }
    setNoteDialog(null);
    setNoteMenu(null);
  }, [updateItemInState]);

  // Accounting paid save
  const handlePaidSave = useCallback(async (itemId: string, field: string, rawValue: string) => {
    const numValue = parseMoneyInput(rawValue);
    const finalValue = numValue !== null ? numValue : 0;
    const formatted = formatMoneyDisplay(finalValue);
    setPaidAmounts(prev => ({ ...prev, [itemId]: { ...(prev[itemId] || { usd1: '', usd2: '', tl1: '', tl2: '' }), [field]: formatted } }));

    const backendField = ({ usd1: 'paidUsd1', usd2: 'paidUsd2', tl1: 'paidTl1', tl2: 'paidTl2' } as any)[field];
    if (!backendField) return;
    try {
      const updated = await updateExpensesDirectOrderItem(itemId, { [backendField]: finalValue } as any);
      updateItemInState(itemId, updated);
    } catch (err) { console.error('Failed to save paid:', err); }
  }, [updateItemInState]);

  const handlePaidFocus = useCallback((itemId: string, field: string) => {
    const current = paidAmounts[itemId]?.[field as keyof typeof paidAmounts[string]] || '';
    const numValue = parseMoneyInput(current);
    const raw = numValue && numValue > 0 ? numValue.toString() : '';
    setPaidAmounts(prev => ({ ...prev, [itemId]: { ...(prev[itemId] || { usd1: '', usd2: '', tl1: '', tl2: '' }), [field]: raw } }));
  }, [paidAmounts]);

  const handlePaidChange = useCallback((itemId: string, field: string, rawValue: string) => {
    const sanitized = sanitizeMoneyInput(rawValue);
    setPaidAmounts(prev => ({ ...prev, [itemId]: { ...(prev[itemId] || { usd1: '', usd2: '', tl1: '', tl2: '' }), [field]: sanitized } }));
  }, []);

  // Invoice save
  const handleInvoiceSave = useCallback(async (itemId: string, field: string, value: string) => {
    const backendField = ({ transactionNo: 'invoiceTransactionNo', invoiceNumber: 'invoiceNumber', quickBook: 'quickBook' } as any)[field];
    if (!backendField) return;
    try {
      const updated = await updateExpensesDirectOrderItem(itemId, { [backendField]: value || null } as any);
      updateItemInState(itemId, updated);
    } catch (err) { console.error('Failed to save invoice:', err); }
  }, [updateItemInState]);

  const handleInvoiceChange = useCallback((itemId: string, field: string, value: string) => {
    setInvoiceValues(prev => ({ ...prev, [itemId]: { ...(prev[itemId] || { transactionNo: '', invoiceNumber: '', quickBook: '' }), [field]: value } }));
  }, []);

  // ── Region grouping ────────────────────────────────────────────────

  const groupByRegion = (projs: ExpensesDirectOrderProject[]) => {
    const byRegion: Record<string, ExpensesDirectOrderProject[]> = {};
    projs.forEach(p => {
      const label = getRegionLabel(p.bucket);
      if (!byRegion[label]) byRegion[label] = [];
      byRegion[label].push(p);
    });
    const ordered = REGION_ORDER.filter(k => byRegion[k]?.length > 0);
    const extras = Object.keys(byRegion).filter(k => !REGION_ORDER.includes(k)).sort();
    return [...ordered, ...extras].map(label => ({ regionLabel: label, projects: byRegion[label] || [] }));
  };

  const regionSections = useMemo(() => groupByRegion(projects), [projects]);

  // Grand totals
  const grandTotals = useMemo(() => {
    let usd = 0, tl = 0, pU1 = 0, pU2 = 0, pT1 = 0, pT2 = 0, remU = 0, remT = 0, noU = 0, noT = 0;
    projects.forEach(p => p.items.forEach(i => {
      const eU = toNumber(i.expensesUsd), eT = toNumber(i.expensesTl);
      usd += eU; tl += eT;
      pU1 += toNumber(i.paidUsd1); pU2 += toNumber(i.paidUsd2);
      pT1 += toNumber(i.paidTl1); pT2 += toNumber(i.paidTl2);
      remU += Math.max(0, eU - toNumber(i.paidUsd1) - toNumber(i.paidUsd2));
      remT += Math.max(0, eT - toNumber(i.paidTl1) - toNumber(i.paidTl2));
      if (i.status === 'NOT_ORDERED') { noU += eU; noT += eT; }
    }));
    return { usd, tl, pU1, pU2, pT1, pT2, remU, remT, noU, noT };
  }, [projects]);

  // ── Render cell (main grid) ────────────────────────────────────────

  const renderCell = (item: ExpensesDirectOrderItem, field: string, displayValue: string, width: number) => {
    const isEditing = editingCell?.itemId === item.id && editingCell?.field === field;
    const refKey = `${item.id}-${field}`;
    const ref = getCellRef(refKey);
    const cellStyle: React.CSSProperties = {
      width, minWidth: width, maxWidth: width, height: H.dataRow,
      display: 'flex', alignItems: 'center', padding: '0 8px',
      borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb',
      fontSize: 12, overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'pointer',
      boxSizing: 'border-box',
    };

    // Status
    if (field === 'status') {
      const ss = getStatusStyle(item.status);
      const hasNote = !!item.statusNote;
      if (isEditing) return <div key={field} ref={ref} style={{ ...cellStyle, position: 'relative' }}>
        <CellStatusAutocomplete value={item.status || ''} onSave={v => handleCellSave(item.id, 'status', v)}
          onCancel={() => setEditingCell(null)} triggerRef={ref} itemId={item.id} projectId={item.projectId} />
      </div>;
      return <div key={field} ref={ref} style={{ ...cellStyle, backgroundColor: ss.backgroundColor, color: ss.color, position: 'relative' }}
        onClick={() => setEditingCell({ itemId: item.id, field })}
        onContextMenu={(e) => { e.preventDefault(); setNoteMenu({ x: e.clientX, y: e.clientY, itemId: item.id, hasNote }); }}>
        {displayValue.replace(/_/g, ' ')}
        {hasNote && <span style={{ position: 'absolute', top: 3, right: 3, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />}
      </div>;
    }

    // Vendor
    if (field === 'vendor') {
      if (isEditing) return <div key={field} ref={ref} style={{ ...cellStyle, position: 'relative' }}>
        <CellVendorAutocomplete value={item.vendor?.code || ''} onSave={v => handleCellSave(item.id, 'vendorId', v)}
          onCancel={() => setEditingCell(null)} triggerRef={ref} itemId={item.id} projectId={item.projectId} />
      </div>;
      return <div key={field} ref={ref} style={cellStyle} onClick={() => setEditingCell({ itemId: item.id, field })}>{displayValue}</div>;
    }

    // Order type
    if (field === 'orderType') {
      if (isEditing) return <div key={field} ref={ref} style={{ ...cellStyle, position: 'relative' }}>
        <CellOrderTypeAutocomplete value={item.orderType || ''} onSave={v => handleCellSave(item.id, 'orderType', v)}
          onCancel={() => setEditingCell(null)} triggerRef={ref} itemId={item.id} projectId={item.projectId} />
      </div>;
      return <div key={field} ref={ref} style={cellStyle} onClick={() => setEditingCell({ itemId: item.id, field })}>{displayValue}</div>;
    }

    // Dates
    if (['std', 'etd', 'rtrd', 'ftd'].includes(field)) {
      if (isEditing) {
        const raw = (item as any)[field] ? new Date((item as any)[field]).toISOString().split('T')[0] : '';
        return <div key={field} ref={ref} style={{ ...cellStyle, position: 'relative' }}>
          <DateEditor value={raw} onSave={v => handleCellSave(item.id, field, v)} onCancel={() => setEditingCell(null)} />
        </div>;
      }
      return <div key={field} ref={ref} style={cellStyle} onClick={() => setEditingCell({ itemId: item.id, field })}>{displayValue}</div>;
    }

    // Money
    if (['expensesUsd', 'expensesTl'].includes(field)) {
      const numVal = toNumber((item as any)[field]);
      const sym = field === 'expensesUsd' ? '$' : '₺';
      if (isEditing) return <div key={field} ref={ref} style={{ ...cellStyle, position: 'relative' }}>
        <input autoFocus type="text" inputMode="decimal" defaultValue={numVal > 0 ? numVal.toString() : ''}
          onBlur={e => handleCellSave(item.id, field, e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleCellSave(item.id, field, (e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingCell(null); }}
          style={{ width: '100%', height: '100%', padding: '4px 8px', border: '2px solid #3b82f6', borderRadius: 4, textAlign: 'right', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
      </div>;
      return <div key={field} ref={ref} style={{ ...cellStyle, textAlign: 'right', justifyContent: 'flex-end', backgroundColor: 'rgba(147,197,253,0.1)' }}
        onClick={() => setEditingCell({ itemId: item.id, field })}>{numVal > 0 ? `${sym}${formatMoneyDisplay(numVal)}` : ''}</div>;
    }

    // Container
    if (field === 'containerNo') {
      if (isEditing) return <div key={field} ref={ref} style={{ ...cellStyle, position: 'relative' }}>
        <ContainerCellEditor value={item.containerNo || ''} onSave={v => handleCellSave(item.id, 'containerNo', v)}
          onCancel={() => setEditingCell(null)} triggerRef={ref} />
      </div>;
      return <div key={field} ref={ref} style={cellStyle} onClick={() => setEditingCell({ itemId: item.id, field })}>{displayValue}</div>;
    }

    // Generic text
    if (isEditing) return <div key={field} ref={ref} style={{ ...cellStyle, position: 'relative' }}>
      <input autoFocus type="text" defaultValue={displayValue}
        onBlur={e => handleCellSave(item.id, field, e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleCellSave(item.id, field, (e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingCell(null); }}
        style={{ width: '100%', height: '100%', padding: '4px 8px', border: '2px solid #3b82f6', borderRadius: 4, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
    </div>;
    return <div key={field} ref={ref} style={cellStyle} onClick={() => setEditingCell({ itemId: item.id, field })}>{displayValue}</div>;
  };

  // ── RENDER ─────────────────────────────────────────────────────────

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading expenses data...</div>;
  if (error) return <div style={{ padding: 20, backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: 4 }}><h3>Error</h3><p style={{ color: '#c00' }}>{error}</p></div>;

  if (regionSections.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', backgroundColor: '#1a1a1a', borderRadius: 8, gap: 16 }}>
        <div style={{ fontSize: 40, opacity: 0.3 }}>📋</div>
        <h3 style={{ margin: 0, color: '#ccc', fontWeight: 600 }}>No Expenses Direct Order Projects</h3>
        <p style={{ margin: 0, color: '#888', fontSize: 14 }}>Get started by adding your first project</p>
        <button onClick={() => setShowAddModal(true)} style={{ marginTop: 8, padding: '10px 28px', backgroundColor: '#c41e3a', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ Add Project</button>
        {showAddModal && <AddProjectModal onClose={() => setShowAddModal(false)} onCreated={p => setProjects(prev => [...prev, p])} />}
      </div>
    );
  }

  return (
    <div style={{ width: 'max-content', minWidth: '100%' }}>
      {/* Add Project Button */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setShowAddModal(true)} style={{ padding: '8px 16px', backgroundColor: '#c41e3a', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Project</button>
      </div>

      {regionSections.map((section) => (
        <React.Fragment key={section.regionLabel}>
          {section.projects.map((project, projectIdx) => {
            const items = project.items || [];
            const showRegionHeader = projectIdx === 0;
            const rowCount = Math.max(items.length, 1);

            return (
              <div key={project.id} style={{ width: '100%', overflowX: 'visible' }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
                  gap: `${LAYOUT_GAP}px`, flexWrap: 'nowrap', width: 'fit-content', maxWidth: 'none', marginBottom: 18,
                }}>

                  {/* ═══ MAIN GRID + ACCOUNTING (side-by-side like Supplier) ═══ */}
                  <div style={{ display: 'flex', flex: '0 0 auto' }}>
                    {/* LEFT: Main Grid */}
                    <div style={{ flex: '0 0 auto' }}>
                      {/* Section header (region) */}
                      {showRegionHeader && (
                        <div style={{
                          width: GRID_WIDTH, height: H.sectionHeader,
                          backgroundColor: '#1e293b', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 15, fontWeight: 700, letterSpacing: 1,
                          borderRadius: '6px 6px 0 0', border: '1px solid #334155', boxSizing: 'border-box',
                        }}>
                          {section.regionLabel.toUpperCase()}
                        </div>
                      )}

                      {/* Project header */}
                      <div style={{
                        width: GRID_WIDTH, height: H.projectHeader,
                        backgroundColor: '#374151', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                        borderRadius: showRegionHeader ? undefined : '4px 4px 0 0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{project.projectNo}</span>
                          <span style={{ fontSize: 13, opacity: 0.8 }}>{project.name}</span>
                        </div>
                        <button onClick={() => { if (window.confirm('Delete this project and all its items?')) deleteExpensesDirectOrderProject(project.id).then(() => setProjects(prev => prev.filter(p => p.id !== project.id))); }}
                          style={{ position: 'absolute', right: 16, padding: '4px 10px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 3, fontSize: 11, cursor: 'pointer' }}>Delete</button>
                      </div>

                      {/* Column headers */}
                      <div style={{ display: 'flex', width: GRID_WIDTH, height: H.topGroup + H.colHead, backgroundColor: '#000', color: '#fff', fontSize: 11, fontWeight: 600 }}>
                        {[
                          ['PROJECT NO', COL.projectNo], ['TYPE', COL.type], ['VENDOR', COL.vendor],
                          ['ORDER TYPE', COL.orderType], ['STATUS', COL.status],
                          ['STD', COL.std], ['ETD', COL.etd], ['RTRD', COL.rtrd], ['RDY', COL.rdy], ['FTD', COL.ftd], ['SND', COL.snd],
                          ['EXPENSES/USD', COL.expensesUsd], ['EXPENSES/TL', COL.expensesTl],
                          ['PAYMENT RULE', COL.paymentRule], ['CONTAINER NO', COL.containerNo],
                          ['SHELVES LOC.', COL.shelvesLoc], ['INVOICE SIT.', COL.invoiceSit],
                        ].map(([label, w]) => (
                          <div key={label as string} style={{ width: w as number, minWidth: w as number, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #333', textAlign: 'center' }}>{label as string}</div>
                        ))}
                      </div>

                      {/* Data rows with merged ProjectNo */}
                      <div style={{ display: 'flex' }}>
                        {/* Merged ProjectNo cell */}
                        <div style={{
                          width: COL.projectNo, minWidth: COL.projectNo,
                          height: rowCount * H.dataRow,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: '#f3f4f6', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb',
                          fontSize: 14, fontWeight: 700, color: '#1f2937',
                          boxSizing: 'border-box',
                        }}>
                          {project.projectNo}
                        </div>

                        {/* Type + rest of columns per row */}
                        <div style={{ flex: 1 }}>
                          {items.map(item => (
                            <div key={item.id} style={{ display: 'flex', width: GRID_WIDTH - COL.projectNo, height: H.dataRow, backgroundColor: '#fff' }}>
                              {renderCell(item, 'type', item.type || (item.customType?.code || ''), COL.type)}
                              {renderCell(item, 'vendor', item.vendor ? `${item.vendor.code} - ${item.vendor.name}` : '', COL.vendor)}
                              {renderCell(item, 'orderType', item.orderType || '', COL.orderType)}
                              {renderCell(item, 'status', item.status || '', COL.status)}
                              {renderCell(item, 'std', formatDateCell(item.std), COL.std)}
                              {renderCell(item, 'etd', formatDateCell(item.etd), COL.etd)}
                              {renderCell(item, 'rtrd', formatDateCell(item.rtrd), COL.rtrd)}
                              {renderCell(item, 'rdy', formatDateCell(item.rdy), COL.rdy)}
                              {renderCell(item, 'ftd', formatDateCell(item.ftd), COL.ftd)}
                              {renderCell(item, 'snd', formatDateCell(item.snd), COL.snd)}
                              {renderCell(item, 'expensesUsd', '', COL.expensesUsd)}
                              {renderCell(item, 'expensesTl', '', COL.expensesTl)}
                              {renderCell(item, 'paymentRule', item.paymentRule || '', COL.paymentRule)}
                              {renderCell(item, 'containerNo', item.containerNo || '', COL.containerNo)}
                              {renderCell(item, 'shelvesLoc', item.shelvesLoc || '', COL.shelvesLoc)}
                              {renderCell(item, 'invoiceSit', item.invoiceSit || '', COL.invoiceSit)}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Project totals */}
                      {items.length > 0 && (() => {
                        let u = 0, t = 0;
                        items.forEach(i => { u += toNumber(i.expensesUsd); t += toNumber(i.expensesTl); });
                        return (
                          <div style={{ display: 'flex', width: GRID_WIDTH, height: H.totalsRow, backgroundColor: '#404040', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                            <div style={{ width: GRID_WIDTH - COL.expensesUsd - COL.expensesTl - COL.paymentRule - COL.containerNo - COL.shelvesLoc - COL.invoiceSit, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 12 }}>TOTAL</div>
                            <div style={{ width: COL.expensesUsd, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>{fmtMoney(u, 'USD')}</div>
                            <div style={{ width: COL.expensesTl, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>{fmtMoney(t, 'TL')}</div>
                            <div style={{ flex: 1 }} />
                          </div>
                        );
                      })()}
                    </div>

                    {/* RIGHT: Accounting Block (Supplier-identical) */}
                    <div style={{ flex: '0 0 auto', marginLeft: LAYOUT_GAP }}>
                      {/* Section header spacer */}
                      {showRegionHeader && (
                        <div style={{
                          height: H.sectionHeader,
                          backgroundColor: '#b88900', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 15, letterSpacing: 1,
                          borderRadius: '6px 6px 0 0', border: '1px solid #9a7500', boxSizing: 'border-box',
                        }}>ACCOUNTING {section.regionLabel.toUpperCase()}</div>
                      )}

                      {/* Project header spacer */}
                      <div style={{ height: H.projectHeader, backgroundColor: '#D4AF37' }} />

                      {/* Top group row: 1st/2nd | 1st/2nd | Remaining | Not Ordered */}
                      <div style={{ display: 'flex', height: H.topGroup, backgroundColor: '#D4AF37', color: '#000', fontSize: 11, fontWeight: 600, alignItems: 'center' }}>
                        {[{ label: '1st / 2nd', w: 2 * ACCT_W.paid }, { label: '1st / 2nd', w: 2 * ACCT_W.paid }, { label: 'Remaining', w: 2 * ACCT_W.remaining }, { label: 'Not Ordered', w: 2 * ACCT_W.notOrdered }].map((g, i) => (
                          <React.Fragment key={i}>
                            <div style={{ width: g.w, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', borderRight: '1px solid #b8960a' }}>{g.label}</div>
                            {i < 3 && <div style={{ width: ACCT_W.gap, height: '100%' }} />}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Column headers: Paid/USD | Paid/USD | Paid/TL | Paid/TL | USD | TL | USD | TL */}
                      <div style={{ display: 'flex', height: H.colHead, backgroundColor: '#000', color: '#fff', fontSize: 10, fontWeight: 600, alignItems: 'center' }}>
                        {[
                          { label: 'Paid/USD', w: ACCT_W.paid }, { label: 'Paid/USD', w: ACCT_W.paid },
                          { label: 'Paid/TL', w: ACCT_W.paid }, { label: 'Paid/TL', w: ACCT_W.paid },
                          { label: 'USD', w: ACCT_W.remaining }, { label: 'TL', w: ACCT_W.remaining },
                          { label: 'USD', w: ACCT_W.notOrdered }, { label: 'TL', w: ACCT_W.notOrdered },
                        ].map((c, i) => {
                          const showGap = i === 1 || i === 3 || i === 5;
                          return <React.Fragment key={i}>
                            <div style={{ width: c.w, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #333', height: '100%' }}>{c.label}</div>
                            {showGap && <div style={{ width: ACCT_W.gap, height: '100%' }} />}
                          </React.Fragment>;
                        })}
                      </div>

                      {/* Data rows */}
                      {items.map(item => {
                        const eU = toNumber(item.expensesUsd), eT = toNumber(item.expensesTl);
                        const paid = paidAmounts[item.id] || { usd1: '', usd2: '', tl1: '', tl2: '' };
                        const pU1 = toNumber(item.paidUsd1), pU2 = toNumber(item.paidUsd2);
                        const pT1 = toNumber(item.paidTl1), pT2 = toNumber(item.paidTl2);
                        const remU = Math.max(0, eU - pU1 - pU2);
                        const remT = Math.max(0, eT - pT1 - pT2);
                        const isNO = item.status === 'NOT_ORDERED';
                        const noU = isNO ? eU : 0, noT = isNO ? eT : 0;

                        const paidFields = [
                          { key: 'usd1', val: paid.usd1 },
                          { key: 'usd2', val: paid.usd2 },
                          { key: 'tl1', val: paid.tl1 },
                          { key: 'tl2', val: paid.tl2 },
                        ];
                        const readonlyFields = [
                          { val: remU, cur: 'USD' as const }, { val: remT, cur: 'TL' as const },
                          { val: noU, cur: 'USD' as const }, { val: noT, cur: 'TL' as const },
                        ];

                        return (
                          <div key={item.id} style={{ display: 'flex', height: H.dataRow, alignItems: 'center', backgroundColor: '#FFF8DC', borderBottom: '1px solid #d0d0d0', boxSizing: 'border-box' }}>
                            {paidFields.map((f, i) => {
                              const showGap = i === 1 || i === 3;
                              return <React.Fragment key={f.key}>
                                <div style={{ width: ACCT_W.paid, height: '100%', borderRight: '1px solid #ccc', boxSizing: 'border-box', display: 'flex', alignItems: 'center' }}>
                                  <input type="text" inputMode="decimal"
                                    value={f.val}
                                    onChange={e => handlePaidChange(item.id, f.key, e.target.value)}
                                    onFocus={() => handlePaidFocus(item.id, f.key)}
                                    onBlur={e => handlePaidSave(item.id, f.key, e.target.value)}
                                    placeholder="0.00"
                                    style={{ width: '100%', height: '100%', padding: '4px 8px', border: 'none', textAlign: 'right', backgroundColor: 'transparent', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                                {showGap && <div style={{ width: ACCT_W.gap, height: '100%' }} />}
                              </React.Fragment>;
                            })}
                            {readonlyFields.map((f, i) => {
                              const w = i < 2 ? ACCT_W.remaining : ACCT_W.notOrdered;
                              const showGap = i === 1;
                              return <React.Fragment key={`ro-${i}`}>
                                <div style={{ width: w, height: '100%', padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderRight: '1px solid #ccc', fontSize: 12, boxSizing: 'border-box' }}>{fmtMoney(f.val, f.cur)}</div>
                                {showGap && <div style={{ width: ACCT_W.gap, height: '100%' }} />}
                              </React.Fragment>;
                            })}
                          </div>
                        );
                      })}

                      {/* Accounting totals */}
                      {items.length > 0 && (() => {
                        let pu1 = 0, pu2 = 0, pt1 = 0, pt2 = 0, rU = 0, rT = 0, noU = 0, noT = 0;
                        items.forEach(i => {
                          pu1 += toNumber(i.paidUsd1); pu2 += toNumber(i.paidUsd2);
                          pt1 += toNumber(i.paidTl1); pt2 += toNumber(i.paidTl2);
                          const eU = toNumber(i.expensesUsd), eT = toNumber(i.expensesTl);
                          rU += Math.max(0, eU - toNumber(i.paidUsd1) - toNumber(i.paidUsd2));
                          rT += Math.max(0, eT - toNumber(i.paidTl1) - toNumber(i.paidTl2));
                          if (i.status === 'NOT_ORDERED') { noU += eU; noT += eT; }
                        });
                        const vals = [
                          { v: pu1, c: 'USD' as const }, { v: pu2, c: 'USD' as const },
                          { v: pt1, c: 'TL' as const }, { v: pt2, c: 'TL' as const },
                          { v: rU, c: 'USD' as const }, { v: rT, c: 'TL' as const },
                          { v: noU, c: 'USD' as const }, { v: noT, c: 'TL' as const },
                        ];
                        return (
                          <div style={{ display: 'flex', height: H.totalsRow, alignItems: 'center', fontSize: 12, fontWeight: 700, backgroundColor: '#D4AF37', color: '#000', borderTop: '2px solid #000' }}>
                            {vals.map((c, i) => {
                              const w = i < 4 ? ACCT_W.paid : i < 6 ? ACCT_W.remaining : ACCT_W.notOrdered;
                              const showGap = i === 1 || i === 3 || i === 5;
                              return <React.Fragment key={i}>
                                <div style={{ width: w, textAlign: 'right', padding: '0 8px', borderRight: '1px solid #b8960a', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>{fmtMoney(c.v, c.c)}</div>
                                {showGap && <div style={{ width: ACCT_W.gap, height: '100%' }} />}
                              </React.Fragment>;
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* ═══ PAYMENTS BLOCK (Supplier-identical) ═══ */}
                  <div style={{ flex: '0 0 auto', width: PAY_W.total }}>
                    {/* Section header */}
                    {showRegionHeader && (
                      <div style={{
                        height: H.sectionHeader, backgroundColor: '#2f4b1f', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 15, letterSpacing: 1,
                        borderRadius: '6px 6px 0 0', border: '1px solid #1f3515', boxSizing: 'border-box',
                      }}>PAYMENTS {section.regionLabel.toUpperCase()}</div>
                    )}
                    {/* Project header spacer */}
                    <div style={{ height: H.projectHeader, backgroundColor: '#2f4b1f' }} />

                    {/* Top group: DUE PAYMENT | PAYMENTS 1 | PAYMENTS 2 */}
                    <div style={{ display: 'flex', height: H.topGroup, fontSize: 11, fontWeight: 600, color: '#fff', alignItems: 'center' }}>
                      {[{ label: 'DUE PAYMENT', w: 2 * PAY_W.col }, { label: 'PAYMENTS 1', w: 2 * PAY_W.col }, { label: 'PAYMENTS 2', w: 2 * PAY_W.col }].map((g, i) => (
                        <React.Fragment key={i}>
                          <div style={{ width: g.w, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#2f5233' }}>{g.label}</div>
                          {i < 2 && <div style={{ width: PAY_W.gap, height: '100%' }} />}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Column headers: USD | TL | USD | TL | USD | TL */}
                    <div style={{ display: 'flex', height: H.colHead, color: '#fff', fontSize: 11, fontWeight: 600, alignItems: 'center' }}>
                      {['USD', 'TL', 'USD', 'TL', 'USD', 'TL'].map((l, i) => {
                        const showGap = i === 1 || i === 3;
                        return <React.Fragment key={i}>
                          <div style={{ width: PAY_W.col, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #3f5b2f', height: '100%', backgroundColor: '#1f3515' }}>{l}</div>
                          {showGap && <div style={{ width: PAY_W.gap, height: '100%' }} />}
                        </React.Fragment>;
                      })}
                    </div>

                    {/* Data rows */}
                    {items.map(item => {
                      const eU = toNumber(item.expensesUsd), eT = toNumber(item.expensesTl);
                      const paid = paidAmounts[item.id] || { usd1: '', usd2: '', tl1: '', tl2: '' };
                      const p1 = toNumber(item.paidUsd1), p2 = toNumber(item.paidUsd2);
                      const t1 = toNumber(item.paidTl1), t2 = toNumber(item.paidTl2);
                      const dueU = Math.max(0, eU - p1 - p2), dueT = Math.max(0, eT - t1 - t2);

                      return (
                        <div key={item.id} style={{ display: 'flex', height: H.dataRow, alignItems: 'center', backgroundColor: '#e8f5e9', borderBottom: '1px solid #d0d0d0', boxSizing: 'border-box' }}>
                          {/* Due Payment - read only */}
                          <div style={{ width: PAY_W.col, height: '100%', padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderRight: '1px solid #d0d0d0', fontSize: 12, fontWeight: 500, boxSizing: 'border-box' }}>{fmtMoney(dueU, 'USD')}</div>
                          <div style={{ width: PAY_W.col, height: '100%', padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderRight: '1px solid #d0d0d0', fontSize: 12, fontWeight: 500, boxSizing: 'border-box' }}>{fmtMoney(dueT, 'TL')}</div>
                          <div style={{ width: PAY_W.gap, height: '100%' }} />
                          {/* Payments 1 - editable */}
                          {[{ key: 'usd1', val: paid.usd1 }, { key: 'tl1', val: paid.tl1 }].map((f, i) => (
                            <React.Fragment key={f.key}>
                              <div style={{ width: PAY_W.col, height: '100%', borderRight: '1px solid #d0d0d0', boxSizing: 'border-box', display: 'flex', alignItems: 'center' }}>
                                <input type="text" inputMode="decimal" value={f.val}
                                  onChange={e => handlePaidChange(item.id, f.key, e.target.value)}
                                  onFocus={() => handlePaidFocus(item.id, f.key)}
                                  onBlur={e => handlePaidSave(item.id, f.key, e.target.value)}
                                  placeholder="0.00"
                                  style={{ width: '100%', height: '100%', padding: '4px 8px', border: 'none', textAlign: 'right', backgroundColor: 'transparent', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                              </div>
                              {i === 1 && <div style={{ width: PAY_W.gap, height: '100%' }} />}
                            </React.Fragment>
                          ))}
                          {/* Payments 2 - editable */}
                          {[{ key: 'usd2', val: paid.usd2 }, { key: 'tl2', val: paid.tl2 }].map((f) => (
                            <div key={f.key} style={{ width: PAY_W.col, height: '100%', borderRight: '1px solid #d0d0d0', boxSizing: 'border-box', display: 'flex', alignItems: 'center' }}>
                              <input type="text" inputMode="decimal" value={f.val}
                                onChange={e => handlePaidChange(item.id, f.key, e.target.value)}
                                onFocus={() => handlePaidFocus(item.id, f.key)}
                                onBlur={e => handlePaidSave(item.id, f.key, e.target.value)}
                                placeholder="0.00"
                                style={{ width: '100%', height: '100%', padding: '4px 8px', border: 'none', textAlign: 'right', backgroundColor: 'transparent', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                          ))}
                        </div>
                      );
                    })}

                    {/* Payments totals */}
                    {items.length > 0 && (() => {
                      let dU = 0, dT = 0, p1U = 0, p1T = 0, p2U = 0, p2T = 0;
                      items.forEach(i => {
                        const eU = toNumber(i.expensesUsd), eT = toNumber(i.expensesTl);
                        const pu1 = toNumber(i.paidUsd1), pu2 = toNumber(i.paidUsd2);
                        const pt1 = toNumber(i.paidTl1), pt2 = toNumber(i.paidTl2);
                        dU += Math.max(0, eU - pu1 - pu2); dT += Math.max(0, eT - pt1 - pt2);
                        p1U += pu1; p1T += pt1; p2U += pu2; p2T += pt2;
                      });
                      const vals = [
                        { v: dU, c: 'USD' as const }, { v: dT, c: 'TL' as const },
                        { v: p1U, c: 'USD' as const }, { v: p1T, c: 'TL' as const },
                        { v: p2U, c: 'USD' as const }, { v: p2T, c: 'TL' as const },
                      ];
                      return (
                        <div style={{ display: 'flex', height: H.totalsRow, alignItems: 'center', fontSize: 12, fontWeight: 700, color: '#1f3515', borderTop: '2px solid #2f4b1f' }}>
                          {vals.map((c, i) => {
                            const showGap = i === 1 || i === 3;
                            return <React.Fragment key={i}>
                              <div style={{ width: PAY_W.col, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderRight: '1px solid #a5d6a7', height: '100%', backgroundColor: '#e8f5e9', boxSizing: 'border-box' }}>{fmtMoney(c.v, c.c)}</div>
                              {showGap && <div style={{ width: PAY_W.gap, height: '100%' }} />}
                            </React.Fragment>;
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* ═══ INVOICE & RECEIPT BLOCK (Supplier-identical) ═══ */}
                  <div style={{ flex: '0 0 auto', width: INV_W.total }}>
                    {/* Section header */}
                    {showRegionHeader && (
                      <div style={{
                        height: H.sectionHeader, backgroundColor: '#696969', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 15, letterSpacing: 1,
                        borderRadius: '6px 6px 0 0', border: '1px solid #696969', boxSizing: 'border-box',
                      }}>INVOICE & RECEIPT {section.regionLabel.toUpperCase()}</div>
                    )}
                    {/* Project header spacer */}
                    <div style={{ height: H.projectHeader, backgroundColor: '#696969' }} />

                    {/* Top group */}
                    <div style={{ display: 'flex', height: H.topGroup, backgroundColor: '#7d7d7d', fontSize: 11, fontWeight: 600, color: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                      INVOICE & RECEIPT
                    </div>

                    {/* Column headers */}
                    <div style={{ display: 'flex', height: H.colHead, backgroundColor: '#696969', color: '#fff', fontSize: 11, fontWeight: 600, alignItems: 'center' }}>
                      {[
                        { label: 'TRANSACTION NO', w: INV_W.transactionNo },
                        { label: 'INVOICE NUMBER', w: INV_W.invoiceNumber },
                        { label: 'QUICK BOOK', w: INV_W.quickBook },
                      ].map((c, i) => (
                        <React.Fragment key={c.label}>
                          <div style={{ width: c.w, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: i < 2 ? '1px solid #696969' : 'none', height: '100%' }}>{c.label}</div>
                          {i < 2 && <div style={{ width: INV_W.gap, backgroundColor: '#696969', height: '100%' }} />}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Data rows */}
                    {items.map(item => {
                      const inv = invoiceValues[item.id] || { transactionNo: '', invoiceNumber: '', quickBook: '' };
                      const isDone = inv.quickBook === 'Done';

                      return (
                        <div key={item.id} style={{ display: 'flex', height: H.dataRow, borderBottom: '1px solid #d0d0d0', backgroundColor: 'white', boxSizing: 'border-box' }}>
                          {/* Transaction No */}
                          <input type="text" value={inv.transactionNo}
                            onChange={e => handleInvoiceChange(item.id, 'transactionNo', e.target.value)}
                            onBlur={e => handleInvoiceSave(item.id, 'transactionNo', e.target.value)}
                            placeholder="TRANSACTION NO"
                            style={{ width: INV_W.transactionNo, height: '100%', padding: '4px 8px', border: 'none', borderRight: '1px solid #d0d0d0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                          <div style={{ width: INV_W.gap, height: '100%', backgroundColor: 'white' }} />
                          {/* Invoice Number */}
                          <input type="text" value={inv.invoiceNumber}
                            onChange={e => handleInvoiceChange(item.id, 'invoiceNumber', e.target.value)}
                            onBlur={e => handleInvoiceSave(item.id, 'invoiceNumber', e.target.value)}
                            placeholder="INVOICE NUMBER"
                            style={{ width: INV_W.invoiceNumber, height: '100%', padding: '4px 8px', border: 'none', borderRight: '1px solid #d0d0d0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                          <div style={{ width: INV_W.gap, height: '100%', backgroundColor: 'white' }} />
                          {/* QuickBook toggle */}
                          <div onClick={() => {
                            const newVal = isDone ? '' : 'Done';
                            handleInvoiceChange(item.id, 'quickBook', newVal);
                            handleInvoiceSave(item.id, 'quickBook', newVal);
                          }}
                            style={{
                              width: INV_W.quickBook, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', backgroundColor: isDone ? '#D1FAE5' : 'white',
                              color: isDone ? '#065F46' : '#999', fontWeight: isDone ? 600 : 'normal', fontSize: 11, userSelect: 'none',
                            }}>
                            {isDone ? 'Done' : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            );
          })}

          {/* Section totals */}
          {(() => {
            let sUsd = 0, sTl = 0, sPU1 = 0, sPU2 = 0, sPT1 = 0, sPT2 = 0, sRU = 0, sRT = 0, sNOU = 0, sNOT = 0;
            section.projects.forEach(p => p.items.forEach(i => {
              const eU = toNumber(i.expensesUsd), eT = toNumber(i.expensesTl);
              sUsd += eU; sTl += eT;
              sPU1 += toNumber(i.paidUsd1); sPU2 += toNumber(i.paidUsd2);
              sPT1 += toNumber(i.paidTl1); sPT2 += toNumber(i.paidTl2);
              sRU += Math.max(0, eU - toNumber(i.paidUsd1) - toNumber(i.paidUsd2));
              sRT += Math.max(0, eT - toNumber(i.paidTl1) - toNumber(i.paidTl2));
              if (i.status === 'NOT_ORDERED') { sNOU += eU; sNOT += eT; }
            }));
            if (sUsd === 0 && sTl === 0) return null;
            return (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: `${LAYOUT_GAP}px`, flexWrap: 'nowrap',
                width: 'fit-content', marginBottom: 32,
              }}>
                {/* Main grid section total */}
                <div style={{ flex: '0 0 auto' }}>
                  <div style={{
                    width: GRID_WIDTH, height: 45,
                    backgroundColor: '#2563eb', color: '#fff', borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', border: '3px solid #0066ff',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: 0.5 }}>{section.regionLabel.replace('TLines ', '').toUpperCase()} TOTALS</span>
                    <div style={{ position: 'absolute', right: 20, display: 'flex', gap: 12 }}>
                      <div style={{ backgroundColor: '#1d4ed8', padding: '6px 12px', borderRadius: 6, fontWeight: 600, fontSize: 14, minWidth: 120, textAlign: 'center' }}>${formatMoneyDisplay(sUsd)}</div>
                      <div style={{ backgroundColor: '#1d4ed8', padding: '6px 12px', borderRadius: 6, fontWeight: 600, fontSize: 14, minWidth: 120, textAlign: 'center' }}>₺{formatMoneyDisplay(sTl)}</div>
                    </div>
                  </div>
                </div>
                {/* Accounting section total */}
                <div style={{ flex: '0 0 auto' }}>
                  <div style={{
                    width: ACCT_W.total, height: 45,
                    backgroundColor: '#D4AF37', color: '#000', borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', border: '2px solid #b8960a',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}>ACCOUNTING TOTAL</span>
                    <div style={{ position: 'absolute', right: 12, display: 'flex', gap: 8 }}>
                      <div style={{ backgroundColor: '#b8960a', color: '#fff', padding: '4px 10px', borderRadius: 4, fontWeight: 600, fontSize: 12, minWidth: 80, textAlign: 'center' }}>${formatMoneyDisplay(sRU)}</div>
                      <div style={{ backgroundColor: '#b8960a', color: '#fff', padding: '4px 10px', borderRadius: 4, fontWeight: 600, fontSize: 12, minWidth: 80, textAlign: 'center' }}>₺{formatMoneyDisplay(sRT)}</div>
                    </div>
                  </div>
                </div>
                {/* Payments section total */}
                <div style={{ flex: '0 0 auto' }}>
                  <div style={{
                    width: PAY_W.total, height: 45,
                    backgroundColor: '#2f4b1f', color: '#fff', borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', border: '1px solid #1f3515',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}>PAYMENTS</span>
                    <div style={{ position: 'absolute', right: 12, display: 'flex', gap: 8 }}>
                      <div style={{ backgroundColor: '#1f3515', padding: '4px 10px', borderRadius: 4, fontWeight: 600, fontSize: 12, minWidth: 80, textAlign: 'center' }}>${formatMoneyDisplay(sRU)}</div>
                      <div style={{ backgroundColor: '#1f3515', padding: '4px 10px', borderRadius: 4, fontWeight: 600, fontSize: 12, minWidth: 80, textAlign: 'center' }}>₺{formatMoneyDisplay(sRT)}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </React.Fragment>
      ))}

      {/* Grand totals */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: `${LAYOUT_GAP}px`, flexWrap: 'nowrap',
        width: 'fit-content', marginBottom: 32,
      }}>
        {/* EXPENSES D.O. TOTAL - main grid only */}
        <div style={{ flex: '0 0 auto' }}>
          <div style={{
            width: GRID_WIDTH, height: 45,
            backgroundColor: '#c41e3a', color: '#fff', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', border: '1px solid #a01729',
          }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>EXPENSES D.O. TOTAL</span>
            <div style={{ position: 'absolute', right: 20, display: 'flex', gap: 12 }}>
              <div style={{ backgroundColor: '#a01729', padding: '6px 12px', borderRadius: 6, fontWeight: 600, fontSize: 14, minWidth: 120, textAlign: 'center' }}>${formatMoneyDisplay(grandTotals.usd)}</div>
              <div style={{ backgroundColor: '#a01729', padding: '6px 12px', borderRadius: 6, fontWeight: 600, fontSize: 14, minWidth: 120, textAlign: 'center' }}>₺{formatMoneyDisplay(grandTotals.tl)}</div>
            </div>
          </div>
        </div>
        {/* ACCOUNTING TOTAL - accounting block only */}
        <div style={{ flex: '0 0 auto' }}>
          <div style={{
            width: ACCT_W.total, height: 45,
            backgroundColor: '#D4AF37', color: '#000', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', border: '2px solid #b8960a',
          }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>ACCOUNTING TOTAL</span>
            <div style={{ position: 'absolute', right: 12, display: 'flex', gap: 8 }}>
              <div style={{ backgroundColor: '#b8960a', color: '#fff', padding: '4px 10px', borderRadius: 4, fontWeight: 600, fontSize: 12, minWidth: 80, textAlign: 'center' }}>${formatMoneyDisplay(grandTotals.remU)}</div>
              <div style={{ backgroundColor: '#b8960a', color: '#fff', padding: '4px 10px', borderRadius: 4, fontWeight: 600, fontSize: 12, minWidth: 80, textAlign: 'center' }}>₺{formatMoneyDisplay(grandTotals.remT)}</div>
            </div>
          </div>
        </div>
        {/* PAYMENTS TOTAL */}
        <div style={{ flex: '0 0 auto' }}>
          <div style={{
            width: PAY_W.total, height: 45,
            backgroundColor: '#2f4b1f', color: '#fff', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', border: '1px solid #1f3515',
          }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>PAYMENTS TOTAL</span>
            <div style={{ position: 'absolute', right: 12, display: 'flex', gap: 8 }}>
              <div style={{ backgroundColor: '#1f3515', padding: '4px 10px', borderRadius: 4, fontWeight: 600, fontSize: 12, minWidth: 80, textAlign: 'center' }}>${formatMoneyDisplay(grandTotals.remU)}</div>
              <div style={{ backgroundColor: '#1f3515', padding: '4px 10px', borderRadius: 4, fontWeight: 600, fontSize: 12, minWidth: 80, textAlign: 'center' }}>₺{formatMoneyDisplay(grandTotals.remT)}</div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && <AddProjectModal onClose={() => setShowAddModal(false)} onCreated={p => setProjects(prev => [...prev, p])} />}

      {/* Status Note Context Menu */}
      {noteMenu && (
        <div style={{ position: 'fixed', left: noteMenu.x, top: noteMenu.y, zIndex: 9999, backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 4, minWidth: 160 }}
          onMouseLeave={() => setNoteMenu(null)}>
          {noteMenu.hasNote ? (<>
            <button style={{ display: 'block', width: '100%', padding: '8px 12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, borderRadius: 4 }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => { const item = projects.flatMap(p => p.items).find(i => i.id === noteMenu.itemId); setNoteDialog({ itemId: noteMenu.itemId, text: item?.statusNote || '', mode: 'view' }); setNoteMenu(null); }}>
              Notu Goruntule
            </button>
            <button style={{ display: 'block', width: '100%', padding: '8px 12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, borderRadius: 4 }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => { const item = projects.flatMap(p => p.items).find(i => i.id === noteMenu.itemId); setNoteDialog({ itemId: noteMenu.itemId, text: item?.statusNote || '', mode: 'edit' }); setNoteMenu(null); }}>
              Notu Duzenle
            </button>
            <button style={{ display: 'block', width: '100%', padding: '8px 12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, borderRadius: 4, color: '#dc2626' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => { handleStatusNoteSave(noteMenu.itemId, ''); }}>
              Notu Sil
            </button>
          </>) : (
            <button style={{ display: 'block', width: '100%', padding: '8px 12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, borderRadius: 4 }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => { setNoteDialog({ itemId: noteMenu.itemId, text: '', mode: 'edit' }); setNoteMenu(null); }}>
              + Not Ekle
            </button>
          )}
        </div>
      )}

      {/* Status Note Dialog */}
      {noteDialog && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setNoteDialog(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, width: 400, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>{noteDialog.mode === 'view' ? 'Status Notu' : 'Not Duzenle'}</h3>
            {noteDialog.mode === 'view' ? (
              <>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: '#374151', whiteSpace: 'pre-wrap' }}>{noteDialog.text}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setNoteDialog({ ...noteDialog, mode: 'edit' })} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 13 }}>Duzenle</button>
                  <button onClick={() => setNoteDialog(null)} style={{ padding: '8px 16px', border: 'none', borderRadius: 6, backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 13 }}>Kapat</button>
                </div>
              </>
            ) : (
              <>
                <textarea value={noteDialog.text} onChange={e => setNoteDialog({ ...noteDialog, text: e.target.value })}
                  style={{ width: '100%', height: 100, padding: 10, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
                  placeholder="Not yazin..." autoFocus />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button onClick={() => setNoteDialog(null)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 13 }}>Iptal</button>
                  <button onClick={() => handleStatusNoteSave(noteDialog.itemId, noteDialog.text)} style={{ padding: '8px 16px', border: 'none', borderRadius: 6, backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 13 }}>Kaydet</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesDirectOrderSheet;
