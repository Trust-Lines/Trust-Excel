import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getAvailableStockProducts, getRowStockUsage, addStockUsage, removeStockUsage,
  StockProduct, RowStockUsage,
} from '../lib/trust-stock';
import { useSocketEvent } from '../hooks/useSocketEvent';

/**
 * "Use from Trust Stock" for one Projects-table row whose vendor is TR-STOCK:
 * shows the stock already taken for this row and lets the user take more
 * (product + quantity). Quantities can't exceed what's left in stock.
 */
const money = (v: number | null, currency: string) =>
  v == null ? '-' : `${currency === 'TL' ? '₺' : currency === 'EUR' ? '€' : '$'}${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const StockUsageModal: React.FC<{ projectItemId: string; rowLabel: string; onClose: () => void }> = ({ projectItemId, rowLabel, onClose }) => {
  const [usages, setUsages] = useState<RowStockUsage[]>([]);
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<StockProduct | null>(null);
  const [qty, setQty] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [u, p] = await Promise.all([getRowStockUsage(projectItemId), getAvailableStockProducts()]);
      setUsages(u);
      setProducts(p);
      setPicked(prev => (prev ? p.find(x => x.id === prev.id) || null : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [projectItemId]);

  useEffect(() => { load(); }, [load]);
  useSocketEvent('trust-stock:usage-changed', load);

  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter(p => p.remaining > 0)
      .filter(p => !q || [p.itemCode, p.description, p.stockItem.pfCode, p.stockItem.group.code, p.stockItem.vendor?.name]
        .some(v => (v || '').toLowerCase().includes(q)));
  }, [products, search]);

  const add = async () => {
    if (!picked) return;
    const n = parseFloat(qty);
    if (!(n > 0)) { setError('Enter a quantity'); return; }
    if (n > picked.remaining) { setError(`Only ${picked.remaining} left of ${picked.itemCode}`); return; }
    setSaving(true);
    setError(null);
    try {
      await addStockUsage(projectItemId, picked.id, n);
      setQty('');
      setPicked(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to use stock');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Put this quantity back into stock?')) return;
    try { await removeStockUsage(id); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
  };

  const th: React.CSSProperties = { padding: '6px 8px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '6px 8px', fontSize: 13, borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' };

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, width: 820, maxWidth: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,.25)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Use from Trust Stock</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{rowLabel}</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>

        <div style={{ padding: '14px 20px', overflowY: 'auto' }}>
          {loading ? <div style={{ color: '#6b7280' }}>Loading…</div> : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Taken for this row</div>
              {usages.length === 0 ? (
                <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>Nothing yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                  <thead><tr>{['Stock', 'Stock PF', 'Item', 'Qty', 'Unit price', 'Value', ''].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {usages.map(u => (
                      <tr key={u.id}>
                        <td style={td}>{u.stockCode}</td>
                        <td style={{ ...td, fontFamily: 'monospace' }}>{u.stockPfCode || '-'}</td>
                        <td style={td}><b>{u.itemCode}</b><div style={{ color: '#6b7280', fontSize: 12 }}>{u.description}</div></td>
                        <td style={td}>{u.quantity}</td>
                        <td style={td}>{money(u.unitPrice, u.currency)}</td>
                        <td style={td}>{money(u.unitPrice != null ? u.unitPrice * u.quantity : null, u.currency)}</td>
                        <td style={td}><button onClick={() => remove(u.id)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12 }}>Return</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Take from stock</div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search item code, description, stock PF, vendor…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, marginBottom: 8 }}
              />
              <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                {available.length === 0 ? (
                  <div style={{ padding: 12, fontSize: 13, color: '#9ca3af' }}>{products.length ? 'No matching item with stock left.' : 'Trust Stock is empty.'}</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['Item', 'Stock / PF', 'Vendor', 'Left', 'Unit price'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {available.map(p => {
                        const active = picked?.id === p.id;
                        return (
                          <tr key={p.id} onClick={() => { setPicked(p); setError(null); }} style={{ cursor: 'pointer', background: active ? '#ecfdf5' : undefined }}>
                            <td style={td}><b>{p.itemCode}</b><div style={{ color: '#6b7280', fontSize: 12 }}>{p.description}</div></td>
                            <td style={td}>{p.stockItem.group.code}<div style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{p.stockItem.pfCode}</div></td>
                            <td style={td}>{p.stockItem.vendor?.code || '-'}</td>
                            <td style={{ ...td, fontWeight: 700 }}>{p.remaining} <span style={{ color: '#9ca3af', fontWeight: 400 }}>/ {p.quantity}</span></td>
                            <td style={td}>{money(p.unitPrice, p.currency)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 13, flex: 1, color: picked ? '#111827' : '#9ca3af' }}>
                  {picked ? <>Selected: <b>{picked.itemCode}</b> ({picked.remaining} left)</> : 'Pick an item above'}
                </span>
                <input
                  type="number"
                  min={0}
                  max={picked?.remaining}
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') add(); }}
                  placeholder="Qty"
                  disabled={!picked}
                  style={{ width: 90, padding: '7px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                />
                <button
                  onClick={add}
                  disabled={!picked || !qty || saving}
                  style={{ padding: '8px 16px', border: 'none', borderRadius: 6, background: '#0f766e', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: !picked || !qty || saving ? 0.5 : 1 }}
                >
                  {saving ? 'Saving…' : 'Use'}
                </button>
              </div>
            </>
          )}
          {error && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default StockUsageModal;
