import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getAvailableStockProducts, getRowStockUsage, applyStockMovements, removeStockUsage, getStockPeople,
  StockProduct, RowStockUsage, STOCK_STATUS_STYLE,
} from '../lib/trust-stock';
import { useSocketEvent } from '../hooks/useSocketEvent';
import TrustStockContentsModal from './TrustStockContentsModal';

/**
 * "Use from Trust Stock" for one Projects-table row whose vendor is TR-STOCK.
 * Opens by itself when the row's vendor is set to TR-STOCK (or from the row's
 * right-click menu). Pick a stock PF at the top, enter per product how many
 * this row TAKES / RESERVES / RETURNS, switch to another PF and add more —
 * everything is saved together with the name of who took it.
 */

type Entry = { take: string; reserve: string; ret: string };
const EMPTY: Entry = { take: '', reserve: '', ret: '' };
const n = (v: string) => { const x = parseFloat(v.replace(',', '.')); return Number.isFinite(x) && x > 0 ? x : 0; };
const dash = (v: number | null) => (v == null ? '—' : v);
const KIND_LABEL: Record<string, string> = { TAKEN: 'Taken', RETURNED: 'Returned', RESERVED: 'Reserved' };
const KIND_COLOR: Record<string, string> = { TAKEN: '#b45309', RETURNED: '#0369a1', RESERVED: '#6d28d9' };

interface PfOption {
  id: string;
  groupCode: string;
  pfCode: string | null;
  vendor: string;
  products: StockProduct[];
  takeable: number;
}

const StockUsageModal: React.FC<{ projectItemId: string; rowLabel: string; onClose: () => void }> = ({ projectItemId, rowLabel, onClose }) => {
  const [moves, setMoves] = useState<RowStockUsage[]>([]);
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [people, setPeople] = useState<string[]>([]);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [pfId, setPfId] = useState<string>('');
  const [takenBy, setTakenBy] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [overviewOpen, setOverviewOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, p, ppl] = await Promise.all([getRowStockUsage(projectItemId), getAvailableStockProducts(), getStockPeople().catch(() => [] as string[])]);
      setMoves(m);
      setProducts(p);
      setPeople(ppl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [projectItemId]);
  useEffect(() => { load(); }, [load]);
  useSocketEvent('trust-stock:usage-changed', load);

  // Stock PFs (one per imported PF), most available first
  const pfs = useMemo<PfOption[]>(() => {
    const map = new Map<string, PfOption>();
    for (const p of products) {
      let o = map.get(p.stockItem.id);
      if (!o) {
        o = { id: p.stockItem.id, groupCode: p.stockItem.group.code, pfCode: p.stockItem.pfCode, vendor: p.stockItem.vendor ? `${p.stockItem.vendor.code} - ${p.stockItem.vendor.name}` : '', products: [], takeable: 0 };
        map.set(o.id, o);
      }
      o.products.push(p);
      o.takeable += Math.max(0, p.takeable);
    }
    return [...map.values()].sort((a, b) => a.groupCode.localeCompare(b.groupCode, undefined, { numeric: true }) || (a.pfCode || '').localeCompare(b.pfCode || ''));
  }, [products]);

  // Start on the PF this row already uses, else the first one
  useEffect(() => {
    if (pfId || !pfs.length) return;
    const used = moves[0] && products.find(p => p.id === moves[0].productId)?.stockItem.id;
    setPfId(used || pfs[0].id);
  }, [pfs, moves, products, pfId]);

  // This row's balance per product
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

  const currentPf = pfs.find(p => p.id === pfId);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (currentPf?.products || []).filter(p => !q || [p.itemCode, p.description, p.dimensions].some(v => (v || '').toLowerCase().includes(q)));
  }, [currentPf, search]);

  const setEntry = (id: string, patch: Partial<Entry>) => setEntries(prev => ({ ...prev, [id]: { ...(prev[id] || EMPTY), ...patch } }));

  // Same limits as the server
  const problemFor = (p: StockProduct): string | null => {
    const e = entries[p.id];
    if (!e) return null;
    const take = n(e.take), reserve = n(e.reserve), ret = n(e.ret);
    const my = mine[p.id] || { taken: 0, reserved: 0 };
    if (ret > my.taken) return `Can return at most ${my.taken}`;
    const free = p.takeable + ret;
    if (take - Math.min(my.reserved, take) > free) return `Max ${free + my.reserved} can be taken`;
    const freeAfterTake = free - Math.max(0, take - my.reserved);
    if (reserve > freeAfterTake) return `Max ${Math.max(0, freeAfterTake)} can be reserved`;
    return null;
  };

  const pending = products.filter(p => { const e = entries[p.id]; return e && (n(e.take) || n(e.reserve) || n(e.ret)); });
  const pendingByPf = useMemo(() => {
    const m: Record<string, number> = {};
    pending.forEach(p => { m[p.stockItem.id] = (m[p.stockItem.id] || 0) + 1; });
    return m;
  }, [pending]);
  const hasProblem = pending.some(p => problemFor(p));
  const canSave = pending.length > 0 && !hasProblem && !!takenBy.trim() && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await applyStockMovements(projectItemId, pending.map(p => {
        const e = entries[p.id];
        return { productId: p.id, take: n(e.take) || undefined, reserve: n(e.reserve) || undefined, return: n(e.ret) || undefined };
      }), takenBy.trim());
      setEntries({});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const undo = async (u: RowStockUsage) => {
    if (!window.confirm(`Undo: ${KIND_LABEL[u.kind]} ${u.itemCode} × ${u.quantity}?`)) return;
    try { await removeStockUsage(u.id); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
  };

  const th: React.CSSProperties = { padding: '6px 6px', fontSize: 10.5, color: '#fff', background: '#1e293b', textAlign: 'center', fontWeight: 600, position: 'sticky', top: 0, zIndex: 1, lineHeight: 1.2 };
  const td: React.CSSProperties = { padding: '5px 6px', fontSize: 12, borderBottom: '1px solid #eef2f7', textAlign: 'center', verticalAlign: 'middle' };
  const inp: React.CSSProperties = { width: 58, padding: '4px 5px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, textAlign: 'right' };

  return (
    <div onMouseDown={() => !saving && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, width: 1320, maxWidth: '100%', height: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,.25)' }}>
        {/* Header */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Use from Trust Stock</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{rowLabel}</div>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={() => setOverviewOpen(true)} style={{ padding: '7px 12px', border: '1px solid #1e293b', background: '#fff', color: '#1e293b', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Stock Overview
          </button>
          <button onClick={onClose} disabled={saving} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>

        {/* 1. Pick the stock PF */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>1 · Stock PF</div>
          {loading ? <div style={{ fontSize: 13, color: '#6b7280' }}>Loading…</div> : pfs.length === 0 ? (
            <div style={{ fontSize: 13, color: '#6b7280' }}>Trust Stock is empty — upload PF PDFs on the Trust Stock page first.</div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {pfs.map(o => {
                const active = o.id === pfId;
                return (
                  <button key={o.id} onClick={() => setPfId(o.id)} style={{
                    textAlign: 'left', padding: '7px 11px', borderRadius: 8, cursor: 'pointer', minWidth: 210,
                    border: active ? '2px solid #0f766e' : '1px solid #d1d5db', background: active ? '#ecfdf5' : '#fff',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                      {o.groupCode}
                      {pendingByPf[o.id] ? <span style={{ marginLeft: 6, padding: '0 6px', borderRadius: 999, background: '#0f766e', color: '#fff', fontSize: 10.5 }}>{pendingByPf[o.id]} to save</span> : null}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#334155' }}>{o.pfCode || '(no PF code)'}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{o.vendor} · {o.products.length} items · {o.takeable} free</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* This row's movements */}
        {moves.length > 0 && (
          <div style={{ padding: '7px 18px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc', maxHeight: 110, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginRight: 4 }}>This row:</span>
              {moves.map(u => (
                <span key={u.id} title={new Date(u.createdAt).toLocaleString('en-GB')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 999, background: '#fff', border: '1px solid #e2e8f0', fontSize: 12 }}>
                  <b style={{ color: KIND_COLOR[u.kind] }}>{KIND_LABEL[u.kind]}</b> {u.itemCode} × {u.quantity}
                  <span style={{ color: '#94a3b8' }}>{u.stockCode}{u.takenBy ? ` · ${u.takenBy}` : ''}</span>
                  <button title="Undo" onClick={() => undo(u)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', padding: 0, fontSize: 14 }}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 2. Products of the chosen PF */}
        <div style={{ padding: '8px 18px 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>2 · What does this row use from {currentPf ? <span style={{ fontFamily: 'monospace' }}>{currentPf.pfCode}</span> : 'the PF'}?</div>
          <div style={{ flex: 1 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter items…" style={{ width: 200, padding: '5px 9px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12 }} />
        </div>
        <div style={{ flex: 1, overflow: 'auto', margin: '0 18px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
          {!currentPf ? null : rows.length === 0 ? <div style={{ padding: 18, color: '#6b7280', fontSize: 13 }}>No items.</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Item Code', 'Description', 'Dimensions', 'Ordered', 'Received', 'On Hand', 'Reserved', 'Available', 'Status', 'This row\ntaken / res.', 'TAKE', 'RESERVE', 'RETURN'].map(h => (
                    <th key={h} style={{ ...th, ...(['TAKE', 'RESERVE', 'RETURN'].includes(h) ? { background: '#0f766e' } : {}) }}>{h.split('\n').map((l, i) => <div key={i}>{l}</div>)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(p => {
                  const st = STOCK_STATUS_STYLE[p.status];
                  const e = entries[p.id] || EMPTY;
                  const my = mine[p.id];
                  const problem = problemFor(p);
                  return (
                    <tr key={p.id} style={{ background: problem ? '#fef2f2' : undefined }}>
                      <td style={{ ...td, fontWeight: 700, color: '#15803d', whiteSpace: 'nowrap' }}>{p.itemCode}</td>
                      <td style={{ ...td, textAlign: 'left', color: '#15803d', maxWidth: 280 }}>{p.description}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{p.dimensions || '—'}</td>
                      <td style={td}>{p.ordered}</td>
                      <td style={td}>{dash(p.received)}</td>
                      <td style={td}>{dash(p.onHand)}</td>
                      <td style={td}>{p.reserved}</td>
                      <td style={{ ...td, fontWeight: 700 }}>{p.available == null ? <span title="Not received in the warehouse yet — ordered quantity is the limit">({p.takeable})</span> : p.available}</td>
                      <td style={td}><span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: 4, background: st.bg, color: st.fg, fontSize: 10, fontWeight: 700 }}>{st.label}</span></td>
                      <td style={{ ...td, color: '#475569' }}>{my ? `${my.taken} / ${my.reserved}` : '—'}</td>
                      <td style={td}><input style={inp} value={e.take} onChange={ev => setEntry(p.id, { take: ev.target.value })} inputMode="decimal" /></td>
                      <td style={td}><input style={inp} value={e.reserve} onChange={ev => setEntry(p.id, { reserve: ev.target.value })} inputMode="decimal" /></td>
                      <td style={td}>
                        <input style={{ ...inp, opacity: my?.taken ? 1 : 0.4 }} disabled={!my?.taken} value={e.ret} onChange={ev => setEntry(p.id, { ret: ev.target.value })} inputMode="decimal" />
                        {problem && <div style={{ color: '#dc2626', fontSize: 10.5, marginTop: 2, whiteSpace: 'nowrap' }}>{problem}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 3. Who + save */}
        <div style={{ padding: '10px 18px', borderTop: '1px solid #e5e7eb', marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>3 · Taken by</span>
          <input
            list="trust-stock-people"
            value={takenBy}
            onChange={e => setTakenBy(e.target.value)}
            placeholder="Name (pick or type a new one)"
            style={{ width: 230, padding: '7px 9px', border: `1px solid ${pending.length && !takenBy.trim() ? '#f59e0b' : '#d1d5db'}`, borderRadius: 6, fontSize: 13 }}
          />
          <datalist id="trust-stock-people">{people.map(p => <option key={p} value={p} />)}</datalist>
          <span style={{ fontSize: 11.5, color: '#64748b' }}>
            {pending.length ? `${pending.length} item(s) from ${Object.keys(pendingByPf).length} PF(s) ready to save` : 'Available in ( ) = not received in the warehouse yet; ordered quantity is the limit.'}
          </span>
          <div style={{ flex: 1 }} />
          {error && <span style={{ color: '#dc2626', fontSize: 13 }}>{error}</span>}
          <button onClick={onClose} disabled={saving} style={{ padding: '8px 14px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 6, cursor: 'pointer' }}>Close</button>
          <button onClick={save} disabled={!canSave} title={pending.length && !takenBy.trim() ? 'Enter who is taking the stock' : undefined}
            style={{ padding: '8px 18px', border: 'none', borderRadius: 6, background: '#0f766e', color: '#fff', fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed', opacity: canSave ? 1 : 0.5 }}>
            {saving ? 'Saving…' : `Save${pending.length ? ` (${pending.length})` : ''}`}
          </button>
        </div>
      </div>

      {overviewOpen && (
        <div onMouseDown={e => e.stopPropagation()}>
          <TrustStockContentsModal readOnly onClose={() => setOverviewOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default StockUsageModal;
