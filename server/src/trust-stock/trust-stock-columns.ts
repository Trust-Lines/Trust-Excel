/**
 * Trust Stock column rules per role (Admin > Roles > Trust Stock columns).
 * Stored in role_column_visibility under the table registry key below, so they don't
 * touch the Projects column rules, which use the same column names.
 */
export const TRUST_STOCK_TABLE_KEY = 'trust-stock-grid';

export const TRUST_STOCK_COLUMNS: { key: string; label: string; money?: boolean }[] = [
  { key: 'pfCode', label: 'PF Code' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'orderNo', label: 'Order No' },
  { key: 'pfSignStatus', label: 'PF Sign Status' },
  { key: 'status', label: 'Status' },
  { key: 'std', label: 'STD' },
  { key: 'etd', label: 'ETD' },
  { key: 'rtr', label: 'RTR' },
  { key: 'rtd', label: 'RTD' },
  { key: 'pfUsd', label: 'PF / USD', money: true },
  { key: 'pfTl', label: 'PF / TL', money: true },
  { key: 'invoice', label: 'INV / USD', money: true },
  { key: 'invoiceTl', label: 'INV / TL', money: true },
  { key: 'paymentRule', label: 'Payment Rule' },
  { key: 'accounting', label: 'Accounting (paid / remaining / invoice)', money: true },
  { key: 'pfPdf', label: 'PF PDFs & Re-order PF (show prices)', money: true },
];

export const TRUST_STOCK_COLUMN_KEYS = TRUST_STOCK_COLUMNS.map(c => c.key);

/** Stock item fields each column covers (writes to them are refused when hidden / read-only). */
export const TRUST_STOCK_COLUMN_FIELDS: Record<string, string[]> = {
  pfCode: ['pfCode'],
  vendor: ['vendorId'],
  orderNo: ['orderNo'],
  pfSignStatus: ['pfSignStatus'],
  status: ['status'],
  std: ['std'],
  etd: ['etd'],
  rtr: ['rtr'],
  rtd: ['rtd'],
  pfUsd: ['pfUsd'],
  pfTl: ['pfTl'],
  invoice: ['invoice'],
  invoiceTl: ['invoiceTl'],
  paymentRule: ['paymentRule'],
  accounting: ['paidUsd1', 'paidUsd2', 'paidTl1', 'paidTl2', 'paidUsd1Date', 'paidUsd2Date', 'paidTl1Date', 'paidTl2Date'],
};

export interface TrustStockColumnRules {
  hidden: Set<string>;
  readOnly: Set<string>;
}

export const NO_RULES: TrustStockColumnRules = { hidden: new Set(), readOnly: new Set() };

/** A product's unit / total price is a PF price: hidden with either PF price column. */
export const hidesProductPrices = (r: TrustStockColumnRules) => r.hidden.has('pfUsd') || r.hidden.has('pfTl') || r.hidden.has('pfPdf');

/** Hidden money columns come back empty, so the prices never reach the browser. */
export function redactStockItem<T extends Record<string, any>>(item: T, r: TrustStockColumnRules): T {
  if (!item || !r.hidden.size) return item;
  const out: Record<string, any> = { ...item };
  for (const col of TRUST_STOCK_COLUMNS) {
    if (!col.money || !r.hidden.has(col.key)) continue;
    for (const f of TRUST_STOCK_COLUMN_FIELDS[col.key] || []) if (f in out) out[f] = null;
  }
  if (hidesProductPrices(r) && 'priceNotes' in out) out.priceNotes = null;
  return out as T;
}

/** Stock products / catalog / usage rows without unit and total prices when the role may not see PF prices. */
export function redactProductPrices<T extends Record<string, any>>(rows: T[], r: TrustStockColumnRules): T[] {
  if (!hidesProductPrices(r)) return rows;
  return rows.map(row => ({
    ...row,
    ...('unitPrice' in row ? { unitPrice: null } : {}),
    ...('totalPrice' in row ? { totalPrice: null } : {}),
  }));
}

/** Fields of a write that the role may not change (hidden or read-only columns). */
export function blockedStockItemFields(dto: Record<string, any>, r: TrustStockColumnRules): string[] {
  const blocked: string[] = [];
  for (const [col, fields] of Object.entries(TRUST_STOCK_COLUMN_FIELDS)) {
    if (!r.hidden.has(col) && !r.readOnly.has(col)) continue;
    for (const f of fields) if (dto[f] !== undefined) blocked.push(f);
  }
  return blocked;
}
