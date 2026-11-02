import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getStockProducts, getAvailableStockProducts, openTrustStockPdf, updateStockProduct, deleteStockProduct, downloadReorderPf,
  StockProduct, StockStatus, STOCK_STATUS_STYLE,
} from '../lib/trust-stock';
import { useSocketEvent } from '../hooks/useSocketEvent';

/**
 * Trust Lines — Cabinet Stock Overview (same columns and rules as the
 * "Cabinet Stock Management" sheet). Every figure is calculated from the
 * imported PFs, the warehouse receipt (Confirmed Received, entered here) and
 * the take/reserve/return movements made from Projects rows.
 */
const fmtPct = (v: number | null) => (v == null ? '—' : `${Math.round(v * 100)}%`);
const dash = (v: number | null) => (v == null ? '—' : v);
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('en-GB') : '-');

const STATUS_FILTERS: (StockStatus | 'ALL')[] = ['ALL', 'HEALTHY', 'WATCH', 'REORDER_NOW', 'OUT_OF_STOCK', 'PENDING_VERIFICATION'];

/** Always-visible number box saved on Enter / leaving it; empty = null. Used for Confirmed Received and Target Stock. */
const QtyCell: React.FC<{
  p: StockProduct;
  field: 'receivedQuantity' | 'targetQuantity';
  current: number | null;
  title: string;
  onError: (m: string) => void;
  onSaved: () => void;
}> = ({ p, field, current, title, onError, onSaved }) => {
  const [value, setValue] = useState(current == null ? '' : String(current));
  useEffect(() => { setValue(current == null ? '' : String(current)); }, [current]);
  const commit = async () => {
    const trimmed = value.trim();
    const next = trimmed === '' ? null : Number(trimmed.replace(',', '.'));
    if (next === current || (next != null && !(Number.isFinite(next) && next >= 0))) { setValue(current == null ? '' : String(current)); return; }
    try { await updateStockProduct(p.id, { [field]: next }); onSaved(); }
    catch (e) { onError(e instanceof Error ? e.message : 'Save failed'); setValue(current == null ? '' : String(current)); }
  };
  return (
    <input
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setValue(current == null ? '' : String(current)); }}
      placeholder="—"
      title={title}
      inputMode="decimal"
      style={{ width: 56, padding: '3px 5px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, textAlign: 'center', background: current == null ? '#f8fafc' : '#fff' }}
    />
  );
};

/** Suggested quantity when a product is ticked in the RE-ORDER tab */
const suggestedQty = (p: StockProduct) =>
  p.reorderQty > 0 ? p.reorderQty
    : p.target != null && p.available != null && p.target > p.available ? p.target - p.available
      : p.ordered;

/**
 * RE-ORDER tab: the products at the reorder point (ticked, with the suggested quantity),
 * and below them every other product, which can be added to the same PF.
 */
const ReorderPanel: React.FC<{
  products: StockProduct[];
  others: StockProduct[];
  picks: Record<string, string>;
  setPicks: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}> = ({ products, others, picks, setPicks }) => {
  const th: React.CSSProperties = { padding: '6px 6px', fontSize: 10.5, color: '#fff', background: '#1e293b', textAlign: 'center', fontWeight: 600, lineHeight: 1.2 };
  const td: React.CSSProperties = { padding: '5px 6px', fontSize: 12, borderBottom: '1px solid #eef2f7', textAlign: 'center', verticalAlign: 'middle' };
  const COLS = ['', 'Stock Order', 'Item Code', 'Description', 'Dimensions', 'Vendor', 'Available', 'Target Stock', 'Remaining %', 'Status', 'PF Quantity'];
  const toggle = (p: StockProduct) => setPicks(prev => {
    const next = { ...prev };
    if (p.id in next) delete next[p.id]; else next[p.id] = String(suggestedQty(p));
    return next;
  });
  const setQty = (p: StockProduct, v: string) => setPicks(prev => ({ ...prev, [p.id]: v }));

  const table = (title: string, note: string, rows: StockProduct[], head: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ padding: '6px 10px', background: head, color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '.3px' }}>
        {title} <span style={{ fontWeight: 400, opacity: .85, marginLeft: 8 }}>{note}</span>
      </div>
      {rows.length === 0 ? <div style={{ padding: 14, color: '#6b7280', fontSize: 12 }}>Nothing here.</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{COLS.map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(p => {
              const st = STOCK_STATUS_STYLE[p.status];
              const picked = p.id in picks;
              return (
                <tr key={p.id} style={{ background: picked ? '#fff7ed' : undefined }}>
                  <td style={td}><input type="checkbox" checked={picked} onChange={() => toggle(p)} style={{ cursor: 'pointer' }} /></td>
                  <td style={td}>{p.stockItem.group.code}</td>
                  <td style={{ ...td, fontWeight: 700, color: '#15803d', whiteSpace: 'nowrap' }}>{p.itemCode}</td>
                  <td style={{ ...td, textAlign: 'left', color: '#15803d', maxWidth: 280 }}>{p.description}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>{p.dimensions || '—'}</td>
                  <td style={td}>{p.stockItem.vendor ? `${p.stockItem.vendor.code} - ${p.stockItem.vendor.name}` : '—'}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{dash(p.available)}</td>
                  <td style={td}>{dash(p.target)}</td>
                  <td style={td}>{fmtPct(p.remainingPct)}</td>
                  <td style={td}><span style={{ display: 'inline-block', padding: '3px 6px', borderRadius: 4, background: st.bg, color: st.fg, fontSize: 10, fontWeight: 700, lineHeight: 1.2 }}>{st.label}</span></td>
                  <td style={td}>
                    <input
                      value={picks[p.id] ?? ''}
                      onChange={e => setQty(p, e.target.value)}
                      placeholder="—"
                      inputMode="decimal"
                      style={{ width: 60, padding: '3px 5px', border: `1px solid ${picked ? '#f59e0b' : '#cbd5e1'}`, borderRadius: 4, fontSize: 12, textAlign: 'center', fontWeight: 700 }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div style={{ padding: '10px 0' }}>
      {table('NEEDS RE-ORDER', 'at or below the reorder point — ticked with the quantity back to the target', products, '#b91c1c')}
      {table('ADD OTHER PRODUCTS TO THE PF', 'tick a product or type a quantity to add it', others, '#334155')}
    </div>
  );
};

/** Click to edit; Enter / leaving the field saves, Esc cancels. */
const EditCell: React.FC<{
  value: string;
  onSave: (v: string) => Promise<void>;
  editable: boolean;
  multiline?: boolean;
  numeric?: boolean;
  style?: React.CSSProperties;
  placeholder?: string;
}> = ({ value, onSave, editable, multiline, numeric, style, placeholder = '—' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);
  if (!editable || !editing) {
    return (
      <span
        onClick={() => editable && setEditing(true)}
        title={editable ? 'Click to edit' : undefined}
        style={{ cursor: editable ? 'text' : undefined, display: 'block', minHeight: 16, borderBottom: editable ? '1px dashed transparent' : undefined, ...style }}
        onMouseEnter={e => { if (editable) e.currentTarget.style.borderBottomColor = '#94a3b8'; }}
        onMouseLeave={e => { e.currentTarget.style.borderBottomColor = 'transparent'; }}
      >
        {value || <span style={{ color: '#cbd5e1' }}>{placeholder}</span>}
      </span>
    );
  }
  const commit = async () => {
    if (saving) return;
    if (draft.trim() === value.trim()) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(draft.trim()); setEditing(false); }
    finally { setSaving(false); }
  };
  const common = {
    autoFocus: true,
    value: draft,
    disabled: saving,
    onChange: (e: any) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') { setDraft(value); setEditing(false); }
      if (e.key === 'Enter' && !(multiline && e.shiftKey)) { e.preventDefault(); commit(); }
    },
    style: { width: '100%', boxSizing: 'border-box' as const, padding: '3px 5px', border: '1px solid #0f766e', borderRadius: 4, fontSize: 12, fontFamily: 'inherit', textAlign: (numeric ? 'center' : 'left') as any },
  };
  return multiline ? <textarea rows={2} {...common} /> : <input inputMode={numeric ? 'decimal' : undefined} {...common} />;
};

/** readOnly: opened from a Projects row (Projects access) — figures only, no receipt editing */
const TrustStockContentsModal: React.FC<{ onClose: () => void; readOnly?: boolean }> = ({ onClose, readOnly = false }) => {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus | 'ALL'>('ALL');
  const [orderFilter, setOrderFilter] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [makingPf, setMakingPf] = useState(false);
  const [view, setView] = useState<'list' | 'reorder'>('list');
  /** RE-ORDER tab: product id → quantity typed for the PF */
  const [picks, setPicks] = useState<Record<string, string>>({});
  /** RE-ORDER tab: also record the PF as a new stock order in Trust Stock */
  const [addToStock, setAddToStock] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Edits from this table; reload afterwards (the live event isn't sent back to the editor)
  const save = async (p: StockProduct, patch: Parameters<typeof updateStockProduct>[1]) => {
    if ('itemCode' in patch && !patch.itemCode) { setError('Item code can\'t be empty'); throw new Error('empty'); }
    if ('quantity' in patch && !(Number.isFinite(patch.quantity as number) && (patch.quantity as number) >= 0)) { setError('Enter a valid ordered quantity'); throw new Error('bad qty'); }
    try { await updateStockProduct(p.id, patch); setError(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); throw e; }
  };
  const remove = async (p: StockProduct) => {
    if (!window.confirm(`Remove ${p.itemCode} from ${p.stockItem.group.code}?`)) return;
    try { await deleteStockProduct(p.id); setError(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Remove failed'); }
  };

  const load = useCallback(async () => {
    try { setProducts(await (readOnly ? getAvailableStockProducts() : getStockProducts())); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [readOnly]);
  useEffect(() => { load(); }, [load]);
  useSocketEvent('trust-stock:usage-changed', load);
  useSocketEvent('trust-stock:item-created', load);
  useSocketEvent('trust-stock:item-deleted', load);

  const orders = useMemo(() => [...new Set(products.map(p => p.stockItem.group.code))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [products]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter(p => statusFilter === 'ALL' || p.status === statusFilter)
      .filter(p => !orderFilter || p.stockItem.group.code === orderFilter)
      .filter(p => !q || [p.itemCode, p.description, p.dimensions, p.stockItem.pfCode, p.stockItem.group.code, p.stockItem.vendor?.name, ...p.usages.map(u => u.projectNo), ...p.usages.map(u => u.takenBy || '')]
        .some(v => (v || '').toLowerCase().includes(q)))
      .sort((a, b) => a.stockItem.group.code.localeCompare(b.stockItem.group.code, undefined, { numeric: true }));
  }, [products, search, statusFilter, orderFilter]);

  // Dashboard figures (remaining / available only count models with a confirmed receipt — same as the sheet)
  const dash_ = useMemo(() => {
    const received = products.filter(p => p.received != null);
    return {
      ordered: products.reduce((s, p) => s + p.ordered, 0),
      received: received.reduce((s, p) => s + (p.received ?? 0), 0),
      used: products.reduce((s, p) => s + p.netUsed, 0),
      onHand: received.reduce((s, p) => s + (p.onHand ?? 0), 0),
      reserved: products.reduce((s, p) => s + p.reserved, 0),
      available: received.reduce((s, p) => s + (p.available ?? 0), 0),
      reorder: products.filter(p => p.status === 'REORDER_NOW').length,
      out: products.filter(p => p.status === 'OUT_OF_STOCK').length,
      watch: products.filter(p => p.status === 'WATCH').length,
      pending: products.filter(p => p.status === 'PENDING_VERIFICATION').length,
    };
  }, [products]);

  const toggle = (id: string) => setOpen(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // RE-ORDER tab: products at the reorder point first, everything else (search / stock order filters apply) below
  const needReorder = useMemo(() => products.filter(p => p.reorderQty > 0), [products]);
  const reorderOthers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter(p => p.reorderQty <= 0)
      .filter(p => !orderFilter || p.stockItem.group.code === orderFilter)
      .filter(p => !q || [p.itemCode, p.description, p.dimensions, p.stockItem.pfCode, p.stockItem.group.code, p.stockItem.vendor?.name].some(v => (v || '').toLowerCase().includes(q)))
      .sort((a, b) => a.stockItem.group.code.localeCompare(b.stockItem.group.code, undefined, { numeric: true }));
  }, [products, search, orderFilter]);
  const openReorder = () => {
    // tick everything at the reorder point that isn't picked yet
    setPicks(prev => {
      const next = { ...prev };
      for (const p of needReorder) if (!(p.id in next)) next[p.id] = String(p.reorderQty);
      return next;
    });
    setView('reorder');
  };
  const pfLines = useMemo(() => Object.entries(picks)
    .map(([productId, v]) => ({ productId, quantity: Number(String(v).replace(',', '.')) }))
    .filter(l => products.some(p => p.id === l.productId) && Number.isFinite(l.quantity) && l.quantity > 0), [picks, products]);
  const createPf = async () => {
    setMakingPf(true);
    setNotice(null);
    try {
      await downloadReorderPf(pfLines, addToStock);
      setError(null);
      if (addToStock) {
        // the new stock order's products are pending verification until the warehouse confirms them
        setNotice('Added to Trust Stock as a new stock order.');
        setPicks({});
        setAddToStock(false);
        await load();
      }
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not create the re-order PF'); }
    finally { setMakingPf(false); }
  };

  const card = (label: string, value: number, head: string, color = '#0f172a') => (
    <div key={label} style={{ flex: '1 1 150px', minWidth: 140, border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', textAlign: 'center' }}>
      <div style={{ background: head, color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '5px 4px', letterSpacing: '.3px' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, padding: '6px 4px', color }}>{value}</div>
    </div>
  );

  const th: React.CSSProperties = { padding: '6px 6px', fontSize: 10.5, color: '#fff', background: '#1e293b', textAlign: 'center', fontWeight: 600, position: 'sticky', top: 0, zIndex: 1, lineHeight: 1.2 };
  const td: React.CSSProperties = { padding: '5px 6px', fontSize: 12, borderBottom: '1px solid #eef2f7', textAlign: 'center', verticalAlign: 'middle' };
  const COLS = ['Stock Order', 'Item Code', 'Description', 'Dimensions', 'Ordered', 'Confirmed\nReceived', 'Target\nStock', 'Taken', 'Returned', 'On Hand', 'Reserved', 'Available', 'Remaining %', 'Reorder at ≤', 'Order', 'Status', 'Used by'];

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: readOnly ? 100001 : 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, width: 1500, maxWidth: '100%', height: '94vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,.25)' }}>
        <div style={{ padding: '10px 18px', background: '#1e293b', color: '#fff', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '.4px' }}>TRUST LINES — STOCK OVERVIEW</div>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#fff' }}>×</button>
        </div>

        {/* Dashboard */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {card('TOTAL ORDERED', dash_.ordered, '#1e3a5f')}
            {card('TOTAL RECEIVED', dash_.received, '#1e3a5f')}
            {card('USED (net of returns)', dash_.used, '#1e3a5f')}
            {card('REMAINING (on hand)', dash_.onHand, '#1e3a5f')}
            {card('RESERVED', dash_.reserved, '#1e3a5f')}
            {card('AVAILABLE', dash_.available, '#1e3a5f')}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {card('NEED REORDER', dash_.reorder, '#b91c1c', '#b91c1c')}
            {card('OUT OF STOCK', dash_.out, '#7f1d1d', '#7f1d1d')}
            {card('ON WATCH', dash_.watch, '#b45309', '#b45309')}
            {card('PENDING VERIFICATION', dash_.pending, '#6b7280', '#6b7280')}
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '8px 18px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid #e5e7eb' }}>
          {STATUS_FILTERS.map(s => {
            const active = view === 'list' && statusFilter === s;
            const style = s === 'ALL' ? { label: 'ALL', bg: '#1e293b', fg: '#fff' } : STOCK_STATUS_STYLE[s];
            return (
              <button key={s} onClick={() => { setStatusFilter(s); setView('list'); }} style={{
                padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: active ? '2px solid #0f172a' : '1px solid #d1d5db', background: active ? style.bg : '#fff', color: active ? style.fg : '#374151',
              }}>{style.label}</button>
            );
          })}
          {!readOnly && (
            <button onClick={openReorder} title="Pick products and quantities for a re-order production form" style={{
              padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: 'pointer',
              border: view === 'reorder' ? '2px solid #0f172a' : '1px solid #f59e0b', background: view === 'reorder' ? '#f59e0b' : '#fff7ed', color: '#9a3412',
            }}>RE-ORDER{needReorder.length ? ` (${needReorder.length})` : ''}</button>
          )}
          <select value={orderFilter} onChange={e => setOrderFilter(e.target.value)} style={{ padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12 }}>
            <option value="">All stock orders</option>
            {orders.map(o => <option key={o}>{o}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          {error && <span style={{ color: '#dc2626', fontSize: 12 }}>{error}</span>}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Item, description, PF, project, person…"
            style={{ width: 230, padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12 }} />
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading && <div style={{ padding: 24, color: '#6b7280' }}>Loading…</div>}
          {!loading && products.length === 0 && <div style={{ padding: 24, color: '#6b7280' }}>No products yet — upload a PF PDF to fill the stock.</div>}
          {!loading && products.length > 0 && view === 'reorder' && (
            <>
              <div style={{ position: 'sticky', top: 0, zIndex: 2, background: '#fff', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #e5e7eb' }}>
                <b style={{ fontSize: 13 }}>Re-order PF</b>
                <span style={{ fontSize: 12, color: '#475569' }}>
                  {pfLines.length} product(s), {pfLines.reduce((s, l) => s + l.quantity, 0)} pcs selected · one page per vendor, next stock code
                </span>
                <div style={{ flex: 1 }} />
                {notice && <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>{notice}</span>}
                <label title="Also record this PF in Trust Stock as a new stock order (products pending verification), as if the PDF had been uploaded"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                  <input type="checkbox" checked={addToStock} onChange={e => setAddToStock(e.target.checked)} />
                  Add to Trust Stock
                </label>
                <button onClick={() => setPicks({})} disabled={!Object.keys(picks).length}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', fontSize: 12, cursor: 'pointer' }}>Clear</button>
                <button onClick={createPf} disabled={!pfLines.length || makingPf}
                  style={{ padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 700, cursor: pfLines.length && !makingPf ? 'pointer' : 'default', background: pfLines.length ? '#f59e0b' : '#cbd5e1', color: '#1e293b' }}>
                  {makingPf ? 'Creating PF…' : `⬇ Create PF${addToStock ? ' + add to stock' : ''}${pfLines.length ? ` (${pfLines.length})` : ''}`}
                </button>
              </div>
              <ReorderPanel products={needReorder} others={reorderOthers} picks={picks} setPicks={setPicks} />
            </>
          )}
          {!loading && products.length > 0 && view === 'list' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{COLS.map(h => <th key={h} style={th}>{h.split('\n').map((l, i) => <div key={i}>{l}</div>)}</th>)}</tr></thead>
              <tbody>
                {visible.map((p, i) => {
                  const st = STOCK_STATUS_STYLE[p.status];
                  const newGroup = i === 0 || visible[i - 1].stockItem.id !== p.stockItem.id;
                  const isOpen = open.has(p.id);
                  return (
                    <React.Fragment key={p.id}>
                      {newGroup && (
                        <tr>
                          <td colSpan={COLS.length} style={{ padding: '5px 10px', background: '#e2e8f0', fontSize: 12, color: '#0f172a' }}>
                            <b>{p.stockItem.group.code}</b>
                            <span style={{ margin: '0 10px', fontFamily: 'monospace' }}>{p.stockItem.pfCode}</span>
                            {p.stockItem.vendor && <span>{p.stockItem.vendor.code} - {p.stockItem.vendor.name}</span>}
                            <span style={{ marginLeft: 10, color: '#475569' }}>{fmtDate(p.stockItem.pfDate)}</span>
                            {p.stockItem.hasPdf && (
                              <button onClick={() => openTrustStockPdf(p.stockItem.id).catch(e => setError(e.message))}
                                style={{ marginLeft: 10, padding: '1px 8px', borderRadius: 4, border: '1px solid #94a3b8', background: '#fff', fontSize: 11, cursor: 'pointer' }}>View PDF</button>
                            )}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td style={td}>{p.stockItem.group.code}</td>
                        <td style={{ ...td, fontWeight: 700, color: '#15803d', whiteSpace: 'nowrap' }}>
                          <EditCell editable={!readOnly} value={p.itemCode} onSave={v => save(p, { itemCode: v })} />
                        </td>
                        <td style={{ ...td, textAlign: 'left', color: '#15803d', maxWidth: 280 }}>
                          <EditCell editable={!readOnly} multiline value={p.description} onSave={v => save(p, { description: v })} />
                        </td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>
                          <EditCell editable={!readOnly} value={p.dimensions || ''} onSave={v => save(p, { dimensions: v || null })} />
                        </td>
                        <td style={td}>
                          <EditCell editable={!readOnly} numeric value={String(p.ordered)} onSave={v => save(p, { quantity: Number(v.replace(',', '.')) })} />
                        </td>
                        <td style={td}>{readOnly ? dash(p.received) : <QtyCell p={p} field="receivedQuantity" current={p.received} title="Confirmed received in the warehouse (empty = pending verification)" onError={setError} onSaved={load} />}</td>
                        <td style={td}>{readOnly ? dash(p.target) : <QtyCell p={p} field="targetQuantity" current={p.target} title="Target stock level — Remaining % and the status are measured against it (empty = use Confirmed Received)" onError={setError} onSaved={load} />}</td>
                        <td style={td}>{p.taken}</td>
                        <td style={td}>{p.returned}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{dash(p.onHand)}</td>
                        <td style={td}>{p.reserved}</td>
                        <td style={{ ...td, fontWeight: 700 }}>{dash(p.available)}</td>
                        <td style={td}>{fmtPct(p.remainingPct)}</td>
                        <td style={td}>{dash(p.reorderThreshold)}</td>
                        <td style={{ ...td, fontWeight: 800, color: p.reorderQty > 0 ? '#c2410c' : '#9ca3af', background: p.reorderQty > 0 ? '#fff7ed' : undefined }}
                          title={p.reorderQty > 0 ? `Re-order ${p.reorderQty} to get back to the ${p.target != null ? `target ${p.target}` : `ordered ${p.ordered}`}` : 'Not at the reorder point'}>
                          {p.reorderQty > 0 ? p.reorderQty : '—'}
                        </td>
                        <td style={td}><span style={{ display: 'inline-block', padding: '3px 6px', borderRadius: 4, background: st.bg, color: st.fg, fontSize: 10, fontWeight: 700, lineHeight: 1.2 }}>{st.label}</span></td>
                        <td style={td}>
                          {p.usages.length === 0 ? (readOnly ? <span style={{ color: '#9ca3af' }}>—</span> : (
                            <button onClick={() => remove(p)} title="Remove this product (only possible while no project uses it)" style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 11, padding: 0 }}>Remove</button>
                          )) : (
                            <button onClick={() => toggle(p.id)} style={{ border: 'none', background: 'none', color: '#0f766e', cursor: 'pointer', fontSize: 12, padding: 0, whiteSpace: 'nowrap' }}>
                              {isOpen ? '▾' : '▸'} {new Set(p.usages.map(u => u.projectNo)).size} project(s)
                            </button>
                          )}
                        </td>
                      </tr>
                      {isOpen && p.usages.map(u => (
                        <tr key={u.id} style={{ background: '#f8fafc' }}>
                          <td style={td} colSpan={2} />
                          <td style={{ ...td, textAlign: 'left' }} colSpan={2}>
                            Project <b>{u.projectNo}</b> <span style={{ color: '#64748b' }}>{u.projectName}</span>
                            <span style={{ fontFamily: 'monospace', fontSize: 11, marginLeft: 8, color: '#475569' }}>{u.projectPfCode}</span>
                            {u.takenBy && <span style={{ marginLeft: 8, color: '#0f172a' }}>· {u.takenBy}</span>}
                            {u.rowDeleted && <span style={{ color: '#dc2626', marginLeft: 6 }}>(row deleted)</span>}
                          </td>
                          <td style={td} colSpan={3} />
                          <td style={{ ...td, color: '#b45309', fontWeight: 600 }}>{u.kind === 'TAKEN' ? u.quantity : ''}</td>
                          <td style={{ ...td, color: '#0369a1', fontWeight: 600 }}>{u.kind === 'RETURNED' ? u.quantity : ''}</td>
                          <td style={td} />
                          <td style={{ ...td, color: '#6d28d9', fontWeight: 600 }}>{u.kind === 'RESERVED' ? u.quantity : ''}</td>
                          <td style={{ ...td, color: '#64748b' }} colSpan={6}>{fmtDate(u.createdAt)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ ...td, background: '#facc15', fontWeight: 800, textAlign: 'left' }}>TOTAL</td>
                  {[
                    visible.reduce((s, p) => s + p.ordered, 0),
                    visible.reduce((s, p) => s + (p.received ?? 0), 0),
                    visible.reduce((s, p) => s + (p.target ?? 0), 0),
                    visible.reduce((s, p) => s + p.taken, 0),
                    visible.reduce((s, p) => s + p.returned, 0),
                    visible.reduce((s, p) => s + (p.onHand ?? 0), 0),
                    visible.reduce((s, p) => s + p.reserved, 0),
                    visible.reduce((s, p) => s + (p.available ?? 0), 0),
                  ].map((v, i) => <td key={i} style={{ ...td, background: '#facc15', fontWeight: 800 }}>{v}</td>)}
                  <td colSpan={2} style={{ ...td, background: '#facc15' }} />
                  <td style={{ ...td, background: '#facc15', fontWeight: 800, color: '#9a3412' }}>{visible.reduce((s, p) => s + p.reorderQty, 0) || '—'}</td>
                  <td colSpan={2} style={{ ...td, background: '#facc15' }} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
        <div style={{ padding: '6px 18px', fontSize: 11, color: '#64748b', borderTop: '1px solid #e5e7eb' }}>
          Status per model, Remaining % = Available ÷ Target Stock (or Confirmed Received when no target is set): HEALTHY &gt; 50% · WATCH 25–50% · REORDER NOW ≤ 25% · OUT OF STOCK ≤ 0 · PENDING VERIFICATION = no warehouse receipt yet (enter it in “Confirmed Received”).
        </div>
      </div>
    </div>
  );
};

export default TrustStockContentsModal;
