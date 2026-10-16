import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getAvailableStockProducts, getRowStockUsage, applyStockMovements, removeStockUsage,
  StockProduct, RowStockUsage, STOCK_STATUS_STYLE,
} from '../lib/trust-stock';
import { useSocketEvent } from '../hooks/useSocketEvent';

/**
 * "Use from Trust Stock" for one Projects-table row whose vendor is TR-STOCK.
 * Opens by itself when a row's vendor is set to TR-STOCK, or from the row's
 * right-click menu. Lists every stock product (like the Cabinet Stock sheet)
 * and lets the user enter, per product, how many this row TAKES, RESERVES or
 * RETURNS — all saved together. Quantities can't exceed what's free.
 */

type Entry = { take: string; reserve: string; ret: string };
const EMPTY: Entry = { take: '', reserve: '', ret: '' };
const n = (v: string) => { const x = parseFloat(v.replace(',', '.')); return Number.isFinite(x) && x > 0 ? x : 0; };
const dash = (v: number | null) => (v == null ? '—' : v);

const StockUsageModal: React.FC<{ projectItemId: string; rowLabel: string; onClose: () => void }> = ({ projectItemId, rowLabel, onClose }) => {
  const [moves, setMoves] = useState<RowStockUsage[]>([]);
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [onlyFree, setOnlyFree] = useState(true);

  const load = useCallback(async () => {
    try {
      const [m, p] = await Promise.all([getRowStockUsage(projectItemId), getAvailableStockProducts()]);
      setMoves(m);
      setProducts(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [projectItemId]);
  useEffect(() => { load(); }, [load]);
  useSocketEvent('trust-stock:usage-changed', load);

  // This row's own balance per product
  const mine = useMemo(() => {
    const m: Record<string, { taken: number; reserved: number }> = {};
    for (const u of moves) {
      const r = (m[u.productId] ||= { taken: 0, reserved: 0 });
      if (u.kind === 'TAKEN') r.taken += u.quantity;
      if (u.kind === 'RETURNED') r.taken -= u.quantity;
      if (u.kind === 'RESERVED') r.reserved += u.quantity;
    }
    return m;
  }, [moves]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter(p => !onlyFree || p.takeable > 0 || mine[p.id])
      .filter(p => !q || [p.itemCode, p.description, p.dimensions, p.stockItem.group.code, p.stockItem.pfCode, p.stockItem.vendor?.name]
        .some(v => (v || '').toLowerCase().includes(q)))
      .sort((a, b) => a.stockItem.group.code.localeCompare(b.stockItem.group.code, undefined, { numeric: true }));
  }, [products, search, onlyFree, mine]);

  const setEntry = (id: string, patch: Partial<Entry>) => setEntries(prev => ({ ...prev, [id]: { ...(prev[id] || EMPTY), ...patch } }));

  // Client-side check mirrors the server rules
  const problemFor = (p: StockProduct): string | null => {
    const e = entries[p.id];
    if (!e) return null;
    const take = n(e.take), reserve = n(e.reserve), ret = n(e.ret);
    const my = mine[p.id] || { taken: 0, reserved: 0 };
    if (ret > my.taken) return `Can return at most ${my.taken}`;
    const free = p.takeable + ret;
    const fromRes = Math.min(my.reserved, take);
    if (take - fromRes > free) return `Max ${free + my.reserved} can be taken`;
    if (reserve > free - Math.max(0, take - my.reserved)) return `Max ${Math.max(0, free - Math.max(0, take - my.reserved))} can be reserved`;
    return null;
  };

  const pending = products.filter(p => { const e = entries[p.id]; return e && (n(e.take) || n(e.reserve) || n(e.ret)); });
  const hasProblem = pending.some(p => problemFor(p));

  const save = async () => {
    if (!pending.length || hasProblem) return;
    setSaving(true);
    setError(null);
    try {
      await applyStockMovements(projectItemId, pending.map(p => {
        const e = entries[p.id];
        return { productId: p.id, take: n(e.take) || undefined, reserve: n(e.reserve) || undefined, return: n(e.ret) || undefined };
      }));
      setEntries({});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const undo = async (u: RowStockUsage) => {
    const what = u.kind === 'TAKEN' ? 'this take' : u.kind === 'RETURNED' ? 'this return' : 'this reservation';
    if (!window.confirm(`Undo ${what} (${u.itemCode} × ${u.quantity})?`)) return;
    try { await removeStockUsage(u.id); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
  };

  const th: React.CSSProperties = { padding: '6px 6px', fontSize: 10.5, color: '#fff', background: '#1e293b', textAlign: 'center', fontWeight: 600, position: 'sticky', top: 0, zIndex: 1, lineHeight: 1.2 };
  const td: React.CSSProperties = { padding: '5px 6px', fontSize: 12, borderBottom: '1px solid #eef2f7', textAlign: 'center', verticalAlign: 'middle' };
  const inp: React.CSSProperties = { width: 58, padding: '4px 5px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, textAlign: 'right' };
  const kindStyle: Record<string, string> = { TAKEN: '#b45309', RETURNED: '#0369a1', RESERVED: '#6d28d9' };

  return (
    <div onMouseDown={() => !saving && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, width: 1380, maxWidth: '100%', height: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,.25)' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Use from Trust Stock</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{rowLabel}</div>
          </div>
          <div style={{ flex: 1 }} />
          <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <input type="checkbox" checked={onlyFree} onChange={e => setOnlyFree(e.target.checked)} /> Only items with stock
          </label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Item code, description, stock order…"
            style={{ width: 240, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
          <button onClick={onClose} disabled={saving} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>

        {/* This row's movements */}
        <div style={{ padding: '8px 18px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc', maxHeight: 130, overflowY: 'auto' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>This row</div>
          {moves.length === 0 ? <div style={{ fontSize: 12, color: '#94a3b8' }}>No stock taken or reserved yet.</div> : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {moves.map(u => (
                <span key={u.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 999, background: '#fff', border: '1px solid #e2e8f0', fontSize: 12 }}>
                  <b style={{ color: kindStyle[u.kind] }}>{u.kind === 'TAKEN' ? 'Taken' : u.kind === 'RETURNED' ? 'Returned' : 'Reserved'}</b>
                  {u.itemCode} × {u.quantity}
                  <span style={{ color: '#94a3b8' }}>{u.stockCode}</span>
                  <button title="Undo" onClick={() => undo(u)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', padding: 0, fontSize: 14 }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? <div style={{ padding: 24, color: '#6b7280' }}>Loading…</div> : rows.length === 0 ? (
            <div style={{ padding: 24, color: '#6b7280' }}>{products.length ? 'No matching items.' : 'Trust Stock is empty — upload PF PDFs on the Trust Stock page.'}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Stock Order', 'Item Code', 'Description', 'Dimensions', 'Ordered', 'Received', 'On Hand', 'Reserved', 'Available', 'Status', 'This row\ntaken / res.', 'TAKE', 'RESERVE', 'RETURN'].map(h => (
                    <th key={h} style={{ ...th, ...(h === 'TAKE' || h === 'RESERVE' || h === 'RETURN' ? { background: '#0f766e' } : {}) }}>{h.split('\n').map((l, i) => <div key={i}>{l}</div>)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => {
                  const st = STOCK_STATUS_STYLE[p.status];
                  const e = entries[p.id] || EMPTY;
                  const my = mine[p.id];
                  const problem = problemFor(p);
                  const newGroup = i === 0 || rows[i - 1].stockItem.group.code !== p.stockItem.group.code;
                  return (
                    <React.Fragment key={p.id}>
                      {newGroup && (
                        <tr><td colSpan={14} style={{ padding: '5px 8px', background: '#e2e8f0', fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                          {p.stockItem.group.code}<span style={{ fontWeight: 400, color: '#475569', marginLeft: 10 }}>{p.stockItem.vendor?.name}</span>
                        </td></tr>
                      )}
                      <tr style={{ background: problem ? '#fef2f2' : undefined }}>
                        <td style={td}>{p.stockItem.group.code}</td>
                        <td style={{ ...td, fontWeight: 700, color: '#15803d', whiteSpace: 'nowrap' }}>{p.itemCode}</td>
                        <td style={{ ...td, textAlign: 'left', color: '#15803d', maxWidth: 260 }}>{p.description}</td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>{p.dimensions || '—'}</td>
                        <td style={td}>{p.ordered}</td>
                        <td style={td}>{dash(p.received)}</td>
                        <td style={td}>{dash(p.onHand)}</td>
                        <td style={td}>{p.reserved}</td>
                        <td style={{ ...td, fontWeight: 700 }}>{p.available == null ? <span title="Not received yet — ordered quantity is the limit">({p.takeable})</span> : p.available}</td>
                        <td style={td}><span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: 4, background: st.bg, color: st.fg, fontSize: 10, fontWeight: 700 }}>{st.label}</span></td>
                        <td style={{ ...td, color: '#475569' }}>{my ? `${my.taken} / ${my.reserved}` : '—'}</td>
                        <td style={td}><input style={inp} value={e.take} onChange={ev => setEntry(p.id, { take: ev.target.value })} inputMode="decimal" /></td>
                        <td style={td}><input style={inp} value={e.reserve} onChange={ev => setEntry(p.id, { reserve: ev.target.value })} inputMode="decimal" /></td>
                        <td style={td}>
                          <input style={{ ...inp, opacity: my?.taken ? 1 : 0.4 }} disabled={!my?.taken} value={e.ret} onChange={ev => setEntry(p.id, { ret: ev.target.value })} inputMode="decimal" />
                          {problem && <div style={{ color: '#dc2626', fontSize: 10.5, marginTop: 2, whiteSpace: 'nowrap' }}>{problem}</div>}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ padding: '10px 18px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Available in ( ) = not received in the warehouse yet; the ordered quantity is the limit until it is.
          </span>
          <div style={{ flex: 1 }} />
          {error && <span style={{ color: '#dc2626', fontSize: 13 }}>{error}</span>}
          <button onClick={onClose} disabled={saving} style={{ padding: '8px 14px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 6, cursor: 'pointer' }}>Close</button>
          <button onClick={save} disabled={!pending.length || hasProblem || saving}
            style={{ padding: '8px 18px', border: 'none', borderRadius: 6, background: '#0f766e', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: !pending.length || hasProblem || saving ? 0.5 : 1 }}>
            {saving ? 'Saving…' : `Save${pending.length ? ` (${pending.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockUsageModal;
