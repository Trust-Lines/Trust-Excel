import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { getStockProducts, openTrustStockPdf, StockProduct } from '../lib/trust-stock';
import { useSocketEvent } from '../hooks/useSocketEvent';

/**
 * What's in Trust Stock: every product from every imported PF, with how many
 * were bought, used (and by which project row), and what's left.
 */
const fmtMoney = (v: number | null, currency: string) =>
  v == null ? '-' : `${currency === 'TL' ? '₺' : currency === 'EUR' ? '€' : '$'}${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('en-GB') : '-');

type Filter = 'all' | 'left' | 'used' | 'empty';

const TrustStockContentsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try { setProducts(await getStockProducts()); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useSocketEvent('trust-stock:usage-changed', load);
  useSocketEvent('trust-stock:item-created', load);
  useSocketEvent('trust-stock:item-deleted', load);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      if (filter === 'left' && p.remaining <= 0) return false;
      if (filter === 'used' && p.used <= 0) return false;
      if (filter === 'empty' && p.remaining > 0) return false;
      if (!q) return true;
      return [p.itemCode, p.description, p.category, p.stockItem.pfCode, p.stockItem.group.code, p.stockItem.vendor?.code, p.stockItem.vendor?.name,
        ...p.usages.map(u => u.projectNo)].some(v => (v || '').toLowerCase().includes(q));
    });
  }, [products, search, filter]);

  // Group by stock PF (one header per PF row)
  const byPf = useMemo(() => {
    const groups: { key: string; head: StockProduct['stockItem']; items: StockProduct[] }[] = [];
    for (const p of visible) {
      let g = groups.find(x => x.key === p.stockItem.id);
      if (!g) { g = { key: p.stockItem.id, head: p.stockItem, items: [] }; groups.push(g); }
      g.items.push(p);
    }
    return groups.sort((a, b) => a.head.group.code.localeCompare(b.head.group.code, undefined, { numeric: true }) || (a.head.pfCode || '').localeCompare(b.head.pfCode || ''));
  }, [visible]);

  const totals = useMemo(() => ({
    bought: products.reduce((s, p) => s + p.quantity, 0),
    used: products.reduce((s, p) => s + p.used, 0),
    left: products.reduce((s, p) => s + p.remaining, 0),
  }), [products]);

  const toggle = (id: string) => setOpen(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const showPdf = (itemId: string) => openTrustStockPdf(itemId).catch(e => alert(e.message));

  const th: React.CSSProperties = { padding: '7px 8px', fontSize: 11, color: '#4b5563', textAlign: 'left', fontWeight: 600, background: '#f3f4f6', position: 'sticky', top: 0, zIndex: 1 };
  const td: React.CSSProperties = { padding: '7px 8px', fontSize: 13, borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' };
  const chip = (f: Filter, text: string) => (
    <button key={f} onClick={() => setFilter(f)} style={{
      padding: '5px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
      border: filter === f ? '2px solid #0f766e' : '1px solid #d1d5db', background: filter === f ? '#0f766e' : '#fff', color: filter === f ? '#fff' : '#374151', fontWeight: filter === f ? 700 : 500,
    }}>{text}</button>
  );

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, width: 1300, maxWidth: '100%', height: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,.25)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Stock Contents</div>
          <div style={{ display: 'flex', gap: 14, fontSize: 13, color: '#374151' }}>
            <span>Bought <b>{totals.bought}</b></span>
            <span>Used <b style={{ color: '#b45309' }}>{totals.used}</b></span>
            <span>Left <b style={{ color: '#047857' }}>{totals.left}</b></span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {chip('all', 'All')}{chip('left', 'In stock')}{chip('used', 'Used')}{chip('empty', 'Used up')}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Item, PF, stock, vendor, project…"
            style={{ width: 240, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading && <div style={{ padding: 30, color: '#6b7280' }}>Loading…</div>}
          {error && <div style={{ padding: 30, color: '#dc2626' }}>{error}</div>}
          {!loading && !error && products.length === 0 && (
            <div style={{ padding: 30, color: '#6b7280' }}>No products yet — upload a PF PDF to fill the stock.</div>
          )}
          {!loading && byPf.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Item code', 'Description', 'Bought', 'Used', 'Left', 'Unit price', 'Total', 'Used by'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {byPf.map(g => (
                  <React.Fragment key={g.key}>
                    <tr>
                      <td colSpan={8} style={{ padding: '8px 10px', background: '#0f766e', color: '#fff', fontSize: 13 }}>
                        <b>{g.head.group.code}</b>
                        <span style={{ margin: '0 10px', fontFamily: 'monospace' }}>{g.head.pfCode || '(no PF code)'}</span>
                        {g.head.vendor && <span>{g.head.vendor.code} - {g.head.vendor.name}</span>}
                        {g.head.type && <span style={{ marginLeft: 10, opacity: 0.85 }}>{g.head.type}</span>}
                        <span style={{ marginLeft: 10, opacity: 0.85 }}>{fmtDate(g.head.pfDate)}</span>
                        {g.head.orderNo && <span style={{ marginLeft: 10, opacity: 0.85 }}>Order {g.head.orderNo}</span>}
                        {g.head.hasPdf && (
                          <button onClick={() => showPdf(g.head.id)} style={{ marginLeft: 12, padding: '2px 10px', borderRadius: 4, border: '1px solid rgba(255,255,255,.6)', background: 'transparent', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
                            View PDF
                          </button>
                        )}
                      </td>
                    </tr>
                    {g.items.map(p => {
                      const isOpen = open.has(p.id);
                      return (
                        <React.Fragment key={p.id}>
                          <tr>
                            <td style={{ ...td, fontWeight: 700, whiteSpace: 'nowrap' }}>{p.itemCode}</td>
                            <td style={td}>{p.description}{p.category && <div style={{ fontSize: 11, color: '#9ca3af' }}>{p.category}</div>}</td>
                            <td style={td}>{p.quantity}</td>
                            <td style={{ ...td, color: p.used ? '#b45309' : '#9ca3af', fontWeight: 600 }}>{p.used}</td>
                            <td style={{ ...td, fontWeight: 700, color: p.remaining > 0 ? '#047857' : '#dc2626' }}>{p.remaining}</td>
                            <td style={td}>{fmtMoney(p.unitPrice, p.currency)}</td>
                            <td style={td}>{fmtMoney(p.totalPrice, p.currency)}</td>
                            <td style={td}>
                              {p.usages.length === 0 ? <span style={{ color: '#9ca3af' }}>—</span> : (
                                <button onClick={() => toggle(p.id)} style={{ border: 'none', background: 'none', color: '#0f766e', cursor: 'pointer', fontSize: 13, padding: 0 }}>
                                  {isOpen ? '▾' : '▸'} {new Set(p.usages.map(u => u.projectNo)).size} project(s)
                                </button>
                              )}
                            </td>
                          </tr>
                          {isOpen && p.usages.map(u => (
                            <tr key={u.id} style={{ background: '#f8fafc' }}>
                              <td style={td} />
                              <td style={{ ...td, color: '#374151' }} colSpan={2}>
                                Project <b>{u.projectNo}</b> {u.projectName && <span style={{ color: '#6b7280' }}>· {u.projectName}</span>}
                                {u.rowDeleted && <span style={{ color: '#dc2626', marginLeft: 6 }}>(row deleted)</span>}
                              </td>
                              <td style={{ ...td, color: '#b45309', fontWeight: 600 }}>{u.quantity}</td>
                              <td style={td} />
                              <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }} colSpan={2}>{u.projectPfCode || '-'}</td>
                              <td style={{ ...td, color: '#6b7280' }}>{fmtDate(u.createdAt)}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrustStockContentsModal;
