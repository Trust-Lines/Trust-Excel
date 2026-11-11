# Trust System — "Upload PF PDF" source (for T-ERP)

Generated 2026-11-11 from the Trust-Lines/Trust-Excel repo.
Reference only: T-ERP calls these endpoints through its /api/trust proxy and builds its own screen
with its design system (see PROMPT.md). The server files are here for the final backend move.

## Index

| File | What | Line in this document |
|---|---|---|
| `components/TrustStockPdfImportModal.tsx` | The upload / check / save screen (Trust System version, inline styles) | 20 |
| `lib/trust-stock.ts` | API helpers: previewTrustStockPdf, importTrustStockPdf, getStockCatalog and the types | 274 |
| `server/src/trust-stock/trust-stock.controller.ts` | Endpoints: POST pdf/preview, POST pdf/import (multipart), GET catalog | 696 |
| `server/src/trust-stock/dto/trust-stock-pdf.dto.ts` | ImportPfDto: the exact fields import accepts | 892 |
| `server/src/trust-stock/trust-stock.service.ts` | previewPdf (vendor match, duplicate check), importPdf (group, PF row, products, stored PDF) | 974 |
| `server/src/trust-stock/pf-pdf-parser.ts` | The PDF reader (rule based, no AI): codes, vendor, date, type, products, layout | 1793 |

---

## FILE: components/TrustStockPdfImportModal.tsx

```tsx
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
```

---

## FILE: lib/trust-stock.ts

```ts
import { apiFetch, getToken } from './auth';
import type { Project } from '../types';
import type { BackendProjectItem } from './projects';
import { mapBackendTypeToFrontend, mapSignStatusToFrontend } from './projects';

/* ============================================================================
 * Trust Stock — purchases Trust makes for its own stock (Trust Stock company).
 * Groups ("STOCK 1", "STOCK 2" …) play the role of projects; items mirror
 * project items so the shared ProjectBlock table can render/edit them.
 * ========================================================================== */

const API_BASE = '/api/trust-stock';

export interface TrustStockItem {
  id: string;
  groupId: string;
  type: string | null;
  customTypeId: string | null;
  customType?: { id: string; name: string; code: string; description?: string | null } | null;
  vendorId: string | null;
  vendor?: { id: string; code: string; name: string } | null;
  pfCode: string | null;
  orderNo: string | null;
  orderType: string | null;
  pfSignStatus: string;
  poSignStatus: string;
  status: string | null;
  std: string | null;
  etd: string | null;
  rtr: string | null;
  rtd: string | null;
  rdy: string | null;
  ftd: string | null;
  snd: string | null;
  pfUsd: string | number | null;
  pfTl: string | number | null;
  invoice: string | number | null;
  invoiceTl: string | number | null;
  paidUsd1: string | number | null;
  paidUsd2: string | number | null;
  paidTl1: string | number | null;
  paidTl2: string | number | null;
  paidUsd1Date: string | null;
  paidUsd2Date: string | null;
  paidTl1Date: string | null;
  paidTl2Date: string | null;
  paymentRule: string | null;
  statusNote: string | null;
  priceNotes: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrustStockGroup {
  id: string;
  code: string;
  name: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: TrustStockItem[];
}

async function json<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || fallback);
  }
  return res.json();
}

export async function getTrustStockGroups(): Promise<TrustStockGroup[]> {
  const data = await json<{ data: TrustStockGroup[] }>(await apiFetch(`${API_BASE}/groups`), 'Failed to load Trust Stock');
  return data.data;
}

/** Leave `code` empty to get the next "STOCK n". */
export async function createTrustStockGroup(data: { code?: string; name?: string }): Promise<TrustStockGroup> {
  return json(await apiFetch(`${API_BASE}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }), 'Failed to create stock group');
}

export async function deleteTrustStockGroup(groupId: string): Promise<void> {
  await json(await apiFetch(`${API_BASE}/groups/${groupId}`, { method: 'DELETE' }), 'Failed to delete stock group');
}

export async function createTrustStockItem(groupId: string, data: Record<string, any>): Promise<BackendProjectItem> {
  const item = await json<TrustStockItem>(await apiFetch(`${API_BASE}/groups/${groupId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }), 'Failed to create stock item');
  return mapTrustStockItemToBackendItem(item);
}

export async function updateTrustStockItem(itemId: string, data: Record<string, any>): Promise<BackendProjectItem> {
  const item = await json<TrustStockItem>(await apiFetch(`${API_BASE}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }), 'Failed to update stock item');
  return mapTrustStockItemToBackendItem(item);
}

export async function deleteTrustStockItem(itemId: string): Promise<void> {
  await json(await apiFetch(`${API_BASE}/items/${itemId}`, { method: 'DELETE' }), 'Failed to delete stock item');
}

/** Stock item → the BackendProjectItem shape ProjectBlock / AccountingGrid work with. */
export function mapTrustStockItemToBackendItem(item: TrustStockItem): BackendProjectItem {
  return {
    ...(item as any),
    projectId: item.groupId,
    vendor: item.vendor ? { id: item.vendor.id, code: item.vendor.code, name: item.vendor.name } : undefined,
    containerNo: null,
    containerDate: null,
    duePaid: false,
  } as BackendProjectItem;
}

/** Stock group → the Project shape ProjectBlock renders ("STOCK 1" in the project-number column). */
export function mapTrustStockGroupToProject(group: TrustStockGroup): Project {
  const items = group.items || [];
  return {
    projectId: group.id,
    projectNumber: group.code,
    projectNumberColor: 'green',
    projectName: group.name || group.code,
    address: '',
    isUrgent: false,
    region: 'TRUST_STOCK',
    poSignStatusByType: {},
    rows: items.map(item => ({
      type: mapBackendTypeToFrontend(item.type as any, item.customType as any),
      pfCode: item.pfCode || '',
      vendor: item.vendor ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name) : '',
      vendorId: item.vendorId || '',
      orderType: item.orderType || '',
      pfSignStatus: mapSignStatusToFrontend(item.pfSignStatus as any),
      poSignStatus: mapSignStatusToFrontend(item.poSignStatus as any),
      status: (item.status || '').replace(/_/g, ' '),
      statusNote: item.statusNote || '',
      std: item.std || '',
      etd: item.etd || '',
      rtd: item.rtd || '',
      rtr: item.rtr || '',
      rdy: item.rdy || '',
      ftd: item.ftd || '',
      snd: item.snd || '',
      pfUsd: item.pfUsd != null ? String(item.pfUsd) : '',
      pfTl: item.pfTl != null ? String(item.pfTl) : '',
      paymentRule: item.paymentRule || '',
      containerNo: '',
      containerDate: '',
      customTypeId: item.customTypeId || null,
      itemId: item.id,
    })) as any,
    backendItems: items.map(mapTrustStockItemToBackendItem),
  } as Project;
}

/* ── PF PDF import ─────────────────────────────────────────────────────────── */

export interface ParsedStockProduct {
  itemCode: string;
  description: string;
  category: string | null;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
}

export interface PfPdfPreview {
  stockCode: string | null;
  pfCode: string | null;
  supplierName: string | null;
  vendor: { id: string; code: string; name: string } | null;
  pfDate: string | null;
  type: string | null;
  currency: 'USD' | 'TL' | 'EUR';
  totalPrice: number | null;
  paymentRule: string | null;
  products: ParsedStockProduct[];
  warnings: string[];
  groupStatus: 'new' | 'exists' | 'in-trash';
  duplicateOf: { itemId: string; groupCode: string } | null;
  /** Where each product row sits in the PDF (points, origin bottom-left; page 0-based). Not sent back on import. */
  layout?: { itemCode: string; page: number; x0: number; x1: number; y0: number; y1: number }[];
}

export interface PfImportData {
  stockCode: string;
  pfCode: string;
  vendorId: string | null;
  type: string | null;
  orderNo?: string | null;
  pfDate: string | null;
  currency: 'USD' | 'TL' | 'EUR';
  totalPrice: number | null;
  paymentRule: string | null;
  products: ParsedStockProduct[];
}

// Multipart uploads can't go through apiFetch (it forces a JSON content type)
async function uploadForm(path: string, form: FormData) {
  const token = getToken();
  const base = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');
  const url = base ? `${base}${path.replace(/^\/api/, '')}` : path;
  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
    credentials: 'include',
  });
  return json<any>(res, 'Upload failed');
}

export async function previewTrustStockPdf(file: File): Promise<PfPdfPreview> {
  const form = new FormData();
  form.append('file', file);
  return uploadForm(`${API_BASE}/pdf/preview`, form);
}

export async function importTrustStockPdf(file: File, data: PfImportData): Promise<TrustStockItem> {
  const form = new FormData();
  form.append('file', file);
  form.append('data', JSON.stringify(data));
  return uploadForm(`${API_BASE}/pdf/import`, form);
}

/** Opens the stored PF PDF in a new tab. */
export async function openTrustStockPdf(itemId: string): Promise<void> {
  const win = window.open('', '_blank'); // open synchronously so popup blockers allow it
  const res = await apiFetch(`${API_BASE}/items/${itemId}/pdf`);
  if (!res.ok) {
    win?.close();
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'PDF not available');
  }
  const url = URL.createObjectURL(await res.blob());
  if (win) win.location.href = url; else window.open(url, '_blank');
}

/** Builds the re-order PF (everything with an Order quantity) and downloads it. */
/** Production form for the picked products and quantities (RE-ORDER tab); addToStock also records it as a new stock order */
export async function downloadReorderPf(lines: { productId: string; quantity: number }[], addToStock = false): Promise<void> {
  const res = await apiFetch(`${API_BASE}/reorder-pf`, { method: 'POST', body: JSON.stringify({ lines, addToStock }) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Could not create the re-order PF');
  }
  const name = decodeURIComponent(/filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || 'REORDER-PF.pdf');
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/* ── Stock contents & usage ────────────────────────────────────────────────── */

export type StockMoveKind = 'TAKEN' | 'RETURNED' | 'RESERVED';
export type StockStatus = 'PENDING_VERIFICATION' | 'OUT_OF_STOCK' | 'REORDER_NOW' | 'WATCH' | 'HEALTHY';

export interface StockProductUsage {
  id: string;
  kind: StockMoveKind;
  quantity: number;
  note: string | null;
  takenBy: string | null;
  createdAt: string;
  projectItemId: string;
  projectNo: string;
  projectName: string;
  projectPfCode: string | null;
  rowDeleted: boolean;
}

export interface StockProduct {
  id: string;
  itemCode: string;
  description: string;
  dimensions: string | null;
  category: string | null;
  /** original ordered quantity */
  quantity: number;
  receivedAt: string | null;
  // stock-sheet figures (see TrustStockService.stats)
  ordered: number;
  received: number | null;
  /** target stock level entered by hand; when set, Remaining % and the status use it instead of received */
  target: number | null;
  taken: number;
  returned: number;
  netUsed: number;
  reserved: number;
  onHand: number | null;
  available: number | null;
  remainingPct: number | null;
  /** reorder point in % as entered; null = default 25% */
  reorderPct: number | null;
  reorderThreshold: number | null;
  /** suggested re-order ((target or ordered) − available) once at the reorder point; 0 otherwise */
  reorderQty: number;
  status: StockStatus;
  /** what can still be taken/reserved (ordered qty is the cap until the receipt is confirmed) */
  takeable: number;
  unitPrice: number | null;
  totalPrice: number | null;
  currency: string;
  stockItem: {
    id: string;
    pfCode: string | null;
    orderNo: string | null;
    pfDate: string | null;
    type: string | null;
    hasPdf: boolean;
    vendor: { id: string; code: string; name: string } | null;
    group: { id: string; code: string };
  };
  usages: StockProductUsage[];
}

export async function getStockProducts(): Promise<StockProduct[]> {
  return json(await apiFetch(`${API_BASE}/products`), 'Failed to load stock contents');
}

/** Same list, readable with Projects access (used by the "Use from Trust Stock" picker). */
export async function getAvailableStockProducts(): Promise<StockProduct[]> {
  return json(await apiFetch(`${API_BASE}/usage/products`), 'Failed to load stock');
}

export async function updateStockProduct(id: string, data: Partial<Pick<StockProduct, 'itemCode' | 'description' | 'dimensions' | 'quantity' | 'unitPrice' | 'totalPrice'>> & { receivedQuantity?: number | null; targetQuantity?: number | null; reorderPct?: number | null }) {
  return json(await apiFetch(`${API_BASE}/products/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }), 'Failed to update product');
}

export async function deleteStockProduct(id: string) {
  return json(await apiFetch(`${API_BASE}/products/${id}`, { method: 'DELETE' }), 'Failed to remove product');
}

export interface RowStockUsage {
  id: string;
  kind: StockMoveKind;
  quantity: number;
  note: string | null;
  takenBy: string | null;
  createdAt: string;
  productId: string;
  itemCode: string;
  description: string;
  unitPrice: number | null;
  currency: string;
  stockPfCode: string | null;
  stockCode: string;
}

export async function getRowStockUsage(projectItemId: string): Promise<RowStockUsage[]> {
  return json(await apiFetch(`${API_BASE}/usage?projectItemId=${encodeURIComponent(projectItemId)}`), 'Failed to load stock usage');
}

export async function addStockUsage(projectItemId: string, productId: string, quantity: number) {
  return json(await apiFetch(`${API_BASE}/usage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectItemId, productId, quantity }),
  }), 'Failed to use stock');
}

export interface StockMovementLine { productId: string; take?: number; reserve?: number; return?: number; note?: string }

/** Take / reserve / return several products for one Projects row in one go. */
export async function applyStockMovements(projectItemId: string, lines: StockMovementLine[], takenBy: string): Promise<RowStockUsage[]> {
  return json(await apiFetch(`${API_BASE}/usage/movements`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectItemId, takenBy, lines }),
  }), 'Failed to save stock movements');
}

export const STOCK_STATUS_STYLE: Record<StockStatus, { label: string; bg: string; fg: string }> = {
  HEALTHY: { label: 'HEALTHY', bg: '#dcfce7', fg: '#166534' },
  WATCH: { label: 'WATCH', bg: '#fef3c7', fg: '#92400e' },
  REORDER_NOW: { label: 'REORDER NOW', bg: '#fee2e2', fg: '#b91c1c' },
  OUT_OF_STOCK: { label: 'OUT OF STOCK', bg: '#7f1d1d', fg: '#ffffff' },
  PENDING_VERIFICATION: { label: 'PENDING VERIFICATION', bg: '#e5e7eb', fg: '#374151' },
};

export async function removeStockUsage(id: string) {
  return json(await apiFetch(`${API_BASE}/usage/${id}`, { method: 'DELETE' }), 'Failed to remove usage');
}

/** The Trust Stock company as a vendor in the Projects table ("TR-STOCK"). */
export function isStockVendorCode(code?: string | null): boolean {
  return !!code && code.toUpperCase().replace(/[^A-Z]/g, '') === 'TRSTOCK';
}

/** Names entered before as "taken by" (for the dropdown). */
export async function getStockPeople(): Promise<string[]> {
  return json(await apiFetch(`${API_BASE}/usage/people`), 'Failed to load names');
}

/** One remembered product (latest entry per item code) for the manual-entry dropdown. */
export interface StockCatalogItem {
  itemCode: string;
  description: string;
  dimensions: string | null;
  category: string | null;
  unitPrice: number | null;
  currency: string;
}

export async function getStockCatalog(): Promise<StockCatalogItem[]> {
  return json(await apiFetch(`${API_BASE}/catalog`), 'Failed to load product catalog');
}
```

---

## FILE: server/src/trust-stock/trust-stock.controller.ts

```ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, Res, UseInterceptors, UploadedFile, BadRequestException, ForbiddenException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';
import { TrustStockService } from './trust-stock.service';
import { CreateTrustStockGroupDto, UpdateTrustStockGroupDto, TrustStockItemDto } from './dto/trust-stock.dto';
import { UpdateStockProductDto, CreateStockUsageDto, StockMovementsDto, ReorderPfDto } from './dto/trust-stock-pdf.dto';
import { TrustStockColumnRules, redactStockItem, redactProductPrices, blockedStockItemFields, hidesProductPrices } from './trust-stock-columns';

// Vercel caps request bodies at 4.5 MB
const PDF_UPLOAD = FileInterceptor('file', { limits: { fileSize: 4 * 1024 * 1024 } });
const requirePdf = (file?: Express.Multer.File) => {
  if (!file) throw new BadRequestException('No PDF uploaded');
  if (!/pdf/i.test(file.mimetype) && !/\.pdf$/i.test(file.originalname)) throw new BadRequestException('Only PDF files are accepted');
  return file;
};

@Controller('trust-stock')
@UseGuards(JwtAuthGuard, PageAccessGuard)
@RequirePageAccess('trust_stock')
export class TrustStockController {
  constructor(private readonly service: TrustStockService) {}

  // Role column rules (Admin > Roles > Trust Stock columns): hidden prices are left out of
  // every response, hidden / read-only columns can't be written, PDFs need the PF PDF column.
  private rules(req: any) {
    return this.service.columnRules(req.user);
  }
  private static group<G extends { items?: any[] }>(g: G, r: TrustStockColumnRules): G {
    return g?.items ? { ...g, items: g.items.map(i => redactStockItem(i, r)) } : g;
  }
  private static checkWrite(dto: Record<string, any>, r: TrustStockColumnRules) {
    const blocked = blockedStockItemFields(dto, r);
    if (blocked.length) throw new ForbiddenException(`Your role can't change: ${blocked.join(', ')}`);
  }
  private static requirePdfAccess(r: TrustStockColumnRules) {
    if (r.hidden.has('pfPdf')) throw new ForbiddenException('Your role has no access to the PF PDFs');
  }

  // ── Groups (STOCK 1, STOCK 2, …) ──
  @Get('groups')
  async findAll(@Request() req: any) {
    const r = await this.rules(req);
    const { data } = await this.service.findAllGroups();
    return { data: data.map(g => TrustStockController.group(g, r)) };
  }

  @Post('groups')
  async createGroup(@Body() dto: CreateTrustStockGroupDto, @Request() req: any) {
    return TrustStockController.group(await this.service.createGroup(dto, req.user?.id), await this.rules(req));
  }

  @Patch('groups/:id')
  async updateGroup(@Param('id') id: string, @Body() dto: UpdateTrustStockGroupDto, @Request() req: any) {
    return TrustStockController.group(await this.service.updateGroup(id, dto, req.user?.id), await this.rules(req));
  }

  @Delete('groups/:id')
  deleteGroup(@Param('id') id: string, @Request() req: any) {
    return this.service.deleteGroup(id, req.user?.id);
  }

  // ── Items ──
  @Post('groups/:groupId/items')
  async createItem(@Param('groupId') groupId: string, @Body() dto: TrustStockItemDto, @Request() req: any) {
    const r = await this.rules(req);
    TrustStockController.checkWrite(dto, r);
    return redactStockItem(await this.service.createItem(groupId, dto, req.user?.id), r);
  }

  @Patch('items/:itemId')
  async updateItem(@Param('itemId') itemId: string, @Body() dto: TrustStockItemDto, @Request() req: any) {
    const r = await this.rules(req);
    TrustStockController.checkWrite(dto, r);
    return redactStockItem(await this.service.updateItem(itemId, dto, req.user?.id), r);
  }

  @Delete('items/:itemId')
  deleteItem(@Param('itemId') itemId: string, @Request() req: any) {
    return this.service.deleteItem(itemId, req.user?.id);
  }

  // ── PF PDF import ──
  @Post('pdf/preview')
  @UseInterceptors(PDF_UPLOAD)
  async previewPdf(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    TrustStockController.requirePdfAccess(await this.rules(req));
    return this.service.previewPdf(requirePdf(file).buffer);
  }

  /** multipart: file = the PDF, data = JSON of the (corrected) preview */
  @Post('pdf/import')
  @UseInterceptors(PDF_UPLOAD)
  async importPdf(@UploadedFile() file: Express.Multer.File, @Body('data') data: string, @Request() req: any) {
    const r = await this.rules(req);
    TrustStockController.requirePdfAccess(r);
    let parsed: unknown;
    try { parsed = JSON.parse(data || ''); } catch { throw new BadRequestException('Invalid import data'); }
    const pdf = requirePdf(file);
    return redactStockItem(await this.service.importPdf(pdf.buffer, pdf.originalname, parsed, req.user?.id) as any, r);
  }

  @Get('items/:itemId/pdf')
  async getPdf(@Param('itemId') itemId: string, @Request() req: any, @Res() res: Response) {
    TrustStockController.requirePdfAccess(await this.rules(req));
    const { data, fileName } = await this.service.getPdf(itemId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    res.send(data);
  }

  // ── Stock contents ──
  @Get('products')
  async listProducts(@Request() req: any) {
    return redactProductPrices(await this.service.listProducts(), await this.rules(req));
  }

  /** Product catalog (every item code entered so far) for the manual-entry dropdown */
  @Get('catalog')
  async catalog(@Request() req: any) {
    return redactProductPrices(await this.service.listCatalog(), await this.rules(req));
  }

  /** Re-order PF (PDF) for the products and quantities picked in the RE-ORDER tab */
  @Post('reorder-pf')
  async reorderPf(@Body() dto: ReorderPfDto, @Request() req: any, @Res() res: Response) {
    TrustStockController.requirePdfAccess(await this.rules(req));
    const { data, fileName } = await this.service.reorderPf(dto.lines, { addToStock: dto.addToStock });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(data);
  }

  @Patch('products/:id')
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateStockProductDto, @Request() req: any) {
    const r = await this.rules(req);
    if (hidesProductPrices(r) && (dto.unitPrice !== undefined || dto.totalPrice !== undefined)) {
      throw new ForbiddenException("Your role can't change prices");
    }
    return redactProductPrices([await this.service.updateProduct(id, dto, req.user?.id) as any], r)[0];
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string, @Request() req: any) {
    return this.service.deleteProduct(id, req.user?.id);
  }

  // ── Usage from the Projects table (Projects page access, not Trust Stock) ──
  @Get('usage/products')
  @RequirePageAccess('operational_board')
  async availableProducts(@Request() req: any) {
    return redactProductPrices(await this.service.listProducts(), await this.rules(req));
  }

  @Get('usage')
  @RequirePageAccess('operational_board')
  async usageForRow(@Query('projectItemId') projectItemId: string, @Request() req: any) {
    if (!projectItemId) throw new BadRequestException('projectItemId is required');
    return redactProductPrices(await this.service.usageForProjectItem(projectItemId) as any[], await this.rules(req));
  }

  @Post('usage')
  @RequirePageAccess('operational_board')
  addUsage(@Body() dto: CreateStockUsageDto, @Request() req: any) {
    return this.service.addUsage(dto, req.user?.id);
  }

  /** Names used before as "taken by" */
  @Get('usage/people')
  @RequirePageAccess('operational_board')
  people() {
    return this.service.listPeople();
  }

  /** Take / reserve / return several products for one row in one go */
  @Post('usage/movements')
  @RequirePageAccess('operational_board')
  applyMovements(@Body() dto: StockMovementsDto, @Request() req: any) {
    return this.service.applyMovements(dto, req.user?.id);
  }

  @Delete('usage/:id')
  @RequirePageAccess('operational_board')
  removeUsage(@Param('id') id: string, @Request() req: any) {
    return this.service.removeUsage(id, req.user?.id);
  }
}
```

---

## FILE: server/src/trust-stock/dto/trust-stock-pdf.dto.ts

```ts
import { IsString, IsOptional, IsNotEmpty, IsIn, IsNumber, IsArray, ValidateNested, ArrayMinSize, Min, ValidateIf, IsEnum, IsBoolean, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectItemType } from '@prisma/client';

export class ImportPfProductDto {
  @IsString() @IsNotEmpty() itemCode: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() category?: string | null;
  @IsNumber() @Min(0) quantity: number;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() unitPrice?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() totalPrice?: number | null;
}

/** What the preview screen sends back (parsed values, possibly corrected by the user). */
export class ImportPfDto {
  @IsString() @IsNotEmpty() stockCode: string;
  @IsString() @IsNotEmpty() pfCode: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() vendorId?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsEnum(ProjectItemType) type?: ProjectItemType | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() orderNo?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() pfDate?: string | null;
  @IsIn(['USD', 'TL', 'EUR']) currency: 'USD' | 'TL' | 'EUR';
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() totalPrice?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() paymentRule?: string | null;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ImportPfProductDto) products: ImportPfProductDto[];
}

export class UpdateStockProductDto {
  @IsOptional() @IsString() @IsNotEmpty() itemCode?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() dimensions?: string | null;
  /** Confirmed received in the warehouse; null = back to pending verification */
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() @Min(0) receivedQuantity?: number | null;
  @IsOptional() @IsNumber() @Min(0) quantity?: number;
  /** Target stock level; null = measure against Confirmed Received */
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() @Min(0) targetQuantity?: number | null;
  /** Reorder point in % (REORDER NOW at or below it, WATCH up to twice it); null = 25% */
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() @Min(1) @Max(99) reorderPct?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() unitPrice?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() totalPrice?: number | null;
}

export class ReorderPfLineDto {
  @IsString() @IsNotEmpty() productId: string;
  @IsNumber() @Min(0.01) quantity: number;
}

/** Re-order PF: the products and quantities picked in the RE-ORDER tab */
export class ReorderPfDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ReorderPfLineDto) lines: ReorderPfLineDto[];
  /** Also record it in Trust Stock: a new stock order with this PF (as if the PDF had been imported) */
  @IsOptional() @IsBoolean() addToStock?: boolean;
}

export class CreateStockUsageDto {
  @IsString() @IsNotEmpty() projectItemId: string;
  @IsString() @IsNotEmpty() productId: string;
  @IsNumber() @Min(0.01) quantity: number;
}

export class StockMovementLineDto {
  @IsString() @IsNotEmpty() productId: string;
  @IsOptional() @IsNumber() @Min(0) take?: number;
  @IsOptional() @IsNumber() @Min(0) reserve?: number;
  @IsOptional() @IsNumber() @Min(0) return?: number;
  @IsOptional() @IsString() note?: string;
}

/** Several stock movements for one Projects row, saved together. */
export class StockMovementsDto {
  @IsString() @IsNotEmpty() projectItemId: string;
  /** Who took / returned / reserved the stock */
  @IsString() @IsNotEmpty() takenBy: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => StockMovementLineDto) lines: StockMovementLineDto[];
}
```

---

## FILE: server/src/trust-stock/trust-stock.service.ts

```ts
import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { applyStatusDateAutomation } from '../common/helpers/status-date-automation';
import { CreateTrustStockGroupDto, UpdateTrustStockGroupDto, TrustStockItemDto } from './dto/trust-stock.dto';
import { ImportPfDto, UpdateStockProductDto, CreateStockUsageDto, StockMovementsDto } from './dto/trust-stock-pdf.dto';
import { parsePfPdf, normalizeCode, normalizeItemCode, PfItemLayout } from './pf-pdf-parser';
import { renderReorderPf, ReorderPfPage } from './reorder-pf';
import { TRUST_STOCK_TABLE_KEY, TRUST_STOCK_COLUMN_FIELDS, TrustStockColumnRules, NO_RULES } from './trust-stock-columns';
import { FileStorage } from '../common/storage/file-storage';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

const ROOMS = ['trust-stock'];
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const ITEM_INCLUDE = {
  vendor: { select: { id: true, code: true, name: true } },
  customType: { select: { id: true, name: true, code: true, description: true } },
};

const GROUP_INCLUDE = {
  items: {
    where: { deletedAt: null },
    include: ITEM_INCLUDE,
    orderBy: { createdAt: 'asc' as const },
  },
};

/**
 * Stock movements that count: not undone, and their Projects row + project are not in the
 * trash. Deleting a row/project gives its stock back; restoring it takes it again.
 */
const LIVE_USAGE = { deletedAt: null, projectItem: { deletedAt: null, project: { deletedAt: null } } };

const DATE_FIELDS = ['std', 'etd', 'rtr', 'rtd', 'rdy', 'ftd', 'snd', 'paidUsd1Date', 'paidUsd2Date', 'paidTl1Date', 'paidTl2Date'] as const;
/** Item fields under the price / accounting columns: never sent in live messages */
const PRICE_FIELDS = new Set([
  ...['pfUsd', 'pfTl', 'invoice', 'invoiceTl', 'accounting'].flatMap(c => TRUST_STOCK_COLUMN_FIELDS[c]),
  'priceNotes',
]);
const PLAIN_FIELDS = [
  'type', 'customTypeId', 'vendorId', 'pfCode', 'orderNo', 'orderType', 'pfSignStatus', 'poSignStatus',
  'pfUsd', 'pfTl', 'invoice', 'invoiceTl', 'paidUsd1', 'paidUsd2', 'paidTl1', 'paidTl2',
  'paymentRule', 'statusNote', 'description', 'priceNotes',
] as const;

/** Trust Stock: purchases Trust makes for its own stock, grouped as STOCK 1, STOCK 2, … */
@Injectable()
export class TrustStockService implements OnModuleInit {
  private readonly logger = new Logger(TrustStockService.name);
  private readonly pdfStore = new FileStorage('trust-stock-pdfs');

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  /**
   * Page access is DB-driven and fail-closed: register the `trust_stock` page and
   * give ADMIN roles access the first time. Other roles are granted in Admin → Roles.
   */
  async onModuleInit() {
    try {
      const page = await this.prisma.pageRegistry.upsert({
        where: { key: 'trust_stock' },
        update: {},
        create: { key: 'trust_stock', name: 'Trust Stock', description: 'Trust Stock purchases (vendor, PF, price, payments)', isActive: true },
      });
      const admins = await this.prisma.role.findMany({ where: { name: { equals: 'ADMIN', mode: 'insensitive' } }, select: { id: true } });
      for (const role of admins) {
        const existing = await this.prisma.rolePageAccess.findUnique({ where: { roleId_pageId: { roleId: role.id, pageId: page.id } } });
        if (!existing) await this.prisma.rolePageAccess.create({ data: { roleId: role.id, pageId: page.id, hasAccess: true } });
      }
    } catch (err: any) {
      this.logger.warn(`Could not seed trust_stock page permission: ${err?.message || err}`);
    }
  }

  // ==================== COLUMN RULES ====================

  private stockTableId: string | null = null;

  /** The caller's Trust Stock column rules (Admin > Roles > Trust Stock columns); none = everything visible. */
  async columnRules(user: any): Promise<TrustStockColumnRules> {
    const visibility: { tableId: string | null; columnKey: string; isHidden: boolean; isReadOnly: boolean }[] = user?.role?.roleColumnVisibility || [];
    if (!visibility.length) return NO_RULES;
    // the registry row appears with the first rule saved; remember it once found
    if (!this.stockTableId) {
      this.stockTableId = (await this.prisma.tableRegistry.findUnique({ where: { key: TRUST_STOCK_TABLE_KEY }, select: { id: true } }))?.id ?? null;
      if (!this.stockTableId) return NO_RULES;
    }
    const rules: TrustStockColumnRules = { hidden: new Set(), readOnly: new Set() };
    for (const v of visibility) {
      if (v.tableId !== this.stockTableId) continue;
      if (v.isHidden) rules.hidden.add(v.columnKey);
      else if (v.isReadOnly) rules.readOnly.add(v.columnKey);
    }
    // accounting (remaining = PF − paid) would give away the hidden prices
    if (['pfUsd', 'pfTl', 'invoice', 'invoiceTl'].some(c => rules.hidden.has(c))) rules.hidden.add('accounting');
    return rules;
  }

  // ==================== GROUPS ====================

  async findAllGroups() {
    const groups = await this.prisma.trustStockGroup.findMany({
      where: { deletedAt: null },
      include: GROUP_INCLUDE,
    });
    // Natural order: STOCK 2 before STOCK 10
    groups.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    return { data: groups };
  }

/** Suffix given to a trashed group's code once that code is needed again. */
  static readonly DELETED_SUFFIX = / ~deleted-\d+$/;

  /**
   * A group in the trash still owns its (unique) code. When the same code is needed
   * again (new stock group / PF import), rename the trashed one out of the way —
   * it gets its code back on restore if still free (see TrashBinService).
   */
  private async freeCodeFromTrash(db: any, code: string) {
    const trashed = await db.trustStockGroup.findUnique({ where: { code } });
    if (trashed?.deletedAt) {
      await db.trustStockGroup.update({ where: { id: trashed.id }, data: { code: `${code} ~deleted-${Date.now()}` } });
    }
  }

  private async nextGroupCode(): Promise<string> {
    const all = await this.prisma.trustStockGroup.findMany({ where: { deletedAt: null }, select: { code: true } });
    let max = 0;
    for (const { code } of all) {
      const m = code.match(/^STOCK\s*(\d+)$/i);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `STOCK ${max + 1}`;
  }

  async createGroup(dto: CreateTrustStockGroupDto, userId?: string) {
    const code = (dto.code || '').trim().toUpperCase() || await this.nextGroupCode();
    await this.freeCodeFromTrash(this.prisma, code);
    const clash = await this.prisma.trustStockGroup.findUnique({ where: { code } });
    if (clash) throw new BadRequestException(`${code} already exists`);

    const group = await this.prisma.trustStockGroup.create({
      data: { code, name: dto.name?.trim() || '', notes: dto.notes || null },
      include: GROUP_INCLUDE,
    });
    this.events.emitToRooms(ROOMS, 'trust-stock:group-created', { groupId: group.id }, userId);
    return group;
  }

  async updateGroup(id: string, dto: UpdateTrustStockGroupDto, userId?: string) {
    await this.getGroupOrThrow(id);
    const data: any = {};
    if (dto.code !== undefined) {
      const code = dto.code.trim().toUpperCase();
      const clash = await this.prisma.trustStockGroup.findFirst({ where: { code, id: { not: id } } });
      if (clash) throw new BadRequestException(`${code} already exists`);
      data.code = code;
    }
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.notes !== undefined) data.notes = dto.notes || null;

    const group = await this.prisma.trustStockGroup.update({ where: { id }, data, include: GROUP_INCLUDE });
    this.events.emitToRooms(ROOMS, 'trust-stock:group-updated', { groupId: group.id }, userId);
    return group;
  }

  async deleteGroup(id: string, userId?: string) {
    const group = await this.getGroupOrThrow(id);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.trustStockGroup.update({ where: { id }, data: { deletedAt: now } }),
      this.prisma.trashBin.create({
        data: {
          entityType: 'TrustStockGroup',
          entityId: id,
          entityLabel: group.name ? `${group.code} — ${group.name}` : group.code,
          moduleGroup: 'trust-stock',
          deletedAt: now,
          deletedByUserId: userId,
          restoreUntil: new Date(now.getTime() + THIRTY_DAYS_MS),
        },
      }),
    ]);
    this.events.emitToRooms(ROOMS, 'trust-stock:group-deleted', { groupId: id }, userId);
    return { message: 'Stock group deleted' };
  }

  private async getGroupOrThrow(id: string) {
    const group = await this.prisma.trustStockGroup.findFirst({ where: { id, deletedAt: null } });
    if (!group) throw new NotFoundException('Stock group not found');
    return group;
  }

  // ==================== ITEMS ====================

  private toData(dto: TrustStockItemDto): Record<string, any> {
    const data: Record<string, any> = {};
    for (const f of PLAIN_FIELDS) {
      if ((dto as any)[f] !== undefined) data[f] = (dto as any)[f];
    }
    for (const f of DATE_FIELDS) {
      const v = (dto as any)[f];
      if (v !== undefined) data[f] = v ? new Date(v) : null;
    }
    if (typeof data.pfCode === 'string') data.pfCode = data.pfCode.trim() || null;
    if (typeof data.orderNo === 'string') data.orderNo = data.orderNo.trim() || null;
    return data;
  }

  async createItem(groupId: string, dto: TrustStockItemDto, userId?: string) {
    await this.getGroupOrThrow(groupId);
    const data = this.toData(dto);
    const status = dto.status || 'NOT_ORDERED';
    const item = await this.prisma.trustStockItem.create({
      data: {
        ...data,
        groupId,
        status,
        std: data.std ?? (status === 'ORDERED' ? new Date() : null),
      } as any,
      include: ITEM_INCLUDE,
    });
    this.events.emitToRooms(ROOMS, 'trust-stock:item-created', { itemId: item.id, groupId }, userId);
    return item;
  }

  async updateItem(itemId: string, dto: TrustStockItemDto, userId?: string) {
    const existing = await this.prisma.trustStockItem.findFirst({ where: { id: itemId, ...{ deletedAt: null, group: { deletedAt: null } } } });
    if (!existing) throw new NotFoundException('Stock item not found');

    const data = this.toData(dto);
    if (dto.status !== undefined) {
      data.status = dto.status;
      // Same status → date rules as the Projects table (STD on ORDERED, RTR on READY TO RECEIVE, …)
      Object.assign(data, applyStatusDateAutomation(existing.status, dto.status, existing, { rtrField: 'rtr', hasRtd: true }));
    }

    const updated = await this.prisma.trustStockItem.update({ where: { id: itemId }, data, include: ITEM_INCLUDE });

    // Cell-level live update for other open pages. Live messages reach every listener,
    // so prices aren't put in them: a price change makes the other pages reload through
    // the API instead, which leaves out what each role may not see.
    const patch: Record<string, any> = {};
    for (const key of [...Object.keys(data), ...DATE_FIELDS]) {
      if (PRICE_FIELDS.has(key)) continue;
      const v = (updated as any)[key];
      patch[key] = v instanceof Date ? v.toISOString() : v ?? null;
    }
    if (Object.keys(data).some(k => PRICE_FIELDS.has(k))) {
      this.events.emitToRooms(ROOMS, 'trust-stock:group-updated', { groupId: existing.groupId }, userId);
    }
    if (userId) {
      this.events.emitPatchEvent(ROOMS, {
        entity: 'trustStockItem',
        entityId: itemId,
        parentId: existing.groupId,
        patch,
        updatedAt: updated.updatedAt.toISOString(),
        updatedBy: userId,
        mutationId: EventsGateway.generateMutationId(),
      });
    }
    return updated;
  }

  async deleteItem(itemId: string, userId?: string) {
    const item = await this.prisma.trustStockItem.findFirst({
      where: { id: itemId, deletedAt: null },
      include: { group: { select: { code: true } } },
    });
    if (!item) throw new NotFoundException('Stock item not found');
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.trustStockItem.update({ where: { id: itemId }, data: { deletedAt: now } }),
      this.prisma.trashBin.create({
        data: {
          entityType: 'TrustStockItem',
          entityId: itemId,
          entityLabel: item.pfCode || `${item.type || 'Custom'} item`,
          moduleGroup: 'trust-stock-items',
          deletedAt: now,
          deletedByUserId: userId,
          restoreUntil: new Date(now.getTime() + THIRTY_DAYS_MS),
          parentId: item.groupId,
          parentLabel: item.group.code,
        },
      }),
    ]);
    this.events.emitToRooms(ROOMS, 'trust-stock:item-deleted', { itemId, groupId: item.groupId }, userId);
    return { message: 'Stock item deleted' };
  }

  // ==================== PF PDF IMPORT ====================

  /** Vendor from the PF code prefix ("KYA-…") or the supplier name on the form. */
  private async matchVendor(codeHint: string | null, supplierName: string | null) {
    const vendors = await this.prisma.vendor.findMany({ select: { id: true, code: true, name: true } });
    if (codeHint) {
      const byCode = vendors.find(v => v.code.toUpperCase() === codeHint.toUpperCase());
      if (byCode) return byCode;
    }
    if (supplierName) {
      const n = normalizeCode(supplierName);
      const byName = vendors.find(v => {
        const vn = normalizeCode(v.name);
        return vn && n && (vn === n || vn.includes(n) || n.includes(vn));
      });
      if (byName) return byName;
    }
    return null;
  }

  /** Read a PF PDF and return what would be saved (nothing is written). */
  async previewPdf(buffer: Buffer) {
    const parsed = await parsePfPdf(buffer);
    const vendor = await this.matchVendor(parsed.vendorCodeHint, parsed.supplierName);
    if (!vendor) parsed.warnings.push(`No vendor matches "${parsed.supplierName || parsed.vendorCodeHint || '?'}" — pick one before saving.`);
    const stockCode = parsed.stockCode?.trim().toUpperCase() || null;
    const group = stockCode ? await this.prisma.trustStockGroup.findUnique({ where: { code: stockCode } }) : null;
    const duplicate = parsed.pfCode
      ? await this.prisma.trustStockItem.findFirst({ where: { pfCode: parsed.pfCode, ...{ deletedAt: null, group: { deletedAt: null } } }, include: { group: { select: { code: true } } } })
      : null;
    if (duplicate) parsed.warnings.push(`${parsed.pfCode} is already in ${duplicate.group.code}.`);
    // parsed.layout stays: where each product row sits on the page (PDF points, origin bottom-left),
    // so an upload screen can highlight the rows it read. It isn't part of the import data.
    return {
      ...parsed,
      stockCode,
      vendor,
      groupStatus: !group || group.deletedAt ? 'new' : 'exists',
      duplicateOf: duplicate ? { itemId: duplicate.id, groupCode: duplicate.group.code } : null,
    };
  }

  /** Save a PF from the (possibly corrected) preview: group, PF row, products and the PDF itself. */
  async importPdf(buffer: Buffer, fileName: string, raw: unknown, userId?: string) {
    const dto = plainToInstance(ImportPfDto, raw);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length) {
      throw new BadRequestException(errors.map(e => Object.values(e.constraints || {}).join(', ') || `${e.property} is invalid`).join('; '));
    }
    const stockCode = dto.stockCode.trim().toUpperCase();
    const pfCode = dto.pfCode.trim();

    const duplicate = await this.prisma.trustStockItem.findFirst({ where: { pfCode, ...{ deletedAt: null, group: { deletedAt: null } } } });
    if (duplicate) throw new BadRequestException(`${pfCode} has already been imported.`);
    // A trashed group with this code doesn't count — move it out of the way and start fresh
    await this.freeCodeFromTrash(this.prisma, stockCode);
    let group = await this.prisma.trustStockGroup.findUnique({ where: { code: stockCode } });

    // Store the PDF first (its key doesn't depend on DB ids), so a failed upload saves nothing
    const safeName = (fileName || `${pfCode}.pdf`).replace(/[^\w.\-]+/g, '_').slice(-120);
    const fileKey = `${stockCode.replace(/[^\w\-]+/g, '_')}/${Date.now()}-${safeName}`;
    await this.pdfStore.save(fileKey, buffer, 'application/pdf');

    const total = dto.totalPrice ?? dto.products.reduce((s, p) => s + (p.totalPrice ?? 0), 0);
    const item = await this.prisma.$transaction(async (tx) => {
      if (!group) group = await tx.trustStockGroup.create({ data: { code: stockCode } });
      const created = await tx.trustStockItem.create({
        data: {
          groupId: group.id,
          type: dto.type ?? null,
          vendorId: dto.vendorId ?? null,
          pfCode,
          orderNo: dto.orderNo?.trim() || null,
          pfDate: dto.pfDate ? new Date(dto.pfDate) : null,
          pfUsd: dto.currency === 'USD' && total ? total : null,
          pfTl: dto.currency === 'TL' && total ? total : null,
          paymentRule: dto.paymentRule ?? null,
          status: 'NOT_ORDERED',
          pdfFileKey: fileKey,
          pdfFileName: fileName || null,
        },
      });
      await tx.trustStockProduct.createMany({
        data: dto.products.map((p, i) => ({
          stockItemId: created.id,
          itemCode: p.itemCode.trim(),
          ...TrustStockService.splitDimensions(p.description?.trim() || ''),
          category: p.category ?? null,
          quantity: p.quantity,
          unitPrice: p.unitPrice ?? null,
          totalPrice: p.totalPrice ?? (p.unitPrice != null ? p.unitPrice * p.quantity : null),
          currency: dto.currency,
          sortOrder: i,
        })),
      });
      return tx.trustStockItem.findUnique({ where: { id: created.id }, include: ITEM_INCLUDE });
    });

    this.events.emitToRooms(ROOMS, 'trust-stock:item-created', { itemId: item!.id, groupId: item!.groupId }, userId);
    return item;
  }

  async getPdf(itemId: string) {
    const item = await this.prisma.trustStockItem.findUnique({ where: { id: itemId }, select: { pdfFileKey: true, pdfFileName: true, pfCode: true } });
    if (!item?.pdfFileKey) throw new NotFoundException('No PDF stored for this PF');
    const data = await this.pdfStore.read(item.pdfFileKey);
    if (!data) throw new NotFoundException('PDF file not found');
    return { data, fileName: item.pdfFileName || `${item.pfCode || 'pf'}.pdf` };
  }

  /**
   * Re-order PF: a PRODUCTION FORM for the products and quantities picked in the RE-ORDER tab,
   * one page per vendor, under the next free stock code (STOCK-TR-04 → STOCK-TR-05).
   * The same item code picked from several stock orders becomes one line.
   * Pictures are copied from the products' original PFs. Nothing is saved unless addToStock:
   * then each page becomes a PF of a new stock order in Trust Stock, exactly like importing the PDF.
   */
  async reorderPf(lines: { productId: string; quantity: number }[], opts: { addToStock?: boolean } = {}) {
    const qty = new Map<string, number>();
    for (const l of lines) if (l.quantity > 0) qty.set(l.productId, (qty.get(l.productId) || 0) + l.quantity);
    const products = (await this.listProducts()).filter(p => qty.has(p.id));
    if (!products.length) throw new BadRequestException('Nothing to re-order');

    // next number after the live stock orders: a code freed by deleting its order is used again
    // (a trashed order gives its code up when it's reused, see freeCodeFromTrash)
    const codes = (await this.prisma.trustStockGroup.findMany({ where: { deletedAt: null }, select: { code: true } })).map(g => g.code.replace(/\s*\(restored( \d+)?\)$/i, ''));
    let prefix = 'STOCK-TR-', max = 0, width = 2;
    for (const c of codes) {
      const m = c.match(/^(.*?)(\d+)$/);
      if (!m || !/STOCK/i.test(m[1])) continue;
      if (Number(m[2]) >= max) { max = Number(m[2]); prefix = m[1]; width = m[2].length; }
    }
    const stockCode = `${prefix}${String(max + 1).padStart(width, '0')}`;
    const now = new Date();
    const date = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;

    // one page per vendor + PF type, in the order the products are listed
    const pages = new Map<string, ReorderPfPage>();
    const pageMeta = new Map<string, { vendorId: string | null; type: string }>();
    const sourceItemIds = new Set<string>();
    for (const p of products) {
      const vendor = p.stockItem.vendor;
      const type = p.stockItem.type || 'MILLWORK';
      const key = `${vendor?.id || '-'}|${type}`;
      if (!pages.has(key)) {
        const letter = type === 'MILLWORK' ? 'M' : type.charAt(0);
        const sameVendor = [...pages.values()].filter(x => x.supplierName === (vendor?.name || '').toUpperCase() && x.pfCode.endsWith(`-${letter}01`)).length;
        pages.set(key, {
          supplierName: (vendor?.name || '').toUpperCase(),
          pfCode: `${vendor?.code ? vendor.code + '-' : ''}${stockCode}-${letter}${String(sameVendor + 1).padStart(2, '0')}`,
          stockCode,
          date,
          formType: type.replace(/_/g, ' '),
          paymentNote: 'Note: Production will start after receiving a 50% advance payment.',
          lines: [],
        });
        pageMeta.set(key, { vendorId: vendor?.id || null, type });
      }
      const page = pages.get(key)!;
      const same = page.lines.find(l => normalizeItemCode(l.itemCode) === normalizeItemCode(p.itemCode));
      if (same) same.quantity += qty.get(p.id)!;
      else page.lines.push({
        itemCode: p.itemCode, description: p.description, dimensions: p.dimensions, category: p.category,
        quantity: qty.get(p.id)!, unitPrice: p.unitPrice, currency: p.currency || 'USD',
      });
      if (p.stockItem.hasPdf) sourceItemIds.add(p.stockItem.id);
    }

    // the original PFs, for the product pictures
    const sources: { pdf: Buffer; layout: PfItemLayout[] }[] = [];
    const items = await this.prisma.trustStockItem.findMany({ where: { id: { in: [...sourceItemIds] } }, select: { pdfFileKey: true }, orderBy: { createdAt: 'desc' } });
    for (const it of items) {
      try {
        const pdf = await this.pdfStore.read(it.pdfFileKey!);
        if (!pdf) continue;
        const layout = (await parsePfPdf(pdf)).layout || [];
        if (layout.length) sources.push({ pdf, layout });
      } catch (e: any) {
        this.logger.warn(`Re-order PF: could not read pictures from ${it.pdfFileKey}: ${e?.message || e}`);
      }
    }

    const data = await renderReorderPf([...pages.values()], sources);
    const fileName = `${stockCode}-REORDER.pdf`;

    if (opts.addToStock) {
      // same path as uploading the PF: validation, duplicate check, PDF stored, products pending verification
      for (const [key, pg] of pages) {
        const meta = pageMeta.get(key)!;
        const currency = pg.lines.find(l => l.currency)?.currency || 'USD';
        await this.importPdf(data, fileName, {
          stockCode,
          pfCode: pg.pfCode,
          vendorId: meta.vendorId,
          type: meta.type,
          pfDate: now.toISOString(),
          currency: ['USD', 'TL', 'EUR'].includes(currency) ? currency : 'USD',
          products: pg.lines.map(l => ({
            itemCode: l.itemCode,
            // dimensions ride in the description, where the import splits them off again
            description: l.dimensions ? `${l.description} (${l.dimensions})` : l.description,
            category: l.category ?? null,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        }); // no userId: the live event goes to the requester too, so the Trust Stock page behind the modal updates
      }
    }
    return { data, fileName };
  }

  // ==================== STOCK CONTENTS & USAGE ====================
  //
  // Same rules as the "Cabinet Stock Management" sheet, per product (model):
  //   on hand    = confirmed received − taken + returned     (none until received)
  //   available  = on hand − reserved
  //   base       = target stock (entered by hand) if set, else confirmed received
  //   remaining% = available ÷ base
  //   reorder %  = entered by hand per product, default 25%
  //   reorder at ≤ ROUNDDOWN(reorder % × base)
  //   status     = PENDING VERIFICATION (no receipt) | OUT OF STOCK (≤ 0) | REORDER NOW (≤ reorder %)
  //                | WATCH (≤ 2 × reorder %) | HEALTHY (above that)

  static readonly DEFAULT_REORDER_PCT = 25;

  private static stats(p: { quantity: any; receivedQuantity: any; targetQuantity?: any; reorderPct?: any; usages: { kind: string; quantity: any; projectItemId?: string }[] }) {
    const sum = (kind: string) => p.usages.filter(u => u.kind === kind).reduce((s, u) => s + Number(u.quantity), 0);
    const ordered = Number(p.quantity);
    const received = p.receivedQuantity != null ? Number(p.receivedQuantity) : null;
    const target = p.targetQuantity != null ? Number(p.targetQuantity) : null;
    const taken = sum('TAKEN');
    const returned = sum('RETURNED');
    const reserved = sum('RESERVED');
    const onHand = received != null ? received - taken + returned : null;
    const available = onHand != null ? onHand - reserved : null;
    const base = target ?? received;
    const remainingPct = received != null && base ? (available as number) / base : null;
    const reorderPct = p.reorderPct != null ? Number(p.reorderPct) : null; // as entered; null = default
    const r = (reorderPct ?? TrustStockService.DEFAULT_REORDER_PCT) / 100;
    const reorderThreshold = received != null && base != null ? Math.floor(base * r) : null;
    let status: 'PENDING_VERIFICATION' | 'OUT_OF_STOCK' | 'REORDER_NOW' | 'WATCH' | 'HEALTHY';
    if (received == null) status = 'PENDING_VERIFICATION';
    else if ((available as number) <= 0) status = 'OUT_OF_STOCK';
    else if ((remainingPct as number) <= r) status = 'REORDER_NOW';
    else if ((remainingPct as number) <= 2 * r) status = 'WATCH';
    else status = 'HEALTHY';
    // What can still be handed out: before the warehouse receipt is confirmed, the ordered quantity is the cap
    const takeable = (received ?? ordered) - taken + returned - reserved;
    // Suggested re-order once the reorder point is hit: what's missing to get back to the target (or the ordered quantity)
    const reorderQty = status === 'REORDER_NOW' || status === 'OUT_OF_STOCK' ? Math.max(0, (target ?? ordered) - (available as number)) : 0;
    return { ordered, received, target, taken, returned, netUsed: taken - returned, reserved, onHand, available, remainingPct, reorderPct, reorderThreshold, reorderQty, status, takeable };
  }

  /** "( D=32.5"-W=40"-H=32.75")" at the end of a description → dimensions + clean description */
  static splitDimensions(description: string, dimensions?: string | null) {
    if (dimensions) return { description, dimensions };
    const m = description.match(/\(?\s*(D\s*=\s*[\d.,]+"?[\s\-–x×]*W\s*=\s*[\d.,]+"?[\s\-–x×]*H\s*=\s*[\d.,]+"?)\s*\)?\s*$/i);
    if (!m) return { description, dimensions: null };
    const dims = m[1].replace(/\s*[-–x×]\s*(?=[WH]\s*=)/gi, ' ').replace(/\s+/g, ' ').replace(/\s*=\s*/g, '=').replace(/(\d),(\d)/g, '$1.$2').trim();
    return { description: description.slice(0, m.index).trim(), dimensions: dims };
  }

  /** Every product in stock with the stock-sheet figures and who used it. */
  async listProducts() {
    const products = await this.prisma.trustStockProduct.findMany({
      where: { deletedAt: null, stockItem: { deletedAt: null, group: { deletedAt: null } } },
      include: {
        stockItem: {
          select: {
            id: true, pfCode: true, orderNo: true, pfDate: true, pdfFileKey: true, type: true,
            vendor: { select: { id: true, code: true, name: true } },
            group: { select: { id: true, code: true } },
          },
        },
        usages: {
          where: LIVE_USAGE,
          orderBy: { createdAt: 'asc' },
          include: { projectItem: { select: { id: true, pfCode: true, deletedAt: true, project: { select: { id: true, projectNo: true, name: true } } } } },
        },
      },
      orderBy: [{ stockItemId: 'asc' }, { sortOrder: 'asc' }],
    });
    return products.map(p => {
      const { pdfFileKey, ...stockItem } = p.stockItem;
      const split = TrustStockService.splitDimensions(p.description, p.dimensions);
      return {
        id: p.id,
        itemCode: p.itemCode,
        description: split.description,
        dimensions: split.dimensions,
        category: p.category,
        quantity: Number(p.quantity),
        receivedAt: p.receivedAt,
        unitPrice: p.unitPrice != null ? Number(p.unitPrice) : null,
        totalPrice: p.totalPrice != null ? Number(p.totalPrice) : null,
        currency: p.currency,
        ...TrustStockService.stats(p),
        stockItem: { ...stockItem, hasPdf: !!pdfFileKey },
        usages: p.usages.map(u => ({
          id: u.id,
          kind: u.kind,
          quantity: Number(u.quantity),
          note: u.note,
          takenBy: u.takenBy,
          createdAt: u.createdAt,
          projectItemId: u.projectItemId,
          projectNo: u.projectItem.project.projectNo,
          projectName: u.projectItem.project.name,
          projectPfCode: u.projectItem.pfCode,
          rowDeleted: !!u.projectItem.deletedAt,
        })),
      };
    });
  }

  /**
   * Every product ever entered (imported or typed), one per item code — offered as a
   * dropdown when adding lines by hand. The most recent entry of a code wins.
   */
  async listCatalog() {
    const rows = await this.prisma.trustStockProduct.findMany({
      orderBy: { createdAt: 'desc' },
      select: { itemCode: true, description: true, dimensions: true, category: true, unitPrice: true, currency: true },
    });
    const seen = new Map<string, any>();
    for (const r of rows) {
      const key = r.itemCode.trim().toUpperCase();
      if (!key || seen.has(key)) continue;
      const split = TrustStockService.splitDimensions(r.description, r.dimensions);
      seen.set(key, {
        itemCode: r.itemCode.trim(),
        description: split.description,
        dimensions: split.dimensions,
        category: r.category,
        unitPrice: r.unitPrice != null ? Number(r.unitPrice) : null,
        currency: r.currency,
      });
    }
    return [...seen.values()].sort((a, b) => a.itemCode.localeCompare(b.itemCode, undefined, { numeric: true }));
  }

  async updateProduct(id: string, dto: UpdateStockProductDto, userId?: string) {
    const product = await this.prisma.trustStockProduct.findFirst({ where: { id, deletedAt: null, stockItem: { deletedAt: null, group: { deletedAt: null } } }, include: { usages: { where: LIVE_USAGE } } });
    if (!product) throw new NotFoundException('Stock product not found');
    const s = TrustStockService.stats(product);
    if (dto.quantity !== undefined && dto.quantity < s.netUsed + s.reserved) {
      throw new BadRequestException(`${s.netUsed + s.reserved} already taken/reserved — ordered quantity can't go below that.`);
    }
    if (dto.receivedQuantity != null && dto.receivedQuantity < s.netUsed + s.reserved) {
      throw new BadRequestException(`${s.netUsed + s.reserved} already taken/reserved — received quantity can't go below that.`);
    }
    const data: any = { ...dto };
    if (typeof data.itemCode === 'string') data.itemCode = data.itemCode.trim();
    // Older rows keep their dimensions inside the description (shown split). When the description
    // is edited, move those dimensions into their own field so they aren't lost.
    if (dto.description !== undefined && dto.dimensions === undefined && !product.dimensions) {
      const old = TrustStockService.splitDimensions(product.description);
      if (old.dimensions) data.dimensions = old.dimensions;
    }
    if (dto.receivedQuantity !== undefined) data.receivedAt = dto.receivedQuantity == null ? null : (product.receivedAt ?? new Date());
    const updated = await this.prisma.trustStockProduct.update({ where: { id }, data });
    this.events.emitToRooms(['trust-stock', 'projects'], 'trust-stock:usage-changed', { productId: id }, userId);
    return updated;
  }

  async deleteProduct(id: string, userId?: string) {
    const product = await this.prisma.trustStockProduct.findFirst({ where: { id, deletedAt: null }, include: { usages: { where: LIVE_USAGE } } });
    if (!product) throw new NotFoundException('Stock product not found');
    if (product.usages.length) throw new BadRequestException('This product is used in projects — remove those usages first.');
    await this.prisma.trustStockProduct.update({ where: { id }, data: { deletedAt: new Date() } });
    this.events.emitToRooms(['trust-stock', 'projects'], 'trust-stock:usage-changed', { productId: id }, userId);
    return { message: 'Product removed' };
  }

  /** Stock movements of one Projects-table row, plus its per-product balance. */
  async usageForProjectItem(projectItemId: string) {
    const usages = await this.prisma.trustStockUsage.findMany({
      where: { projectItemId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: { product: { include: { stockItem: { select: { pfCode: true, group: { select: { code: true } } } } } } },
    });
    return usages.map(u => ({
      id: u.id,
      kind: u.kind,
      quantity: Number(u.quantity),
      note: u.note,
      takenBy: u.takenBy,
      createdAt: u.createdAt,
      productId: u.productId,
      itemCode: u.product.itemCode,
      description: TrustStockService.splitDimensions(u.product.description, u.product.dimensions).description,
      unitPrice: u.product.unitPrice != null ? Number(u.product.unitPrice) : null,
      currency: u.product.currency,
      stockPfCode: u.product.stockItem.pfCode,
      stockCode: u.product.stockItem.group.code,
    }));
  }

  private async getStockRow(projectItemId: string) {
    const row = await this.prisma.projectItem.findFirst({
      where: { id: projectItemId, deletedAt: null },
      include: { vendor: { select: { code: true } } },
    });
    if (!row) throw new NotFoundException('Project row not found');
    if (!isStockVendor(row.vendor?.code)) throw new BadRequestException('Stock can only be used on rows whose vendor is TR-STOCK.');
    return row;
  }

  /**
   * Apply several movements for one project row in one go (the "Use from Trust Stock" screen):
   * per product: take N, reserve N, return N. Taking first uses up this row's own reservation.
   */
  async applyMovements(dto: StockMovementsDto, userId?: string) {
    const row = await this.getStockRow(dto.projectItemId);
    const lines = dto.lines.filter(l => (l.take || 0) > 0 || (l.reserve || 0) > 0 || (l.return || 0) > 0);
    const takenBy = dto.takenBy.trim();
    if (!takenBy) throw new BadRequestException('Enter who is taking the stock.');
    if (!lines.length) throw new BadRequestException('Nothing to save.');

    await this.prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const product = await tx.trustStockProduct.findFirst({
          where: { id: line.productId, deletedAt: null, stockItem: { deletedAt: null, group: { deletedAt: null } } },
          include: { usages: { where: LIVE_USAGE } },
        });
        if (!product) throw new NotFoundException('Stock product not found');
        const mine = product.usages.filter(u => u.projectItemId === row.id);
        const sumMine = (kind: string) => mine.filter(u => u.kind === kind).reduce((s, u) => s + Number(u.quantity), 0);
        const s = TrustStockService.stats(product);

        // Return: at most what this row has taken (net)
        if (line.return) {
          const net = sumMine('TAKEN') - sumMine('RETURNED');
          if (line.return > net + 1e-9) throw new BadRequestException(`${product.itemCode}: this row has only ${net} to return.`);
          await tx.trustStockUsage.create({ data: { productId: product.id, projectItemId: row.id, kind: 'RETURNED', quantity: line.return, note: line.note ?? null, takenBy, createdByUserId: userId ?? null } });
        }

        // Take: first from this row's own reservation, the rest from what's free
        if (line.take) {
          const myReserved = sumMine('RESERVED');
          const fromReservation = Math.min(myReserved, line.take);
          const free = s.takeable + (line.return || 0);
          if (line.take - fromReservation > free + 1e-9) {
            throw new BadRequestException(`${product.itemCode}: only ${Math.max(0, free) + myReserved} can be taken.`);
          }
          if (fromReservation > 0) await this.releaseReservation(tx, mine.filter(u => u.kind === 'RESERVED'), fromReservation);
          await tx.trustStockUsage.create({ data: { productId: product.id, projectItemId: row.id, kind: 'TAKEN', quantity: line.take, note: line.note ?? null, takenBy, createdByUserId: userId ?? null } });
        }

        // Reserve: hold for this row without taking it out yet
        if (line.reserve) {
          const free = s.takeable + (line.return || 0) - (line.take ? Math.max(0, line.take - sumMine('RESERVED')) : 0);
          if (line.reserve > free + 1e-9) throw new BadRequestException(`${product.itemCode}: only ${Math.max(0, free)} can be reserved.`);
          await tx.trustStockUsage.create({ data: { productId: product.id, projectItemId: row.id, kind: 'RESERVED', quantity: line.reserve, note: line.note ?? null, takenBy, createdByUserId: userId ?? null } });
        }
      }
    });

    this.events.emitToRooms(['trust-stock', 'projects'], 'trust-stock:usage-changed', { projectItemId: row.id }, userId);
    return this.usageForProjectItem(row.id);
  }

  /** Reduce reservation records by `qty` (newest first). */
  private async releaseReservation(tx: any, reservations: { id: string; quantity: any }[], qty: number) {
    let left = qty;
    for (const r of [...reservations].reverse()) {
      if (left <= 0) break;
      const q = Number(r.quantity);
      if (q <= left + 1e-9) {
        await tx.trustStockUsage.update({ where: { id: r.id }, data: { deletedAt: new Date() } });
        left -= q;
      } else {
        await tx.trustStockUsage.update({ where: { id: r.id }, data: { quantity: q - left } });
        left = 0;
      }
    }
  }

  /** Names entered before as "taken by" — offered in the dropdown. */
  async listPeople(): Promise<string[]> {
    const rows = await this.prisma.trustStockUsage.findMany({ where: { takenBy: { not: null } }, distinct: ['takenBy'], select: { takenBy: true } });
    return rows.map(r => r.takenBy!.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b, 'tr'));
  }

  /** Single take (kept for API compatibility). */
  async addUsage(dto: CreateStockUsageDto, userId?: string) {
    await this.applyMovements({ projectItemId: dto.projectItemId, takenBy: '—', lines: [{ productId: dto.productId, take: dto.quantity }] } as StockMovementsDto, userId);
    return this.prisma.trustStockUsage.findFirst({ where: { projectItemId: dto.projectItemId, productId: dto.productId, kind: 'TAKEN', deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  /** Undo one movement (e.g. a wrong entry or a released reservation). */
  async removeUsage(id: string, userId?: string) {
    const usage = await this.prisma.trustStockUsage.findFirst({ where: { id, deletedAt: null }, include: { product: { include: { usages: { where: LIVE_USAGE } } } } });
    if (!usage) throw new NotFoundException('Usage not found');
    if (usage.kind === 'RETURNED') {
      // Undoing a return puts those pieces back on the row — only possible if they're still free
      const s = TrustStockService.stats(usage.product);
      if (Number(usage.quantity) > s.takeable + 1e-9) throw new BadRequestException('Those pieces have been used elsewhere since — can\'t undo this return.');
    }
    if (usage.kind === 'TAKEN') {
      const mine = usage.product.usages.filter(u => u.projectItemId === usage.projectItemId);
      const net = mine.filter(u => u.kind === 'TAKEN').reduce((s, u) => s + Number(u.quantity), 0)
        - mine.filter(u => u.kind === 'RETURNED').reduce((s, u) => s + Number(u.quantity), 0);
      if (net - Number(usage.quantity) < -1e-9) throw new BadRequestException('Undo the return for this row first.');
    }
    await this.prisma.trustStockUsage.update({ where: { id }, data: { deletedAt: new Date() } });
    this.events.emitToRooms(['trust-stock', 'projects'], 'trust-stock:usage-changed', { projectItemId: usage.projectItemId }, userId);
    return { message: 'Removed' };
  }
}

/** The Trust Stock company as a vendor in the Projects table ("TR-STOCK - TRUST-STOCK"). */
export function isStockVendor(code?: string | null): boolean {
  return !!code && code.toUpperCase().replace(/[^A-Z]/g, '') === 'TRSTOCK';
}
```

---

## FILE: server/src/trust-stock/pf-pdf-parser.ts

```ts
/**
 * Reads a Trust Lines "(ESTIMATED) PRODUCTION FORM" PDF (the PF) plus the vendor's
 * price quote that is usually attached as the following page(s).
 *
 * Rule-based, no AI: text is rebuilt into rows from its position on the page.
 *  - Page with "(ESTIMATED) PRODUCTION FORM": supplier, ORDER NO (= PF code), date,
 *    PROJECT NUMBER (= stock code), form type (MILLWORK, …), category lines and the
 *    ITEM CODE / DESCRIPTION / QUANTITY table.
 *  - Other pages (vendor quote, layout differs per vendor): any row that holds a
 *    quantity q, a unit price u and a total t with q × u ≈ t is a price line; it is
 *    matched to the product with that quantity (in order of appearance).
 * Anything that can't be found is left empty and reported in `warnings` so the
 * user can complete it on the preview screen before saving.
 */

// pdf-parse's package entry runs a self-test when required directly; use the lib file.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

// pdf.js (inside pdf-parse) prints harmless font notices such as "Warning: TT: undefined
// function: 21" for PDFs with hinted TrueType fonts. Its verbosity setting doesn't reach the
// in-process worker that prints them, so while a PDF is being read, drop just those
// "Warning: …" lines from console.log. Everything else (and real errors) still shows.
let quietDepth = 0;
let originalLog: typeof console.log | null = null;
async function withPdfJsQuiet<T>(fn: () => Promise<T>): Promise<T> {
  if (quietDepth++ === 0) {
    originalLog = console.log;
    const log = originalLog;
    console.log = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].startsWith('Warning: ')) return;
      log.apply(console, args);
    };
  }
  try {
    return await fn();
  } finally {
    if (--quietDepth === 0 && originalLog) { console.log = originalLog; originalLog = null; }
  }
}

export interface ParsedPfProduct {
  itemCode: string;
  description: string;
  category: string | null;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
}

/** Where a product's picture sits on the PF page (PDF points, origin bottom-left) */
export interface PfItemLayout {
  itemCode: string;
  page: number;      // 0-based
  x0: number; x1: number;
  y0: number; y1: number; // y0 < y1
}

export interface ParsedPf {
  stockCode: string | null;      // PROJECT NUMBER, e.g. "STOCK-TR-02"
  pfCode: string | null;         // ORDER NO, e.g. "KYA-STOCK-TR-02-M01"
  supplierName: string | null;   // e.g. "KAYA TEKNIK"
  vendorCodeHint: string | null; // prefix of the PF code, e.g. "KYA"
  pfDate: string | null;         // ISO yyyy-mm-dd
  type: string | null;           // MILLWORK, SHELVING, … (from the form title)
  currency: 'USD' | 'TL' | 'EUR';
  totalPrice: number | null;     // vendor quote total, or sum of product totals
  paymentRule: string | null;    // advance %, e.g. "50"
  products: ParsedPfProduct[];
  warnings: string[];
  /** picture cell of each product (used to copy product pictures into generated PFs) */
  layout?: PfItemLayout[];
}

interface Cell { s: string; x: number; y: number; w?: number; h?: number }
interface Row { y: number; cells: Cell[]; text: string }

const KNOWN_TYPES = ['MILLWORK', 'SHELVING', 'CEILING', 'IMAGE', 'FURNITURE', 'DECORATION'];

async function readRows(buffer: Buffer): Promise<Row[][]> {
  const pages: Row[][] = [];
  const pagerender = async (pageData: any) => {
    const tc = await pageData.getTextContent({ normalizeWhitespace: true });
    const cells: Cell[] = tc.items
      .map((i: any) => ({ s: String(i.str).replace(/\s+/g, ' ').trim(), x: i.transform[4], y: i.transform[5], w: i.width || 0, h: Math.abs(i.transform[3]) || 10 }))
      .filter((c: Cell) => c.s);
    cells.sort((a, b) => b.y - a.y || a.x - b.x);
    const rows: Row[] = [];
    for (const c of cells) {
      let row = rows.find(r => Math.abs(r.y - c.y) < 3);
      if (!row) { row = { y: c.y, cells: [], text: '' }; rows.push(row); }
      row.cells.push(c);
    }
    rows.forEach(r => {
      r.cells.sort((a, b) => a.x - b.x);
      // Glue pieces of one word/phrase the PDF split up (e.g. at Ş/İ glyphs: "GOS-ST" + "OCK-TR-07")
      const merged: Cell[] = [];
      for (const c of r.cells) {
        const prev = merged[merged.length - 1];
        const gap = prev && prev.w ? c.x - (prev.x + prev.w) : Infinity;
        const h = prev?.h || 10;
        if (prev && gap < 0.45 * h && gap > -0.5 * h) {
          prev.s = gap > 0.12 * h ? `${prev.s} ${c.s}` : prev.s + c.s;
          prev.w = c.x + (c.w || 0) - prev.x;
        } else merged.push({ ...c });
      }
      r.cells = merged;
      r.text = r.cells.map(c => c.s).join(' ');
    });
    pages.push(rows);
    return '';
  };
  await withPdfJsQuiet(() => pdfParse(buffer, { pagerender }));
  return pages;
}

/** "30.000.00", "30,000.00", "30.000,00", "300.00$", "$ 9.000" → number */
export function parseMoney(raw: string): number | null {
  const s = raw.replace(/[^\d.,-]/g, '');
  if (!/\d/.test(s)) return null;
  const lastSep = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
  let n: number;
  if (lastSep >= 0 && s.length - lastSep - 1 === 2) {
    n = parseFloat(s.slice(0, lastSep).replace(/[.,]/g, '') + '.' + s.slice(lastSep + 1));
  } else {
    n = parseFloat(s.replace(/[.,]/g, ''));
  }
  return Number.isFinite(n) ? n : null;
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * Item codes as the stock sheet writes them, whatever spacing the PF used:
 * "IN/FC-36/F 12 BODY" → "IN-FC-36/F12 BODY", "IN-FC-48/ F12" → "IN-FC-48/F12",
 * "IN-FC-48/B 20 - SHORT" → "IN-FC-48/B20 SHORT", "FA 40" stays "FA 40".
 */
export function normalizeItemCode(raw: string): string {
  return raw.toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\/([A-Z]+)\s+(\d)/g, '/$1$2')
    .replace(/^([A-Z]+)\/([A-Z]+)-/, '$1-$2-')
    .replace(/\s+-\s+/g, ' ')
    .trim();
}

/** Cell in `row` closest to column x (within tolerance). */
function cellAt(row: Row | undefined, x: number, tol = 40): Cell | undefined {
  if (!row) return undefined;
  let best: Cell | undefined;
  for (const c of row.cells) {
    const d = Math.abs(c.x - x);
    if (d <= tol && (!best || d < Math.abs(best.x - x))) best = c;
  }
  return best;
}

function toIsoDate(s: string): string | null {
  const m = s.match(/(\d{1,2})([./-])(\d{1,2})\2(\d{4})/);
  if (!m) return null;
  let a = +m[1], b = +m[3];
  const y = +m[4];
  // "." / "-" → day.month (Turkish); "/" → month/day (US Excel) unless that can't be a date
  let day = a, month = b;
  if (m[2] === '/' && a <= 12) { month = a; day = b; }
  if (month > 12 && day <= 12) { [day, month] = [month, day]; }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Label variants seen on PFs (English / Turkish, different templates)
const L = {
  code: /ITEM\s*CODE|ITEM\s*NO|PRODUCT\s*CODE|^CODE$|^KOD|[ÜU]R[ÜU]N\s*KOD|STOK\s*KOD/i,
  desc: /DESCRIPTION|^DESC\.?$|A[ÇC]IKLAMA|[ÜU]R[ÜU]N\s*ADI/i,
  qty: /QUANTITY|^QTY\.?$|^PCS\.?$|^ADET$|M[İI]KTAR/i,
  price: /PRICE|F[İI]YAT|TUTAR|AMOUNT/i,
  unitPrice: /^(UNIT\s*)?PRICE|B[İI]R[İI]M\s*F[İI]YAT|^F[İI]YAT/i,
  lineTotal: /^(TOTAL|AMOUNT|TUTAR|TOPLAM)(\s*PRICE)?$/i,
  order: /ORDER\s*NO|PF\s*NO|PO\s*NO|S[İI]PAR[İI][ŞS]\s*NO/i,
  date: /^(DATE|TAR[İI]H):?$/i,
  supplier: /SUPPLIER|TEDAR[İI]K[ÇC][İI]|^VENDOR/i,
  project: /PROJECT\s*(NUMBER|NO)|PROJE\s*NO/i,
  tableEnd: /^\s*(TOTAL|TOPLAM)\b|PRODUCTION MANAGER|PAYMENT TERMS|SIGNATURE|[İI]MZA/i,
};

export async function parsePfPdf(buffer: Buffer): Promise<ParsedPf> {
  const out: ParsedPf = {
    stockCode: null, pfCode: null, supplierName: null, vendorCodeHint: null, pfDate: null,
    type: null, currency: 'USD', totalPrice: null, paymentRule: null, products: [], warnings: [],
  };

  // Every part is read on its own: if one fails, the rest still comes through.
  const attempt = (what: string, fn: () => void) => {
    try { fn(); } catch { out.warnings.push(`Couldn't read ${what} — check it on the preview.`); }
  };

  let pages: Row[][] = [];
  try {
    pages = await readRows(buffer);
  } catch {
    out.warnings.push('This PDF could not be read (damaged or password-protected) — fill the fields by hand.');
    return out;
  }
  if (!pages.some(p => p.length)) {
    out.warnings.push('No text found in this PDF (scanned image?) — fill the fields by hand.');
    return out;
  }

  const isFormTitle = (t: string) => /PRODUCTION FORM/i.test(t);
  let formIdx = pages.findIndex(p => p.some(r => isFormTitle(r.text)));
  if (formIdx < 0) formIdx = pages.findIndex(p => p.some(r => r.cells.some(c => L.order.test(c.s))) && p.some(r => r.cells.some(c => L.code.test(c.s))));
  if (formIdx < 0) out.warnings.push('Trust Lines "Production Form" page not found — check the fields on the preview.');
  const form = formIdx >= 0 ? pages[formIdx] : [];
  const rowIndex = (re: RegExp) => form.findIndex(r => r.cells.some(c => re.test(c.s)) || re.test(r.text));
  const allText = pages.flat().map(r => r.text).join('\n');

  // ── Form type (MILLWORK …)
  attempt('the type', () => {
    const titleIdx = rowIndex(/PRODUCTION FORM/i);
    for (const r of form.slice(Math.max(0, titleIdx), Math.max(0, titleIdx) + 3)) {
      const t = KNOWN_TYPES.find(k => r.text.toUpperCase().includes(k));
      if (t) { out.type = t; break; }
    }
  });

  // ── Supplier / ORDER NO / Date: a label row with the values underneath (or right next to the label)
  attempt('supplier / order no / date', () => {
    const valueFor = (re: RegExp, tol = 60): string | null => {
      for (let i = 0; i < form.length; i++) {
        const label = form[i].cells.find(c => re.test(c.s));
        if (!label) continue;
        const inline = label.s.replace(/^[^:]*:\s*/, '').trim();
        if (label.s.includes(':') && inline && !re.test(inline)) return inline;  // "ORDER NO: X"
        const below = cellAt(form[i + 1], label.x, tol)?.s;
        if (below && !Object.values(L).some(l => l !== L.tableEnd && l.test(below))) return below;
      }
      return null;
    };
    out.supplierName = valueFor(L.supplier);
    out.pfCode = valueFor(L.order);
    out.pfDate = toIsoDate(valueFor(L.date) || '');
  });
  attempt('the PF code', () => {
    if (out.pfCode && /^[A-Z0-9]+(-[A-Z0-9]+)+$/i.test(out.pfCode)) return;
    // Fallback: anything shaped like a PF code, e.g. KYA-STOCK-TR-03-M01
    const m = allText.match(/\b[A-Z]{2,8}-STOCK-[A-Z0-9-]+\b/) || allText.match(/\b[A-Z]{2,8}(?:-[A-Z0-9]+){2,}-[A-Z]\d{2}\b/);
    if (m) out.pfCode = m[0];
  });
  if (!out.pfDate) attempt('the date', () => { out.pfDate = form.map(r => toIsoDate(r.text)).find(Boolean) || null; });
  if (out.pfCode) out.vendorCodeHint = out.pfCode.split('-')[0] || null;

  // ── Stock code: under "PROJECT NUMBER"; fallback from the PF code (KYA-STOCK-TR-03-M01 → STOCK-TR-03)
  attempt('the stock code', () => {
    const projIdx = rowIndex(L.project);
    if (projIdx >= 0) {
      const label = form[projIdx].cells.find(c => L.project.test(c.s));
      const v = label ? cellAt(form[projIdx + 1], label.x, 40)?.s : form[projIdx + 1]?.cells[0]?.s;
      if (v && /\d/.test(v)) out.stockCode = v.trim();
    }
    if (!out.stockCode && out.pfCode) {
      const m = out.pfCode.match(/(STOCK(?:-[A-Z0-9]+)*?)-[A-Z]\d{2}$/i) || out.pfCode.match(/STOCK-[A-Z0-9-]+/i);
      if (m) out.stockCode = m[1] || m[0];
    }
  });

  // ── Product tables: form pages (and continuation pages) — any page whose header row has
  //    a code column and a quantity column but no price column (price columns = vendor quote).
  const tablePages = pages
    .map((rows, idx) => ({ rows, idx }))
    .filter(({ rows, idx }) => idx === formIdx || rows.some(r => isFormTitle(r.text))
      || rows.some(r => r.cells.some(c => L.code.test(c.s)) && r.cells.some(c => L.qty.test(c.s))));
  const skipped: string[] = [];
  out.layout = [];
  for (const { rows, idx: pageIdx } of tablePages) {
    let category: string | null = null;
    for (let i = 0; i < rows.length; i++) {
      const head = rows[i];
      const codeHead = head.cells.find(c => L.code.test(c.s));
      const qtyHead = head.cells.find(c => L.qty.test(c.s));
      if (!codeHead || !qtyHead) continue;
      try {
        const descHead = head.cells.find(c => L.desc.test(c.s));
        // Category = plain heading rows right above the table ("CABINETRY", "INDUSTRIAL / CABINETS / MDF / BLACK")
        const headings: string[] = [];
        for (let k = i - 1; k >= 0 && headings.length < 2; k--) {
          const t = rows[k].text;
          if (/STANDARD ITEMS|PROJECT|CLIENT|SUPPLIER|ORDER NO/i.test(t) || rows[k].cells.some(c => L.code.test(c.s))) break;
          const only = rows[k].cells.length === 1 ? rows[k].cells[0] : null;
          if (only && /^\d+([.,]\d+)?$/.test(only.s.trim())) continue;               // stray number
          if (!only || only.x >= codeHead.x - 5) break;                                // a product line — stop
          if (/[A-Za-zÇĞİÖŞÜçğıöşü]{3,}/.test(t)) headings.unshift(t);
        }
        // a lone gray sub-category bar stays under the black section bar above it ("CABINETRY")
        if (headings.length === 1 && category?.includes(' — ')) category = `${category.split(' — ')[0]} — ${headings[0]}`;
        else if (headings.length) category = headings.join(' — ');

        const body: Row[] = [];
        let endedAtNextTable = false;
        for (let k = i + 1; k < rows.length; k++) {
          if (rows[k].cells.some(c => L.code.test(c.s))) { endedAtNextTable = true; break; } // next table
          if (L.tableEnd.test(rows[k].text) || rows[k].cells.some(c => /^(TOTAL|TOPLAM)$/i.test(c.s))) break;
          body.push(rows[k]);
        }
        if (endedAtNextTable) {
          const qtyX = qtyHead.x;
          while (body.length) {
            const last = body[body.length - 1];
            const only = last.cells.length === 1 ? last.cells[0] : null;
            const heading = only && only.x < codeHead.x - 5;                                        // full-width section title
            const stray = only && /^\d+([.,]\d+)?$/.test(only.s.trim()) && Math.abs(only.x - qtyX) > 30; // loose number
            if (heading || stray) body.pop(); else break;
          }
        }

        const descX = descHead ? descHead.x : codeHead.x + 120;
        const picHead = head.cells.find(c => /^(PIC|PICTURE|IMAGE|G[ÖO]RSEL|RES[İI]M)$/i.test(c.s.trim()));
        const unitHead = head.cells.find(c => c.x > qtyHead.x && L.unitPrice.test(c.s));
        const totalHead = head.cells.find(c => c.x > qtyHead.x && c !== unitHead && L.lineTotal.test(c.s));
        const inMoneyCol = (c: Cell) => [unitHead, totalHead].some(h => h && Math.abs(c.x - h.x) <= 45) || (!!unitHead && c.x > unitHead.x - 20);
        const isCodeCell = (c: Cell) => c.x < Math.min(descX, codeHead.x + 80) - 20 && c.x >= codeHead.x - 40;
        const isQtyCell = (c: Cell) => !!qtyHead && Math.abs(c.x - qtyHead.x) <= 30 && /^\d+([.,]\d+)?$/.test(c.s.trim());
        const cells = body.flatMap(r => r.cells.map(c => ({ ...c, y: r.y })));
        const qtyCells = cells.filter(isQtyCell);

        // One item per quantity cell — code and description pieces go to the nearest quantity
        // (an item may span several text rows). Without a quantity column: one per code row.
        const anchors = qtyCells.length
          ? qtyCells.map(c => ({ y: c.y, qty: parseMoney(c.s) }))
          : body.filter(r => r.cells.some(isCodeCell)).map(r => ({ y: r.y, qty: null as number | null }));
        const parts = anchors.map(() => ({ code: [] as Cell[], desc: [] as Cell[], money: [] as Cell[] }));
        // A piece belongs to an item only if it lies within that item's band (≈ half the row spacing),
        // so a line whose quantity can't be read doesn't borrow the neighbour's quantity.
        const ys = anchors.map(a => a.y).sort((p, q) => q - p);
        const gaps = ys.slice(1).map((y, k) => ys[k] - y).sort((p, q) => p - q);
        const band = gaps.length ? Math.max(6, gaps[Math.floor(gaps.length / 2)] * 0.45) : 20;
        const orphanCodes: Cell[] = [];
        for (const c of cells) {
          if (isQtyCell(c) || !anchors.length) continue;
          let best = 0;
          anchors.forEach((a, k) => { if (Math.abs(a.y - c.y) < Math.abs(anchors[best].y - c.y)) best = k; });
          if (Math.abs(anchors[best].y - c.y) > band) { if (isCodeCell(c)) orphanCodes.push(c); continue; }
          if (inMoneyCol(c)) { parts[best].money.push(c); continue; }
          (isCodeCell(c) ? parts[best].code : parts[best].desc).push(c);
        }
        // Codes with no quantity next to them are reported as skipped (lines close together = one code)
        orphanCodes.sort((p, q) => q.y - p.y).reduce<Cell[][]>((groups, c) => {
          const g = groups[groups.length - 1];
          if (g && Math.abs(g[g.length - 1].y - c.y) <= band) g.push(c); else groups.push([c]);
          return groups;
        }, []).forEach(g => skipped.push(`${normalizeItemCode(g.map(c => c.s).join(' '))} — quantity not readable`));

        anchors.forEach((a, k) => {
          // A line that can't be read is skipped; the next one is still read
          try {
            const byPos = (x: Cell[]) => [...x].sort((p, q) => q.y - p.y || p.x - q.x).map(c => c.s).join(' ');
            const code = normalizeItemCode(byPos(parts[k].code));
            const description = byPos(parts[k].desc).replace(/\s+/g, ' ').trim();
            if (!code && !description) return; // stray number between tables, not a line
            if (!code) { skipped.push(`quantity ${a.qty ?? '?'}${description ? ` (${description.slice(0, 40)}…)` : ''} — no item code`); return; }
            if (a.qty == null || !Number.isFinite(a.qty) || a.qty <= 0) { skipped.push(`${code} — quantity not readable`); return; }
            const moneyAt = (h?: Cell) => {
              if (!h) return null;
              const c = parts[k].money.filter(m => Math.abs(m.x - h.x) <= 45).sort((p, q) => Math.abs(p.x - h.x) - Math.abs(q.x - h.x))[0];
              return c ? parseMoney(c.s) : null;
            };
            let unitPrice = moneyAt(unitHead), totalPrice = moneyAt(totalHead);
            if (unitPrice == null && totalPrice != null) unitPrice = +(totalPrice / a.qty).toFixed(2);
            if (totalPrice == null && unitPrice != null) totalPrice = +(unitPrice * a.qty).toFixed(2);
            out.products.push({ itemCode: code, description, category, quantity: a.qty, unitPrice, totalPrice });
            if (picHead) {
              // picture cell: from just left of the PIC label to just left of QUANTITY, one row high
              const half = gaps.length ? Math.max(8, gaps[Math.floor(gaps.length / 2)] / 2 - 1) : 14;
              const mid = a.y + 3; // quantity text baseline sits slightly below the row's middle
              out.layout!.push({ itemCode: code, page: pageIdx, x0: picHead.x - 14, x1: qtyHead.x - 3, y0: mid - half, y1: mid + half });
            }
          } catch {
            skipped.push(`a line near the top-${Math.round(a.y)} mark`);
          }
        });
      } catch {
        out.warnings.push('Part of a product table could not be read — check the lines on the preview.');
      }
    }
  }
  if (skipped.length) out.warnings.push(`Skipped ${skipped.length} line(s) that couldn't be read: ${skipped.join('; ')}.`);
  if (out.products.length === 0) out.warnings.push('No product lines found — add them on the preview.');

  // ── Payment rule: "50% advance" / "%50 sözleşmede"
  attempt('the payment rule', () => {
    const pay = allText.match(/(\d{1,3})\s*%\s*(?:advance|pe[sş]in|deposit)/i)
      || allText.match(/%\s*(\d{1,3})\s*(?:s[oö]zle[sş]me|pe[sş]in|advance)/i)
      || allText.match(/(?:payment|[oö]deme)[^\n]*?%\s*(\d{1,3})/i)
      || allText.match(/(?:payment|[oö]deme)[^\n]*?(\d{1,3})\s*%/i);
    if (pay) out.paymentRule = pay[1];
  });

  // ── Currency
  attempt('the currency', () => {
    if (/\bEUR\b|€/.test(allText)) out.currency = 'EUR';
    if (/\bUSD\b|\$/.test(allText)) out.currency = 'USD';
    else if (/\bTL\b|₺|\bTRY\b/.test(allText)) out.currency = 'TL';
  });

  // ── Prices from the other pages (vendor quote): rows where qty × unit ≈ total
  const tableIdx = new Set(tablePages.map(t => t.idx));
  const quoteRows = pages.filter((_, i) => !tableIdx.has(i)).flat();
  const used = new Set<number>();
  for (const r of quoteRows) {
    try {
      const nums = r.cells.flatMap(c => c.s.split(/\s{2,}|\s(?=\$)|(?<=\$)\s/))
        .map(s => s.trim()).filter(s => /\d/.test(s))
        .flatMap(s => (/^\d+(\.\d+)?(\s+\d+(\.\d+)?)+$/.test(s) ? s.split(/\s+/) : [s]))
        .map(parseMoney).filter((n): n is number => n != null && n > 0);
      if (nums.length < 3) continue;
      let matched = false;
      for (let pi = 0; pi < out.products.length && !matched; pi++) {
        if (used.has(pi) || out.products[pi].unitPrice != null) continue;
        const q = out.products[pi].quantity;
        if (!q || !nums.includes(q)) continue;
        for (const u of nums) {
          if (u === q) continue;
          const t = nums.find(n => n !== u && Math.abs(n - u * q) < 0.01 * Math.max(1, n));
          if (t != null) {
            out.products[pi].unitPrice = u;
            out.products[pi].totalPrice = t;
            used.add(pi);
            matched = true;
            break;
          }
        }
      }
    } catch { /* an unreadable quote row is skipped */ }
  }
  const unpriced = out.products.filter(p => p.unitPrice == null);
  if (out.products.length && unpriced.length === out.products.length) {
    out.warnings.push('No vendor prices found in this PDF — enter the unit prices on the preview.');
  } else {
    for (const p of unpriced) out.warnings.push(`Price not found for ${p.itemCode} — enter it on the preview.`);
  }

  // Cross-check: the quantities read must add up to the form's TOTAL
  attempt('the form total', () => {
    const totalRow = form.find(r => r.cells.some(c => /^(TOTAL|TOPLAM)$/i.test(c.s)));
    const formTotal = totalRow?.cells.map(c => parseMoney(c.s)).find((v): v is number => v != null && v > 0);
    const qtySum = out.products.reduce((sum, p) => sum + p.quantity, 0);
    if (formTotal != null && out.products.length && Math.abs(formTotal - qtySum) > 0.001) {
      out.warnings.push(`Quantities read add up to ${qtySum}, but the form's TOTAL is ${formTotal} — check the lines.`);
    }
  });

  // ── Grand total: "TOTAL PRICE … 39.000.00" on a quote page, else sum of lines
  attempt('the total price', () => {
    for (let i = 0; i < quoteRows.length; i++) {
      if (!/TOTAL|TOPLAM/i.test(quoteRows[i].text)) continue;
      for (const r of [quoteRows[i], quoteRows[i + 1], quoteRows[i - 1]].filter(Boolean) as Row[]) {
        const money = r.cells.map(c => parseMoney(c.s)).filter((n): n is number => n != null && n > 0);
        const big = money.length ? Math.max(...money) : null;
        if (big && big > (out.totalPrice ?? 0)) out.totalPrice = big;
      }
    }
    const sum = out.products.reduce((s, p) => s + (p.totalPrice ?? 0), 0);
    if (sum > 0 && (!out.totalPrice || Math.abs(out.totalPrice - sum) > 0.01)) {
      if (out.totalPrice) out.warnings.push(`Quote total ${out.totalPrice} differs from the sum of lines ${sum}; using the sum of lines.`);
      out.totalPrice = sum;
    }
    if (!sum && !out.products.some(p => p.totalPrice)) out.totalPrice = null;
  });

  if (!out.pfCode) out.warnings.push('ORDER NO (PF code) not found.');
  if (!out.stockCode) out.warnings.push('PROJECT NUMBER (stock code) not found.');
  if (!out.supplierName) out.warnings.push('Supplier not found.');
  if (!out.type) out.warnings.push('Type (MILLWORK, …) not found.');
  return out;
}

export { norm as normalizeCode };
```
