import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterBar, { FilterConfig } from '../components/FilterBar';
import OperationalBoardGrid, { OperationalBoardGridHandle } from '../components/OperationalBoardGrid';
import HalfAssignmentToolbar from '../components/HalfAssignmentToolbar';
import AddProjectDrawer, { NewProjectData } from '../components/AddProjectDrawer';
import AccessDenied from '../components/AccessDenied';
import { createProject, getProjects, bulkAssignProjectHalf, ApiSection } from '../lib/projects';
import { createMissingExtraCase, bulkAssignMissingExtraHalf } from '../lib/missing-extra';
import { TodayPfFlag, todayPfActiveKeys } from '../lib/today-pf';
import { PfGroup, getPfGroups } from '../lib/pf-groups';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { ProjectType } from '../types';
import { usePagePermissions } from '../hooks/usePagePermissions';
import { useColumnPermissions } from '../hooks/useColumnPermissions';
import { exportProjectsToExcel } from '../utils/excel/exportProjectsExcel';
import { exportProjectsAllTabsToExcel } from '../utils/excel/exportProjectsAllTabsExcel';

// Map dashboard issueType to the problematic field
const ISSUE_TYPE_TO_FIELD: Record<string, string> = {
  'ORDERED_NO_ETD': 'etd',
  'READY_NO_RTD': 'rtd',
  'SENT_TO_TLINES_NO_FTD': 'ftd',
  'RECEIVED_NO_RTD': 'rtd',
  'NO_VENDOR': 'vendor',
  'NO_ORDER_TYPE': 'orderType',
  'NO_CONTAINER': 'containerNo',
};

// Type options for Missing & Extra case creation (same as Add Project)
const TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: 'Millwork', label: 'Millwork' },
  { value: 'Shelving', label: 'Shelving' },
  { value: 'Ceiling', label: 'Ceiling' },
  { value: 'Furniture', label: 'Furniture' },
  { value: 'Image', label: 'Image' }
];

interface OperationalBoardProps {
  mode?: 'projects' | 'missingExtra';
  vendorCodeFilter?: string;
}

const OperationalBoard: React.FC<OperationalBoardProps> = ({ mode = 'projects', vendorCodeFilter }) => {
  const { canAccessOperationalBoard } = usePagePermissions();
  const { isColumnVisible } = useColumnPermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sectionsData, setSectionsData] = useState<ApiSection[]>([]);
  const [allSectionsData, setAllSectionsData] = useState<ApiSection[]>([]); // Unfiltered, for filter-dropdown option lists

  // TODAY'S PFs: flags reported up by TodayPfControl (it owns fetching + socket refresh)
  const [todayPfFlags, setTodayPfFlags] = useState<TodayPfFlag[]>([]);

  // PF GROUPS: owned here (unlike Today's PFs) because both the right-click "Add to
  // Group" menu (inside each ProjectBlock) and the grouped table view need the list.
  const [pfGroups, setPfGroups] = useState<PfGroup[]>([]);
  const refreshPfGroups = useCallback(() => {
    getPfGroups().then(setPfGroups).catch(() => { /* non-critical: leave last-known groups in place */ });
  }, []);
  useEffect(() => { if (mode === 'projects') refreshPfGroups(); }, [mode, refreshPfGroups]);
  useSocketEvent('pf-group:updated', refreshPfGroups);

  // Derive unique containers from table rows for filter
  const availableContainers = useMemo(() => {
    const seen = new Map<string, string>();
    sectionsData.forEach((section: any) => {
      (section.projects || []).forEach((project: any) => {
        (project.rows || []).forEach((row: any) => {
          if (row.containerNo && row.containerNo.trim()) {
            const key = row.containerNo.trim().toLowerCase();
            if (!seen.has(key)) seen.set(key, row.containerNo.trim());
          }
        });
        (project.backendItems || []).forEach((item: any) => {
          if (item.containerNo && item.containerNo.trim()) {
            const key = item.containerNo.trim().toLowerCase();
            if (!seen.has(key)) seen.set(key, item.containerNo.trim());
          }
        });
      });
    });
    return [...seen.values()];
  }, [sectionsData]);

  // Derive distinct half/year tokens present in the data, for the Half filter dropdown.
  // Built from the UNFILTERED project set so selecting "First Half" doesn't make
  // "Second Half" disappear from the option list.
  const availableHalves = useMemo(() => {
    const seen = new Set<string>();
    allSectionsData.forEach((section: any) => {
      (section.projects || []).forEach((project: any) => {
        if (project.halfOfYear && project.halfYear) {
          seen.add(`${project.halfYear}:${project.halfOfYear}`);
        }
      });
    });
    return [...seen.values()].sort();
  }, [allSectionsData]);

  // HALF-YEAR ASSIGNMENT: currently-visible (post-filter) project ids + selection state
  const visibleProjectIds = useMemo(() => {
    const ids = new Set<string>();
    sectionsData.forEach((section: any) => {
      (section.projects || []).forEach((project: any) => {
        if (project.projectId) ids.add(project.projectId);
      });
    });
    return [...ids];
  }, [sectionsData]);

  // Half-year assignment is supported on Projects and Missing & Extra (both are
  // backed by their own real DB rows with halfOfYear/halfYear columns). Direct
  // Order has its own separate page (DirectOrder.tsx) with the same feature.
  const isHalfSelectableMode = mode === 'projects' || mode === 'missingExtra';

  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());

  // OperationalBoard is reused (not remounted) when switching between the
  // Projects and Missing & Extra tabs, so clear any leftover selection when
  // the mode changes to avoid mixing project ids with case ids.
  useEffect(() => {
    setSelectedProjectIds(new Set());
  }, [mode]);

  const handleToggleProjectSelect = useCallback((projectId: string) => {
    setSelectedProjectIds(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);

  const allVisibleSelected = visibleProjectIds.length > 0 && visibleProjectIds.every(id => selectedProjectIds.has(id));

  const handleToggleSelectAll = () => {
    setSelectedProjectIds(allVisibleSelected ? new Set() : new Set(visibleProjectIds));
  };

  const handleHalfAssigned = () => {
    setSelectedProjectIds(new Set());
    // The backend excludes the acting user's own socket from the project:updated
    // broadcast (it assumes this tab already has fresh data from the HTTP response),
    // so this tab must refetch explicitly — otherwise the grid looks unchanged
    // until a manual page reload.
    gridRef.current?.refreshData();
  };

  // Dashboard highlighting: read itemId and issueType from URL
  const highlightedItemId = searchParams.get('itemId');
  const issueType = searchParams.get('issueType');
  const highlightField = issueType ? ISSUE_TYPE_TO_FIELD[issueType] || null : null;

  // Clear highlight params after 4 seconds so re-navigation works
  useEffect(() => {
    if (highlightedItemId) {
      const timer = setTimeout(() => {
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.delete('itemId');
          next.delete('projectId');
          next.delete('issueType');
          return next;
        }, { replace: true });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [highlightedItemId, setSearchParams]);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    vendors: [],
    vendorCodes: [],
    types: [],
    statuses: [],
    containers: [],
    halves: []
  });
  // Keys of flagged (project, type) pairs for whichever lists (Today's PFs / To Order) are toggled on — union when both
  const todayPfKeys = useMemo(() => todayPfActiveKeys(todayPfFlags.filter(f =>
    (f.kind === 'PF' && filterConfig.todayPfOnly) || (f.kind === 'FOLLOWUP' && filterConfig.followUpOnly)
  )), [todayPfFlags, filterConfig.todayPfOnly, filterConfig.followUpOnly]);
  const [projectSearch, setProjectSearch] = useState('');
  const [addProjectDrawerOpen, setAddProjectDrawerOpen] = useState(false);

  // Missing Extra case creation state
  const [addCaseDrawerOpen, setAddCaseDrawerOpen] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [caseFormData, setCaseFormData] = useState({
    section: '' as 'TLINES_NE' | 'TLINES_SE' | 'TLINES_NW' | 'CVW' | 'TLINES_HQ' | 'TLINES_TC' | '',
    projectSource: 'fromProjects' as 'fromProjects' | 'legacy',
    selectedProjectId: '',
    legacyProjectNo: '',
    legacyProjectName: '',
    caseType: '' as 'MISSING' | 'EXTRA' | 'REPLACEMENT' | '',
    caseIndex: '',
    selectedTypes: [] as ProjectType[]
  });
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [caseFormError, setCaseFormError] = useState<string | null>(null);

  // Ref to access grid refresh function
  const gridRef = React.useRef<OperationalBoardGridHandle>(null);

  const handleFilterChange = (config: FilterConfig) => {
    setFilterConfig(config);
  };

  const handleExportExcel = () => {
    if (sectionsData.length === 0) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    if (mode === 'projects') {
      // Projects export: one workbook with Projects + Missing & Extra +
      // Direct Orders + Project Total sheets
      exportProjectsAllTabsToExcel({
        projectsSections: sectionsData,
        isColumnVisible,
        filename: `Operational_Board_${dateStr}.xlsx`,
      });
    } else {
      exportProjectsToExcel({ sections: sectionsData, isColumnVisible, filename: `Missing_Extra_${dateStr}.xlsx` });
    }
  };



  const handleAddCase = () => {
    setCaseFormData({
      section: '',
      projectSource: 'fromProjects',
      selectedProjectId: '',
      legacyProjectNo: '',
      legacyProjectName: '',
      caseType: '',
      caseIndex: '',
      selectedTypes: []
    });
    setCaseFormError(null);
    setAddCaseDrawerOpen(true);

    // Load projects in background - don't block modal opening
    getProjects()
      .then((response) => {
        const projects = response.data.map((p: any) => ({
          id: p.id,
          projectNo: p.projectNo,
          name: p.name,
          section: p.bucket
        }));
        setAvailableProjects(projects);
      })
      .catch((error) => {
        console.warn('🛡️ Projects API unavailable for case creation, but legacy mode still works:', error);
        setAvailableProjects([]);
      });
  };

  const handleCloseAddProjectDrawer = () => {
    setAddProjectDrawerOpen(false);
  };

  const handleCloseAddCaseDrawer = () => {
    setAddCaseDrawerOpen(false);
    setIsCreatingCase(false);
    setCaseFormData({
      section: '',
      projectSource: 'fromProjects',
      selectedProjectId: '',
      legacyProjectNo: '',
      legacyProjectName: '',
      caseType: '',
      caseIndex: '',
      selectedTypes: []
    });
    setCaseFormError(null);
  };

  const handleTypeToggle = (type: ProjectType) => {
    setCaseFormData(prev => {
      const safeSelectedTypes = Array.isArray(prev.selectedTypes) ? prev.selectedTypes : [];
      return {
        ...prev,
        selectedTypes: safeSelectedTypes.includes(type)
          ? safeSelectedTypes.filter(t => t !== type)
          : [...safeSelectedTypes, type]
      };
    });
  };

  const handleCreateCase = async () => {
    setIsCreatingCase(true);
    setCaseFormError(null);

    let requestData: any = {
      section: caseFormData.section,
      caseType: caseFormData.caseType,
      types: caseFormData.selectedTypes.map(type => type.toUpperCase())
    };

    try {
      if (!caseFormData.section || !caseFormData.caseType) {
        setCaseFormError('Please fill in all required fields');
        setIsCreatingCase(false);
        return;
      }

      if (caseFormData.selectedTypes.length === 0) {
        setCaseFormError('Please select at least one type');
        setIsCreatingCase(false);
        return;
      }

      if (caseFormData.projectSource === 'fromProjects' && !caseFormData.selectedProjectId) {
        setCaseFormError('Please select a project');
        setIsCreatingCase(false);
        return;
      }

      if (caseFormData.projectSource === 'legacy' && (!caseFormData.legacyProjectNo || !caseFormData.legacyProjectName)) {
        setCaseFormError('Please fill in project number and name');
        setIsCreatingCase(false);
        return;
      }

      if (caseFormData.projectSource === 'fromProjects') {
        requestData.baseProjectId = caseFormData.selectedProjectId;
      } else {
        requestData.legacyProjectNo = caseFormData.legacyProjectNo.trim();
        requestData.legacyProjectName = caseFormData.legacyProjectName;
      }

      // Add custom case index if provided
      if (caseFormData.caseIndex.trim() !== '') {
        const parsedIndex = parseInt(caseFormData.caseIndex);
        if (isNaN(parsedIndex) || parsedIndex < 1) {
          setCaseFormError('Case index must be a positive number');
          setIsCreatingCase(false);
          return;
        }
        requestData.caseIndex = parsedIndex;
      }

      await createMissingExtraCase(requestData);

      handleCloseAddCaseDrawer();

      // OPTIMISTIC REFRESH: Immediately refresh Missing/Extra data
      if (gridRef.current) {
        await gridRef.current.refreshData();
      } else {
        console.warn('⚠️ Grid refresh function not available');
      }
    } catch (error) {
      setCaseFormError(`Failed to create case: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingCase(false);
    }
  };

  const handleCreateProject = async (data: NewProjectData): Promise<{ success: boolean; error?: string }> => {
    try {
      const projectRequest: any = {
        bucket: data.sectionId as 'TLINES_NE' | 'TLINES_SE' | 'TLINES_NW' | 'CVW' | 'TLINES_HQ' | 'TLINES_TC',
        projectNo: `${data.projectNumber}`,
        name: data.projectName,
        address: data.address || '',
        types: [...data.selectedTypes.map(type => type.toUpperCase()), ...data.customTypes.map(type => type.toUpperCase())],
        ...(data.dropboxSection && { dropboxSection: data.dropboxSection }),
        ...(data.dropboxRegion && { dropboxRegion: data.dropboxRegion }),
        ...(data.dropboxStatus && { dropboxStatus: data.dropboxStatus }),
        ...(data.dropboxClientType && { dropboxClientType: data.dropboxClientType }),
        ...(data.clientName && { clientName: data.clientName }),
      };

      await createProject(projectRequest);

      // Refresh grid so the new project appears immediately (don't await — let drawer close instantly)
      if (gridRef.current) {
        gridRef.current.refreshData();
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create project' };
    }
  };

  // Page Access Control
  if (!canAccessOperationalBoard) {
    return (
      <AccessDenied
        title="Projects Access Denied"
        message="Your role does not have permission to access Projects. Please contact your administrator if you need access."
      />
    );
  }

  return (
    <div className={`board-page ${mode === 'missingExtra' ? 'board-page--missing' : 'board-page--projects'}`}>
      {/* Page header with mode-specific content */}
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
          {mode === 'missingExtra' ? 'Missing & Extra' : 'Projects'}
        </h2>

        {mode === 'projects' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Project search */}
            {!vendorCodeFilter && (
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={projectSearch}
                  onChange={e => setProjectSearch(e.target.value)}
                  placeholder="Proje ara..."
                  style={{
                    height: '34px',
                    width: '200px',
                    padding: '0 28px 0 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {projectSearch && (
                  <span
                    onClick={() => setProjectSearch('')}
                    style={{
                      position: 'absolute', right: '8px', top: '50%',
                      transform: 'translateY(-50%)', cursor: 'pointer',
                      color: '#9ca3af', fontSize: '16px', fontWeight: '700', lineHeight: 1
                    }}
                  >×</span>
                )}
              </div>
            )}
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
              onClick={() => setAddProjectDrawerOpen(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563eb',
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
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Project search for ME mode */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={projectSearch}
                onChange={e => setProjectSearch(e.target.value)}
                placeholder="Proje ara..."
                style={{
                  height: '34px', width: '200px',
                  padding: '0 28px 0 10px',
                  border: '1px solid #d1d5db', borderRadius: '4px',
                  fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                }}
              />
              {projectSearch && (
                <span onClick={() => setProjectSearch('')} style={{
                  position: 'absolute', right: '8px', top: '50%',
                  transform: 'translateY(-50%)', cursor: 'pointer',
                  color: '#9ca3af', fontSize: '16px', fontWeight: '700', lineHeight: 1
                }}>×</span>
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
              onClick={handleAddCase}
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
              <span>Create Missing/Extra</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter bar - only show when vendorCodeFilter is not provided */}
      {!vendorCodeFilter && (
        <FilterBar
          filterConfig={filterConfig}
          onFilterChange={handleFilterChange}
          totalItems={0}
          filteredItems={0}
          availableContainers={availableContainers}
          availableHalves={availableHalves}
          matchingProjectCount={visibleProjectIds.length}
          showTodayPf={mode === 'projects'}
          onTodayPfFlagsChange={setTodayPfFlags}
          pfGroups={mode === 'projects' ? pfGroups : []}
        />
      )}

      {/* Half-year assignment toolbar - Projects and Missing & Extra tabs */}
      {!vendorCodeFilter && isHalfSelectableMode && (
        <HalfAssignmentToolbar
          selectedCount={selectedProjectIds.size}
          allVisibleSelected={allVisibleSelected}
          visibleCount={visibleProjectIds.length}
          onToggleSelectAll={handleToggleSelectAll}
          selectedIds={Array.from(selectedProjectIds)}
          onAssign={mode === 'missingExtra' ? bulkAssignMissingExtraHalf : bulkAssignProjectHalf}
          onAssigned={handleHalfAssigned}
        />
      )}

      {/* Grid component */}
      <OperationalBoardGrid
        ref={gridRef}
        mode={mode}
        vendorCodeFilter={vendorCodeFilter}
        filterConfig={filterConfig}
        readOnly={!!vendorCodeFilter}
        onSectionsChange={setSectionsData}
        onAllSectionsChange={setAllSectionsData}
        highlightedItemId={highlightedItemId}
        highlightField={highlightField}
        projectSearch={projectSearch}
        selectedProjectIds={isHalfSelectableMode && !vendorCodeFilter ? selectedProjectIds : undefined}
        onToggleProjectSelect={isHalfSelectableMode && !vendorCodeFilter ? handleToggleProjectSelect : undefined}
        todayPfActiveKeys={mode === 'projects' ? todayPfKeys : undefined}
        pfGroups={mode === 'projects' ? pfGroups : []}
        allSectionsData={allSectionsData}
      />

      {/* Add Project Drawer */}
      <AddProjectDrawer
        isOpen={addProjectDrawerOpen}
        onClose={handleCloseAddProjectDrawer}
        onCreateProject={handleCreateProject}
        existingProjectNumbers={{}}
      />

      {/* Create Case Modal */}
      {addCaseDrawerOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            minWidth: '500px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
              Create Missing/Extra Case
            </h3>

            {caseFormError && (
              <div style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '20px',
                border: '1px solid #f5c6cb'
              }}>
                {caseFormError}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Section *
              </label>
              <select
                value={caseFormData.section}
                onChange={(e) => setCaseFormData(prev => ({ ...prev, section: e.target.value as any }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">-- Select Section --</option>
                <option value="TLINES_NE">TLines NE</option>
                <option value="TLINES_SE">TLines SE</option>
                <option value="TLINES_NW">TLines NW</option>
                <option value="CVW">TLines CVW</option>
                <option value="TLINES_HQ">TLines HQ</option>
                <option value="TLINES_TC">TLines TC</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500' }}>
                Project Source
              </label>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="projectSource"
                    value="fromProjects"
                    checked={caseFormData.projectSource === 'fromProjects'}
                    onChange={(e) => setCaseFormData(prev => ({ ...prev, projectSource: e.target.value as any }))}
                    style={{ marginRight: '8px' }}
                  />
                  From Projects (default)
                </label>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="projectSource"
                    value="legacy"
                    checked={caseFormData.projectSource === 'legacy'}
                    onChange={(e) => setCaseFormData(prev => ({ ...prev, projectSource: e.target.value as any }))}
                    style={{ marginRight: '8px' }}
                  />
                  Legacy project (manual)
                </label>
              </div>
            </div>

            {caseFormData.projectSource === 'fromProjects' ? (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Select Project *
                </label>
                <select
                  value={caseFormData.selectedProjectId}
                  onChange={(e) => setCaseFormData(prev => ({ ...prev, selectedProjectId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">-- Select Project --</option>
                  {availableProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.projectNo} - {project.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Project Number *
                  </label>
                  <input
                    type="text"
                    value={caseFormData.legacyProjectNo}
                    onChange={(e) => setCaseFormData(prev => ({ ...prev, legacyProjectNo: e.target.value }))}
                    placeholder="e.g., st1, 239"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={caseFormData.legacyProjectName}
                    onChange={(e) => setCaseFormData(prev => ({ ...prev, legacyProjectName: e.target.value }))}
                    placeholder="e.g., Old Project Name"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Case Type *
              </label>
              <select
                value={caseFormData.caseType}
                onChange={(e) => setCaseFormData(prev => ({ ...prev, caseType: e.target.value as any }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">-- Select Case Type --</option>
                <option value="MISSING">Missing (MS)</option>
                <option value="EXTRA">Extra (EX)</option>
                <option value="REPLACEMENT">Replacement (RE)</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Case Index (optional)
              </label>
              <input
                type="number"
                min="1"
                value={caseFormData.caseIndex}
                onChange={(e) => setCaseFormData(prev => ({ ...prev, caseIndex: e.target.value }))}
                placeholder="Auto (leave empty for next available)"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <span style={{ fontSize: '12px', color: '#666', marginTop: '4px', display: 'block' }}>
                Leave empty for automatic numbering, or enter a specific index
              </span>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Types <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '8px',
                marginBottom: '12px'
              }}>
                {TYPE_OPTIONS.map(type => (
                  <label
                    key={type.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={(() => {
                        const safeSelectedTypes = Array.isArray(caseFormData.selectedTypes) ? caseFormData.selectedTypes : [];
                        return safeSelectedTypes.includes(type.value);
                      })()}
                      onChange={() => handleTypeToggle(type.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCloseAddCaseDrawer}
                disabled={isCreatingCase}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: isCreatingCase ? 'not-allowed' : 'pointer',
                  opacity: isCreatingCase ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCase}
                disabled={isCreatingCase}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2c3e50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: isCreatingCase ? 'not-allowed' : 'pointer',
                  opacity: isCreatingCase ? 0.6 : 1
                }}
              >
                {isCreatingCase ? 'Creating...' : 'Create Case'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalBoard;

// Add CSS styles for dashboard highlighting
const highlightingStyles = `
.project-container {
  transition: all 0.3s ease;
}

.project-container.highlighted {
  transform: scale(1.02);
  z-index: 10;
  position: relative;
}

.dashboard-highlighted {
  animation: dashboardHighlight 3s ease-in-out;
}

.dashboard-item-highlighted {
  animation: itemHighlight 3s ease-in-out;
  border-left: 4px solid #22c55e !important;
}

.dashboard-cell-highlighted {
  animation: cellHighlight 3s ease-in-out;
  border-radius: 3px;
  z-index: 5;
  position: relative;
}

@keyframes dashboardHighlight {
  0% {
    border: 3px solid rgba(37, 99, 235, 0.8);
    box-shadow: 0 0 20px rgba(37, 99, 235, 0.3);
    background: rgba(37, 99, 235, 0.08);
  }
  50% {
    border: 3px solid rgba(37, 99, 235, 0.5);
    box-shadow: 0 0 12px rgba(37, 99, 235, 0.2);
    background: rgba(37, 99, 235, 0.04);
  }
  100% {
    border: 3px solid transparent;
    box-shadow: none;
    background: transparent;
  }
}

@keyframes itemHighlight {
  0% {
    background: rgba(34, 197, 94, 0.5);
    transform: translateX(6px);
  }
  20% {
    background: rgba(34, 197, 94, 0.35);
    transform: translateX(3px);
  }
  70% {
    background: rgba(34, 197, 94, 0.15);
    transform: translateX(1px);
  }
  100% {
    background: transparent;
    transform: translateX(0);
  }
}

@keyframes cellHighlight {
  0% {
    background-color: rgba(220, 38, 38, 0.35);
    outline: 3px solid #dc2626;
    box-shadow: 0 0 12px rgba(220, 38, 38, 0.5);
  }
  20% {
    background-color: rgba(220, 38, 38, 0.25);
    outline: 2px solid #dc2626;
    box-shadow: 0 0 8px rgba(220, 38, 38, 0.3);
  }
  70% {
    background-color: rgba(220, 38, 38, 0.08);
    outline: 1px solid rgba(220, 38, 38, 0.3);
    box-shadow: none;
  }
  100% {
    background-color: transparent;
    outline: none;
    box-shadow: none;
  }
}

/* Enhanced visual feedback - auto-fading label */
.dashboard-highlighted::before {
  content: "Dashboard";
  position: absolute;
  top: -10px;
  right: 10px;
  background: #2563eb;
  color: white;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  z-index: 20;
  animation: fadeLabel 3s ease-in-out;
  opacity: 0;
  pointer-events: none;
}

@keyframes fadeLabel {
  0% { opacity: 0; transform: translateY(-4px); }
  15% { opacity: 1; transform: translateY(0); }
  70% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-4px); }
}
`;

// Inject highlighting styles
if (typeof document !== 'undefined') {
  const styleId = 'operational-board-highlighting';
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }

  styleElement.textContent = highlightingStyles;
}