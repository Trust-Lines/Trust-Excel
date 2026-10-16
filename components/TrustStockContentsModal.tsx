import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getStockProducts, openTrustStockPdf, updateStockProduct, productFamily,
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

const ReceivedCell: React.FC<{ p: StockProduct; onError: (m: string) => void }> = ({ p, onError }) => {
  const [value, setValue] = useState(p.received == null ? '' : String(p.received));
  useEffect(() => { setValue(p.received == null ? '' : String(p.received)); }, [p.received]);
  const commit = async () => {
    const trimmed = value.trim();
    const next = trimmed === '' ? null : Number(trimmed.replace(',', '.'));
    if (next === p.received || (next != null && !Number.isFinite(next))) { setValue(p.received == null ? '' : String(p.received)); return; }
    try { await updateStockProduct(p.id, { receivedQuantity: next }); }
    catch (e) { onError(e instanceof Error ? e.message : 'Save failed'); setValue(p.received == null ? '' : String(p.received)); }
  };
  return (
    <input
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setValue(p.received == null ? '' : String(p.received)); }}
      placeholder="—"
      title="Confirmed received in the warehouse (empty = pending verification)"
      inputMode="decimal"
      style={{ width: 56, padding: '3px 5px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, textAlign: 'center', background: p.received == null ? '#f8fafc' : '#fff' }}
    />
  );
};

const TrustStockContentsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus | 'ALL'>('ALL');
  const [orderFilter, setOrderFilter] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try { setProducts(await getStockProducts()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, []);
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
      .filter(p => !q || [p.itemCode, p.description, p.dimensions, p.stockItem.pfCode, p.stockItem.group.code, p.stockItem.vendor?.name, ...p.usages.map(u => u.projectNo)]
        .some(v => (v || '').toLowerCase().includes(q)))
      .sort((a, b) => a.stockItem.group.code.localeCompare(b.stockItem.group.code, undefined, { numeric: true }));
  }, [products, search, statusFilter, orderFilter]);

  // Dashboard figures (remaining / available only count models with a confirmed receipt — same as the sheet)
  const dash_ = useMemo(() => {
    const received = products.filter(p => p.received != null);
    const families: Record<string, number> = {};
    for (const p of received) families[productFamily(p.itemCode)] = (families[productFamily(p.itemCode)] || 0) + (p.onHand ?? 0);
    for (const p of products) if (!(productFamily(p.itemCode) in families)) families[productFamily(p.itemCode)] = 0;
    return {
      ordered: products.reduce((s, p) => s + p.ordered, 0),
      received: received.reduce((s, p) => s + (p.received ?? 0), 0),
      used: products.reduce((s, p) => s + p.netUsed, 0),
      onHand: received.reduce((s, p) => s + (p.onHand ?? 0), 0),
      reserved: products.reduce((s, p) => s + p.reserved, 0),
      available: received.reduce((s, p) => s + (p.available ?? 0), 0),
      families,
      reorder: products.filter(p => p.status === 'REORDER_NOW').length,
      out: products.filter(p => p.status === 'OUT_OF_STOCK').length,
      watch: products.filter(p => p.status === 'WATCH').length,
      pending: products.filter(p => p.status === 'PENDING_VERIFICATION').length,
    };
  }, [products]);

  const toggle = (id: string) => setOpen(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const card = (label: string, value: number, head: string, color = '#0f172a') => (
    <div key={label} style={{ flex: '1 1 150px', minWidth: 140, border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', textAlign: 'center' }}>
      <div style={{ background: head, color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '5px 4px', letterSpacing: '.3px' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, padding: '6px 4px', color }}>{value}</div>
    </div>
  );

  const th: React.CSSProperties = { padding: '6px 6px', fontSize: 10.5, color: '#fff', background: '#1e293b', textAlign: 'center', fontWeight: 600, position: 'sticky', top: 0, zIndex: 1, lineHeight: 1.2 };
  const td: React.CSSProperties = { padding: '5px 6px', fontSize: 12, borderBottom: '1px solid #eef2f7', textAlign: 'center', verticalAlign: 'middle' };
  const COLS = ['Stock Order', 'Item Code', 'Description', 'Dimensions', 'Ordered', 'Confirmed\nReceived', 'Taken', 'Returned', 'On Hand', 'Reserved', 'Available', 'Remaining %', 'Reorder at ≤', 'Status', 'Used by'];

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
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
            {Object.entries(dash_.families).sort(([a], [b]) => a.localeCompare(b)).map(([f, v]) => card(`${f} REMAINING`, v, '#2c5aa0', '#1d4ed8'))}
            {card('NEED REORDER', dash_.reorder, '#b91c1c', '#b91c1c')}
            {card('OUT OF STOCK', dash_.out, '#7f1d1d', '#7f1d1d')}
            {card('ON WATCH', dash_.watch, '#b45309', '#b45309')}
            {card('PENDING VERIFICATION', dash_.pending, '#6b7280', '#6b7280')}
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '8px 18px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid #e5e7eb' }}>
          {STATUS_FILTERS.map(s => {
            const active = statusFilter === s;
            const style = s === 'ALL' ? { label: 'ALL', bg: '#1e293b', fg: '#fff' } : STOCK_STATUS_STYLE[s];
            return (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: active ? '2px solid #0f172a' : '1px solid #d1d5db', background: active ? style.bg : '#fff', color: active ? style.fg : '#374151',
              }}>{style.label}</button>
            );
          })}
          <select value={orderFilter} onChange={e => setOrderFilter(e.target.value)} style={{ padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12 }}>
            <option value="">All stock orders</option>
            {orders.map(o => <option key={o}>{o}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          {error && <span style={{ color: '#dc2626', fontSize: 12 }}>{error}</span>}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Item, description, PF, project…"
            style={{ width: 230, padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12 }} />
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading && <div style={{ padding: 24, color: '#6b7280' }}>Loading…</div>}
          {!loading && products.length === 0 && <div style={{ padding: 24, color: '#6b7280' }}>No products yet — upload a PF PDF to fill the stock.</div>}
          {!loading && products.length > 0 && (
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
                        <td style={{ ...td, fontWeight: 700, color: '#15803d', whiteSpace: 'nowrap' }}>{p.itemCode}</td>
                        <td style={{ ...td, textAlign: 'left', color: '#15803d', maxWidth: 280 }}>{p.description}</td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>{p.dimensions || '—'}</td>
                        <td style={td}>{p.ordered}</td>
                        <td style={td}><ReceivedCell p={p} onError={setError} /></td>
                        <td style={td}>{p.taken}</td>
                        <td style={td}>{p.returned}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{dash(p.onHand)}</td>
                        <td style={td}>{p.reserved}</td>
                        <td style={{ ...td, fontWeight: 700 }}>{dash(p.available)}</td>
                        <td style={td}>{fmtPct(p.remainingPct)}</td>
                        <td style={td}>{dash(p.reorderThreshold)}</td>
                        <td style={td}><span style={{ display: 'inline-block', padding: '3px 6px', borderRadius: 4, background: st.bg, color: st.fg, fontSize: 10, fontWeight: 700, lineHeight: 1.2 }}>{st.label}</span></td>
                        <td style={td}>
                          {p.usages.length === 0 ? <span style={{ color: '#9ca3af' }}>—</span> : (
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
                            {u.rowDeleted && <span style={{ color: '#dc2626', marginLeft: 6 }}>(row deleted)</span>}
                          </td>
                          <td style={td} colSpan={2} />
                          <td style={{ ...td, color: '#b45309', fontWeight: 600 }}>{u.kind === 'TAKEN' ? u.quantity : ''}</td>
                          <td style={{ ...td, color: '#0369a1', fontWeight: 600 }}>{u.kind === 'RETURNED' ? u.quantity : ''}</td>
                          <td style={td} />
                          <td style={{ ...td, color: '#6d28d9', fontWeight: 600 }}>{u.kind === 'RESERVED' ? u.quantity : ''}</td>
                          <td style={{ ...td, color: '#64748b' }} colSpan={5}>{fmtDate(u.createdAt)}</td>
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
                    visible.reduce((s, p) => s + p.taken, 0),
                    visible.reduce((s, p) => s + p.returned, 0),
                    visible.reduce((s, p) => s + (p.onHand ?? 0), 0),
                    visible.reduce((s, p) => s + p.reserved, 0),
                    visible.reduce((s, p) => s + (p.available ?? 0), 0),
                  ].map((v, i) => <td key={i} style={{ ...td, background: '#facc15', fontWeight: 800 }}>{v}</td>)}
                  <td colSpan={4} style={{ ...td, background: '#facc15' }} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
        <div style={{ padding: '6px 18px', fontSize: 11, color: '#64748b', borderTop: '1px solid #e5e7eb' }}>
          Status per model, Remaining % = Available ÷ Confirmed Received: HEALTHY &gt; 40% · WATCH 25–40% · REORDER NOW ≤ 25% · OUT OF STOCK ≤ 0 · PENDING VERIFICATION = no warehouse receipt yet (enter it in “Confirmed Received”).
        </div>
      </div>
    </div>
  );
};

export default TrustStockContentsModal;
