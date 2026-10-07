import { BackendProject, BackendProjectItem, getProjects, getProjectItems } from './projects';

// Dashboard data interfaces
export interface DashboardKPI {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal';
}

export interface DashboardIssue {
  severity: 'HIGH' | 'MED';
  message: string;
  projectNo: string;
  type: string;
  vendor: string;
  pfCode: string;
  relevantDate: string;
  projectId: string;
  itemId: string;
}

export interface DashboardItem {
  id: string;
  projectNo: string;
  projectName: string;
  type: string;
  vendor: string;
  pfCode: string;
  status: string;
  etd: string;
  rtd: string;
  ftd: string;
  daysOverdue?: number;
  daysDue?: number;
  updatedAt: string;
}

export interface DashboardMetrics {
  kpis: DashboardKPI[];
  issues: DashboardIssue[];
  overdueItems: DashboardItem[];
  dueSoonItems: DashboardItem[];
  recentActivity: DashboardItem[];
}


// Fetch all projects with their items
export const fetchAllProjectData = async (): Promise<{ projects: BackendProject[], allItems: BackendProjectItem[] }> => {
  try {
    // First, fetch all projects
    const projectsResponse = await getProjects();
    const projects = projectsResponse.data;

    // Check if projects already include items
    const hasItems = projects.some(p => p.items && p.items.length > 0);

    if (hasItems) {
      // Projects already include items, extract them
      const allItems = projects.flatMap(p => p.items || []);
      return { projects, allItems };
    }

    // Projects don't include items, fetch them separately
    const itemPromises = projects.map(p => getProjectItems(p.id));
    const projectItemsArrays = await Promise.all(itemPromises);

    // Combine all items into a single array
    const allItems = projectItemsArrays.flat();

    // Enrich projects with their items
    const projectsWithItems = projects.map((project, index) => ({
      ...project,
      items: projectItemsArrays[index]
    }));

    return { projects: projectsWithItems, allItems };
  } catch (error) {
    console.error('Failed to fetch project data:', error);
    throw new Error('Failed to load dashboard data');
  }
};

// Items are already filtered by backend permissions - no frontend role filtering needed
export const filterItemsByRole = (items: BackendProjectItem[]): BackendProjectItem[] => {
  return items;
};

// Generate KPIs based on filtered items
export const generateKPIs = (items: BackendProjectItem[]): DashboardKPI[] => {
  const today = new Date();

  // Basic status counts
  const notOrderedCount = items.filter(item => item.status === 'NOT_ORDERED').length;
  const orderedCount = items.filter(item => item.status === 'ORDERED').length;
  const readyCount = items.filter(item => item.status === 'READY').length;
  const readyToReceiveCount = items.filter(item => item.status === 'READY_TO_RECEIVE').length;
  const holdCount = items.filter(item => item.status?.startsWith('HOLD')).length;

  // Overdue count (ETD/RTD/FTD in past and not RECEIVED)
  const overdueCount = items.filter(item => {
    if (item.status === 'RECEIVED' || item.status === 'SENT' || item.status === 'SENT_TO_TLINES') {
      return false; // Not overdue if already received/sent
    }

    const etd = item.etd ? new Date(item.etd) : null;
    const rtd = item.rtd ? new Date(item.rtd) : null;
    const ftd = item.ftd ? new Date(item.ftd) : null;

    return (etd && etd < today) || (rtd && rtd < today) || (ftd && ftd < today);
  }).length;

  const baseKPIs: DashboardKPI[] = [
    { label: 'Not Ordered', value: notOrderedCount, color: 'red' },
    { label: 'Ordered', value: orderedCount, color: 'blue' },
    { label: 'Ready', value: readyCount, color: 'green' },
    { label: 'Ready to Receive', value: readyToReceiveCount, color: 'purple' },
    { label: 'On Hold', value: holdCount, color: 'orange' },
    { label: 'Overdue', value: overdueCount, color: 'red' }
  ];

  return baseKPIs;
};

// Generate issues based on business rules
export const generateIssues = (items: BackendProjectItem[], projects: BackendProject[]): DashboardIssue[] => {
  const today = new Date();
  const issues: DashboardIssue[] = [];

  // Create project lookup for project names and numbers
  const projectLookup = projects.reduce((acc, p) => {
    acc[p.id] = { name: p.name, projectNo: p.projectNo };
    return acc;
  }, {} as Record<string, { name: string; projectNo: string }>);

  items.forEach(item => {
    const project = projectLookup[item.projectId];
    if (!project) return;

    const vendorName = item.vendor ? `${item.vendor.code} - ${item.vendor.name}` : 'No Vendor';
    const typeLabel = item.type ? item.type.charAt(0) + item.type.slice(1).toLowerCase() : 'Unknown';

    // HIGH: ETD is in the past AND status not RECEIVED/SENT
    if (item.etd && !['RECEIVED', 'SENT', 'SENT_TO_TLINES'].includes(item.status || '')) {
      const etd = new Date(item.etd);
      if (etd < today) {
        issues.push({
          severity: 'HIGH',
          message: `ETD passed but item not received`,
          projectNo: project.projectNo,
          type: typeLabel,
          vendor: vendorName,
          pfCode: item.pfCode || 'No PF Code',
          relevantDate: item.etd,
          projectId: item.projectId,
          itemId: item.id
        });
      }
    }

    // HIGH: status is ORDERED/READY but ETD missing
    if (['ORDERED', 'READY'].includes(item.status || '') && !item.etd) {
      issues.push({
        severity: 'HIGH',
        message: `${item.status} but ETD missing`,
        projectNo: project.projectNo,
        type: typeLabel,
        vendor: vendorName,
        pfCode: item.pfCode || 'No PF Code',
        relevantDate: '',
        projectId: item.projectId,
        itemId: item.id
      });
    }

    // MED: PF Code missing
    if (!item.pfCode) {
      issues.push({
        severity: 'MED',
        message: 'PF Code missing',
        projectNo: project.projectNo,
        type: typeLabel,
        vendor: vendorName,
        pfCode: 'Missing',
        relevantDate: '',
        projectId: item.projectId,
        itemId: item.id
      });
    }

    // MED: Vendor missing
    if (!item.vendorId || !item.vendor) {
      issues.push({
        severity: 'MED',
        message: 'Vendor missing',
        projectNo: project.projectNo,
        type: typeLabel,
        vendor: 'Missing',
        pfCode: item.pfCode || 'No PF Code',
        relevantDate: '',
        projectId: item.projectId,
        itemId: item.id
      });
    }
  });

  // Sort by severity (HIGH first) then by project number
  return issues.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'HIGH' ? -1 : 1;
    }
    return a.projectNo.localeCompare(b.projectNo);
  });
};

// Generate overdue items list
export const generateOverdueItems = (items: BackendProjectItem[], projects: BackendProject[]): DashboardItem[] => {
  const today = new Date();
  const projectLookup = projects.reduce((acc, p) => {
    acc[p.id] = { name: p.name, projectNo: p.projectNo };
    return acc;
  }, {} as Record<string, { name: string; projectNo: string }>);

  const overdueItems = items
    .filter(item => {
      // Not overdue if already received/sent
      if (['RECEIVED', 'SENT', 'SENT_TO_TLINES'].includes(item.status || '')) {
        return false;
      }

      const etd = item.etd ? new Date(item.etd) : null;
      const rtd = item.rtd ? new Date(item.rtd) : null;
      const ftd = item.ftd ? new Date(item.ftd) : null;

      return (etd && etd < today) || (rtd && rtd < today) || (ftd && ftd < today);
    })
    .map(item => {
      const project = projectLookup[item.projectId];
      const mostOverdueDate = [item.etd, item.rtd, item.ftd]
        .filter(Boolean)
        .map(date => new Date(date!))
        .filter(date => date < today)
        .sort((a, b) => a.getTime() - b.getTime())[0]; // Earliest overdue date

      const daysOverdue = mostOverdueDate
        ? Math.floor((today.getTime() - mostOverdueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: item.id,
        projectNo: project?.projectNo || 'Unknown',
        projectName: project?.name || 'Unknown Project',
        type: item.type ? item.type.charAt(0) + item.type.slice(1).toLowerCase() : 'Unknown',
        vendor: item.vendor ? `${item.vendor.code} - ${item.vendor.name}` : 'No Vendor',
        pfCode: item.pfCode || 'No PF Code',
        status: mapItemStatusToDisplay(item.status),
        etd: item.etd || '',
        rtd: item.rtd || '',
        ftd: item.ftd || '',
        daysOverdue,
        updatedAt: item.updatedAt
      };
    })
    .sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0)) // Most overdue first
    .slice(0, 15); // Top 15

  return overdueItems;
};

// Generate due soon items list (next 7 days)
export const generateDueSoonItems = (items: BackendProjectItem[], projects: BackendProject[]): DashboardItem[] => {
  const today = new Date();
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const projectLookup = projects.reduce((acc, p) => {
    acc[p.id] = { name: p.name, projectNo: p.projectNo };
    return acc;
  }, {} as Record<string, { name: string; projectNo: string }>);

  const dueSoonItems = items
    .filter(item => {
      // Skip if already received/sent
      if (['RECEIVED', 'SENT', 'SENT_TO_TLINES'].includes(item.status || '')) {
        return false;
      }

      const etd = item.etd ? new Date(item.etd) : null;
      const rtd = item.rtd ? new Date(item.rtd) : null;
      const ftd = item.ftd ? new Date(item.ftd) : null;

      return [etd, rtd, ftd].some(date =>
        date && date >= today && date <= sevenDaysFromNow
      );
    })
    .map(item => {
      const project = projectLookup[item.projectId];
      const upcomingDate = [item.etd, item.rtd, item.ftd]
        .filter(Boolean)
        .map(date => new Date(date!))
        .filter(date => date >= today && date <= sevenDaysFromNow)
        .sort((a, b) => a.getTime() - b.getTime())[0]; // Earliest upcoming date

      const daysDue = upcomingDate
        ? Math.floor((upcomingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: item.id,
        projectNo: project?.projectNo || 'Unknown',
        projectName: project?.name || 'Unknown Project',
        type: item.type ? item.type.charAt(0) + item.type.slice(1).toLowerCase() : 'Unknown',
        vendor: item.vendor ? `${item.vendor.code} - ${item.vendor.name}` : 'No Vendor',
        pfCode: item.pfCode || 'No PF Code',
        status: mapItemStatusToDisplay(item.status),
        etd: item.etd || '',
        rtd: item.rtd || '',
        ftd: item.ftd || '',
        daysDue,
        updatedAt: item.updatedAt
      };
    })
    .sort((a, b) => (a.daysDue || 0) - (b.daysDue || 0)) // Soonest first
    .slice(0, 15); // Top 15

  return dueSoonItems;
};

// Generate recent activity (most recently updated items)
export const generateRecentActivity = (items: BackendProjectItem[], projects: BackendProject[]): DashboardItem[] => {
  const projectLookup = projects.reduce((acc, p) => {
    acc[p.id] = { name: p.name, projectNo: p.projectNo };
    return acc;
  }, {} as Record<string, { name: string; projectNo: string }>);

  const recentItems = items
    .map(item => {
      const project = projectLookup[item.projectId];
      return {
        id: item.id,
        projectNo: project?.projectNo || 'Unknown',
        projectName: project?.name || 'Unknown Project',
        type: item.type ? item.type.charAt(0) + item.type.slice(1).toLowerCase() : 'Unknown',
        vendor: item.vendor ? `${item.vendor.code} - ${item.vendor.name}` : 'No Vendor',
        pfCode: item.pfCode || 'No PF Code',
        status: mapItemStatusToDisplay(item.status),
        etd: item.etd || '',
        rtd: item.rtd || '',
        ftd: item.ftd || '',
        updatedAt: item.updatedAt
      };
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) // Most recent first
    .slice(0, 10); // Latest 10

  return recentItems;
};

// Helper function to map backend status to display format
const mapItemStatusToDisplay = (status: string | null): string => {
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

// Main function to generate all dashboard metrics
export const generateDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const { projects, allItems } = await fetchAllProjectData();
  const filteredItems = filterItemsByRole(allItems);

  const kpis = generateKPIs(filteredItems);
  const issues = generateIssues(filteredItems, projects);
  const overdueItems = generateOverdueItems(filteredItems, projects);
  const dueSoonItems = generateDueSoonItems(filteredItems, projects);
  const recentActivity = generateRecentActivity(filteredItems, projects);

  return {
    kpis,
    issues,
    overdueItems,
    dueSoonItems,
    recentActivity
  };
};