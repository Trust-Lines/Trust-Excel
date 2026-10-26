import * as fs from 'fs';
import * as path from 'path';
import { launchBrowser } from '../common/pdf/browser';
import { PfItemLayout, normalizeItemCode } from './pf-pdf-parser';

/**
 * Re-order PF: the Trust Lines "PRODUCTION FORM" (same layout as the PFs we
 * import — US Letter, same bands, columns, total bar, signature boxes and payment note),
 * one page per vendor, listing what has to be re-ordered.
 */

export interface ReorderPfLine {
  itemCode: string;
  description: string;
  dimensions: string | null;
  category: string | null;      // "CABINETRY — INDUSTRIAL / CABINETS / MDF / BLACK"
  quantity: number;
  unitPrice: number | null;
  currency: string;
  picture?: string | null;      // data URL cropped from the product's original PF
}

export interface ReorderPfPage {
  supplierName: string;
  pfCode: string;               // ORDER NO
  stockCode: string;            // PROJECT NUMBER
  date: string;                 // m/d/yyyy, as on our PFs
  formType: string;             // MILLWORK …
  paymentNote: string;
  lines: ReorderPfLine[];
}

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const money = (v: number, currency: string) => {
  const sym = currency === 'TL' ? '₺' : currency === 'EUR' ? '€' : '$';
  return sym + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const assetCache = new Map<string, string>();
/** assets/<name> as a data URL ('' when missing) */
function asset(name: string, mime: string): string {
  if (assetCache.has(name)) return assetCache.get(name)!;
  const candidates = [
    path.join(__dirname, 'assets', name),
    path.join(__dirname, '..', '..', 'src', 'trust-stock', 'assets', name), // compiled → asset stays in src
    path.join(process.cwd(), 'server', 'src', 'trust-stock', 'assets', name),
  ];
  for (const p of candidates) {
    try {
      const url = `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`;
      assetCache.set(name, url);
      return url;
    } catch { /* next */ }
  }
  return '';
}
const logo = () => asset('pf-logo.png', 'image/png');

/** Carlito = Calibri's metrics (our PFs are Calibri), embedded so the server renders the same everywhere */
function fontFaces(): string {
  return ([['Regular', 400, 'normal'], ['Bold', 700, 'normal'], ['Italic', 400, 'italic'], ['BoldItalic', 700, 'italic']] as const)
    .map(([f, w, s]) => {
      const url = asset(`Carlito-${f}.ttf`, 'font/ttf');
      return url ? `@font-face { font-family: 'PfCalibri'; src: url(${url}) format('truetype'); font-weight: ${w}; font-style: ${s}; }` : '';
    }).join('\n');
}

/** One page of the form. Sizes in pt, measured from the real PFs (612 × 792). */
interface SignatureBlock { url: string; width: number }

function pageHtml(pg: ReorderPfPage, signature: SignatureBlock | null): string {
  // group lines by category → [section bar (black), sub-category bar (gray)]
  const groups: { section: string; sub: string; lines: ReorderPfLine[] }[] = [];
  let lastSec = '';
  for (const l of pg.lines) {
    const cat = (l.category || '').toUpperCase().replace(/\s+/g, ' ').replace(/\s*\/\s*/g, ' / ').trim();
    let [section, ...rest] = cat.split(/\s*[—–]\s*/);
    let sub = rest.join(' — ');
    // "INDUSTRIAL / CABINETS / MDF / BLACK" alone is a sub-category of the section above it
    if (!sub && section.includes(' / ')) {
      sub = section;
      section = groups.find(x => x.sub === sub)?.section ?? lastSec;
    }
    section = section || '';
    if (section) lastSec = section;
    let g = groups.find(x => x.section === section && x.sub === sub);
    if (!g) { g = { section, sub, lines: [] }; groups.push(g); }
    g.lines.push(l);
  }
  const currency = pg.lines.find(l => l.currency)?.currency || 'USD';
  const totalQty = pg.lines.reduce((s, l) => s + l.quantity, 0);
  const totalPrice = pg.lines.reduce((s, l) => s + (l.unitPrice ?? 0) * l.quantity, 0);
  const anyPrice = pg.lines.some(l => l.unitPrice != null);

  let lastSection = '';
  const body = groups.map(g => {
    const sectionBar = g.section && g.section !== lastSection ? `<div class="bar black">${esc(g.section)}</div>` : '';
    lastSection = g.section || lastSection;
    return `${sectionBar}
      ${g.sub ? `<div class="bar gray">${esc(g.sub)}</div>` : ''}
      <table class="items">
        <colgroup><col style="width:89pt"><col style="width:210pt"><col style="width:41pt"><col style="width:34pt"><col style="width:86pt"><col style="width:111pt"></colgroup>
        <tr class="head"><td>ITEM CODE</td><td>DESCRIPTION</td><td>PIC</td><td>QUANTITY</td><td>PRICE</td><td>TOTAL</td></tr>
        ${g.lines.map(l => `
        <tr class="row">
          <td class="code">${esc(l.itemCode)}</td>
          <td class="desc">${esc(l.description)}${l.dimensions ? `<br>( ${esc(l.dimensions.replace(/ (?=[WH]=)/g, '-'))})` : ''}</td>
          <td class="pic">${l.picture ? `<img src="${l.picture}">` : ''}</td>
          <td class="qty">${l.quantity}</td>
          <td class="num">${l.unitPrice != null ? money(l.unitPrice, l.currency) : ''}</td>
          <td class="num">${l.unitPrice != null ? money(l.unitPrice * l.quantity, l.currency) : ''}</td>
        </tr>`).join('')}
      </table>`;
  }).join('');

  return `
  <section class="page">
    <div class="top">
      <div class="logo-box">${logo() ? `<img src="${logo()}">` : ''}</div>
      <div class="title-box">
        <div class="title">PRODUCTION FORM</div>
        <div class="type">${esc(pg.formType)}</div>
      </div>
    </div>

    <table class="grid">
      <colgroup><col style="width:306pt"><col style="width:34pt"><col style="width:102pt"><col style="width:129pt"></colgroup>
      <tr class="label"><td>SUPPLIER INFO</td><td></td><td class="c">ORDER NO:</td><td class="c">Date</td></tr>
      <tr class="value"><td class="big">${esc(pg.supplierName)}</td><td></td><td class="c order"><span class="fit">${esc(pg.pfCode)}</span></td><td class="c big date">${esc(pg.date)}</td></tr>
    </table>
    <table class="grid">
      <colgroup><col style="width:89pt"><col style="width:353pt"><col style="width:129pt"></colgroup>
      <tr class="label"><td colspan="3">Project INFO</td></tr>
      <tr class="client"><td class="c small">PROJECT NUMBER</td><td class="clientname">Client : <b>TRUST LINES</b></td><td></td></tr>
      <tr class="stock"><td class="c stockcode">${esc(pg.stockCode)}</td><td class="trustlines">TRUST LINES-TR</td><td></td></tr>
    </table>

    <div class="bar red">STANDARD ITEMS / BASIC COLORS</div>
    ${body}

    <table class="items total">
      <colgroup><col style="width:89pt"><col style="width:210pt"><col style="width:41pt"><col style="width:34pt"><col style="width:86pt"><col style="width:111pt"></colgroup>
      <tr><td colspan="3" class="tl">TOTAL</td><td class="tq">${totalQty}</td><td></td><td class="tp">${anyPrice ? money(totalPrice, currency) : ''}</td></tr>
    </table>
    ${signature ? `<img class="signblock" src="${signature.url}" style="width:${signature.width}pt">` : `
    <table class="sign">
      <colgroup><col style="width:124pt"><col style="width:106pt"><col style="width:144pt"><col style="width:86pt"><col style="width:111pt"></colgroup>
      <tr class="head"><td>PRODUCTION MANAGER</td><td>PROJECT MANAGER</td><td>TRUST LINES MANAGER</td><td>GENERAL MANAGER</td><td>ACCOUNTANT</td></tr>
      <tr class="space"><td></td><td></td><td></td><td></td><td></td></tr>
      <tr class="blank"><td colspan="5"></td></tr>
    </table>
    <div class="note">
      <div class="nt">PAYMENT TERMS NOTE</div>
      <div>${esc(pg.paymentNote)}</div>
    </div>
    <div class="endline"></div>`}
  </section>`;
}

const CSS = `
  @page { size: 612pt 792pt; margin: 30pt 0 25pt; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: PfCalibri, Calibri, Carlito, "Segoe UI", Arial, sans-serif; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 612pt; padding: 25pt 20pt 0 21pt; page-break-after: always; position: relative; }
  .page:last-child { page-break-after: auto; }
  .top { display: flex; height: 59pt; border-top: 0.75pt solid #000; }
  .logo-box { width: 340pt; border-top: 0.75pt solid #000; margin-top: -0.75pt; padding: 8pt 0 0 6pt; }
  .logo-box img { width: 130pt; height: auto; display: block; }
  .title-box { width: 231pt; border: 0.75pt solid #000; border-top: none; }
  .title { background: #d9d9d9; height: 19pt; font-size: 15pt; font-weight: 700; text-align: center; line-height: 19pt; border-bottom: 0.75pt solid #000; }
  .type { background: #808080; color: #fff; height: 39pt; font-size: 15pt; font-weight: 700; text-align: center; line-height: 39pt; }
  table { border-collapse: collapse; width: 571pt; table-layout: fixed; }
  td { border: 0.75pt solid #000; padding: 0 3pt; vertical-align: middle; }
  .grid { margin-top: 9pt; }
  .grid + .grid { margin-top: -0.75pt; }
  .grid .label td { background: #a6a6a6; font-size: 8pt; font-weight: 700; height: 12pt; }
  .grid .value td { height: 19pt; font-size: 11pt; font-weight: 700; }
  .grid .order { background: #d9d9d9; white-space: nowrap; padding: 0 2pt; }
  .grid .order .fit { font-size: 9.5pt; display: inline-block; }
  .grid .date { background: #d9d9d9; }
  .grid .c { text-align: center; }
  .grid .client td { height: 16pt; }
  .grid .small { font-size: 8pt; font-weight: 700; }
  .grid .clientname { font-size: 11pt; }
  .grid .stock td { height: 36pt; }
  .grid .stockcode { background: #d9d9d9; font-size: 12pt; font-weight: 700; }
  .grid .trustlines { font-size: 15pt; font-weight: 700; }
  .bar { width: 571pt; font-size: 9pt; font-weight: 700; color: #fff; padding: 0 3pt; border: 0.75pt solid #000; }
  .bar.red { background: #c00000; text-align: center; height: 13pt; line-height: 12pt; margin-top: 3pt; }
  .bar.black { background: #000; height: 12pt; line-height: 11pt; margin-top: 3pt; }
  .bar.gray { background: #595959; height: 12pt; line-height: 11pt; margin-top: 4pt; }
  .items { margin-top: 4pt; }
  .items .head td { background: #000; color: #fff; font-size: 8pt; font-weight: 700; text-align: center; height: 15pt; }
  .items tr { page-break-inside: avoid; }
  .items .row td { height: 30pt; font-size: 8pt; text-align: center; }
  .items .code { font-weight: 700; }
  .items .desc { font-size: 7.5pt; line-height: 1.25; }
  .items .pic { padding: 1pt; }
  .items .pic img { max-width: 39pt; max-height: 27pt; display: block; margin: 0 auto; }
  .items .qty { font-size: 7.5pt; }
  .items .num { font-size: 8pt; }
  .total { margin-top: 2pt; }
  .total td { background: #ffc000; height: 13pt; font-weight: 700; border-color: #ffc000; }
  .total .tl { text-align: right; font-size: 11pt; padding-right: 6pt; }
  .total .tq { font-size: 10pt; }
  .total .tp { text-align: right; font-size: 11pt; }
  .sign { margin-top: 1pt; }
  .sign .head td { font-size: 8pt; font-weight: 700; text-align: center; height: 12pt; border-bottom: none; }
  .sign .space td { height: 18pt; border-top: none; }
  .sign .blank td { height: 10pt; }
  .note { width: 571pt; border: 0.75pt solid #000; border-top: none; font-size: 7pt; font-style: italic; padding: 3pt 3pt 4pt; }
  .note .nt { font-weight: 700; font-size: 8pt; }
  .endline { width: 571pt; height: 10pt; border: 0.75pt solid #000; border-top: none; }
  .signblock { display: block; margin: 1pt 0 0 -1pt; page-break-inside: avoid; }
`;

/**
 * Copy each product's picture out of its original PF: render the PF page with pdf.js in the
 * browser and crop the PIC cell. Returns itemCode(upper) → data URL.
 */
async function cropPictures(browser: any, sources: { pdf: Buffer; layout: PfItemLayout[] }[]): Promise<Map<string, string>> {
  const pics = new Map<string, string>();
  if (!sources.length) return pics;
  const dir = path.dirname(require.resolve('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js'));
  const page = await browser.newPage();
  try {
    await page.setContent('<html><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(path.join(dir, 'pdf.js'), 'utf8') });
    await page.evaluate((code: string) => {
      (window as any).PDFJS.workerSrc = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    }, fs.readFileSync(path.join(dir, 'pdf.worker.js'), 'utf8'));
    for (const src of sources) {
      try {
        const crops: [string, string][] = await page.evaluate(async (b64: string, layout: PfItemLayout[]) => {
          const PDFJS = (window as any).PDFJS;
          const pdf = await PDFJS.getDocument({ data: Uint8Array.from(atob(b64), c => c.charCodeAt(0)) }).promise;
          const S = 4;
          const out: [string, string][] = [];
          const rendered = new Map<number, { canvas: HTMLCanvasElement; H: number }>();
          for (const l of layout) {
            if (!rendered.has(l.page)) {
              const pg = await pdf.getPage(l.page + 1);
              const vp = pg.getViewport(S);
              const canvas = document.createElement('canvas');
              canvas.width = vp.width; canvas.height = vp.height;
              await pg.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
              rendered.set(l.page, { canvas, H: pg.getViewport(1).height });
            }
            const { canvas, H } = rendered.get(l.page)!;
            // inset past the cell borders, then trim white space around the picture
            const x = l.x0 + 1.5, y = H - l.y1 + 1.5, w = l.x1 - l.x0 - 3, h = l.y1 - l.y0 - 3;
            const c = document.createElement('canvas'); c.width = w * S; c.height = h * S;
            const ctx = c.getContext('2d')!;
            ctx.drawImage(canvas, x * S, y * S, w * S, h * S, 0, 0, w * S, h * S);
            const d = ctx.getImageData(0, 0, c.width, c.height).data;
            let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
            for (let yy = 0; yy < c.height; yy++) for (let xx = 0; xx < c.width; xx++) {
              const k = (yy * c.width + xx) * 4;
              if (d[k] < 225 || d[k + 1] < 225 || d[k + 2] < 225) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
            }
            if (x1 < 0 || (x1 - x0) < 8 || (y1 - y0) < 8) continue; // empty cell
            const t = document.createElement('canvas'); t.width = x1 - x0 + 1; t.height = y1 - y0 + 1;
            t.getContext('2d')!.drawImage(c, x0, y0, t.width, t.height, 0, 0, t.width, t.height);
            out.push([l.itemCode, t.toDataURL('image/png')]);
          }
          return out;
        }, src.pdf.toString('base64'), src.layout);
        for (const [k, v] of crops) if (!pics.has(normalizeItemCode(k))) pics.set(normalizeItemCode(k), v);
      } catch { /* a PF whose pictures can't be read just leaves PIC empty */ }
    }
  } finally {
    await page.close().catch(() => {});
  }
  return pics;
}

/**
 * The signature block of an original PF (signature boxes with the signatures in them, payment
 * note), cropped from the first source that is actually signed. `sources` come newest first.
 */
async function cropSignature(browser: any, sources: { pdf: Buffer }[]): Promise<SignatureBlock | null> {
  if (!sources.length) return null;
  const dir = path.dirname(require.resolve('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js'));
  const page = await browser.newPage();
  try {
    await page.setContent('<html><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(path.join(dir, 'pdf.js'), 'utf8') });
    await page.evaluate((code: string) => {
      (window as any).PDFJS.workerSrc = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    }, fs.readFileSync(path.join(dir, 'pdf.worker.js'), 'utf8'));
    for (const src of sources) {
      try {
        const sig: SignatureBlock | null = await page.evaluate(async (b64: string) => {
          const PDFJS = (window as any).PDFJS;
          const pdf = await PDFJS.getDocument({ data: Uint8Array.from(atob(b64), c => c.charCodeAt(0)) }).promise;
          const S = 4;
          for (let n = pdf.numPages; n >= 1; n--) {
            const pg = await pdf.getPage(n);
            const H = pg.getViewport(1).height;
            const items = (await pg.getTextContent()).items.map((i: any) => ({ s: String(i.str).trim(), y: H - i.transform[5] }));
            const head = items.find((i: any) => /PRODUCTION MANAGER/i.test(i.s));
            const note = items.find((i: any) => /PAYMENT TERMS/i.test(i.s) && (!head || i.y > head.y));
            if (!head || !note) continue;
            const vp = pg.getViewport(S);
            const canvas = document.createElement('canvas'); canvas.width = vp.width; canvas.height = vp.height;
            await pg.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            const ctx = canvas.getContext('2d')!;
            const W = canvas.width;
            const img = ctx.getImageData(0, 0, W, canvas.height).data;
            const dark = (x: number, y: number) => { const k = (y * W + x) * 4; return img[k] + img[k + 1] + img[k + 2] < 300; };
            // a table border: a dark run across the right part of the page (signatures don't reach that far as a straight line)
            const isLine = (y: number) => { let c = 0; const a = Math.round(430 * S), b = Math.round(580 * S); for (let x = a; x < b; x++) if (dark(x, y)) c++; return c > (b - a) * 0.9; };
            let top = -1;
            for (let y = Math.round(head.y * S); y > Math.round((head.y - 20) * S); y--) if (isLine(y)) { top = y; break; }
            // below the note: its bottom border, then the empty row's bottom border
            let bottom = -1, found = 0;
            for (let y = Math.round((note.y + 2) * S); y < Math.min(canvas.height, Math.round((note.y + 60) * S)); y++) {
              if (isLine(y)) { found++; bottom = y; if (found === 2) break; while (isLine(y + 1)) y++; }
            }
            if (top < 0 || bottom < 0) continue;
            // left / right frame from the top border
            let x0 = 0, x1 = W - 1;
            while (x0 < W && !dark(x0, top)) x0++;
            while (x1 > 0 && !dark(x1, top)) x1--;
            // signed? count ink between the header row and the note, ignoring the vertical borders
            const y0 = Math.round((head.y + 3) * S), y1 = Math.round((note.y - 10) * S);
            const inked = (x: number, y: number) => dark(x, y) || (img[(y * W + x) * 4 + 2] > 150 && img[(y * W + x) * 4] < 120); // black or blue pen
            const borderRow = new Set<number>();
            for (let y = y0; y < y1; y++) { let c = 0; for (let x = x0; x < x1; x++) if (inked(x, y)) c++; if (c > (x1 - x0) * 0.6) borderRow.add(y); }
            let ink = 0;
            for (let x = x0 + 8; x < x1 - 8; x++) {
              let col = 0;
              for (let y = y0; y < y1; y++) if (!borderRow.has(y) && inked(x, y)) col++;
              if (col < (y1 - y0) * 0.6) ink += col;   // a full-height column is a border
            }
            if (ink < 200 * S * S) return null;          // blank boxes (stray marks only: ~550 vs ~15,000 for real signatures at 4×)
            const pad = S; // 1pt
            const t = document.createElement('canvas');
            t.width = x1 - x0 + 2 * pad; t.height = bottom - top + 2 * pad;
            t.getContext('2d')!.drawImage(canvas, x0 - pad, top - pad, t.width, t.height, 0, 0, t.width, t.height);
            // scaled to our frame (571pt + the 1pt margins), whatever page size the original was
            return { url: t.toDataURL('image/png'), width: 571 * t.width / (x1 - x0) };
          }
          return null;
        }, src.pdf.toString('base64'));
        if (sig) return sig;
      } catch { /* try the next PF */ }
    }
  } finally {
    await page.close().catch(() => {});
  }
  return null;
}

/** Build the PDF: pictures are taken from `sources` (original PFs, newest first) by item code, the signatures from the newest signed one. */
export async function renderReorderPf(pages: ReorderPfPage[], sources: { pdf: Buffer; layout: PfItemLayout[] }[]): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const pics = await cropPictures(browser, sources);
    for (const pg of pages) for (const l of pg.lines) if (!l.picture) l.picture = pics.get(normalizeItemCode(l.itemCode)) || null;
    const signature = await cropSignature(browser, sources);
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${fontFaces()}${CSS}</style></head><body>${pages.map(pg => pageHtml(pg, signature)).join('')}</body></html>`, { waitUntil: 'load' });
    // long PF codes: shrink the text until it fits its cell (never wraps or spills over the border)
    await page.evaluate(async () => {
      await (document as any).fonts.ready;
      document.querySelectorAll<HTMLElement>('.fit').forEach(el => {
        const room = el.parentElement!.clientWidth - 6;
        let size = parseFloat(getComputedStyle(el).fontSize);
        while (el.offsetWidth > room && size > 5) { size -= 0.25; el.style.fontSize = `${size}px`; }
      });
    });
    const pdf = await page.pdf({ format: 'Letter', printBackground: true, preferCSSPageSize: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close().catch(() => {});
  }
}
