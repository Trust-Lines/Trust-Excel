/**
 * Reads a Trust Lines "ESTIMATED PRODUCTION FORM" PDF (the PF) plus the vendor's
 * price quote that is usually attached as the following page(s).
 *
 * Rule-based, no AI: text is rebuilt into rows from its position on the page.
 *  - Page with "ESTIMATED PRODUCTION FORM": supplier, ORDER NO (= PF code), date,
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

export interface ParsedPfProduct {
  itemCode: string;
  description: string;
  category: string | null;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
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
}

interface Cell { s: string; x: number; y: number }
interface Row { y: number; cells: Cell[]; text: string }

const KNOWN_TYPES = ['MILLWORK', 'SHELVING', 'CEILING', 'IMAGE', 'FURNITURE', 'DECORATION'];

async function readRows(buffer: Buffer): Promise<Row[][]> {
  const pages: Row[][] = [];
  const pagerender = async (pageData: any) => {
    const tc = await pageData.getTextContent({ normalizeWhitespace: true });
    const cells: Cell[] = tc.items
      .map((i: any) => ({ s: String(i.str).replace(/\s+/g, ' ').trim(), x: i.transform[4], y: i.transform[5] }))
      .filter((c: Cell) => c.s);
    cells.sort((a, b) => b.y - a.y || a.x - b.x);
    const rows: Row[] = [];
    for (const c of cells) {
      let row = rows.find(r => Math.abs(r.y - c.y) < 3);
      if (!row) { row = { y: c.y, cells: [], text: '' }; rows.push(row); }
      row.cells.push(c);
    }
    rows.forEach(r => { r.cells.sort((a, b) => a.x - b.x); r.text = r.cells.map(c => c.s).join(' '); });
    pages.push(rows);
    return '';
  };
  await pdfParse(buffer, { pagerender });
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
  const m = s.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

export async function parsePfPdf(buffer: Buffer): Promise<ParsedPf> {
  const pages = await readRows(buffer);
  const out: ParsedPf = {
    stockCode: null, pfCode: null, supplierName: null, vendorCodeHint: null, pfDate: null,
    type: null, currency: 'USD', totalPrice: null, paymentRule: null, products: [], warnings: [],
  };

  const formIdx = pages.findIndex(p => p.some(r => /ESTIMATED PRODUCTION FORM/i.test(r.text)));
  if (formIdx < 0) {
    out.warnings.push('Trust Lines "Estimated Production Form" page not found — fill the fields by hand.');
  }
  const form = formIdx >= 0 ? pages[formIdx] : [];
  const rowIndex = (re: RegExp) => form.findIndex(r => re.test(r.text));

  // ── Form type (MILLWORK …): row right after the title, or any known type on the title rows
  const titleIdx = rowIndex(/ESTIMATED PRODUCTION FORM/i);
  for (const r of form.slice(Math.max(0, titleIdx), titleIdx + 3)) {
    const t = KNOWN_TYPES.find(k => r.text.toUpperCase().includes(k));
    if (t) { out.type = t; break; }
  }

  // ── Supplier / ORDER NO / Date: header row, values in the next row under each label
  const supIdx = rowIndex(/SUPPLIER INFO/i);
  if (supIdx >= 0) {
    const head = form[supIdx], next = form[supIdx + 1];
    const orderHead = head.cells.find(c => /ORDER NO/i.test(c.s));
    const dateHead = head.cells.find(c => /^DATE$/i.test(c.s));
    const supHead = head.cells.find(c => /SUPPLIER/i.test(c.s));
    if (supHead) out.supplierName = cellAt(next, supHead.x, 60)?.s || null;
    if (orderHead) out.pfCode = cellAt(next, orderHead.x, 60)?.s || null;
    if (dateHead) out.pfDate = toIsoDate(cellAt(next, dateHead.x, 60)?.s || '');
  }
  if (!out.pfDate) {
    const any = form.map(r => toIsoDate(r.text)).find(Boolean);
    if (any) out.pfDate = any;
  }
  if (out.pfCode) out.vendorCodeHint = out.pfCode.split('-')[0] || null;

  // ── Stock code: row under "PROJECT NUMBER"
  const projIdx = rowIndex(/PROJECT NUMBER/i);
  if (projIdx >= 0) {
    const label = form[projIdx].cells.find(c => /PROJECT NUMBER/i.test(c.s))!;
    out.stockCode = cellAt(form[projIdx + 1], label.x, 40)?.s || form[projIdx + 1]?.cells[0]?.s || null;
  }

  // ── Product table(s): from each "ITEM CODE" header down to "TOTAL"
  let category: string | null = null;
  for (let i = 0; i < form.length; i++) {
    const head = form[i];
    const codeHead = head.cells.find(c => /ITEM CODE/i.test(c.s));
    if (!codeHead) continue;
    const descHead = head.cells.find(c => /DESCRIPTION/i.test(c.s));
    const qtyHead = head.cells.find(c => /QUANTITY|QTY/i.test(c.s));
    // Category = closest plain heading rows above the table (e.g. "CABINETRY", "INDUSTRIAL / CABINETS / MDF / BLACK")
    const headings: string[] = [];
    for (let k = i - 1; k >= 0 && headings.length < 2; k--) {
      const t = form[k].text;
      if (/STANDARD ITEMS|PROJECT|CLIENT|SUPPLIER|ORDER NO/i.test(t)) break;
      if (form[k].cells.length === 1) headings.unshift(t);
    }
    if (headings.length) category = headings.join(' — ');

    const body: Row[] = [];
    for (let k = i + 1; k < form.length && !/^\s*TOTAL\b/i.test(form[k].text) && !form[k].cells.some(c => /^TOTAL$/i.test(c.s)); k++) {
      if (form[k].cells.some(c => /ITEM CODE/i.test(c.s))) break;
      body.push(form[k]);
    }
    const descX = descHead ? descHead.x : codeHead.x + 120;
    const isCodeCell = (c: Cell) => c.x < Math.min(descX, codeHead.x + 80) - 20 && c.x >= codeHead.x - 40;
    const anchors = body.filter(r => r.cells.some(isCodeCell));
    for (const a of anchors) {
      const code = a.cells.find(isCodeCell)!.s;
      const qtyCell = qtyHead ? cellAt(a, qtyHead.x, 30) : undefined;
      const quantity = qtyCell ? parseMoney(qtyCell.s) : null;
      // Description = description-column text of the rows closest to this anchor
      const descLines = body
        .filter(r => {
          const nearest = anchors.reduce((b, x) => (Math.abs(x.y - r.y) < Math.abs(b.y - r.y) ? x : b), anchors[0]);
          return nearest === a;
        })
        .sort((p, q) => q.y - p.y)
        .map(r => r.cells.filter(c => !isCodeCell(c) && c !== cellAt(r, qtyHead?.x ?? -999, 30)).map(c => c.s).join(' '))
        .filter(Boolean);
      out.products.push({
        itemCode: code,
        description: descLines.join(' ').replace(/\s+/g, ' ').trim(),
        category,
        quantity: quantity ?? 0,
        unitPrice: null,
        totalPrice: null,
      });
      if (quantity == null) out.warnings.push(`Quantity not found for ${code}.`);
    }
  }
  if (out.products.length === 0) out.warnings.push('No product lines found on the form.');

  // ── Payment rule: "50% advance" / "%50 sözleşmede"
  const allText = pages.flat().map(r => r.text).join('\n');
  const pay = allText.match(/(\d{1,3})\s*%\s*(?:advance|pe[sş]in|deposit)/i)
    || allText.match(/%\s*(\d{1,3})\s*(?:s[oö]zle[sş]me|pe[sş]in|advance)/i)
    || allText.match(/(?:payment|[oö]deme)[^\n]*?%\s*(\d{1,3})/i)
    || allText.match(/(?:payment|[oö]deme)[^\n]*?(\d{1,3})\s*%/i);
  if (pay) out.paymentRule = pay[1];

  // ── Currency
  if (/\bEUR\b|€/.test(allText)) out.currency = 'EUR';
  if (/\bUSD\b|\$/.test(allText)) out.currency = 'USD';
  else if (/\bTL\b|₺|\bTRY\b/.test(allText)) out.currency = 'TL';

  // ── Prices from the quote pages: rows where qty × unit ≈ total
  const used = new Set<number>();
  const quoteRows = pages.filter((_, i) => i !== formIdx).flat();
  for (const r of quoteRows) {
    const nums = r.cells.flatMap(c => c.s.split(/\s{2,}|\s(?=\$)|(?<=\$)\s/))
      .map(s => s.trim()).filter(s => /\d/.test(s))
      .flatMap(s => (/^\d+(\.\d+)?(\s+\d+(\.\d+)?)+$/.test(s) ? s.split(/\s+/) : [s]))
      .map(parseMoney).filter((n): n is number => n != null && n > 0);
    if (nums.length < 3) continue;
    let matched = false;
    for (let pi = 0; pi < out.products.length && !matched; pi++) {
      if (used.has(pi)) continue;
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
  }
  for (const p of out.products) {
    if (p.unitPrice == null) out.warnings.push(`Price not found for ${p.itemCode} — enter it on the preview.`);
  }

  // ── Grand total: "TOTAL PRICE … 39.000.00" on a quote page, else sum of lines
  for (let i = 0; i < quoteRows.length; i++) {
    if (!/TOTAL/i.test(quoteRows[i].text)) continue;
    const candidates = [quoteRows[i], quoteRows[i + 1], quoteRows[i - 1]].filter(Boolean) as Row[];
    for (const r of candidates) {
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

  if (!out.pfCode) out.warnings.push('ORDER NO (PF code) not found.');
  if (!out.stockCode) out.warnings.push('PROJECT NUMBER (stock code) not found.');
  if (!out.supplierName) out.warnings.push('Supplier not found.');
  if (!out.type) out.warnings.push('Type (MILLWORK, …) not found.');
  return out;
}

export { norm as normalizeCode };
