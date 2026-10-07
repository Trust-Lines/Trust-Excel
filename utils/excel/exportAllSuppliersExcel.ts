/**
 * All-Suppliers Excel Export
 *
 * Produces a single workbook:
 *   Sheet 1: "Supplier Total" — exactly as the /supplier-total page
 *   Then one sheet per supplier (vendor code as sheet name) containing all of
 *   that supplier's data: PROJECTS, MISSING & EXTRA and DIRECT ORDERS blocks,
 *   each rendered with the same layout as the supplier pages
 *   (Projects grid + Accounting + Payments + Invoice).
 *
 * Vendor order matches /supplier-total (YSM first, then by code).
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { fetchSupplierTotals } from '../../lib/supplierTotalApi';
import { getProjects, BackendProject } from '../../lib/projects';
import { getMissingExtraCases, BackendMissingExtraCase } from '../../lib/missing-extra';
import { getDirectOrders } from '../../lib/direct-orders';
import { extractVendorCode } from '../../lib/vendorUtils';
import { ColumnKey } from '../../lib/columns';
import { writeSupplierTotalSheet } from './exportSupplierTotalExcel';
import {
  writeSupplierSectionsToSheet,
  getSupplierLayoutTotalCols,
  RegionSection,
} from './exportSupplierExcel';

// ── Region definitions (same order as the supplier pages) ───────────

const REGIONS = [
  { bucket: 'TLINES_NE', label: 'TLines NE' },
  { bucket: 'TLINES_SE', label: 'TLines SE' },
  { bucket: 'TLINES_NW', label: 'TLines NW' },
  { bucket: 'CVW', label: 'TLines CVW' },
  { bucket: 'TLINES_HQ', label: 'TLines HQ' },
  { bucket: 'TLINES_TC', label: 'TLines TC' },
];

function groupToRegionSections(projects: any[]): RegionSection[] {
  const byBucket: Record<string, any[]> = {};
  projects.forEach(p => {
    const bucket = p.bucket || 'UNKNOWN';
    if (!byBucket[bucket]) byBucket[bucket] = [];
    byBucket[bucket].push(p);
  });

  const ordered = REGIONS
    .filter(r => byBucket[r.bucket]?.length)
    .map(r => ({ regionLabel: r.label, bucket: r.bucket, projects: byBucket[r.bucket] }));
  const extras = Object.keys(byBucket)
    .filter(b => !REGIONS.some(r => r.bucket === b))
    .sort()
    .map(b => ({ regionLabel: b, bucket: b, projects: byBucket[b] }));

  return [...ordered, ...extras] as RegionSection[];
}

// ── Data mappers (mirror the supplier sheets) ───────────────────────

/** Map a Missing & Extra case to a project-like object (same as SupplierMESheet) */
function meCaseToProject(meCase: BackendMissingExtraCase): any {
  return {
    id: meCase.id,
    projectNo: meCase.derivedProjectCode,
    name: `${meCase.baseProjectName} (${meCase.caseType})`,
    bucket: meCase.section,
    isUrgent: (meCase as any).isUrgent || false,
    containerDate: (meCase as any).containerDate ?? null,
    items: (meCase.items || []).map((meItem: any) => ({
      ...meItem,
      projectId: meItem.caseId,
      vendor: meItem.vendor || { id: '', code: '', name: '' },
      containerDate: (meCase as any).containerDate
        ? new Date((meCase as any).containerDate).toISOString().split('T')[0]
        : '',
    })),
  };
}

/** Keep only the given vendor's items; drop projects left without items */
function filterByVendorCode(projects: any[], vendorCode: string): any[] {
  return projects
    .map(p => ({
      ...p,
      items: (p.items || []).filter((item: any) => extractVendorCode(item.vendor) === vendorCode),
    }))
    .filter(p => p.items.length > 0);
}

/** DO items carry vendorId (same matching as SupplierDOSheet) */
function filterByVendorId(projects: any[], vendorId: string): any[] {
  return projects
    .map(p => ({
      ...p,
      items: (p.items || []).filter((item: any) => (item.vendorId ?? item.vendor?.id ?? null) === vendorId),
    }))
    .filter(p => p.items.length > 0);
}

// ── Sheet helpers ────────────────────────────────────────────────────

/** Excel sheet names: max 31 chars, no \\ / ? * [ ] :, unique */
function sanitizeSheetName(name: string, used: Set<string>): string {
  let base = name.replace(/[\\/?*[\]:]/g, ' ').trim().substring(0, 31) || 'Sheet';
  let candidate = base;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${i++})`;
    candidate = base.substring(0, 31 - suffix.length) + suffix;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function fillBg(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

/** Full-width banner row (vendor title / tab titles) */
function writeBanner(ws: ExcelJS.Worksheet, label: string, bg: string, totalCols: number, height = 26): void {
  const row = ws.addRow(new Array(totalCols).fill(''));
  row.height = height;
  ws.mergeCells(row.number, 1, row.number, totalCols);
  const cell = row.getCell(1);
  cell.value = label;
  cell.font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
  cell.fill = fillBg(bg);
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

// ── Main export ──────────────────────────────────────────────────────

interface ExportAllSuppliersOptions {
  isColumnVisible: (key: ColumnKey) => boolean;
}

export async function exportAllSuppliersExcel({ isColumnVisible }: ExportAllSuppliersOptions): Promise<void> {
  // Fetch everything in parallel: totals (incl. vendor list, YSM first) + all three datasets
  const [totals, projectsResp, meCases, doResp] = await Promise.all([
    fetchSupplierTotals(),
    getProjects(),
    getMissingExtraCases(),
    getDirectOrders(),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Suppliers Export';
  wb.created = new Date();

  // ── Sheet 1: Supplier Total (exactly as /supplier-total) ──
  writeSupplierTotalSheet(wb, totals);

  // ── Prepare datasets once; filtered per vendor below ──
  const allProjects: BackendProject[] = projectsResp.data || [];

  const meProjectsAll: any[] = [];
  Object.values(meCases as unknown as Record<string, BackendMissingExtraCase[]>).forEach(cases => {
    (cases || []).forEach(meCase => meProjectsAll.push(meCaseToProject(meCase)));
  });

  const doProjectsAll: any[] = [];
  ((doResp as any).sections || []).forEach((section: any) => {
    (section.projects || []).forEach((p: any) => {
      doProjectsAll.push({
        id: p.id,
        projectNo: p.projectNo,
        name: p.name || '',
        bucket: p.bucket ?? section.section,
        isUrgent: Boolean(p.isUrgent),
        containerDate: p.containerDate || null,
        items: p.items || [],
      });
    });
  });

  const totalCols = getSupplierLayoutTotalCols(isColumnVisible);
  const usedNames = new Set<string>(['supplier total']);

  // ── One sheet per supplier (same order as /supplier-total) ──
  for (const vendor of totals.vendors) {
    const ws = wb.addWorksheet(sanitizeSheetName(vendor.vendorCode, usedNames));

    writeBanner(ws, `${vendor.vendorCode} - ${vendor.vendorName}`, '111827', totalCols, 30);
    ws.addRow([]);

    const pSections = groupToRegionSections(filterByVendorCode(allProjects, vendor.vendorCode));
    const meSections = groupToRegionSections(filterByVendorCode(meProjectsAll, vendor.vendorCode));
    const doSections = groupToRegionSections(filterByVendorId(doProjectsAll, vendor.vendorId));

    let wroteAny = false;

    if (pSections.length > 0) {
      writeBanner(ws, 'PROJECTS', '0F172A', totalCols);
      writeSupplierSectionsToSheet(ws, pSections, 'p', isColumnVisible);
      wroteAny = true;
    }

    if (meSections.length > 0) {
      writeBanner(ws, 'MISSING & EXTRA', '0F172A', totalCols);
      writeSupplierSectionsToSheet(ws, meSections, 'me', isColumnVisible);
      wroteAny = true;
    }

    if (doSections.length > 0) {
      writeBanner(ws, 'DIRECT ORDERS', '0F172A', totalCols);
      writeSupplierSectionsToSheet(ws, doSections, 'do', isColumnVisible);
      wroteAny = true;
    }

    if (!wroteAny) {
      const row = ws.addRow(['No data for this supplier']);
      row.getCell(1).font = { italic: true, size: 11, color: { argb: '6B7280' } };
    }
  }

  // ── Save ──
  const dateStr = new Date().toISOString().slice(0, 10);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `Suppliers_All_${dateStr}.xlsx`);
}
