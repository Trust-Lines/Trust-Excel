import React, { useEffect, useState } from 'react';
import { previewTrustStockPdf, importTrustStockPdf, getStockCatalog, PfPdfPreview, ParsedStockProduct, StockCatalogItem } from '../lib/trust-stock';
import { getVendors, Vendor } from '../lib/projects';

/**
 * Upload a PF PDF → the server reads it (no AI, rule based) → the values are shown
 * here to check/correct → Save creates the stock group (if new), the PF row with
 * its total, the product lines, and keeps the PDF.
 */
const TYPES = ['MILLWORK', 'SHELVING', 'CEILING', 'IMAGE', 'FURNITURE', 'DECORATION'];

const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 };
const label: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 3 };
const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));

const TrustStockPdfImportModal: React.FC<{ onClose: () => void; onImported: () => void }> = ({ onClose, onImported }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PfPdfPreview | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [busy, setBusy] = useState<'reading' | 'saving' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable copy of the parsed values
  const [stockCode, setStockCode] = useState('');
  const [pfCode, setPfCode] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [type, setType] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [pfDate, setPfDate] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'TL' | 'EUR'>('USD');
  const [paymentRule, setPaymentRule] = useState('');
  const [products, setProducts] = useState<ParsedStockProduct[]>([]);

  useEffect(() => { getVendors().then(setVendors).catch(() => {}); }, []);

  // Every product entered before — typing an item code offers them; picking one fills the line
  const [catalog, setCatalog] = useState<StockCatalogItem[]>([]);
  useEffect(() => { getStockCatalog().then(setCatalog).catch(() => {}); }, []);
  const catalogText = (c: StockCatalogItem) => (c.dimensions ? `${c.description} (${c.dimensions})` : c.description);
  const setItemCode = (i: number, code: string) => {
    const hit = catalog.find(c => c.itemCode.toUpperCase() === code.trim().toUpperCase());
    setProducts(prev => prev.map((p, k) => {
      if (k !== i) return p;
      const next = { ...p, itemCode: code };
      if (!hit) return next;
      // Fill what's empty (or still the text a previous pick put there)
      const prevHit = catalog.find(c => c.itemCode.toUpperCase() === p.itemCode.trim().toUpperCase());
      if (!p.description.trim() || (prevHit && p.description === catalogText(prevHit))) next.description = catalogText(hit);
      if (!p.category) next.category = hit.category;
      if (p.unitPrice == null && hit.unitPrice != null) {
        next.unitPrice = hit.unitPrice;
        next.totalPrice = +(hit.unitPrice * (p.quantity || 0)).toFixed(2);
      }
      return next;
    }));
  };

  const read = async (f: File) => {
    setFile(f);
    setBusy('reading');
    setError(null);
    try {
      const p = await previewTrustStockPdf(f);
      setPreview(p);
      setStockCode(p.stockCode || '');
      setPfCode(p.pfCode || '');
      setVendorId(p.vendor?.id || '');
      setType(p.type || '');
      setPfDate(p.pfDate || '');
      setCurrency(p.currency);
      setPaymentRule(p.paymentRule || '');
      setProducts(p.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read the PDF');
    } finally {
      setBusy(null);
    }
  };

  const setProduct = (i: number, patch: Partial<ParsedStockProduct>) =>
    setProducts(prev => prev.map((p, k) => {
      if (k !== i) return p;
      const next = { ...p, ...patch };
      // keep line total in step when qty or unit price is edited
      if (('quantity' in patch || 'unitPrice' in patch) && next.unitPrice != null) next.totalPrice = +(next.unitPrice * next.quantity).toFixed(2);
      return next;
    }));

  const total = products.reduce((s, p) => s + (p.totalPrice ?? 0), 0);
  const sym = currency === 'TL' ? '₺' : currency === 'EUR' ? '€' : '$';
  const missing = !stockCode.trim() || !pfCode.trim() || products.length === 0 || products.some(p => !p.itemCode.trim());

  const save = async () => {
    if (!file || missing) return;
    setBusy('saving');
    setError(null);
    try {
      await importTrustStockPdf(file, {
        stockCode: stockCode.trim(),
        pfCode: pfCode.trim(),
        vendorId: vendorId || null,
        type: type || null,
        orderNo: orderNo.trim() || null,
        pfDate: pfDate || null,
        currency,
        totalPrice: total || null,
        paymentRule: paymentRule.trim() || null,
        products,
      });
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
      setBusy(null);
    }
  };

  return (
    <div onMouseDown={() => !busy && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, width: 1000, maxWidth: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,.25)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Upload PF PDF</div>
          <button onClick={onClose} disabled={!!busy} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: '2px dashed #cbd5e1', borderRadius: 8, cursor: 'pointer', background: '#f8fafc' }}>
            <input type="file" accept="application/pdf,.pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) read(f); e.target.value = ''; }} />
            <span style={{ padding: '6px 12px', background: '#0f766e', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>Choose PDF</span>
            <span style={{ fontSize: 13, color: '#475569' }}>{busy === 'reading' ? 'Reading…' : file ? file.name : 'Estimated Production Form + vendor quote (max 4 MB)'}</span>
          </label>

          {preview && (
            <>
              {preview.warnings.length > 0 && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, fontSize: 13, color: '#92400e' }}>
                  {preview.warnings.map((w, i) => <div key={i}>• {w}</div>)}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
                <div>
                  <span style={label}>Stock code {preview.groupStatus === 'new' ? '(new)' : preview.groupStatus === 'exists' ? '(adds to existing)' : ''}</span>
                  <input style={input} value={stockCode} onChange={e => setStockCode(e.target.value)} />
                </div>
                <div>
                  <span style={label}>PF code (order no on the form)</span>
                  <input style={{ ...input, fontFamily: 'monospace' }} value={pfCode} onChange={e => setPfCode(e.target.value)} />
                </div>
                <div>
                  <span style={label}>Vendor {preview.supplierName ? `(PDF: ${preview.supplierName})` : ''}</span>
                  <select style={input} value={vendorId} onChange={e => setVendorId(e.target.value)}>
                    <option value="">— not set —</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.code} - {v.name}</option>)}
                  </select>
                </div>
                <div>
                  <span style={label}>Type</span>
                  <select style={input} value={type} onChange={e => setType(e.target.value)}>
                    <option value="">—</option>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <span style={label}>PF date</span>
                  <input type="date" style={input} value={pfDate} onChange={e => setPfDate(e.target.value)} />
                </div>
                <div>
                  <span style={label}>Order no (optional)</span>
                  <input style={input} value={orderNo} onChange={e => setOrderNo(e.target.value)} placeholder="your PO / invoice no" />
                </div>
                <div>
                  <span style={label}>Currency</span>
                  <select style={input} value={currency} onChange={e => setCurrency(e.target.value as any)}>
                    <option>USD</option><option>TL</option><option>EUR</option>
                  </select>
                </div>
                <div>
                  <span style={label}>Payment rule (advance %)</span>
                  <input style={input} value={paymentRule} onChange={e => setPaymentRule(e.target.value)} />
                </div>
              </div>

              <datalist id="trust-stock-catalog">
                {catalog.map(c => <option key={c.itemCode} value={c.itemCode}>{catalogText(c)}{c.unitPrice != null ? ` · ${c.unitPrice}` : ''}</option>)}
              </datalist>
              <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700 }}>Products in this PF</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6 }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    {['Item code', 'Description', 'Qty', `Unit ${sym}`, `Total ${sym}`, ''].map(h => (
                      <th key={h} style={{ padding: '6px 8px', fontSize: 11, color: '#4b5563', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: 4, width: 120 }}><input style={input} list="trust-stock-catalog" placeholder="Type to search…" value={p.itemCode} onChange={e => setItemCode(i, e.target.value)} /></td>
                      <td style={{ padding: 4 }}>
                        <textarea style={{ ...input, minHeight: 38, resize: 'vertical' }} value={p.description} onChange={e => setProduct(i, { description: e.target.value })} />
                        {p.category && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{p.category}</div>}
                      </td>
                      <td style={{ padding: 4, width: 80 }}><input style={input} value={p.quantity} onChange={e => setProduct(i, { quantity: num(e.target.value) ?? 0 })} /></td>
                      <td style={{ padding: 4, width: 110 }}><input style={input} value={p.unitPrice ?? ''} onChange={e => setProduct(i, { unitPrice: num(e.target.value) })} /></td>
                      <td style={{ padding: 4, width: 120 }}><input style={input} value={p.totalPrice ?? ''} onChange={e => setProduct(i, { totalPrice: num(e.target.value) })} /></td>
                      <td style={{ padding: 4, width: 30 }}>
                        <button title="Remove line" onClick={() => setProducts(prev => prev.filter((_, k) => k !== i))} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} style={{ padding: 6 }}>
                      <button onClick={() => setProducts(prev => [...prev, { itemCode: '', description: '', category: null, quantity: 0, unitPrice: null, totalPrice: null }])}
                        style={{ border: '1px dashed #9ca3af', background: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>+ Add line</button>
                    </td>
                    <td style={{ padding: 6, fontWeight: 700 }}>{products.reduce((s, p) => s + (p.quantity || 0), 0)}</td>
                    <td />
                    <td style={{ padding: 6, fontWeight: 700 }}>{sym}{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </>
          )}

          {error && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 10 }}>{error}</div>}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} disabled={!!busy} style={{ padding: '8px 14px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={save}
            disabled={!preview || missing || !!busy || !!preview?.duplicateOf}
            title={preview?.duplicateOf ? `Already imported in ${preview.duplicateOf.groupCode}` : undefined}
            style={{ padding: '8px 18px', border: 'none', background: '#0f766e', color: '#fff', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: !preview || missing || busy || preview?.duplicateOf ? 0.5 : 1 }}
          >
            {busy === 'saving' ? 'Saving…' : 'Save to Trust Stock'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrustStockPdfImportModal;
