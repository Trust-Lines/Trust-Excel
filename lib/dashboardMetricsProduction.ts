import { BackendProject, BackendProjectItem, getProjects, getProjectItems } from './projects';
import { getDirectOrders } from './direct-orders';
import { getMissingExtraCases, BackendMissingExtraCase, BackendMissingExtraItem } from './missing-extra';

// Production Dashboard data interfaces
export interface ProductionKPI {
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal' | 'indigo';
  category: 'status' | 'overdue' | 'finance';
}

export interface ActionCenterItem {
  id: string;
  projectId: string;
  projectNo: string;
  projectName: string;
  type: string;
  vendor: string;
  status: string;
  relevantDate: string;
  relevantDateType: 'ETD' | 'RTD' | 'FTD' | 'None';
  daysOverdue?: number;
  daysUntilDue?: number;
  updatedAt: string;
}

export interface DataIssue {
  id: string;
  projectId: string;
  issueType: 'ORDERED_NO_ETD' | 'READY_NO_RTD' | 'SENT_TO_TLINES_NO_FTD' | 'RECEIVED_NO_RTD' | 'NO_VENDOR' | 'NO_ORDER_TYPE' | 'NO_CONTAINER';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  projectNo: string;
  type: string;
  vendor: string;
  status: string;
  description: string;
}

export interface TypeBreakdown {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ProjectHealth {
  projectId: string;
  projectNo: string;
  projectName: string;
  bucket: string;
  isUrgent: boolean;
  totalItems: number;
  statusCounts: Record<string, number>;
  overdueCount: number;
  dueSoonCount: number;
  issueCount: number;
  completionPercent: number;
  pfUsdTotal: number;
  pfTlTotal: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ProjectSummary {
  totalProjects: number;
  openProjects: number;
  doneProjects: number;
  projectsCount: number;       // Regular projects
  directOrdersCount: number;   // Direct orders
  missingExtraCount: number;   // Missing/Extra cases
  openProjectsCount: number;
  openDirectOrdersCount: number;
  openMissingExtraCount: number;
}

export interface ProductionDashboardMetrics {
  kpis: ProductionKPI[];
  overdueItems: ActionCenterItem[];
  dueSoonItems: ActionCenterItem[];
  dataIssues: DataIssue[];
  lastUpdated: string;
  totalItemsCount: number;
  showMoneyMetrics: boolean;
  typeBreakdown: TypeBreakdown[];
  projectHealthList: ProjectHealth[];
  statusDistribution: StatusDistribution[];
  pipelineStages: StatusDistribution[];
  projectSummary: ProjectSummary;
}

// Helper to check if user can see money columns
export const shouldShowMoneyMetrics = (userAccessPolicy: any): boolean => {
  if (!userAccessPolicy) return false;

  const hiddenColumns = userAccessPolicy.columnsHidden || [];
  const pfUsdHidden = hiddenColumns.includes('pfUsd');
  const pfTlHidden = hiddenColumns.includes('pfTl');

  // Show money metrics if at least one money column is visible
  return !pfUsdHidden || !pfTlHidden;
};

// Get relevant date based on item status
export const getRelevantDateForStatus = (item: BackendProjectItem): { date: string | null, type: 'ETD' | 'RTD' | 'FTD' | 'None' } => {
  const status = item.status;

  switch (status) {
    case 'ORDERED':
      return { date: item.etd, type: item.etd ? 'ETD' : 'None' };
    case 'READY':
      return { date: item.rtd, type: item.rtd ? 'RTD' : 'None' };
    case 'SENT_TO_TLINES':
      return { date: item.ftd, type: item.ftd ? 'FTD' : 'None' };
    case 'RECEIVED':
      return { date: item.rtd, type: item.rtd ? 'RTD' : 'None' };
    default:
      // Try to find any available date
      if (item.etd) return { date: item.etd, type: 'ETD' };
      if (item.rtd) return { date: item.rtd, type: 'RTD' };
      if (item.ftd) return { date: item.ftd, type: 'FTD' };
      return { date: null, type: 'None' };
  }
};

// Normalize Missing/Extra item → BackendProjectItem shape
const normalizeMEItem = (item: BackendMissingExtraItem, caseId: string): BackendProjectItem => ({
  id: item.id,
  projectId: caseId,
  type: item.type as any,
  customTypeId: item.customTypeId,
  customType: item.customType ? { ...item.customType, description: null } : item.customType as any,
  pfCode: item.pfCode,
  vendorId: item.vendorId,
  orderType: item.orderType,
  pfSignStatus: item.pfSignStatus,
  poSignStatus: item.poSignStatus,
  status: item.status,
  std: item.std,
  etd: item.etd,
  rtd: item.rtd,
  rtr: null,
  rdy: null,
  ftd: item.ftd,
  snd: null,
  pfUsd: item.pfUsd,
  pfTl: item.pfTl,
  paidUsd1: item.paidUsd1,
  paidUsd2: item.paidUsd2,
  paidTl1: item.paidTl1,
  paidTl2: item.paidTl2,
  invoiceTransactionNo: item.invoiceTransactionNo,
  invoiceNumber: item.invoiceNumber,
  quickBook: item.quickBook,
  containerNo: item.containerNo,
  containerDate: null,
  paymentRule: item.paymentRule,
  statusNote: (item as any).statusNote ?? null,
  duePaid: (item as any).duePaid ?? false,
  paidUsd1Date: null,
  paidUsd2Date: null,
  paidTl1Date: null,
  paidTl2Date: null,
  invoiceDate: null,
  invoice: item.invoice ?? null,
  invoiceTl: item.invoiceTl ?? null,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  vendor: item.vendor,
});

// Normalize Missing/Extra Case → BackendProject shape
const normalizeMECase = (c: BackendMissingExtraCase): BackendProject => ({
  id: c.id,
  bucket: c.section,
  projectNo: c.derivedProjectCode,
  name: `${c.baseProjectName} (${c.caseType})`,
  address: null,
  description: null,
  types: c.types,
  status: 'IN_PROGRESS', // ME cases are always active
  isUrgent: c.isUrgent,
  containerDate: c.containerDate,
  createdByUserId: '',
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
  items: (c.items || []).map(it => normalizeMEItem(it, c.id)),
});

// Enhanced data fetching - all 3 sources: Projects + Direct Orders + Missing/Extra
export const fetchAllProjectDataProduction = async (): Promise<{
  projects: BackendProject[],
  allItems: BackendProjectItem[],
  projectSummary: ProjectSummary
}> => {
  try {

    // Fetch all 3 sources in parallel
    const [projectsResponse, directOrdersResponse, missingExtraResponse] = await Promise.all([
      getProjects(),
      getDirectOrders().catch(err => { console.warn('📊 Direct Orders fetch failed:', err); return { data: [], sections: [] } as any; }),
      getMissingExtraCases().catch(err => { console.warn('📊 Missing/Extra fetch failed:', err); return {} as any; }),
    ]);

    // ── 1. Regular Projects ──
    const regularProjects = projectsResponse.data;
    const hasItems = regularProjects.some(p => p.items && p.items.length > 0);
    let regularItems: BackendProjectItem[];

    if (hasItems) {
      regularItems = regularProjects.flatMap(p => p.items || []);
    } else {
      const itemArrays = await Promise.all(regularProjects.map(p => getProjectItems(p.id)));
      regularItems = itemArrays.flat();
      regularProjects.forEach((p, i) => { p.items = itemArrays[i]; });
    }


    // ── 2. Direct Orders ──
    const doProjects = (directOrdersResponse.data || []) as any[];
    const doNormalized: BackendProject[] = doProjects.map((dp: any) => ({
      id: dp.id,
      bucket: dp.bucket || 'TLINES_HQ',
      projectNo: dp.projectNo || 'DO-?',
      name: dp.name || 'Direct Order',
      address: dp.address || null,
      description: dp.description || null,
      types: dp.types || [],
      status: dp.status || 'IN_PROGRESS',
      isUrgent: dp.isUrgent || false,
      containerDate: dp.containerDate || null,
      createdByUserId: '',
      createdAt: dp.createdAt || '',
      updatedAt: dp.updatedAt || '',
      items: (dp.items || []).map((it: any) => ({
        ...it,
        projectId: dp.id,
      })),
    }));
    const doItems: BackendProjectItem[] = doNormalized.flatMap(p => p.items || []);


    // ── 3. Missing/Extra Cases ──
    const meGrouped = missingExtraResponse || {};
    const meCases: BackendMissingExtraCase[] = Object.values(meGrouped).flat() as BackendMissingExtraCase[];
    const meNormalized: BackendProject[] = meCases.map(normalizeMECase);
    const meItems: BackendProjectItem[] = meNormalized.flatMap(p => p.items || []);


    // ── Combine all ──
    const allProjects = [...regularProjects, ...doNormalized, ...meNormalized];
    const allItems = [...regularItems, ...doItems, ...meItems];


    // ── Project Summary ──
    // A project is "done" if: status is DONE, OR all items are SENT
    const isProjectDone = (p: BackendProject): boolean => {
      if (p.status === 'DONE') return true;
      const items = p.items || [];
      return items.length > 0 && items.every(it => it.status === 'SENT');
    };

    const projectSummary: ProjectSummary = {
      totalProjects: allProjects.length,
      openProjects: allProjects.filter(p => !isProjectDone(p)).length,
      doneProjects: allProjects.filter(p => isProjectDone(p)).length,
      projectsCount: regularProjects.length,
      directOrdersCount: doProjects.length,
      missingExtraCount: meCases.length,
      openProjectsCount: regularProjects.filter(p => !isProjectDone(p)).length,
      openDirectOrdersCount: doNormalized.filter(p => !isProjectDone(p)).length,
      openMissingExtraCount: meNormalized.filter(p => !isProjectDone(p)).length,
    };

    return { projects: allProjects, allItems, projectSummary };
  } catch (error) {
    console.error('Failed to fetch project data:', error);
    throw new Error('Failed to load dashboard data');
  }
};

// Enhanced KPI generation with proper role awareness
export const generateProductionKPIs = (
  items: BackendProjectItem[],
  showMoneyMetrics: boolean
): ProductionKPI[] => {
  const today = new Date();

  // Basic status counts (consistent with requirements)
  const totalItems = items.length;
  const notOrderedCount = items.filter(item => item.status === 'NOT_ORDERED').length;
  const orderedCount = items.filter(item => item.status === 'ORDERED').length;
  const readyCount = items.filter(item => item.status === 'READY').length;
  const sentToTlinesCount = items.filter(item => item.status === 'SENT_TO_TLINES').length;
  const receivedCount = items.filter(item => item.status === 'RECEIVED').length;

  // Overdue count based on relevant date per status
  const overdueCount = items.filter(item => {
    // Skip completed items
    if (['RECEIVED', 'SENT'].includes(item.status || '')) {
      return false;
    }

    const { date } = getRelevantDateForStatus(item);
    if (!date) return false;

    const relevantDate = new Date(date);
    return relevantDate < today;
  }).length;

  // Due Next 7 Days count
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dueNext7DaysCount = items.filter(item => {
    if (['RECEIVED', 'SENT'].includes(item.status || '')) {
      return false;
    }

    const { date } = getRelevantDateForStatus(item);
    if (!date) return false;

    const relevantDate = new Date(date);
    return relevantDate >= today && relevantDate <= sevenDaysFromNow;
  }).length;

  // Core KPIs (always visible)
  const coreKPIs: ProductionKPI[] = [
    { label: 'Total Items', value: totalItems, color: 'indigo', category: 'status' },
    { label: 'Not Ordered', value: notOrderedCount, color: 'red', category: 'status' },
    { label: 'Ordered', value: orderedCount, color: 'blue', category: 'status' },
    { label: 'Ready', value: readyCount, color: 'green', category: 'status' },
    { label: 'Sent to TLines', value: sentToTlinesCount, color: 'purple', category: 'status' },
    { label: 'Received', value: receivedCount, color: 'teal', category: 'status' },
    { label: 'Overdue', value: overdueCount, color: 'red', category: 'overdue' },
    { label: 'Due Next 7 Days', value: dueNext7DaysCount, color: 'orange', category: 'overdue' }
  ];

  // Add money metrics only if user can see them
  if (showMoneyMetrics) {
    // Helper function to safely convert monetary values to numbers
    const safeMoneyToNumber = (value: any): number => {
      if (value === null || value === undefined || value === '') {
        return 0;
      }

      // If it's already a number
      if (typeof value === 'number') {
        return isNaN(value) ? 0 : value;
      }

      // If it's a string, clean and convert
      if (typeof value === 'string') {
        // Remove commas and trim whitespace
        const cleaned = value.replace(/,/g, '').trim();
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      }

      // Fallback for other types
      const parsed = Number(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Calculate financial totals with safe numeric conversion
    const totalPfUsd = items.reduce((sum, item) => {
      const numericValue = safeMoneyToNumber(item.pfUsd);
      return sum + numericValue;
    }, 0);

    const totalPfTl = items.reduce((sum, item) => {
      const numericValue = safeMoneyToNumber(item.pfTl);
      return sum + numericValue;
    }, 0);

    // Currency formatters with proper localization
    const usdFormatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const tlFormatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Format display values with guard rails
    let displayUsd: string;
    let displayTl: string;

    if (isNaN(totalPfUsd)) {
      console.error('MONEY_FORMAT_ERROR: totalPfUsd is NaN', { totalPfUsd, items: items.length });
      displayUsd = '$0.00';
    } else {
      displayUsd = `$${usdFormatter.format(totalPfUsd)}`;
    }

    if (isNaN(totalPfTl)) {
      console.error('MONEY_FORMAT_ERROR: totalPfTl is NaN', { totalPfTl, items: items.length });
      displayTl = '₺0.00';
    } else {
      displayTl = `₺${tlFormatter.format(totalPfTl)}`;
    }

    coreKPIs.push(
      {
        label: 'PF USD Total',
        value: displayUsd,
        color: 'teal',
        category: 'finance'
      },
      {
        label: 'PF TL Total',
        value: displayTl,
        color: 'teal',
        category: 'finance'
      }
    );
  }

  return coreKPIs;
};

// Generate overdue items for Action Center
export const generateOverdueActionItems = (
  items: BackendProjectItem[],
  projects: BackendProject[]
): ActionCenterItem[] => {
  const today = new Date();
  const projectLookup = projects.reduce((acc, p) => {
    acc[p.id] = { name: p.name, projectNo: p.projectNo };
    return acc;
  }, {} as Record<string, { name: string; projectNo: string }>);

  const overdueItems = items
    .filter(item => {
      // Skip completed items
      if (['RECEIVED', 'SENT'].includes(item.status || '')) {
        return false;
      }

      const { date } = getRelevantDateForStatus(item);
      if (!date) return false;

      const relevantDate = new Date(date);
      return relevantDate < today;
    })
    .map(item => {
      const project = projectLookup[item.projectId];
      const { date, type } = getRelevantDateForStatus(item);

      const daysOverdue = date
        ? Math.floor((today.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: item.id,
        projectId: item.projectId,
        projectNo: project?.projectNo || 'Unknown',
        projectName: project?.name || 'Unknown Project',
        type: formatItemType(item.type || ''),
        vendor: formatVendor(item.vendor),
        status: formatItemStatus(item.status),
        relevantDate: date || '',
        relevantDateType: type,
        daysOverdue,
        updatedAt: item.updatedAt
      };
    })
    .sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0)) // Most overdue first
    .slice(0, 20); // Top 20 as required

  return overdueItems;
};

// Generate due soon items for Action Center
export const generateDueSoonActionItems = (
  items: BackendProjectItem[],
  projects: BackendProject[]
): ActionCenterItem[] => {
  const today = new Date();
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const projectLookup = projects.reduce((acc, p) => {
    acc[p.id] = { name: p.name, projectNo: p.projectNo };
    return acc;
  }, {} as Record<string, { name: string; projectNo: string }>);

  const dueSoonItems = items
    .filter(item => {
      // Skip completed items
      if (['RECEIVED', 'SENT'].includes(item.status || '')) {
        return false;
      }

      const { date } = getRelevantDateForStatus(item);
      if (!date) return false;

      const relevantDate = new Date(date);
      return relevantDate >= today && relevantDate <= sevenDaysFromNow;
    })
    .map(item => {
      const project = projectLookup[item.projectId];
      const { date, type } = getRelevantDateForStatus(item);

      const daysUntilDue = date
        ? Math.floor((new Date(date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: item.id,
        projectId: item.projectId,
        projectNo: project?.projectNo || 'Unknown',
        projectName: project?.name || 'Unknown Project',
        type: formatItemType(item.type || ''),
        vendor: formatVendor(item.vendor),
        status: formatItemStatus(item.status),
        relevantDate: date || '',
        relevantDateType: type,
        daysUntilDue,
        updatedAt: item.updatedAt
      };
    })
    .sort((a, b) => (a.daysUntilDue || 0) - (b.daysUntilDue || 0)) // Soonest first
    .slice(0, 20); // Top 20 as required

  return dueSoonItems;
};

// Generate data issues for Action Center
export const generateDataIssues = (
  items: BackendProjectItem[],
  projects: BackendProject[]
): DataIssue[] => {
  const projectLookup = projects.reduce((acc, p) => {
    acc[p.id] = { name: p.name, projectNo: p.projectNo };
    return acc;
  }, {} as Record<string, { name: string; projectNo: string }>);

  const issues: DataIssue[] = [];

  items.forEach(item => {
    const project = projectLookup[item.projectId];
    if (!project) return;

    const baseIssue = {
      id: item.id,
      projectId: item.projectId,
      projectNo: project.projectNo,
      type: formatItemType(item.type || ''),
      vendor: formatVendor(item.vendor),
      status: formatItemStatus(item.status)
    };

    // High priority issues: Status without required date
    if (item.status === 'ORDERED' && !item.etd) {
      issues.push({
        ...baseIssue,
        issueType: 'ORDERED_NO_ETD',
        severity: 'HIGH',
        description: 'ORDERED status but ETD missing'
      });
    }

    if (item.status === 'READY' && !item.rtd) {
      issues.push({
        ...baseIssue,
        issueType: 'READY_NO_RTD',
        severity: 'HIGH',
        description: 'READY status but RTD missing'
      });
    }

    if (item.status === 'SENT_TO_TLINES' && !item.ftd) {
      issues.push({
        ...baseIssue,
        issueType: 'SENT_TO_TLINES_NO_FTD',
        severity: 'HIGH',
        description: 'SENT_TO_TLINES status but FTD missing'
      });
    }

    if (item.status === 'RECEIVED' && !item.rtd) {
      issues.push({
        ...baseIssue,
        issueType: 'RECEIVED_NO_RTD',
        severity: 'HIGH',
        description: 'RECEIVED status but RTD missing'
      });
    }

    // Medium priority issues: Missing master data
    if (!item.vendorId) {
      issues.push({
        ...baseIssue,
        issueType: 'NO_VENDOR',
        severity: 'MEDIUM',
        description: 'Vendor not assigned'
      });
    }

    if (!item.orderType) {
      issues.push({
        ...baseIssue,
        issueType: 'NO_ORDER_TYPE',
        severity: 'MEDIUM',
        description: 'Order type not specified'
      });
    }

    // Optional: Container missing (lower priority)
    if (item.status === 'ORDERED' && !item.containerNo) {
      issues.push({
        ...baseIssue,
        issueType: 'NO_CONTAINER',
        severity: 'LOW',
        description: 'Container number not specified'
      });
    }
  });

  // Sort by severity (HIGH > MEDIUM > LOW) then by project number
  return issues
    .sort((a, b) => {
      const severityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
      if (a.severity !== b.severity) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return a.projectNo.localeCompare(b.projectNo);
    })
    .slice(0, 30); // Top 30 as required
};

// Formatting helper functions
export const formatItemType = (type: string): string => {
  return type.charAt(0) + type.slice(1).toLowerCase();
};

export const formatVendor = (vendor: any): string => {
  if (!vendor) return 'No Vendor';
  return `${vendor.code} - ${vendor.name}`;
};

export const formatItemStatus = (status: string | null): string => {
  if (!status) return 'No Status';

  const statusMap: Record<string, string> = {
    'HOLD_T': 'Hold / T',
    'HOLD_PM': 'Hold / PM',
    'NOT_ORDERED': 'Not Ordered',
    'ORDERED': 'Ordered',
    'ASSEMBLY': 'Assembly',
    'READY_TO_RECEIVE': 'Ready to Receive',
    'RECEIVED': 'Received',
    'READY': 'Ready',
    'SENT_TO_TLINES': 'Sent to TLines',
    'PARTIAL_SENT': 'Partial Sent',
    'SENT': 'Sent'
  };

  return statusMap[status] || status;
};

// Items are already filtered by backend permissions - no frontend role filtering needed
export const filterItemsByRole = (items: BackendProjectItem[]): BackendProjectItem[] => {
  return items;
};

// ── New dashboard metric generators ──

const TYPE_COLORS: Record<string, string> = {
  MILLWORK: '#6366f1',
  SHELVING: '#f59e0b',
  CEILING: '#06b6d4',
  IMAGE: '#ec4899',
  FURNITURE: '#8b5cf6',
  DECORATION: '#10b981',
};

const STATUS_COLORS: Record<string, string> = {
  NOT_ORDERED: '#ef4444',
  ORDERED: '#3b82f6',
  READY: '#22c55e',
  SENT_TO_TLINES: '#a855f7',
  RECEIVED: '#f97316',
  SENT: '#15803d',
  HOLD_T: '#94a3b8',
  HOLD_PM: '#94a3b8',
  ASSEMBLY: '#eab308',
  READY_TO_RECEIVE: '#14b8a6',
  PARTIAL_SENT: '#7c3aed',
};

const PIPELINE_STATUSES = ['NOT_ORDERED', 'ORDERED', 'RECEIVED', 'SENT_TO_TLINES', 'SENT'];

export const generateTypeBreakdown = (items: BackendProjectItem[]): TypeBreakdown[] => {
  const counts: Record<string, number> = {};
  items.forEach(item => {
    const t = item.type || 'OTHER';
    counts[t] = (counts[t] || 0) + 1;
  });
  const total = items.length || 1;
  return Object.entries(counts)
    .map(([type, count]) => ({
      type: formatItemType(type),
      count,
      percentage: Math.round((count / total) * 100),
      color: TYPE_COLORS[type] || '#94a3b8',
    }))
    .sort((a, b) => b.count - a.count);
};

export const generateProjectHealthList = (
  items: BackendProjectItem[],
  projects: BackendProject[]
): ProjectHealth[] => {
  const today = new Date();
  const sevenDays = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const safeNum = (v: any): number => {
    if (v == null || v === '') return 0;
    const n = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : Number(v);
    return isNaN(n) ? 0 : n;
  };

  const grouped: Record<string, BackendProjectItem[]> = {};
  items.forEach(item => {
    if (!grouped[item.projectId]) grouped[item.projectId] = [];
    grouped[item.projectId].push(item);
  });

  const projectMap = projects.reduce((acc, p) => { acc[p.id] = p; return acc; }, {} as Record<string, BackendProject>);

  return Object.entries(grouped)
    .map(([projectId, pItems]) => {
      const proj = projectMap[projectId];
      if (!proj) return null;

      const statusCounts: Record<string, number> = {};
      pItems.forEach(it => {
        const s = it.status || 'UNKNOWN';
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });

      const completedStatuses = ['SENT_TO_TLINES', 'RECEIVED', 'SENT'];
      const completedCount = pItems.filter(it => completedStatuses.includes(it.status || '')).length;
      const completionPercent = pItems.length > 0 ? Math.round((completedCount / pItems.length) * 100) : 0;

      const overdueCount = pItems.filter(it => {
        if (['RECEIVED', 'SENT'].includes(it.status || '')) return false;
        const { date } = getRelevantDateForStatus(it);
        return date ? new Date(date) < today : false;
      }).length;

      const dueSoonCount = pItems.filter(it => {
        if (['RECEIVED', 'SENT'].includes(it.status || '')) return false;
        const { date } = getRelevantDateForStatus(it);
        if (!date) return false;
        const d = new Date(date);
        return d >= today && d <= sevenDays;
      }).length;

      const issueCount = pItems.filter(it => {
        if (it.status === 'ORDERED' && !it.etd) return true;
        if (it.status === 'READY' && !it.rtd) return true;
        if (it.status === 'SENT_TO_TLINES' && !it.ftd) return true;
        if (!it.vendorId) return true;
        return false;
      }).length;

      return {
        projectId,
        projectNo: proj.projectNo,
        projectName: proj.name,
        bucket: proj.bucket || '',
        isUrgent: proj.isUrgent || false,
        totalItems: pItems.length,
        statusCounts,
        overdueCount,
        dueSoonCount,
        issueCount,
        completionPercent,
        pfUsdTotal: pItems.reduce((s, it) => s + safeNum(it.pfUsd), 0),
        pfTlTotal: pItems.reduce((s, it) => s + safeNum(it.pfTl), 0),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.totalItems - a!.totalItems) as ProjectHealth[];
};

export const generateStatusDistribution = (items: BackendProjectItem[]): StatusDistribution[] => {
  const counts: Record<string, number> = {};
  items.forEach(item => {
    const s = item.status || 'UNKNOWN';
    counts[s] = (counts[s] || 0) + 1;
  });
  const total = items.length || 1;
  return Object.entries(counts)
    .map(([status, count]) => ({
      status: formatItemStatus(status),
      count,
      percentage: Math.round((count / total) * 100),
      color: STATUS_COLORS[status] || '#94a3b8',
    }))
    .sort((a, b) => b.count - a.count);
};

export const generatePipelineStages = (items: BackendProjectItem[]): StatusDistribution[] => {
  const total = items.length || 1;
  return PIPELINE_STATUSES.map(status => {
    const count = items.filter(it => it.status === status).length;
    return {
      status: formatItemStatus(status),
      count,
      percentage: Math.round((count / total) * 100),
      color: STATUS_COLORS[status] || '#94a3b8',
    };
  });
};

// Main production dashboard metrics generator
export const generateProductionDashboardMetrics = async (
  userAccessPolicy: any
): Promise<ProductionDashboardMetrics> => {

  const { projects, allItems, projectSummary } = await fetchAllProjectDataProduction();
  const filteredItems = filterItemsByRole(allItems);
  const showMoneyMetrics = shouldShowMoneyMetrics(userAccessPolicy);


  const kpis = generateProductionKPIs(filteredItems, showMoneyMetrics);
  const overdueItems = generateOverdueActionItems(filteredItems, projects);
  const dueSoonItems = generateDueSoonActionItems(filteredItems, projects);
  const dataIssues = generateDataIssues(filteredItems, projects);
  const typeBreakdown = generateTypeBreakdown(filteredItems);
  const projectHealthList = generateProjectHealthList(filteredItems, projects);
  const statusDistribution = generateStatusDistribution(filteredItems);
  const pipelineStages = generatePipelineStages(filteredItems);

  return {
    kpis,
    overdueItems,
    dueSoonItems,
    dataIssues,
    lastUpdated: new Date().toISOString(),
    totalItemsCount: filteredItems.length,
    showMoneyMetrics,
    typeBreakdown,
    projectHealthList,
    statusDistribution,
    pipelineStages,
    projectSummary,
  };
};