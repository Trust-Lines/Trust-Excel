import React, { useState, useEffect, useMemo } from 'react';
import { getProjects } from '../lib/projects';
import { getMissingExtraCases } from '../lib/missing-extra';
import { getDirectOrders } from '../lib/direct-orders';
import { mapBackendTypeToFrontend, mapItemStatusToFrontend } from '../lib/projects';
import { getStatusStyle } from '../utils/statusStyles';
import { TYPE_ORDER } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useColumnPermissions } from '../hooks/useColumnPermissions';
import { formatDateCell } from '../lib/dateUtils';
import { getPfGroups, PfGroup, tiersOfGroup } from '../lib/pf-groups';
import trustLogo from '../src/Trust_Lines-DSB-Black.png';

/* ============================================================================
 * REPORTS PAGE
 * Printable report templates built from on-the-fly project / missing&extra /
 * direct-order data. Each template selects items by status, merges ALL vendors
 * into ONE table, and prints clean on A4.
 * ========================================================================== */

// A single flattened row in a report
interface ReportRow {
  source: 'P' | 'ME' | 'DO';
  projectNo: string;
  supplier: string;       // vendor display ("YSM - YAŞAMPLUS") or "—"
  type: string;
  pfCode: string;
  orderType: string;
  status: string;         // backend status enum (STATUS column of mixed-status reports)
  priceText: string;      // "$1,800.00" | "₺8,100.00" | "-"
  priceSort: number;      // for stable sorting if needed
  priceUsd: number;       // pf price split by currency (for totals)
  priceTl: number;
  invoiceText: string;    // same shape as priceText, but from invoice/invoiceTl
  invoiceUsd: number;
  invoiceTl: number;
  orderedDate: string;    // STD, formatted dd/MM/yyyy — '-' if not ordered yet
  projectId?: string;     // Projects source only — needed to match against PF Groups

  // Payment status (pulled from accounting fields: paid vs effective price)
  payment: {
    hasPrice: boolean;
    fullyPaid: boolean;
    text: string;         // paid amount (if paid) or remaining (if unpaid)
    paidUsd: number; paidTl: number; remUsd: number; remTl: number;
  };
}

interface ReportTemplate {
  key: string;
  label: string;
  /** backend status enums this report includes */
  statuses: string[];
  /** banner color */
  color: string;
  /**
   * Mixed-status reports: adds a STATUS column so rows can be told apart, and
   * lets the user narrow the report to some of these statuses at the top.
   */
  statusOptions?: string[];
}

// Report templates. "On Hold" is the first/active one (red).
// NOTE: the status groupings below mirror the board sections — tell me if any
// status should move to a different report.
const REPORT_TEMPLATES: ReportTemplate[] = [
  { key: 'to_order',      label: 'To Order',         statuses: ['TO_ORDER'], color: '#b91c1c' },
  { key: 'in_production', label: 'Ordered',           statuses: ['ORDERED', 'WAITING_PAYMENT', 'ASSEMBLY'], color: '#16a34a' },
  { key: 'new_orders',    label: 'Not Ordered',       statuses: ['NOT_ORDERED', 'BOOKS_IN_PROGRESS'], color: '#f59e0b', statusOptions: ['NOT_ORDERED', 'BOOKS_IN_PROGRESS'] },
  { key: 'on_hold',       label: 'On Hold',          statuses: ['HOLD_T', 'HOLD_PM', 'HOLD_BOOKS'], color: '#dc2626', statusOptions: ['HOLD_T', 'HOLD_PM', 'HOLD_BOOKS'] },
  { key: 'received_sent', label: 'Received and Sent', statuses: ['READY_TO_RECEIVE', 'RECEIVED', 'READY', 'SENT_TO_TLINES', 'PARTIAL_SENT', 'SENT'], color: '#15803d' },
];

// ── Helpers ──────────────────────────────────────────────────────────

function toNumber(v: any): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** PF price: whichever currency is filled → "$x" (USD) or "₺x" (TL), else "-" */
function priceFor(item: any): { text: string; sort: number; usd: number; tl: number } {
  const usd = toNumber(item.pfUsd);
  const tl = toNumber(item.pfTl);
  if (usd > 0) return { text: '$' + usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), sort: usd, usd, tl: 0 };
  if (tl > 0) return { text: '₺' + tl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), sort: tl, usd: 0, tl };
  return { text: '-', sort: 0, usd: 0, tl: 0 };
}

/** Invoice price: whichever currency is filled → "$x" (USD) or "₺x" (TL), else "-" */
function invoiceFor(item: any): { text: string; sort: number; usd: number; tl: number } {
  const usd = toNumber(item.invoice);
  const tl = toNumber(item.invoiceTl);
  if (usd > 0) return { text: '$' + usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), sort: usd, usd, tl: 0 };
  if (tl > 0) return { text: '₺' + tl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), sort: tl, usd: 0, tl };
  return { text: '-', sort: 0, usd: 0, tl: 0 };
}

/** Total label like "$1,200.00  ·  ₺8,100.00" (omits zero currencies, "-" if both 0) */
function totalText(usd: number, tl: number): string {
  const parts: string[] = [];
  if (usd > 0.001) parts.push(moneyText('$', usd));
  if (tl > 0.001) parts.push(moneyText('₺', tl));
  return parts.length ? parts.join('   ·   ') : '-';
}

function todayStr(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function moneyText(currency: '$' | '₺', n: number): string {
  return currency + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Vendor display text for an item */
function supplierFor(item: any): string {
  const v = item.vendor;
  if (!v) return '—';
  if (typeof v === 'string') return v || '—';
  return v.code ? `${v.code} - ${v.name ?? ''}` : (v.name || '—');
}

/**
 * Payment status from accounting fields.
 * Effective price = invoice if entered, else pf (per currency). Paid = sum of the
 * two paid fields in that currency. Fully paid → green + paid amount;
 * otherwise → red + remaining amount.
 */
function paymentFor(item: any): {
  hasPrice: boolean; fullyPaid: boolean; text: string;
  paidUsd: number; paidTl: number; remUsd: number; remTl: number;
} {
  const usdBase = toNumber(item.invoice) > 0 ? toNumber(item.invoice) : toNumber(item.pfUsd);
  const tlBase = toNumber(item.invoiceTl) > 0 ? toNumber(item.invoiceTl) : toNumber(item.pfTl);

  let base = 0;
  let currency: '$' | '₺' = '$';
  let paid = 0;

  if (usdBase > 0) {
    base = usdBase; currency = '$';
    paid = toNumber(item.paidUsd1) + toNumber(item.paidUsd2);
  } else if (tlBase > 0) {
    base = tlBase; currency = '₺';
    paid = toNumber(item.paidTl1) + toNumber(item.paidTl2);
  }

  const zero = { paidUsd: 0, paidTl: 0, remUsd: 0, remTl: 0 };
  const hasPrice = base > 0;
  if (!hasPrice) return { hasPrice: false, fullyPaid: false, text: '-', ...zero };

  const remaining = Math.max(0, base - paid);
  const fullyPaid = paid >= base - 0.001;
  const isUsd = currency === '$';
  return {
    hasPrice: true,
    fullyPaid,
    text: fullyPaid ? moneyText(currency, paid) : moneyText(currency, remaining),
    paidUsd: isUsd ? paid : 0,
    paidTl: isUsd ? 0 : paid,
    remUsd: isUsd ? remaining : 0,
    remTl: isUsd ? 0 : remaining,
  };
}

const Reports: React.FC = () => {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { isColumnVisible } = useColumnPermissions();
  // Reports had no permission gating at all — a role that's hidden pfUsd/pfTl/invoice/invoiceTl
  // elsewhere in the app could still see them here. Mirror the same column keys.
  const canSeePf = isColumnVisible('pfUsd') || isColumnVisible('pfTl');
  const canSeeInvoice = isColumnVisible('invoice') || isColumnVisible('invoiceTl');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // All on-board items flattened once (across the three sources)
  const [allItems, setAllItems] = useState<Array<{ source: 'P' | 'ME' | 'DO'; projectNo: string; status: string; item: any; projectId?: string }>>([]);

  const [selectedTemplate, setSelectedTemplate] = useState<string>('on_hold');
  const [typeFilter, setTypeFilter] = useState<string>(''); // '' = all types
  const [showPrice, setShowPrice] = useState<boolean>(true); // PF Price column visibility
  const [showInvoice, setShowInvoice] = useState<boolean>(true); // Invoice Price column visibility
  const [showPayment, setShowPayment] = useState<boolean>(true); // Payment column visibility (supplier mode)
  const [showOrderedDate, setShowOrderedDate] = useState<boolean>(true); // Ordered date (STD) column visibility
  const [groupMode, setGroupMode] = useState<'project' | 'supplier' | 'group'>('project'); // split by project, supplier, or PF Group
  const [pfGroups, setPfGroups] = useState<PfGroup[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<'' | 'paid' | 'unpaid'>(''); // supplier mode only
  const [supplierFilter, setSupplierFilter] = useState<string>(''); // '' = all suppliers
  const [statusFilter, setStatusFilter] = useState<string[]>([]); // [] = every status of the selected report

  // Force the price/invoice toggles off (and keep them off) for roles that don't have
  // pfUsd/pfTl/invoice/invoiceTl visibility — otherwise a restricted role could just
  // check the box themselves and see the numbers anyway.
  useEffect(() => { if (!canSeePf && showPrice) setShowPrice(false); }, [canSeePf, showPrice]);
  useEffect(() => { if (!canSeeInvoice && showInvoice) setShowInvoice(false); }, [canSeeInvoice, showInvoice]);

  // 'all' renders every template (combined PDF); otherwise the single selected one
  const activeTemplates = selectedTemplate === 'all'
    ? REPORT_TEMPLATES
    : REPORT_TEMPLATES.filter(t => t.key === selectedTemplate);

  // ── Load data from the three sources ──
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [projectsResp, meCases, doResp] = await Promise.all([
          getProjects(),
          getMissingExtraCases(),
          getDirectOrders(),
        ]);
        if (!alive) return;

        const flat: Array<{ source: 'P' | 'ME' | 'DO'; projectNo: string; status: string; item: any; projectId?: string }> = [];

        // Projects
        (projectsResp.data || []).forEach((project: any) => {
          (project.items || []).forEach((item: any) => {
            flat.push({ source: 'P', projectNo: String(project.projectNo), status: item.status || '', item, projectId: item.projectId || project.id });
          });
        });

        // Missing & Extra (grouped by section → cases → items; use derived code as "project no")
        Object.values(meCases || {}).forEach((cases: any) => {
          (cases || []).forEach((meCase: any) => {
            (meCase.items || []).forEach((item: any) => {
              flat.push({ source: 'ME', projectNo: meCase.derivedProjectCode, status: item.status || '', item });
            });
          });
        });

        // Direct Orders (sections → projects → items)
        ((doResp as any).sections || []).forEach((section: any) => {
          (section.projects || []).forEach((project: any) => {
            (project.items || []).forEach((item: any) => {
              flat.push({ source: 'DO', projectNo: String(project.projectNo), status: item.status || '', item });
            });
          });
        });

        setAllItems(flat);
      } catch (err: any) {
        if (alive) setError(err?.message || 'Failed to load report data');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [authLoading, isAuthenticated]);

  // PF Groups — only needed when "Group by: Group" is selected; harmless to fetch once regardless.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    getPfGroups().then(setPfGroups).catch(() => { /* non-critical: group-by-group just shows empty */ });
  }, [authLoading, isAuthenticated]);

  const typeIdx = (t: string) => { const i = TYPE_ORDER.indexOf(t as any); return i === -1 ? 999 : i; };

  // Build a full report (rows + groupings + totals) for one template, honoring filters
  const buildReport = (tmpl: ReportTemplate) => {
    // Sub-status selection only applies to the single selected report (not the combined view)
    const narrowed = selectedTemplate !== 'all' && !!tmpl.statusOptions && statusFilter.length > 0;
    const statusSet = new Set(narrowed ? tmpl.statuses.filter(st => statusFilter.includes(st)) : tmpl.statuses);
    const rows: ReportRow[] = [];

    for (const entry of allItems) {
      if (!statusSet.has(entry.status)) continue;
      const pfCode = (entry.item.pfCode || '').trim();
      if (!pfCode) continue; // skip items without a PF code
      const displayType = mapBackendTypeToFrontend(entry.item.type, entry.item.customType);
      if (typeFilter && displayType !== typeFilter) continue;

      const supplier = supplierFor(entry.item);
      if (supplierFilter && supplier !== supplierFilter) continue;

      const price = priceFor(entry.item);
      const invoice = invoiceFor(entry.item);
      const payment = paymentFor(entry.item);

      // Paid / Unpaid filter (supplier mode only)
      if (groupMode === 'supplier' && paymentFilter) {
        if (paymentFilter === 'paid' && !payment.fullyPaid) continue;
        if (paymentFilter === 'unpaid' && !(payment.hasPrice && !payment.fullyPaid)) continue;
      }

      rows.push({
        source: entry.source,
        projectNo: entry.projectNo,
        supplier,
        type: displayType,
        pfCode: entry.item.pfCode || '',
        orderType: entry.item.orderType || '',
        status: entry.status,
        priceText: price.text,
        priceSort: price.sort,
        priceUsd: price.usd,
        priceTl: price.tl,
        invoiceText: invoice.text,
        invoiceUsd: invoice.usd,
        invoiceTl: invoice.tl,
        orderedDate: formatDateCell(entry.item.std) || '-',
        projectId: entry.projectId,
        payment,
      });
    }

    rows.sort((a, b) => {
      if (a.projectNo !== b.projectNo) return a.projectNo.localeCompare(b.projectNo, undefined, { numeric: true });
      if (typeIdx(a.type) !== typeIdx(b.type)) return typeIdx(a.type) - typeIdx(b.type);
      return a.pfCode.localeCompare(b.pfCode);
    });

    // Project grouping (Project No → Type)
    const byProject: { projectNo: string; rows: ReportRow[] }[] = [];
    for (const r of rows) {
      let g = byProject.find(x => x.projectNo === r.projectNo);
      if (!g) { g = { projectNo: r.projectNo, rows: [] }; byProject.push(g); }
      g.rows.push(r);
    }
    const grouped = byProject.map(g => {
      const types: { type: string; rows: ReportRow[] }[] = [];
      for (const r of g.rows) {
        let t = types.find(x => x.type === r.type);
        if (!t) { t = { type: r.type, rows: [] }; types.push(t); }
        t.rows.push(r);
      }
      return { projectNo: g.projectNo, total: g.rows.length, types };
    });

    // Supplier grouping
    const bySupplier: { supplier: string; rows: ReportRow[] }[] = [];
    for (const r of rows) {
      let g = bySupplier.find(x => x.supplier === r.supplier);
      if (!g) { g = { supplier: r.supplier, rows: [] }; bySupplier.push(g); }
      g.rows.push(r);
    }
    bySupplier.forEach(g => g.rows.sort((a, b) => {
      if (typeIdx(a.type) !== typeIdx(b.type)) return typeIdx(a.type) - typeIdx(b.type);
      return a.pfCode.localeCompare(b.pfCode);
    }));
    bySupplier.sort((a, b) => a.supplier.localeCompare(b.supplier));

    // PF Group grouping (Group N → rank tier → member's rows) — Projects source only,
    // since PF Groups reference the `projects` table. Groups/tiers with nothing
    // matching the current template/filters are dropped.
    const byGroup = pfGroups
      .map(g => {
        const tiers = tiersOfGroup(g)
          .map(([rank, members]) => {
            const tierMembers = members
              .map(m => ({
                projectNo: m.projectNo,
                typeLabel: m.typeLabel,
                rows: rows.filter(r => r.projectId === m.projectId && r.type === m.typeLabel),
              }))
              .filter(m => m.rows.length > 0);
            return { rank, members: tierMembers };
          })
          .filter(t => t.members.length > 0);
        return { id: g.id, number: g.number, tiers };
      })
      .filter(g => g.tiers.length > 0);

    // Group view only shows rows that belong to a PF Group — count and total just those
    const groupedRows = new Set(byGroup.flatMap(g => g.tiers.flatMap(t => t.members.flatMap(m => m.rows))));
    const shownRowCount = groupMode === 'group'
      ? byGroup.reduce((n, g) => n + g.tiers.reduce((m, t) => m + t.members.reduce((k, mem) => k + mem.rows.length, 0), 0), 0)
      : rows.length;

    // Totals (split by currency)
    let priceUsd = 0, priceTl = 0, invoiceUsd = 0, invoiceTl = 0, paidUsd = 0, paidTl = 0, remUsd = 0, remTl = 0;
    for (const r of groupMode === 'group' ? [...groupedRows] : rows) {
      priceUsd += r.priceUsd; priceTl += r.priceTl;
      invoiceUsd += r.invoiceUsd; invoiceTl += r.invoiceTl;
      paidUsd += r.payment.paidUsd; paidTl += r.payment.paidTl;
      remUsd += r.payment.remUsd; remTl += r.payment.remTl;
    }

    return { template: tmpl, rows, grouped, groupedBySupplier: bySupplier, groupedByGroup: byGroup, shownRowCount, totals: { priceUsd, priceTl, invoiceUsd, invoiceTl, paidUsd, paidTl, remUsd, remTl } };
  };

  // One report per active template (1 for a single selection, 4 for "all")
  const reports = useMemo(
    () => activeTemplates.map(buildReport),
    [allItems, selectedTemplate, typeFilter, groupMode, paymentFilter, supplierFilter, pfGroups, statusFilter],
  );

  const totalRowCount = reports.reduce((acc, r) => acc + r.shownRowCount, 0);

  // Distinct types available for the type-filter dropdown (union across active templates)
  const availableTypes = useMemo(() => {
    const statusSet = new Set(activeTemplates.flatMap(t => t.statuses));
    const set = new Set<string>();
    for (const entry of allItems) {
      if (!statusSet.has(entry.status)) continue;
      if (!(entry.item.pfCode || '').trim()) continue;
      set.add(mapBackendTypeToFrontend(entry.item.type, entry.item.customType));
    }
    return [...set].sort((a, b) => {
      const ai = TYPE_ORDER.indexOf(a as any), bi = TYPE_ORDER.indexOf(b as any);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1; if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [allItems, selectedTemplate]);

  // Distinct suppliers available for the supplier dropdown (across active templates)
  const availableSuppliers = useMemo(() => {
    const statusSet = new Set(activeTemplates.flatMap(t => t.statuses));
    const set = new Set<string>();
    for (const entry of allItems) {
      if (!statusSet.has(entry.status)) continue;
      if (!(entry.item.pfCode || '').trim()) continue;
      const s = supplierFor(entry.item);
      if (s && s !== '—') set.add(s);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [allItems, selectedTemplate]);

  // Reset type filter when switching template (types differ)
  useEffect(() => { setTypeFilter(''); setStatusFilter([]); }, [selectedTemplate]);
  // Reset payment filter when leaving supplier mode
  useEffect(() => { if (groupMode !== 'supplier') setPaymentFilter(''); }, [groupMode]);

  const handlePrint = () => window.print();

  return (
    <div className="reports-page" style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Print CSS — only the report sheet is visible on paper, A4 */}
      <style>{`
        /* Force background colors to print (browsers strip them by default) */
        .report-sheet, .report-sheet * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body * { visibility: hidden !important; }
          .report-sheet, .report-sheet * { visibility: visible !important; }
          .report-sheet { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; padding: 0 !important; }
          .no-print { display: none !important; }
        }
        .report-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .report-table th, .report-table td {
          border: 1px solid #333; padding: 6px 8px; text-align: center; vertical-align: middle;
        }
        .report-table thead th { background: #2d2d2d; color: #fff; font-size: 11px; letter-spacing: .3px; }
        .report-table td.left { text-align: left; }
        .report-projno { font-weight: 700; font-size: 15px; background: #f1f5f9; }
        .report-supplier { font-weight: 700; font-size: 14px; background: #f1f5f9; text-align: left; }
        .report-type { font-weight: 600; background: #fafafa; }
        .report-table tbody tr:nth-child(even) td:not(.report-projno):not(.report-type):not(.report-supplier):not(.pay-paid):not(.pay-unpaid) { background: #fcfcfc; }
        .pay-paid { background: #16a34a; color: #fff; font-weight: 700; }
        .pay-unpaid { background: #dc2626; color: #fff; font-weight: 700; }
        .report-total td { background: #1f2937; color: #fff; font-weight: 800; font-size: 13px; }
        .report-total td.left { text-align: left; letter-spacing: .5px; }
      `}</style>

      {/* ── Controls (screen only) ── */}
      <div className="no-print" style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '24px' }}>Reports</h1>
        <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: '14px' }}>
          Select a report template, optionally filter by type, then print on A4.
        </p>

        {/* Template buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {REPORT_TEMPLATES.map(t => {
            const active = t.key === selectedTemplate;
            return (
              <button
                key={t.key}
                onClick={() => setSelectedTemplate(t.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: active ? `2px solid ${t.color}` : '1px solid #d1d5db',
                  background: active ? t.color : '#fff',
                  color: active ? '#fff' : '#374151',
                  fontWeight: active ? 700 : 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            );
          })}
          {/* Combined: all four reports in one PDF, each in its own section */}
          <button
            onClick={() => setSelectedTemplate('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: selectedTemplate === 'all' ? '2px solid #1f2937' : '1px dashed #9ca3af',
              background: selectedTemplate === 'all' ? '#1f2937' : '#fff',
              color: selectedTemplate === 'all' ? '#fff' : '#374151',
              fontWeight: selectedTemplate === 'all' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            All (Combined)
          </button>
        </div>

        {/* Sub-status picker for mixed-status reports (e.g. On Hold → Hold T / Hold PM / Hold Books) */}
        {(() => {
          const tmpl = REPORT_TEMPLATES.find(t => t.key === selectedTemplate);
          if (!tmpl?.statusOptions) return null;
          const options = tmpl.statusOptions;
          const countOf = (st: string) => allItems.filter(e => e.status === st && (e.item.pfCode || '').trim()).length;
          const chip = (key: string, label: string, active: boolean, onClick: () => void, colors?: { backgroundColor: string; color: string }) => {
            const colored = active && colors && colors.backgroundColor !== 'white';
            return (
              <button
                key={key}
                onClick={onClick}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  border: active ? '2px solid #1f2937' : '1px solid #d1d5db',
                  background: colored ? colors!.backgroundColor : active ? '#1f2937' : '#fff',
                  color: colored ? colors!.color : active ? '#fff' : '#374151',
                  fontWeight: active ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          };
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>Status:</span>
              {chip('all', `All (${options.reduce((sum, st) => sum + countOf(st), 0)})`, statusFilter.length === 0, () => setStatusFilter([]))}
              {options.map(st => chip(
                st,
                `${mapItemStatusToFrontend(st)} (${countOf(st)})`,
                statusFilter.includes(st),
                () => setStatusFilter(prev => {
                  const next = prev.includes(st) ? prev.filter(x => x !== st) : [...prev, st];
                  // picking every option is the same as "All"
                  return next.length === options.length ? [] : next;
                }),
                getStatusStyle(st),
              ))}
            </div>
          );
        })()}

        {/* Group mode: split by Project or by Supplier */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>Group by:</span>
          {(['project', 'supplier', 'group'] as const).map(mode => {
            const active = groupMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setGroupMode(mode)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: active ? '2px solid #1f2937' : '1px solid #d1d5db',
                  background: active ? '#1f2937' : '#fff',
                  color: active ? '#fff' : '#374151',
                  fontWeight: active ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {mode === 'project' ? 'Project' : mode === 'supplier' ? 'Supplier' : 'Group'}
              </button>
            );
          })}
        </div>

        {/* Type filter + payment filter + print */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>Type:</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ height: '36px', padding: '0 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', minWidth: '160px' }}
          >
            <option value="">All Types</option>
            {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Searchable supplier dropdown (type to search or pick) */}
          <label style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>Supplier:</label>
          <input
            list="reports-supplier-list"
            value={supplierFilter}
            onChange={e => setSupplierFilter(e.target.value)}
            placeholder="All Suppliers"
            style={{ height: '36px', padding: '0 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', minWidth: '220px' }}
          />
          <datalist id="reports-supplier-list">
            {availableSuppliers.map(s => <option key={s} value={s} />)}
          </datalist>
          {supplierFilter && (
            <button
              onClick={() => setSupplierFilter('')}
              title="Clear supplier"
              style={{ height: '36px', padding: '0 10px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', color: '#6b7280', fontSize: '13px', cursor: 'pointer' }}
            >
              ✕
            </button>
          )}

          {groupMode === 'supplier' && (
            <>
              <label style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>Payment:</label>
              <select
                value={paymentFilter}
                onChange={e => setPaymentFilter(e.target.value as '' | 'paid' | 'unpaid')}
                style={{ height: '36px', padding: '0 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', minWidth: '130px' }}
              >
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </>
          )}

          {canSeePf && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" checked={showPrice} onChange={e => setShowPrice(e.target.checked)} />
              Show PF Price
            </label>
          )}

          {canSeeInvoice && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" checked={showInvoice} onChange={e => setShowInvoice(e.target.checked)} />
              Show Invoice Price
            </label>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
            <input type="checkbox" checked={showOrderedDate} onChange={e => setShowOrderedDate(e.target.checked)} />
            Show Ordered Date
          </label>

          {groupMode === 'supplier' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" checked={showPayment} onChange={e => setShowPayment(e.target.checked)} />
              Show Payment
            </label>
          )}

          <div style={{ flex: 1 }} />

          <span style={{ fontSize: '13px', color: '#6b7280' }}>{totalRowCount} rows</span>
          <button
            onClick={handlePrint}
            disabled={totalRowCount === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              height: '36px', padding: '0 18px', borderRadius: '6px', border: 'none',
              background: totalRowCount === 0 ? '#9ca3af' : '#1f2937', color: '#fff',
              fontWeight: 600, fontSize: '14px', cursor: totalRowCount === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6V2h8v4M4 12H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1M4 10h8v4H4z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Print
          </button>
        </div>
      </div>

      {loading && <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading report data...</div>}
      {error && <div style={{ padding: '20px', color: '#dc2626' }}>Error: {error}</div>}

      {/* ── The printable report sheet ── */}
      {!loading && !error && (
        <div
          className="report-sheet"
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          {/* Header: logo · title · date */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', borderBottom: '2px solid #111', paddingBottom: '12px' }}>
            <img src={trustLogo} alt="Trust Lines" style={{ height: '150px', width: 'auto', maxWidth: '340px', objectFit: 'contain' }} />
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '13px', letterSpacing: '1px', color: '#374151', fontWeight: 700 }}>
                {typeFilter ? typeFilter.toUpperCase() : availableTypes.map(t => t.toUpperCase()).join(' | ') || 'ALL TYPES'}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#111' }}>
              DATE: {todayStr()}
            </div>
          </div>

          {/* One section per active report (1 for single, 4 for "All (Combined)") */}
          {(selectedTemplate === 'all' ? reports.filter(r => r.shownRowCount > 0) : reports).map((report, idx) => (
            <div
              key={report.template.key}
              className="report-section"
              style={idx > 0 ? { breakBefore: 'page', pageBreakBefore: 'always', marginTop: '28px' } : undefined}
            >
              {/* Status banner */}
              <div style={{
                marginTop: '14px',
                background: report.template.color,
                color: '#fff',
                borderRadius: '4px',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '.5px' }}>{report.template.label}</span>
                <span style={{ display: 'flex', gap: '8px' }}>
                  {selectedTemplate !== 'all' && report.template.statusOptions && statusFilter.length > 0 && (
                    <span style={{ fontSize: '13px', fontWeight: 600, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '4px' }}>
                      {statusFilter.map(st => mapItemStatusToFrontend(st)).join(' · ')}
                    </span>
                  )}
                  {typeFilter && (
                    <span style={{ fontSize: '13px', fontWeight: 600, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '4px' }}>
                      Type: {typeFilter}
                    </span>
                  )}
                  {supplierFilter && (
                    <span style={{ fontSize: '13px', fontWeight: 600, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '4px' }}>
                      Supplier: {supplierFilter}
                    </span>
                  )}
                  {groupMode === 'supplier' && paymentFilter && (
                    <span style={{ fontSize: '13px', fontWeight: 600, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '4px' }}>
                      {paymentFilter === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  )}
                </span>
              </div>

              {/* ── PROJECT split table ── */}
              {groupMode === 'project' && (
                <table className="report-table" style={{ marginTop: '14px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: showPrice || showInvoice ? '14%' : '16%' }}>PROJECT No.</th>
                      <th style={{ width: showPrice || showInvoice ? '16%' : '18%' }}>TYPE</th>
                      <th style={{ width: showPrice || showInvoice ? '26%' : '32%' }}>PF CODE</th>
                      <th style={{ width: showPrice || showInvoice ? '26%' : '34%' }}>ORDER TYPE</th>
                      {report.template.statusOptions && <th style={{ width: '14%' }}>STATUS</th>}
                      {showOrderedDate && <th style={{ width: '14%' }}>ORDERED DATE</th>}
                      {showPrice && <th style={{ width: '18%' }}>PF PRICE</th>}
                      {showInvoice && <th style={{ width: '18%' }}>INVOICE PRICE</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {report.grouped.length === 0 && (
                      <tr><td colSpan={4 + (report.template.statusOptions ? 1 : 0) + (showOrderedDate ? 1 : 0) + (showPrice ? 1 : 0) + (showInvoice ? 1 : 0)} style={{ padding: '24px', color: '#9ca3af' }}>No records for this status.</td></tr>
                    )}
                    {report.grouped.map(g => {
                      let projectCellRendered = false;
                      return g.types.map(typeGroup =>
                        typeGroup.rows.map((r, ri) => (
                          <tr key={`${g.projectNo}-${typeGroup.type}-${ri}-${r.pfCode}`}>
                            {!projectCellRendered && (() => { projectCellRendered = true; return (
                              <td className="report-projno" rowSpan={g.total}>{g.projectNo}</td>
                            ); })()}
                            {ri === 0 && (
                              <td className="report-type" rowSpan={typeGroup.rows.length}>{typeGroup.type}</td>
                            )}
                            <td className="left">{r.pfCode || '-'}</td>
                            <td>{r.orderType || '-'}</td>
                            {report.template.statusOptions && <td style={{ ...getStatusStyle(r.status), fontWeight: 700, fontSize: '11px' }}>{mapItemStatusToFrontend(r.status)}</td>}
                            {showOrderedDate && <td>{r.orderedDate}</td>}
                            {showPrice && <td style={{ fontWeight: 600 }}>{r.priceText}</td>}
                            {showInvoice && <td style={{ fontWeight: 600 }}>{r.invoiceText}</td>}
                          </tr>
                        ))
                      );
                    })}
                  </tbody>
                  {(showPrice || showInvoice) && report.grouped.length > 0 && (
                    <tfoot>
                      <tr className="report-total">
                        <td className="left" colSpan={4 + (report.template.statusOptions ? 1 : 0) + (showOrderedDate ? 1 : 0)}>TOTAL</td>
                        {showPrice && <td>{totalText(report.totals.priceUsd, report.totals.priceTl)}</td>}
                        {showInvoice && <td>{totalText(report.totals.invoiceUsd, report.totals.invoiceTl)}</td>}
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}

              {/* ── SUPPLIER split table ── */}
              {groupMode === 'supplier' && (
                <table className="report-table" style={{ marginTop: '14px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: showPrice || showInvoice ? '20%' : '26%' }}>SUPPLIER</th>
                      <th style={{ width: showPrice || showInvoice ? '22%' : '28%' }}>PF CODE</th>
                      <th style={{ width: showPrice || showInvoice ? '14%' : '18%' }}>TYPE</th>
                      {report.template.statusOptions && <th style={{ width: '12%' }}>STATUS</th>}
                      {showOrderedDate && <th style={{ width: '12%' }}>ORDERED DATE</th>}
                      {showPrice && <th style={{ width: '14%' }}>PF PRICE</th>}
                      {showInvoice && <th style={{ width: '14%' }}>INVOICE PRICE</th>}
                      {showPayment && <th style={{ width: showPrice || showInvoice ? '20%' : '28%' }}>PAYMENT</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {report.groupedBySupplier.length === 0 && (
                      <tr><td colSpan={3 + (report.template.statusOptions ? 1 : 0) + (showOrderedDate ? 1 : 0) + (showPrice ? 1 : 0) + (showInvoice ? 1 : 0) + (showPayment ? 1 : 0)} style={{ padding: '24px', color: '#9ca3af' }}>No records for this status.</td></tr>
                    )}
                    {report.groupedBySupplier.map(g =>
                      g.rows.map((r, ri) => (
                        <tr key={`${g.supplier}-${ri}-${r.pfCode}`}>
                          {ri === 0 && (
                            <td className="report-supplier" rowSpan={g.rows.length}>{g.supplier}</td>
                          )}
                          <td className="left">{r.pfCode || '-'}</td>
                          <td>{r.type}</td>
                          {report.template.statusOptions && <td style={{ ...getStatusStyle(r.status), fontWeight: 700, fontSize: '11px' }}>{mapItemStatusToFrontend(r.status)}</td>}
                          {showOrderedDate && <td>{r.orderedDate}</td>}
                          {showPrice && <td style={{ fontWeight: 600 }}>{r.priceText}</td>}
                          {showInvoice && <td style={{ fontWeight: 600 }}>{r.invoiceText}</td>}
                          {showPayment && (
                            <td className={r.payment.hasPrice ? (r.payment.fullyPaid ? 'pay-paid' : 'pay-unpaid') : ''}>
                              {r.payment.text}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                  {report.groupedBySupplier.length > 0 && (
                    <tfoot>
                      <tr className="report-total">
                        <td className="left" colSpan={3 + (report.template.statusOptions ? 1 : 0) + (showOrderedDate ? 1 : 0)}>TOTAL</td>
                        {showPrice && <td>{totalText(report.totals.priceUsd, report.totals.priceTl)}</td>}
                        {showInvoice && <td>{totalText(report.totals.invoiceUsd, report.totals.invoiceTl)}</td>}
                        {showPayment && (
                          <td style={{ lineHeight: 1.5 }}>
                            <div>Paid: {totalText(report.totals.paidUsd, report.totals.paidTl)}</div>
                            <div>Due: {totalText(report.totals.remUsd, report.totals.remTl)}</div>
                          </td>
                        )}
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}

              {/* ── GROUP split table (PF Groups: Group N → tier → project/type) ── */}
              {groupMode === 'group' && (
                <table className="report-table" style={{ marginTop: '14px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '6%' }}>GROUP</th>
                      <th style={{ width: '6%' }}>RANK</th>
                      <th style={{ width: showPrice || showInvoice ? '14%' : '16%' }}>PROJECT No.</th>
                      <th style={{ width: showPrice || showInvoice ? '14%' : '16%' }}>TYPE</th>
                      <th style={{ width: showPrice || showInvoice ? '20%' : '26%' }}>PF CODE</th>
                      <th style={{ width: showPrice || showInvoice ? '20%' : '26%' }}>ORDER TYPE</th>
                      {report.template.statusOptions && <th style={{ width: '12%' }}>STATUS</th>}
                      {showOrderedDate && <th style={{ width: '12%' }}>ORDERED DATE</th>}
                      {showPrice && <th style={{ width: '16%' }}>PF PRICE</th>}
                      {showInvoice && <th style={{ width: '16%' }}>INVOICE PRICE</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {report.groupedByGroup.length === 0 && (
                      <tr><td colSpan={6 + (report.template.statusOptions ? 1 : 0) + (showOrderedDate ? 1 : 0) + (showPrice ? 1 : 0) + (showInvoice ? 1 : 0)} style={{ padding: '24px', color: '#9ca3af' }}>
                        {report.rows.length > 0
                          ? `None of the ${report.rows.length} items in this report belong to a PF Group yet. Add types to a group from the Projects page (project menu → Create Group).`
                          : 'No grouped records for this status.'}
                      </td></tr>
                    )}
                    {report.groupedByGroup.map(grp => {
                      const groupRowCount = grp.tiers.reduce((n, t) => n + t.members.reduce((m, mem) => m + mem.rows.length, 0), 0);
                      let groupCellRendered = false;
                      return grp.tiers.map(tier => {
                        const tierRowCount = tier.members.reduce((m, mem) => m + mem.rows.length, 0);
                        let tierCellRendered = false;
                        return tier.members.map(mem => mem.rows.map((r, ri) => (
                          <tr key={`${grp.id}-${tier.rank}-${mem.projectNo}-${mem.typeLabel}-${ri}-${r.pfCode}`}>
                            {!groupCellRendered && (() => { groupCellRendered = true; return (
                              <td className="report-projno" rowSpan={groupRowCount}>Group {grp.number}</td>
                            ); })()}
                            {!tierCellRendered && (() => { tierCellRendered = true; return (
                              <td className="report-type" rowSpan={tierRowCount}>{tier.rank}</td>
                            ); })()}
                            {ri === 0 && (
                              <>
                                <td className="report-type" rowSpan={mem.rows.length}>{mem.projectNo}</td>
                                <td className="report-type" rowSpan={mem.rows.length}>{mem.typeLabel}</td>
                              </>
                            )}
                            <td className="left">{r.pfCode || '-'}</td>
                            <td>{r.orderType || '-'}</td>
                            {report.template.statusOptions && <td style={{ ...getStatusStyle(r.status), fontWeight: 700, fontSize: '11px' }}>{mapItemStatusToFrontend(r.status)}</td>}
                            {showOrderedDate && <td>{r.orderedDate}</td>}
                            {showPrice && <td style={{ fontWeight: 600 }}>{r.priceText}</td>}
                            {showInvoice && <td style={{ fontWeight: 600 }}>{r.invoiceText}</td>}
                          </tr>
                        )));
                      });
                    })}
                  </tbody>
                  {(showPrice || showInvoice) && report.groupedByGroup.length > 0 && (
                    <tfoot>
                      <tr className="report-total">
                        <td className="left" colSpan={6 + (report.template.statusOptions ? 1 : 0) + (showOrderedDate ? 1 : 0)}>TOTAL</td>
                        {showPrice && <td>{totalText(report.totals.priceUsd, report.totals.priceTl)}</td>}
                        {showInvoice && <td>{totalText(report.totals.invoiceUsd, report.totals.invoiceTl)}</td>}
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}
            </div>
          ))}

          {/* ── COMBINED GRAND TOTAL (all templates together) ── */}
          {selectedTemplate === 'all' && (() => {
            const vis = reports.filter(r => r.shownRowCount > 0);
            if (vis.length === 0) return null;
            const g = vis.reduce((acc, r) => ({
              priceUsd: acc.priceUsd + r.totals.priceUsd,
              priceTl: acc.priceTl + r.totals.priceTl,
              invoiceUsd: acc.invoiceUsd + r.totals.invoiceUsd,
              invoiceTl: acc.invoiceTl + r.totals.invoiceTl,
              paidUsd: acc.paidUsd + r.totals.paidUsd,
              paidTl: acc.paidTl + r.totals.paidTl,
              remUsd: acc.remUsd + r.totals.remUsd,
              remTl: acc.remTl + r.totals.remTl,
            }), { priceUsd: 0, priceTl: 0, invoiceUsd: 0, invoiceTl: 0, paidUsd: 0, paidTl: 0, remUsd: 0, remTl: 0 });

            const Cell = ({ label, usd, tl }: { label: string; usd: number; tl: number }) => (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '190px' }}>
                <span style={{ fontSize: '11px', opacity: 0.7, letterSpacing: '.5px' }}>{label}</span>
                <span style={{ fontSize: '15px', fontWeight: 800 }}>
                  {usd > 0.001 ? moneyText('$', usd) : '$0.00'}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 800 }}>
                  {tl > 0.001 ? moneyText('₺', tl) : '₺0.00'}
                </span>
              </div>
            );

            return (
              <div className="report-grand" style={{ breakBefore: 'avoid', marginTop: '22px' }}>
                <div style={{
                  background: 'linear-gradient(90deg,#0f172a,#1f2937)',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '16px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '24px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '.5px' }}>GRAND TOTAL — ALL</span>
                  <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {showPrice && <Cell label="PF PRICE" usd={g.priceUsd} tl={g.priceTl} />}
                    {showInvoice && <Cell label="INVOICE PRICE" usd={g.invoiceUsd} tl={g.invoiceTl} />}
                    {groupMode === 'supplier' && showPayment && <Cell label="PAID" usd={g.paidUsd} tl={g.paidTl} />}
                    {groupMode === 'supplier' && showPayment && <Cell label="DUE" usd={g.remUsd} tl={g.remTl} />}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default Reports;
