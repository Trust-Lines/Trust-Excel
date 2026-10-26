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
