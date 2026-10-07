// DirectOrder.tsx - Direct Order projects page (mirrors OperationalBoard.tsx)

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLivePatchStore, PatchEventPayload } from '../hooks/useLivePatchStore';
import OperationalBoardGrid from '../components/OperationalBoardGrid';
import FilterBar from '../components/FilterBar';
import HalfAssignmentToolbar from '../components/HalfAssignmentToolbar';
import AddProjectDrawer from '../components/AddProjectDrawer';
import { useAuth } from '../contexts/AuthContext';
import { usePagePermissions } from '../hooks/usePagePermissions';
import { useColumnPermissions } from '../hooks/useColumnPermissions';
import { createEmptyFilters } from '../types';
import {
  getDirectOrders,
  createDirectOrder,
  bulkAssignDirectOrderHalf
} from '../lib/direct-orders';
import { mapBackendTypeToFrontend, mapItemStatusToFrontend, BackendProjectItem } from '../lib/projects';
import { CreateProjectData, ProjectsData, FilterConfig } from '../types';
import { filterProjects } from '../utils/filterUtils';
import { exportProjectsToExcel } from '../utils/excel/exportProjectsExcel';
import { useSocket } from '../contexts/SocketContext';
import { useSocketEvent } from '../hooks/useSocketEvent';

const DirectOrder: React.FC = () => {
  // ===================== STATE MANAGEMENT =====================
  const [projectsData, setProjectsData] = useState<ProjectsData>({
    sections: [],
    lastUpdate: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<FilterConfig>(createEmptyFilters());
  const [projectSearch, setProjectSearch] = useState('');
  const [aggregationTrigger, setAggregationTrigger] = useState(0); // ✅ ADD: Force aggregation recalculation

  // HALF-YEAR ASSIGNMENT: selection state
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const handleToggleProjectSelect = useCallback((projectId: string) => {
    setSelectedProjectIds(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);

  // ===================== HOOKS =====================
  const { isAuthenticated } = useAuth();
  const { canAccessOperationalBoard } = usePagePermissions();
  const { isColumnVisible } = useColumnPermissions();

  // ===================== ACCESS CONTROL =====================
  // For now, use the same permission as OperationalBoard
  // TODO: Add specific DirectOrder permission if needed
  const hasDirectOrderAccess = canAccessOperationalBoard;

  // ===================== DATA FETCHING =====================
  const fetchDirectOrders = async () => {
    if (!isAuthenticated || !hasDirectOrderAccess) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);


      const response = await getDirectOrders();


      const bucketToLabel: Record<string, string> = {
        'TLINES_NE': 'TLines NE',
        'TLINES_SE': 'TLines SE',
        'TLINES_NW': 'TLines NW',
        'CVW': 'TLines CVW',
        'TLINES_HQ': 'TLines HQ',
        'TLINES_TC': 'TLines TC',
      };

      const canonicalSections = response.sections.map((section: any) => ({
        id: section.section,
        label: bucketToLabel[section.section] || section.section,
        projects: section.projects.map((p: any) => {

          // Build PO Sign Status by type from actual items (FIXED: Proper aggregation)
          const poSignStatusByType: Record<string, string> = {};
          const typeGroups: Record<string, string[]> = {};

          // First, group items by type
          (p.items || []).forEach((item: any) => {
            const frontendType = item.type || 'Unknown';
            const poStatus = item.poSignStatus;
            const mappedStatus = poStatus === 'NOT_SIGNED' ? 'NOT SIGNED' :
              poStatus === 'READY_TO_SIGN' ? 'READY TO SIGN' :
                poStatus === 'WAITING_TLINES_TO_SIGN' ? 'WAITING TLINES TO SIGN' :
                poStatus === 'WAITING_T_TO_SIGN' ? 'WAITING T TO SIGN' :
                poStatus === 'SIGNED' ? 'SIGNED' : null;

            if (!typeGroups[frontendType]) {
              typeGroups[frontendType] = [];
            }
            if (mappedStatus) typeGroups[frontendType].push(mappedStatus);
          });

          // Then, determine type-level status using business rules
          Object.keys(typeGroups).forEach(frontendType => {
            const statuses = typeGroups[frontendType];

            if (statuses.includes('SIGNED')) {
              poSignStatusByType[frontendType] = 'SIGNED';
            } else if (statuses.includes('WAITING TLINES TO SIGN')) {
              poSignStatusByType[frontendType] = 'WAITING TLINES TO SIGN';
            } else if (statuses.includes('WAITING T TO SIGN')) {
              poSignStatusByType[frontendType] = 'WAITING T TO SIGN';
            } else if (statuses.includes('READY TO SIGN')) {
              poSignStatusByType[frontendType] = 'READY TO SIGN';
            } else if (statuses.includes('NOT SIGNED')) {
              poSignStatusByType[frontendType] = 'NOT SIGNED';
            }
            // null/empty = no entry → displays blank
          });

          // ✅ DO_PROJECTNO_PROOF: Keep projectNo as string

          return {
            projectId: p.id,
            projectNumber: String(p.projectNo),
            projectNumberColor: 'blue' as const,
            projectName: p.name || '',
            address: p.address || '',
            region: p.region || '',
            bucket: p.bucket,
            backendItems: p.items ?? [],
            poSignStatusByType,
            isUrgent: Boolean(p.isUrgent),
            containerDate: p.containerDate || null,
            halfOfYear: p.halfOfYear || null,
            halfYear: p.halfYear || null,
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
            }))
          };
        })
      }));

      setProjectsData({
        sections: canonicalSections,
        lastUpdate: new Date(),
      });
    } catch (err) {
      console.error('❌ DIRECT_ORDER_COMPONENT_FETCH_ERROR:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch direct orders');
    } finally {
      setLoading(false);
    }
  };

  // ===================== EFFECTS =====================
  useEffect(() => {
    fetchDirectOrders();
  }, [isAuthenticated, hasDirectOrderAccess]);

  // Socket.IO: real-time updates for direct orders
  const { joinRooms, leaveRooms, isConnected, userId: myUserId } = useSocket();
  const prevConnected = useRef(isConnected);
  const livePatch = useLivePatchStore();

  useEffect(() => {
    joinRooms(['direct-orders']);
    return () => { leaveRooms(['direct-orders']); };
  }, [joinRooms, leaveRooms]);

  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      fetchDirectOrders();
    }
    prevConnected.current = isConnected;
  }, [isConnected]);

  // Debounced refetch for create/delete events (rare, full refetch is OK)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchDirectOrders(), 300);
  }, []);

  // Patch-based handler: apply cell-level updates without full refetch
  const handlePatchEvent = useCallback((data: PatchEventPayload) => {
    if (data.entity !== 'directOrderItem') return;
    if (!myUserId) return;

    const result = livePatch.handlePatchEvent(data, myUserId);
    if (result.apply && result.patch && result.entityId) {
      // Surgically update the item in the nested sections state
      setProjectsData(prev => ({
        ...prev,
        sections: prev.sections.map(section => ({
          ...section,
          projects: section.projects.map((project: any) => ({
            ...project,
            backendItems: (project.backendItems || []).map((item: any) => {
              if (item.id !== result.entityId) return item;
              return { ...item, ...result.patch };
            }),
            rows: (project.rows || []).map((row: any) => {
              if (row.itemId !== result.entityId) return row;
              return { ...row, ...result.patch };
            }),
          })),
        })),
      }));
      // Trigger aggregation recalculation
      setAggregationTrigger(prev => prev + 1);
    }
  }, [myUserId, livePatch]);

  // Subscribe to patch events for cell-level updates
  useSocketEvent('entity:patched', handlePatchEvent);

  // Create & delete = full refetch (rare operations)
  useSocketEvent('do-item:created', debouncedRefetch);
  useSocketEvent('do-item:deleted', debouncedRefetch);
  useSocketEvent('do-project:created', debouncedRefetch);
  useSocketEvent('do-project:updated', debouncedRefetch);
  useSocketEvent('do-project:deleted', debouncedRefetch);

  // ===================== PROJECT HANDLERS =====================
  const handleCreateProject = async (data: CreateProjectData) => {
    try {

      // Don't modify projectNo - it's already "DO-04" format from drawer
      await createDirectOrder(data);
      await fetchDirectOrders();
      setShowCreateModal(false);

    } catch (err) {
      console.error('❌ Error creating direct order project:', err);
      throw err;
    }
  };


  // ===================== DYNAMIC PO SIGN STATUS AGGREGATION =====================
  const sectionsWithUpdatedAggregation = useMemo(() => {

    return projectsData.sections.map((section: any) => ({
      ...section,
      projects: section.projects.map((project: any) => {
        const poSignStatusByType: Record<string, string> = {};
        const typeGroups: Record<string, string[]> = {};

        // Group items by type and collect their PO statuses
        (project.backendItems || []).forEach((item: any) => {
          const frontendType = mapBackendTypeToFrontend(item.type, item.customType) || 'Unknown';
          const poStatus = item.poSignStatus;
          const mappedStatus = poStatus === 'NOT_SIGNED' ? 'NOT SIGNED' :
            poStatus === 'READY_TO_SIGN' ? 'READY TO SIGN' :
              poStatus === 'WAITING_TLINES_TO_SIGN' ? 'WAITING TLINES TO SIGN' :
              poStatus === 'WAITING_T_TO_SIGN' ? 'WAITING T TO SIGN' :
              poStatus === 'SIGNED' ? 'SIGNED' : null;

          if (!typeGroups[frontendType]) {
            typeGroups[frontendType] = [];
          }
          if (mappedStatus) typeGroups[frontendType].push(mappedStatus);
        });

        // Calculate type-level status using business rules
        Object.keys(typeGroups).forEach(frontendType => {
          const statuses = typeGroups[frontendType];

          if (statuses.includes('SIGNED')) {
            poSignStatusByType[frontendType] = 'SIGNED';
          } else if (statuses.includes('WAITING TLINES TO SIGN')) {
            poSignStatusByType[frontendType] = 'WAITING TLINES TO SIGN';
          } else if (statuses.includes('WAITING T TO SIGN')) {
            poSignStatusByType[frontendType] = 'WAITING T TO SIGN';
          } else if (statuses.includes('READY TO SIGN')) {
            poSignStatusByType[frontendType] = 'READY TO SIGN';
          } else if (statuses.includes('NOT SIGNED')) {
            poSignStatusByType[frontendType] = 'NOT SIGNED';
          }
          // null/empty = no entry → displays blank
        });

        return {
          ...project,
          poSignStatusByType, // ✅ DYNAMIC: Recalculated on every render when data changes
          isUrgent: Boolean(project.isUrgent), // ✅ PRESERVE: Ensure boolean type
          containerDate: project.containerDate, // ✅ PRESERVE: Keep container date
        };
      })
    }));
  }, [projectsData.sections, aggregationTrigger]);

  // Derive unique containers from table rows for filter
  const availableContainers = useMemo(() => {
    const seen = new Map<string, string>();
    sectionsWithUpdatedAggregation.forEach((section: any) => {
      (section.projects || []).forEach((project: any) => {
        (project.rows || []).forEach((row: any) => {
          if (row.containerNo && row.containerNo.trim()) {
            const key = row.containerNo.trim().toLowerCase();
            if (!seen.has(key)) seen.set(key, row.containerNo.trim());
          }
        });
      });
    });
    return [...seen.values()];
  }, [sectionsWithUpdatedAggregation]);

  // Distinct half/year tokens present in the (unfiltered) data, for the Half filter dropdown
  const availableHalves = useMemo(() => {
    const seen = new Set<string>();
    projectsData.sections.forEach((section: any) => {
      (section.projects || []).forEach((project: any) => {
        if (project.halfOfYear && project.halfYear) {
          seen.add(`${project.halfYear}:${project.halfOfYear}`);
        }
      });
    });
    return [...seen.values()].sort();
  }, [projectsData.sections]);

  // ===================== FILTERING =====================
  const filteredSections = useMemo(() => {
    const hasActiveFilters = filters.vendors.length > 0 ||
      (filters.vendorCodes?.length ?? 0) > 0 ||
      filters.types.length > 0 ||
      filters.statuses.length > 0 ||
      (filters.containers?.length || 0) > 0 ||
      (filters.halves?.length || 0) > 0;

    const q = projectSearch.trim().toLowerCase();

    const applySearch = (projects: any[]) => {
      if (!q) return projects;
      const exact: any[] = [], starts: any[] = [], contains: any[] = [];
      projects.forEach(p => {
        const num = String(p.projectNumber ?? p.projectNo ?? '').toLowerCase();
        if (num === q) exact.push(p);
        else if (num.startsWith(q)) starts.push(p);
        else if (num.includes(q)) contains.push(p);
      });
      return [...exact, ...starts, ...contains];
    };

    const base = hasActiveFilters
      ? sectionsWithUpdatedAggregation.map((section: any) => ({
          ...section,
          projects: filterProjects(section.projects, filters),
        })).filter((section: any) => section.projects.length > 0)
      : sectionsWithUpdatedAggregation;

    if (!q) return base;
    return base.map((section: any) => ({
      ...section,
      projects: applySearch(section.projects),
    })).filter((section: any) => section.projects.length > 0);
  }, [sectionsWithUpdatedAggregation, filters, projectSearch]);

  // HALF-YEAR ASSIGNMENT: currently-visible (post-filter) project ids + selection helpers
  const visibleProjectIds = useMemo(() => {
    const ids = new Set<string>();
    filteredSections.forEach((section: any) => {
      (section.projects || []).forEach((project: any) => {
        if (project.projectId) ids.add(project.projectId);
      });
    });
    return [...ids];
  }, [filteredSections]);

  const allVisibleSelected = visibleProjectIds.length > 0 && visibleProjectIds.every(id => selectedProjectIds.has(id));

  const handleToggleSelectAll = () => {
    setSelectedProjectIds(allVisibleSelected ? new Set() : new Set(visibleProjectIds));
  };

  const handleHalfAssigned = () => {
    setSelectedProjectIds(new Set());
    fetchDirectOrders();
  };

  // ===================== ITEM UPDATE HANDLER =====================
  const handleItemUpdate = () => {
    setAggregationTrigger(prev => prev + 1);
  };

  // ===================== EXTERNAL ITEM CREATED (refreshless insert) =====================
  const handleExternalItemCreated = useCallback((projectId: string, item: BackendProjectItem) => {
    const newRow = {
      itemId: item.id,
      type: mapBackendTypeToFrontend(item.type, (item as any).customType),
      vendor: item.vendor
        ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name)
        : '',
      vendorId: item.vendorId || '',
      orderType: item.orderType || '',
      status: mapItemStatusToFrontend(item.status ?? ''),
      pfCode: item.pfCode ?? '',
      pfSignStatus: item.pfSignStatus,
      poSignStatus: item.poSignStatus,
      containerNo: item.containerNo ?? '',
      std: item.std, etd: item.etd, rtd: item.rtd,
      rtr: item.rtr, rdy: item.rdy, ftd: item.ftd, snd: item.snd,
      pfUsd: item.pfUsd?.toString() ?? '',
      pfTl: item.pfTl?.toString() ?? '',
      invoice: item.invoice != null ? item.invoice.toString() : '',
      invoiceTl: item.invoiceTl != null ? item.invoiceTl.toString() : '',
      statusNote: item.statusNote ?? '',
      paymentRule: item.paymentRule ?? '',
    };

    setProjectsData(prev => ({
      ...prev,
      sections: prev.sections.map((section: any) => ({
        ...section,
        projects: section.projects.map((project: any) => {
          if (project.projectId !== projectId) return project;
          const alreadyExists = (project.backendItems ?? []).some((i: any) => i.id === item.id);
          if (alreadyExists) return project;
          const filteredRows = (project.rows || []).filter((r: any) => !(!r.itemId && r.type === newRow.type));
          return {
            ...project,
            backendItems: [...(project.backendItems ?? []), item],
            rows: [...filteredRows, newRow],
          };
        }),
      })),
    }));
  }, []);

  // ===================== EXPORT HANDLER =====================
  const handleExportExcel = () => {
    if (filteredSections.length === 0) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    exportProjectsToExcel({ sections: filteredSections, isColumnVisible, filename: `Direct_Order_${dateStr}.xlsx` });
  };

  // ===================== RENDER CONDITIONS =====================
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Please log in to access Direct Order.</p>
      </div>
    );
  }

  if (!hasDirectOrderAccess) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>You don't have access to the Direct Order module.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading direct orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <p>Error: {error}</p>
        <button onClick={fetchDirectOrders} style={{ marginTop: '10px' }}>
          Retry
        </button>
      </div>
    );
  }

  // ===================== RENDER =====================
  return (
    <div className="board-page board-page--projects">
      {/* Page header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: '108px',
        zIndex: 100
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
          Direct Order
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={projectSearch}
              onChange={e => setProjectSearch(e.target.value)}
              placeholder="Proje ara..."
              style={{
                width: '200px',
                padding: '6px 28px 6px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            {projectSearch && (
              <span
                onClick={() => setProjectSearch('')}
                style={{ position: 'absolute', right: '8px', cursor: 'pointer', color: '#9ca3af', fontSize: '14px', fontWeight: '700' }}
              >×</span>
            )}
          </div>
          <button
            onClick={handleExportExcel}
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2c3e50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>+</span>
            <span>Add Project</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar
        filterConfig={filters}
        onFilterChange={setFilters}
        totalItems={sectionsWithUpdatedAggregation.reduce((acc, section) => acc + section.projects.length, 0)}
        filteredItems={filteredSections.reduce((acc, section) => acc + section.projects.length, 0)}
        availableContainers={availableContainers}
        availableHalves={availableHalves}
        matchingProjectCount={visibleProjectIds.length}
      />

      {/* Half-year assignment toolbar */}
      <HalfAssignmentToolbar
        selectedCount={selectedProjectIds.size}
        allVisibleSelected={allVisibleSelected}
        visibleCount={visibleProjectIds.length}
        onToggleSelectAll={handleToggleSelectAll}
        selectedIds={Array.from(selectedProjectIds)}
        onAssign={bulkAssignDirectOrderHalf}
        onAssigned={handleHalfAssigned}
      />

      {/* Grid component */}
      <OperationalBoardGrid
        mode="directOrder"
        projects={filteredSections}
        externalLoading={loading}
        filterConfig={filters}
        onItemUpdate={handleItemUpdate}
        projectSearch={projectSearch}
        onExternalItemCreated={handleExternalItemCreated}
        selectedProjectIds={selectedProjectIds}
        onToggleProjectSelect={handleToggleProjectSelect}
      />

      {/* Add Direct Order Drawer */}
      <AddProjectDrawer
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        mode="directOrder"
        onCreateProject={async (data) => {

          // Combine all types
          const allTypes = [...(data.selectedTypes || []), ...(data.customTypes || [])];


          // projectNumber is already "DO-04" format (text input)
          const payload = {
            projectNo: data.projectNumber as any,
            name: data.projectName,
            address: data.address || '',
            bucket: data.sectionId as any,
            description: '',
            status: 'PRE_PROJECT',
            types: allTypes
          };


          await handleCreateProject(payload as any);

          return { success: true };
        }}
        existingProjectNumbers={{}}
      />
    </div>
  );
};

export default DirectOrder;