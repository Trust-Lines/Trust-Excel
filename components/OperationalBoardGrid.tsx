import React, { useState, useMemo, useEffect, useImperativeHandle, forwardRef, useRef, useCallback } from 'react';
import { useLivePatchStore, PatchEventPayload } from '../hooks/useLivePatchStore';
import ProjectBlock from './ProjectBlock';
import { getProjects, mapBackendProjectsToSections, ApiSection, BackendProjectItem, deleteProject, mapBackendTypeToFrontend, mapItemStatusToFrontend, mapSignStatusToFrontend } from '../lib/projects';
import { getMissingExtraCases, BackendMissingExtraCase, deleteMissingExtraCase } from '../lib/missing-extra';
import { deleteDirectOrder } from '../lib/direct-orders';
import { filterProjects } from '../utils/filterUtils';
import { Project } from '../types';
import { useColumnPermissions } from '../hooks/useColumnPermissions';
import { FilterConfig } from './FilterBar';
import { getGridWidthPx, COLUMN_WIDTHS, SCROLLABLE_COLUMNS } from '../lib/gridWidth';
import { getProjectColor } from '../lib/projectColor';
import { useSocket } from '../contexts/SocketContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { useAuth } from '../contexts/AuthContext';
import { PfGroup } from '../lib/pf-groups';
import GroupedPfTable from './GroupedPfTable';

// Section Total Row Component
const SectionTotalRow: React.FC<{
  sectionLabel: string;
  totals: { pfUsd: number; pfTl: number; invoice: number; invoiceTl: number; hasData: boolean };
  isColumnVisible: (columnKey: string) => boolean;
  shouldShowMoneyTotals: () => boolean;
  gridWidthPx: string;
}> = ({ sectionLabel, totals, isColumnVisible, shouldShowMoneyTotals, gridWidthPx }) => {
  if (!totals.hasData || !shouldShowMoneyTotals()) {
    return null;
  }

  const sectionName = sectionLabel.replace('TLines ', '').toUpperCase();
  const showUsdTotal = isColumnVisible('pfUsd');
  const showTlTotal = isColumnVisible('pfTl');
  const showInvoiceTotal = isColumnVisible('invoice');
  const showInvoiceTlTotal = isColumnVisible('invoiceTl');

  if (!showUsdTotal && !showTlTotal && !showInvoiceTotal && !showInvoiceTlTotal) {
    return null;
  }

  // Calculate right offset to the right edge of a target column
  const getColumnRightOffset = (targetColumn: string): number => {
    const idx = SCROLLABLE_COLUMNS.findIndex(col => col === targetColumn);
    if (idx === -1) return 0;
    return SCROLLABLE_COLUMNS.slice(idx + 1)
      .filter(col => isColumnVisible(col))
      .reduce((sum, col) => sum + (COLUMN_WIDTHS[col] || 0), 0);
  };

  const moneyBoxStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: '#1d4ed8',
    color: 'white',
    padding: '6px 8px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '14px',
    border: '1px solid #1e40af',
    width: '150px',
    textAlign: 'center',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'relative',
      width: gridWidthPx,
      minWidth: gridWidthPx,
      maxWidth: gridWidthPx,
      height: '45px',
      backgroundColor: '#2563eb',
      color: 'white',
      borderRadius: '6px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #1e40af'
    }}>
      <div style={{
        textAlign: 'center',
        fontWeight: '700',
        fontSize: '16px',
        letterSpacing: '0.5px'
      }}>
        {sectionName} TOTALS
      </div>
      {showUsdTotal && (
        <div style={{ ...moneyBoxStyle, right: `${getColumnRightOffset('pfUsd') + 5}px` }}>
          ${totals.pfUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )}
      {showTlTotal && (
        <div style={{ ...moneyBoxStyle, right: `${getColumnRightOffset('pfTl') + 5}px` }}>
          ₺{totals.pfTl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )}
      {showInvoiceTotal && (
        <div style={{ ...moneyBoxStyle, right: `${getColumnRightOffset('invoice') + 5}px` }}>
          INV/USD {totals.invoice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )}
      {showInvoiceTlTotal && (
        <div style={{ ...moneyBoxStyle, right: `${getColumnRightOffset('invoiceTl') + 5}px` }}>
          INV/TL {totals.invoiceTl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )}
    </div>
  );
};

interface OperationalBoardGridProps {
  mode?: 'projects' | 'missingExtra' | 'directOrder' | 'expenses-p';
  vendorCodeFilter?: string;
  filterConfig?: FilterConfig;
  readOnly?: boolean;
  enableAccountingColumns?: boolean; // SUPPLIER MODE: Show accounting columns inline
  onDataRefresh?: () => void; // Callback for when data is refreshed
  onSectionsChange?: (sections: ApiSection[]) => void; // Callback to expose sections data
  onAllSectionsChange?: (sections: ApiSection[]) => void; // Callback to expose UNFILTERED sections (before filterConfig is applied)
  onItemUpdate?: () => void; // ✅ ADD: Callback when any item is updated
  // NEW: Allow external projects to be passed (for Direct Orders)
  projects?: any[];
  externalLoading?: boolean;
  // Dashboard highlighting
  highlightedItemId?: string | null;
  highlightField?: string | null;
  // Project number search
  projectSearch?: string;
  // DirectOrder: callback for surgical item insert into external state
  onExternalItemCreated?: (projectId: string, item: BackendProjectItem) => void;
  // HALF-YEAR ASSIGNMENT: project selection (Projects page only)
  selectedProjectIds?: Set<string>;
  onToggleProjectSelect?: (projectId: string) => void;
  // TODAY'S PFs: active (projectId:typeLabel) tokens, for the todayPfOnly filter
  todayPfActiveKeys?: Set<string> | null;
  // PF GROUPS: passed through to each ProjectBlock's right-click menu, and used
  // to render the grouped-view table when filterConfig.groupViewOnly is active.
  pfGroups?: PfGroup[];
  allSectionsData?: ApiSection[];
}

export interface OperationalBoardGridHandle {
  refreshData: () => Promise<void>;
}

const OperationalBoardGrid = forwardRef<OperationalBoardGridHandle, OperationalBoardGridProps>(({
  mode = 'projects',
  vendorCodeFilter,
  filterConfig,
  enableAccountingColumns = false,
  onDataRefresh,
  onSectionsChange,
  onAllSectionsChange,
  onItemUpdate,
  projects: externalProjects,
  highlightedItemId,
  highlightField,
  projectSearch = '',
  onExternalItemCreated,
  selectedProjectIds,
  onToggleProjectSelect,
  todayPfActiveKeys,
  pfGroups = [],
  allSectionsData,
}, ref) => {
  const { isColumnVisible: baseIsColumnVisible, shouldShowMoneyTotals } = useColumnPermissions();
  const { userAccessPolicy, isAdmin } = useAuth();
  const allowedTypes = userAccessPolicy?.allowedTypes;

  // Wrap isColumnVisible to exclude expenses columns in non-expenses modes (matching ProjectBlock logic)
  const isExpensesMode = mode === 'expenses-p';
  const EXPENSES_SHOW_COLS = ['expensesUsd', 'expensesTl'];
  const EXPENSES_HIDE_COLS = ['pfCode', 'pfSignStatus', 'poSignStatus', 'pfUsd', 'pfTl', 'rtd', 'containerDate'];
  const isColumnVisible = useCallback((key: string) => {
    if (isExpensesMode) {
      if (EXPENSES_HIDE_COLS.includes(key)) return false;
      if (EXPENSES_SHOW_COLS.includes(key)) return true;
    } else {
      if (EXPENSES_SHOW_COLS.includes(key)) return false;
    }
    return baseIsColumnVisible(key);
  }, [baseIsColumnVisible, isExpensesMode]);

  // Calculate dynamic grid width based on visible columns
  const gridWidthPx = useMemo(() => {
    return getGridWidthPx(isColumnVisible);
  }, [isColumnVisible]);

  const [projectSections, setProjectSections] = useState<ApiSection[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [globalItemsById, setGlobalItemsById] = useState<Map<string, BackendProjectItem>>(new Map());

  // Missing/Extra state
  const [missingExtraCases, setMissingExtraCases] = useState<Record<string, BackendMissingExtraCase[]>>({});
  const [isLoadingMissingExtra, setIsLoadingMissingExtra] = useState(false);
  const [missingExtraError, setMissingExtraError] = useState<string | null>(null);

  // Define fallback sections that always show, even when APIs fail
  const fallbackSections = [
    { id: 'TLINES_NE', label: 'TLines NE' },
    { id: 'TLINES_SE', label: 'TLines SE' },
    { id: 'TLINES_NW', label: 'TLines NW' },
    { id: 'CVW', label: 'TLines CVW' },
    { id: 'TLINES_HQ', label: 'TLines HQ' },
    { id: 'TLINES_TC', label: 'TLines TC' },
  ];

  // SUPPLIER MODE: Strict vendor code filtering - completely isolated from normal filtering
  const supplierMode = Boolean(vendorCodeFilter);
  const effectiveFilterConfig = useMemo(() => {
    if (supplierMode) {
      // SUPPLIER VIEW: STRICT vendor code filtering ONLY
      const config: FilterConfig = {
        vendors: [],                            // MUST be empty - no UUID filtering in supplier view
        vendorCodes: [vendorCodeFilter!],       // e.g., ["YSM"] - string codes only (non-null asserted since supplierMode checks vendorCodeFilter)
        types: [],                              // Supplier view shows all types
        statuses: [],                           // Supplier view shows all statuses
        containers: []                          // Supplier view shows all containers
      };

      // PROOF LOGGING - confirm strict vendor code mode

      return config;
    } else {
      // NORMAL BOARD VIEW: Use FilterBar config for row-level filtering (C) FIXED - was using empty config
      const config = filterConfig || { vendors: [], vendorCodes: [], types: [], statuses: [], containers: [] };

      // PROOF LOGGING - confirm normal filtering mode is using FilterBar config
      if (filterConfig && (filterConfig.vendors.length > 0 || (filterConfig.vendorCodes?.length ?? 0) > 0 || filterConfig.types.length > 0 || filterConfig.statuses.length > 0)) {
      }

      return config;
    }
  }, [vendorCodeFilter, supplierMode, filterConfig, mode]);

  // Convert Missing/Extra cases to sections for display
  const missingExtraSections = useMemo(() => {
    if (mode !== 'missingExtra') return [];

    return fallbackSections.map(fallbackSection => {
      const casesInSection = missingExtraCases[fallbackSection.id] || [];

      // Convert cases to projects for ProjectBlock compatibility
      const projects = casesInSection.map(caseItem => ({
        projectId: caseItem.id,
        projectNo: caseItem.derivedProjectCode,
        projectNumber: caseItem.derivedProjectCode, // Use derived project code (e.g., "301-MS-1")
        projectNumberColor: getProjectColor(caseItem),
        projectName: `${caseItem.baseProjectName} (${caseItem.caseType})`,
        address: '',
        region: '',
        bucket: caseItem.section,
        poSignStatusByType: {},
        derivedProjectCode: caseItem.derivedProjectCode, // STEP 2 FIX: Pass derivedProjectCode to ProjectBlock
        isUrgent: caseItem.isUrgent || false, // ✅ ADD: Preserve urgent status from backend
        containerDate: caseItem.containerDate || null, // ✅ ADD: Preserve container date from backend
        halfOfYear: (caseItem as any).halfOfYear || null,
        halfYear: (caseItem as any).halfYear || null,
        rows: (caseItem.items || []).map(item => ({
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
          pfCode: item.pfCode || ''
        })),
        backendItems: caseItem.items || []
      }));

      return {
        id: fallbackSection.id,
        label: fallbackSection.label,
        projects
      } as unknown as ApiSection;
    });
  }, [missingExtraCases, mode]);

  // Project number search helper: exact → startsWith → contains priority
  const applyProjectSearch = (projects: any[]): any[] => {
    const q = (projectSearch || '').trim().toLowerCase();
    if (!q) return projects;
    const exact: any[] = [];
    const starts: any[] = [];
    const contains: any[] = [];
    projects.forEach(p => {
      const num = String(p.projectNumber ?? p.projectNo ?? '').toLowerCase();
      if (num === q) exact.push(p);
      else if (num.startsWith(q)) starts.push(p);
      else if (num.includes(q)) contains.push(p);
    });
    return [...exact, ...starts, ...contains];
  };

  // Sign "waiting" filters must react instantly to edits: row.poSignStatus/pfSignStatus come from the
  // last fetch, so overlay the live values kept in globalItemsById before filtering.
  const withLiveSignStatus = useCallback((projects: Project[]): Project[] => {
    if (!effectiveFilterConfig.signWaiting?.length) return projects;
    return projects.map(pr => ({
      ...pr,
      rows: pr.rows.map(r => {
        const live = r.itemId ? globalItemsById.get(r.itemId) : undefined;
        return live
          ? { ...r, pfSignStatus: mapSignStatusToFrontend(live.pfSignStatus), poSignStatus: mapSignStatusToFrontend(live.poSignStatus) } as typeof r
          : r;
      }),
    }));
  }, [effectiveFilterConfig.signWaiting, globalItemsById]);

  const filteredSections = useMemo(() => {
    if (mode === 'missingExtra') {
      return missingExtraSections
        .map((section) => ({
          ...section,
          projects: applyProjectSearch(filterProjects(withLiveSignStatus((section.projects || []) as Project[]), effectiveFilterConfig, true))
        }))
        .filter((section) => section.projects.length > 0);
    } else if (mode === 'directOrder') {
      return (projectSections || []).map(section => ({
        ...section,
        projects: applyProjectSearch(section.projects || [])
      })).filter(section => !(projectSearch?.trim()) || section.projects.length > 0);
    } else {
      const result = (projectSections || []).map((section) => ({
        ...section,
        projects: applyProjectSearch(filterProjects(withLiveSignStatus((section.projects || []) as Project[]), effectiveFilterConfig, false, todayPfActiveKeys))
      }));

      if (supplierMode) {
      }

      return result;
    }
  }, [mode, projectSections, missingExtraSections, effectiveFilterConfig, supplierMode, vendorCodeFilter, projectSearch, todayPfActiveKeys, withLiveSignStatus]);

  // Notify parent about sections data changes
  useEffect(() => {
    if (onSectionsChange && filteredSections.length > 0) {
      onSectionsChange(filteredSections);
    }
  }, [filteredSections, onSectionsChange]);

  // Notify parent about the UNFILTERED sections (before filterConfig narrows them) —
  // used to build filter-dropdown option lists so selecting one Half doesn't make
  // the other Half's option disappear from the list.
  useEffect(() => {
    if (onAllSectionsChange && projectSections.length > 0) {
      onAllSectionsChange(projectSections);
    }
  }, [projectSections, onAllSectionsChange]);

  const parseMoney = (value: any): number => {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const cleaned = value.replace(/,/g, '');
      const num = Number(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  // Helper: check if a backend item is restricted for current user
  const isItemRestricted = useCallback((item: BackendProjectItem): boolean => {
    if (isAdmin || !allowedTypes) return false;
    if (item.customTypeId) {
      return !(allowedTypes.customTypeIds ?? []).includes(item.customTypeId);
    }
    if (item.type) {
      return !(allowedTypes.enumTypes ?? []).includes(item.type);
    }
    return false;
  }, [isAdmin, allowedTypes]);

  const calculateSectionTotals = useMemo(() => {
    return (section: ApiSection) => {
      let totalUsd = 0;
      let totalTl = 0;
      let totalInvoice = 0;
      let totalInvoiceTl = 0;
      let itemsCount = 0;

      section.projects.forEach(project => {
        if (project.rows) {
          project.rows.forEach(row => {
            // Skip restricted items from totals
            if (row.itemId && globalItemsById.has(row.itemId)) {
              const liveItem = globalItemsById.get(row.itemId)!;
              if (isItemRestricted(liveItem)) return;
              itemsCount++;
              totalUsd += parseMoney(liveItem.pfUsd);
              totalTl += parseMoney(liveItem.pfTl);
              totalInvoice += parseMoney((liveItem as any).invoice);
              totalInvoiceTl += parseMoney((liveItem as any).invoiceTl);
            } else {
              // Row without live item - check isRestricted flag if available
              if ((row as any).isRestricted) return;
              itemsCount++;
              totalUsd += parseMoney(row.pfUsd);
              totalTl += parseMoney(row.pfTl);
              totalInvoice += parseMoney((row as any).invoice);
              totalInvoiceTl += parseMoney((row as any).invoiceTl);
            }
          });
        }
      });

      return { pfUsd: totalUsd, pfTl: totalTl, invoice: totalInvoice, invoiceTl: totalInvoiceTl, hasData: itemsCount > 0 };
    };
  }, [globalItemsById, isItemRestricted]);

  // Load data functions
  const loadProjects = async () => {
    // CRITICAL FIX: If external projects are provided (e.g., from DirectOrder page), use them
    if (externalProjects !== undefined) {
      setProjectSections(externalProjects as ApiSection[]);
      setIsLoadingProjects(false);
      return;
    }

    try {
      setIsLoadingProjects(true);
      setProjectsError(null);
      const response = await getProjects();
      const sections = mapBackendProjectsToSections(response.data);
      setProjectSections(sections);

      const globalMap = new Map<string, BackendProjectItem>();
      sections.forEach(section => {
        section.projects.forEach(project => {
          if (project.backendItems) {
            project.backendItems.forEach(item => {
              globalMap.set(item.id, item);
            });
          }
        });
      });
      setGlobalItemsById(globalMap);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjectsError(error instanceof Error ? error.message : 'Unknown error occurred');
      // Even on error, we can show fallback sections in Missing/Extra mode
      if (mode === 'missingExtra') {
      }
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadMissingExtraCases = async () => {
    try {
      setIsLoadingMissingExtra(true);
      setMissingExtraError(null);

      const cases = await getMissingExtraCases();
      setMissingExtraCases(cases as Record<string, BackendMissingExtraCase[]>);

      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error('❌ Failed to load Missing/Extra cases:', error);
      setMissingExtraError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoadingMissingExtra(false);
    }
  };

  // Expose refresh function for optimistic updates
  const refreshData = async () => {
    if (mode === 'projects') {
      await loadProjects();
    } else if (mode === 'missingExtra') {
      await loadMissingExtraCases();
    }
  };

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refreshData
  }), [refreshData]);

  // Load data based on mode
  useEffect(() => {

    if (mode === 'directOrder' && externalProjects !== undefined) {
      // Direct Order mode with external data - skip fetch
      loadProjects();
      return;
    }

    if (mode === 'projects') {
      loadProjects();
    } else if (mode === 'missingExtra') {
      loadMissingExtraCases();
    }
  }, [mode, externalProjects]);

  // Socket.IO: real-time updates (only for projects/missingExtra modes)
  // DirectOrder mode: parent DirectOrder.tsx handles socket events
  const { joinRooms, leaveRooms, isConnected, userId: myUserId } = useSocket();
  const prevConnected = useRef(isConnected);
  const livePatch = useLivePatchStore();

  useEffect(() => {
    if (mode === 'directOrder') return; // Parent handles socket
    const room = mode === 'missingExtra' ? 'missing-extra' : 'projects';
    joinRooms([room]);
    return () => { leaveRooms([room]); };
  }, [mode, joinRooms, leaveRooms]);

  useEffect(() => {
    if (mode === 'directOrder') return;
    if (isConnected && !prevConnected.current) {
      refreshData();
    }
    prevConnected.current = isConnected;
  }, [isConnected]);

  // Coalesce bursts of structural events (e.g. several creates in quick succession)
  // into one paginated refresh. The originating user is already excluded server-side
  // via `excludeUserId` (see EventsGateway.emitToRooms), so this only fires when
  // OTHER users are mutating the data set.
  const REFRESH_DEBOUNCE_MS = 750;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRefreshRef = useRef(false);
  const noop = useCallback(() => { }, []);

  // Execute pending refresh when user leaves an input (blur).
  // This means a structural WebSocket event that arrived mid-edit
  // will wait until the user finishes typing before reloading.
  useEffect(() => {
    const onFocusOut = (e: FocusEvent) => {
      const leaving = e.target as HTMLElement;
      if (
        pendingRefreshRef.current &&
        (leaving.tagName === 'INPUT' || leaving.tagName === 'TEXTAREA' || leaving.isContentEditable)
      ) {
        // Small delay so the save handler fires first
        setTimeout(() => {
          pendingRefreshRef.current = false;
          refreshData();
        }, 300);
      }
    };
    document.addEventListener('focusout', onFocusOut);
    return () => document.removeEventListener('focusout', onFocusOut);
  }, [refreshData]);

  const debouncedRefresh = useCallback(() => {
    const activeEl = document.activeElement as HTMLElement | null;
    const isTyping = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.isContentEditable
    );

    if (isTyping) {
      // Mark refresh as pending — will fire in the focusout handler above.
      pendingRefreshRef.current = true;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => refreshData(), REFRESH_DEBOUNCE_MS);
  }, [refreshData]);

  // Only react to events matching current mode
  const projectStructuralHandler = mode === 'projects' ? debouncedRefresh : noop;
  const meHandler = mode === 'missingExtra' ? debouncedRefresh : noop;

  // project-item:created → surgical insert (no full refresh, no scroll reset).
  // Shared logic: surgically insert a new item without full reload — works for all modes
  const insertNewItemIntoProject = useCallback((projectId: string, item: BackendProjectItem) => {
    const newRow = {
      type: mapBackendTypeToFrontend(item.type, (item as any).customType),
      pfCode: item.pfCode || '',
      vendor: item.vendor
        ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name)
        : '',
      vendorId: item.vendorId || '',
      orderType: item.orderType || '',
      pfSignStatus: mapSignStatusToFrontend(item.pfSignStatus),
      poSignStatus: mapSignStatusToFrontend(item.poSignStatus),
      status: mapItemStatusToFrontend(item.status || 'NOT_ORDERED'),
      std: item.std || '', etd: item.etd || '', rtd: item.rtd || '',
      rtr: item.rtr || '', rdy: item.rdy || '', ftd: item.ftd || '', snd: item.snd || '',
      statusNote: item.statusNote || '',
      pfUsd: item.pfUsd ? item.pfUsd.toString() : '',
      pfTl: item.pfTl ? item.pfTl.toString() : '',
      invoice: item.invoice ? item.invoice.toString() : '',
      invoiceTl: (item as any).invoiceTl ? (item as any).invoiceTl.toString() : '',
      paymentRule: item.paymentRule || '',
      containerNo: item.containerNo || '',
      containerDate: item.containerDate ? new Date(item.containerDate).toISOString().split('T')[0] : '',
      itemId: item.id,
    };

    if (mode === 'missingExtra') {
      // ME mode: add item to the matching case's items list
      setMissingExtraCases(prev => {
        const updated: Record<string, any[]> = {};
        for (const [sectionId, cases] of Object.entries(prev)) {
          updated[sectionId] = (cases as any[]).map((caseItem: any) => {
            if (caseItem.id !== projectId) return caseItem;
            const alreadyExists = (caseItem.items || []).some((i: any) => i.id === item.id);
            if (alreadyExists) return caseItem;
            return { ...caseItem, items: [...(caseItem.items || []), item] };
          });
        }
        return updated;
      });
    } else if (mode === 'directOrder' && onExternalItemCreated) {
      // DirectOrder: delegate to parent so it updates its own state
      onExternalItemCreated(projectId, item);
    } else {
      // Projects mode: update projectSections
      setProjectSections(prev => prev.map(section => ({
        ...section,
        projects: section.projects.map(project => {
          if (project.projectId !== projectId) return project;
          const alreadyExists = project.backendItems?.some(i => i.id === item.id);
          if (alreadyExists) return project;
          const filteredRows = (project.rows || []).filter(r => !(!r.itemId && r.type === newRow.type));
          return {
            ...project,
            backendItems: [...(project.backendItems ?? []), item],
            rows: [...filteredRows, newRow],
          };
        }),
      })));
    }

    setGlobalItemsById(prev => {
      if (prev.has(item.id)) return prev;
      const next = new Map(prev);
      next.set(item.id, item);
      return next;
    });
  }, [mode, onExternalItemCreated]);

  const handleItemCreated = useCallback((data: { item: BackendProjectItem; projectId: string }) => {
    if (mode !== 'projects') return;
    insertNewItemIntoProject(data.projectId, data.item);
  }, [mode, insertNewItemIntoProject]);

  // Socket-event contract:
  //   • project-item:created → surgical insert above (no scroll reset)
  //   • project-item:deleted / project:* → structural change, need fresh fetch
  //   • entity:patched → cell-level surgical update (handled by handlePatchEvent below)
  useSocketEvent('project-item:created', handleItemCreated);
  useSocketEvent('project-item:deleted', projectStructuralHandler);
  useSocketEvent('project:created', projectStructuralHandler);
  useSocketEvent('project:updated', projectStructuralHandler);
  useSocketEvent('project:deleted', projectStructuralHandler);
  useSocketEvent('me-item:created', meHandler);
  useSocketEvent('me-item:deleted', meHandler);
  useSocketEvent('me-case:created', meHandler);
  useSocketEvent('me-case:updated', meHandler);
  useSocketEvent('me-case:deleted', meHandler);


  // Fixed bottom scrollbar refs and sync
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const bottomBarInnerRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  const handleMainScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (bottomBarRef.current && mainScrollRef.current) {
      bottomBarRef.current.scrollLeft = mainScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isSyncingRef.current = false; });
  }, []);

  const handleBottomBarScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (mainScrollRef.current && bottomBarRef.current) {
      mainScrollRef.current.scrollLeft = bottomBarRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isSyncingRef.current = false; });
  }, []);

  // Keep bottom scrollbar width in sync with content scroll width
  useEffect(() => {
    const main = mainScrollRef.current;
    const inner = bottomBarInnerRef.current;
    if (!main || !inner) return;

    const updateWidth = () => {
      inner.style.width = `${main.scrollWidth}px`;
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(main);
    if (main.firstElementChild) observer.observe(main.firstElementChild);
    const interval = setInterval(updateWidth, 1000);

    return () => { observer.disconnect(); clearInterval(interval); };
  }, [mode, filteredSections]);

  const updateGlobalItem = useCallback((itemId: string, patch: Partial<BackendProjectItem>) => {
    setGlobalItemsById(prev => {
      const newMap = new Map(prev);
      const existingItem = newMap.get(itemId);
      if (existingItem) {
        newMap.set(itemId, { ...existingItem, ...patch });
      }
      return newMap;
    });
  }, []);

  // Patch-based handler: apply cell-level updates without full refetch
  // This prevents wiping in-progress edits when another user saves
  const handlePatchEvent = useCallback((data: PatchEventPayload) => {
    // Only handle entities relevant to current mode
    if (mode === 'projects' && data.entity !== 'projectItem') return;
    if (mode === 'missingExtra' && data.entity !== 'meItem') return;
    if (mode === 'directOrder') return; // Parent handles this
    if (!myUserId) return;

    const result = livePatch.handlePatchEvent(data, myUserId);
    if (result.apply && result.patch && result.entityId) {
      // Update globalItemsById for totals
      updateGlobalItem(result.entityId, result.patch);

      // Surgically update projectSections so ProjectBlock gets new backendItems & rows
      if (mode === 'projects') {
        setProjectSections(prev => prev.map(section => ({
          ...section,
          projects: section.projects.map(project => ({
            ...project,
            backendItems: project.backendItems?.map(item =>
              item.id === result.entityId ? { ...item, ...result.patch } : item
            ),
            rows: project.rows.map(row =>
              row.itemId === result.entityId ? { ...row, ...result.patch } : row
            ),
          }))
        })));
      }

      // Surgically update missingExtraCases for ME mode
      if (mode === 'missingExtra') {
        setMissingExtraCases(prev => {
          const updated: Record<string, BackendMissingExtraCase[]> = {};
          for (const [sectionId, cases] of Object.entries(prev)) {
            updated[sectionId] = cases.map(caseItem => ({
              ...caseItem,
              items: caseItem.items?.map(item =>
                item.id === result.entityId ? { ...item, ...result.patch } : item
              ),
            }));
          }
          return updated;
        });
      }
    }
  }, [mode, myUserId, livePatch, updateGlobalItem]);

  useSocketEvent('entity:patched', handlePatchEvent);

  const handleProjectItemUpdate = useCallback(async (_projectId: string) => {
    await loadProjects();
    if (onItemUpdate) onItemUpdate();
  }, [onItemUpdate]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      if (mode === 'directOrder') {
        await deleteDirectOrder(projectId);
      } else if (mode === 'missingExtra') {
        await deleteMissingExtraCase(projectId);
      } else {
        await deleteProject(projectId);
      }
      if (mode === 'projects') {
        loadProjects();
      } else if (mode === 'missingExtra') {
        loadMissingExtraCases();
      } else if (mode === 'directOrder') {
        if (onDataRefresh) onDataRefresh();
      }
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      alert(`Proje silinirken hata oluştu: ${errorMessage}`);
      throw error;
    }
  }, [mode, onDataRefresh]);

  // Determine loading and error states based on mode
  const isLoading = mode === 'projects' ? isLoadingProjects : isLoadingMissingExtra;
  const dataError = mode === 'projects' ? projectsError : missingExtraError;

  // RESILIENCE: Always show section bars in Missing/Extra mode, even if APIs fail
  const shouldShowFallbackSections = mode === 'missingExtra' && (missingExtraError || projectsError);
  const sectionsToRender = shouldShowFallbackSections
    ? fallbackSections.map(section => ({ ...section, projects: [] as any[] }))
    : filteredSections;

  return (
    <>
      <div ref={mainScrollRef} onScroll={handleMainScroll} className="operational-board-grid global-scroll-container">
        {isLoading && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            Loading {mode === 'missingExtra' ? 'Missing & Extra cases' : 'projects'}...
          </div>
        )}

        {/* Show error for projects mode, but not for Missing/Extra (we show fallback sections) */}
        {dataError && !isLoading && mode === 'projects' && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>
            Error: {dataError}
          </div>
        )}

        {/* Show error notice for Missing/Extra mode but still render fallback sections */}
        {missingExtraError && !isLoadingMissingExtra && mode === 'missingExtra' && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            margin: '16px',
            fontSize: '14px'
          }}>
            ⚠️ Missing & Extra data unavailable: {missingExtraError}. Showing section structure.
          </div>
        )}

        {!isLoading && mode === 'projects' && filterConfig?.groupViewOnly ? (
          <GroupedPfTable
            groups={pfGroups}
            sections={allSectionsData || []}
            globalItemsById={globalItemsById}
            updateGlobalItem={updateGlobalItem}
            onProjectUpdate={handleProjectItemUpdate}
            onItemCreated={insertNewItemIntoProject}
            onDeleteProject={handleDeleteProject}
            highlightedItemId={highlightedItemId}
            highlightField={highlightField}
          />
        ) : !isLoading && (
          sectionsToRender.length > 0 ? (
            sectionsToRender.map((section) => {
              // Always show section separator, even if no projects
              const sectionTotals = section.projects?.length > 0
                ? calculateSectionTotals(section)
                : { pfUsd: 0, pfTl: 0, invoice: 0, invoiceTl: 0, hasData: false };

              return (
                <section key={section.id}>
                  {/* Show projects if available */}
                  {section.projects?.map((project) => (
                    <ProjectBlock
                      key={project.projectId}
                      mode={mode}
                      project={project}
                      sectionLabel={section.label}
                      backendItems={project.backendItems}
                      globalItemsById={globalItemsById}
                      updateGlobalItem={updateGlobalItem}
                      onProjectUpdate={handleProjectItemUpdate}
                      onItemCreated={insertNewItemIntoProject}
                      onDeleteProject={handleDeleteProject}
                      supplierVendorCodeFilter={vendorCodeFilter}
                      enableAccountingColumns={enableAccountingColumns}
                      showSectionHeader={section.projects.indexOf(project) === 0}
                      highlightedItemId={highlightedItemId}
                      highlightField={highlightField}
                      selectable={(mode === 'projects' || mode === 'missingExtra' || mode === 'directOrder') && !!onToggleProjectSelect}
                      isSelected={!!selectedProjectIds?.has(project.projectId)}
                      onToggleSelect={onToggleProjectSelect}
                      enableGrouping={mode === 'projects'}
                      pfGroups={pfGroups}
                    />
                  ))}

                  {/* Show totals if there's data */}
                  {section.projects?.length > 0 && (
                    <SectionTotalRow
                      sectionLabel={section.label}
                      totals={sectionTotals}
                      isColumnVisible={isColumnVisible}
                      shouldShowMoneyTotals={shouldShowMoneyTotals}
                      gridWidthPx={gridWidthPx}
                    />
                  )}
                </section>
              );
            })
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              {vendorCodeFilter ? 'No items found for this vendor' : (
                mode === 'missingExtra' ? 'No Missing & Extra cases found' : 'No projects found'
              )}
            </div>
          )
        )}
      </div>

      {/* Fixed bottom scrollbar - always visible at viewport bottom */}
      <div ref={bottomBarRef} onScroll={handleBottomBarScroll} className="global-scroll-bottom-bar">
        <div ref={bottomBarInnerRef} className="global-scroll-bottom-content" />
      </div>
    </>
  );
});

OperationalBoardGrid.displayName = 'OperationalBoardGrid';
export default OperationalBoardGrid;