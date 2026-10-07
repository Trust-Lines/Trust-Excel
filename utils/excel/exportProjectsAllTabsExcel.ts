/**
 * Multi-tab Excel Export for the Projects page
 *
 * Produces a single workbook with four sheets:
 *   1. Projects        — the currently displayed Operational Board sections
 *   2. Missing & Extra — fetched fresh, same layout as the ME tab
 *   3. Direct Orders   — fetched fresh, same layout as the DO tab
 *   4. Project Total   — fetched fresh, same layout as the /project-total page
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  ApiSection,
  mapBackendTypeToFrontend,
  mapItemStatusToFrontend,
} from '../../lib/projects';
import { ColumnKey } from '../../lib/columns';
import { getMissingExtraCases, BackendMissingExtraCase } from '../../lib/missing-extra';
import { getDirectOrders } from '../../lib/direct-orders';
import { getProjectColor } from '../../lib/projectColor';
import { fetchProjectTotals } from '../../lib/projectTotalApi';
import type { CompanyDef } from '../../types/projectTotal';
import { writeProjectsSheet } from './exportProjectsExcel';
import { writeProjectTotalSheet } from './exportProjectTotalExcel';

// ── Section / company definitions (same as the pages) ───────────────

const SECTION_DEFS = [
  { id: 'TLINES_NE', label: 'TLines NE' },
  { id: 'TLINES_SE', label: 'TLines SE' },
  { id: 'TLINES_NW', label: 'TLines NW' },
  { id: 'CVW', label: 'TLines CVW' },
  { id: 'TLINES_HQ', label: 'TLines HQ' },
  { id: 'TLINES_TC', label: 'TLines TC' },
];

const PRODUCTION_COMPANIES: CompanyDef[] = [
  { key: 'TLINES_NE', label: 'T LINES NE' },
  { key: 'TLINES_SE', label: 'T LINES SE' },
  { key: 'TLINES_CVW', label: 'T LINES CVW' },
  { key: 'TLINES_NW', label: 'T LINES NW' },
  { key: 'TLINES_HQ', label: 'T LINES HQ' },
  { key: 'TRUST_TC', label: 'TRUST TC' },
];

const EXPENSES_COMPANIES: CompanyDef[] = [
  ...PRODUCTION_COMPANIES,
  { key: 'TRUST_EXP', label: 'TRUST Expenses' },
];

// Same persisted USD/TRY rate the /project-total page uses
const RATE_LS_KEY = 'PROJECT_TOTAL_USD_TRY_RATE';
const DEFAULT_RATE = 41.23;

function getStoredUsdTryRate(): number {
  try {
    const raw = localStorage.getItem(RATE_LS_KEY);
    if (raw !== null) {
      const v = parseFloat(raw);
      if (Number.isFinite(v) && v > 0) return v;
    }
  } catch { /* ignore */ }
  return DEFAULT_RATE;
}

// ── Data mappers (mirror the ME tab and DO page mappings) ───────────

function mapMissingExtraToSections(
  casesBySection: Record<string, BackendMissingExtraCase[]>,
): ApiSection[] {
  return SECTION_DEFS.map(sectionDef => {
    const casesInSection = casesBySection[sectionDef.id] || [];

    const projects = casesInSection.map(caseItem => ({
      projectId: caseItem.id,
      projectNumber: caseItem.derivedProjectCode,
      projectNumberColor: getProjectColor(caseItem as any),
      projectName: `${caseItem.baseProjectName} (${caseItem.caseType})`,
      address: '',
      region: '',
      poSignStatusByType: {},
      rows: (caseItem.items || []).map((item: any) => ({
        itemId: item.id,
        type: mapBackendTypeToFrontend(item.type, item.customType) as any,
        vendor: item.vendor
          ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name)
          : '',
        vendorId: item.vendorId,
        orderType: item.orderType || '',
        pfSignStatus: item.pfSignStatus,
        poSignStatus: item.poSignStatus,
        status: mapItemStatusToFrontend(item.status || ''),
        std: item.std,
        etd: item.etd,
        rtd: item.rtd,
        rtr: item.rtr,
        rdy: item.rdy,
        ftd: item.ftd,
        snd: item.snd,
        pfUsd: (item.pfUsd || 0).toString(),
        pfTl: (item.pfTl || 0).toString(),
        invoice: (item.invoice || 0).toString(),
        invoiceTl: (item.invoiceTl || 0).toString(),
        paymentRule: item.paymentRule || '',
        containerNo: item.containerNo,
        containerDate: item.containerDate ? new Date(item.containerDate).toISOString().split('T')[0] : '',
        pfCode: item.pfCode || '',
      })),
    }));

    return {
      id: sectionDef.id,
      label: sectionDef.label,
      projects,
    } as unknown as ApiSection;
  });
}

function mapDirectOrdersToSections(response: { sections: any[] }): ApiSection[] {
  const bucketToLabel: Record<string, string> = Object.fromEntries(
    SECTION_DEFS.map(s => [s.id, s.label]),
  );

  return (response.sections || []).map((section: any) => ({
    id: section.section,
    label: bucketToLabel[section.section] || section.section,
    projects: (section.projects || []).map((p: any) => ({
      projectId: p.id,
      projectNumber: String(p.projectNo),
      projectNumberColor: 'blue' as const,
      projectName: p.name || '',
      address: p.address || '',
      region: p.region || '',
      poSignStatusByType: {},
      rows: (p.items ?? []).map((item: any) => ({
        itemId: item.id,
        type: mapBackendTypeToFrontend(item.type, item.customType),
        vendor: item.vendor
          ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name)
          : '',
        vendorId: item.vendorId,
        orderType: item.orderType ?? item.orderTypeRef?.name ?? '',
        status: mapItemStatusToFrontend(item.status ?? ''),
        pfCode: item.pfCode ?? '',
        pfSignStatus: item.pfSignStatus,
        poSignStatus: item.poSignStatus,
        containerNo: item.containerNo ?? '',
        containerDate: item.containerDate ? new Date(item.containerDate).toISOString().split('T')[0] : '',
        std: item.std,
        etd: item.etd,
        rtd: item.rtd,
        rtr: item.rtr,
        rdy: item.rdy,
        ftd: item.ftd,
        snd: item.snd,
        pfUsd: item.pfUsd?.toString() ?? '',
        pfTl: item.pfTl?.toString() ?? '',
        invoice: item.invoice != null ? item.invoice.toString() : '',
        invoiceTl: item.invoiceTl != null ? item.invoiceTl.toString() : '',
        statusNote: item.statusNote ?? '',
        paymentRule: item.paymentRule ?? '',
      })),
    })),
  })) as unknown as ApiSection[];
}

// ── Main export ──────────────────────────────────────────────────────

interface ExportAllTabsOptions {
  projectsSections: ApiSection[];
  isColumnVisible: (key: ColumnKey) => boolean;
  filename?: string;
}

export async function exportProjectsAllTabsToExcel({
  projectsSections,
  isColumnVisible,
  filename,
}: ExportAllTabsOptions): Promise<void> {
  // Fetch the other tabs + totals in parallel; a failing fetch skips its sheet
  // instead of blocking the whole export
  const [meResult, doResult, totalsResult] = await Promise.allSettled([
    getMissingExtraCases(),
    getDirectOrders(),
    fetchProjectTotals(),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Projects';
  wb.created = new Date();

  writeProjectsSheet(wb, 'Projects', projectsSections, isColumnVisible);

  if (meResult.status === 'fulfilled') {
    const meSections = mapMissingExtraToSections(
      meResult.value as unknown as Record<string, BackendMissingExtraCase[]>,
    );
    writeProjectsSheet(wb, 'Missing & Extra', meSections, isColumnVisible);
  } else {
    console.error('Excel export: Missing & Extra fetch failed:', meResult.reason);
  }

  if (doResult.status === 'fulfilled') {
    writeProjectsSheet(wb, 'Direct Orders', mapDirectOrdersToSections(doResult.value as any), isColumnVisible);
  } else {
    console.error('Excel export: Direct Orders fetch failed:', doResult.reason);
  }

  if (totalsResult.status === 'fulfilled') {
    writeProjectTotalSheet(wb, totalsResult.value, getStoredUsdTryRate(), PRODUCTION_COMPANIES, EXPENSES_COMPANIES);
  } else {
    console.error('Excel export: Project Total fetch failed:', totalsResult.reason);
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const outputName = filename || `Projects_${dateStr}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, outputName);
}
