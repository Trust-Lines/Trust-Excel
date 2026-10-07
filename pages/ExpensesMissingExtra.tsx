import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useLivePatchStore, PatchEventPayload } from '../hooks/useLivePatchStore';
import ProjectBlock from '../components/ProjectBlock';
import PaymentsGrid from '../components/PaymentsGrid';
import InvoiceReceiptGrid from '../components/InvoiceReceiptGrid';
import AccountingGrid from '../components/AccountingGrid';
import AddProjectDrawer, { NewProjectData } from '../components/AddProjectDrawer';
import { useTablePermissions, PAGE_KEYS } from '../hooks/useTablePermissions';
import { useSocket } from '../contexts/SocketContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { getExpensesMissingExtraProjects, mapExpensesMEToProject, mapExpensesMEItemToBackendItem, createExpensesMissingExtraProject, createExpensesMissingExtraItem, deleteExpensesMissingExtraProject } from '../lib/expenses-missing-extra';
import { apiFetch } from '../lib/auth';
import { TYPE_ORDER, extractPFSequence, getVendorPriority } from '../types';
import type { ExpensesMissingExtraProject } from '../types/expensesMissingExtra';
import type { Project } from '../types';
import type { BackendProjectItem } from '../lib/projects';

const SECTION_ORDER = [
  { id: 'TLINES_NE', label: 'TLines NE' },
  { id: 'TLINES_SE', label: 'TLines SE' },
  { id: 'TLINES_NW', label: 'TLines NW' },
  { id: 'CVW', label: 'TLines CVW' },
  { id: 'TLINES_HQ', label: 'TLines HQ' },
  { id: 'TLINES_TC', label: 'TLines TC' },
];

interface SectionData {
  id: string;
  label: string;
  projects: {
    raw: ExpensesMissingExtraProject;
    frontend: Project;
    backendItems: BackendProjectItem[];
  }[];
}

const LAYOUT_GAP = 24;

const ExpensesMissingExtra: React.FC = () => {
  const { hasPageAccess, loading: permissionsLoading } = useTablePermissions();
  const canAccessPage = hasPageAccess(PAGE_KEYS.EXPENSES_MISSING_EXTRA || 'expenses_missing_extra');

  const [sections, setSections] = useState<SectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  const [globalItemsById, setGlobalItemsById] = useState<Map<string, BackendProjectItem>>(new Map());

  const viewportRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const bottomInnerRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);
  const [contentWidth, setContentWidth] = useState(5000);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const expensesProjects = await getExpensesMissingExtraProjects();

      const projectsByBucket: Record<string, SectionData['projects']> = {};
      const itemsMap = new Map<string, BackendProjectItem>();

      expensesProjects.forEach(ep => {
        const frontend = mapExpensesMEToProject(ep);
        const backendItems = (ep.items || []).map(mapExpensesMEItemToBackendItem);
        if (!projectsByBucket[ep.bucket]) {
          projectsByBucket[ep.bucket] = [];
        }
        projectsByBucket[ep.bucket].push({ raw: ep, frontend, backendItems });

        backendItems.forEach(item => itemsMap.set(item.id, item));
      });

      const orderedSections: SectionData[] = SECTION_ORDER.map(s => ({
        id: s.id,
        label: s.label,
        projects: projectsByBucket[s.id] || [],
      }));

      setSections(orderedSections);
      setGlobalItemsById(itemsMap);
    } catch (err) {
      console.error('Failed to fetch expenses missing & extra projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccessPage) {
      fetchData();
    }
  }, [canAccessPage, fetchData]);

  // Socket.IO: real-time updates
  const { joinRooms, leaveRooms, isConnected, userId: myUserId } = useSocket();
  const prevConnected = useRef(isConnected);
  const livePatch = useLivePatchStore();

  useEffect(() => {
    joinRooms(['expenses-me']);
    return () => { leaveRooms(['expenses-me']); };
  }, [joinRooms, leaveRooms]);

  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      fetchData();
    }
    prevConnected.current = isConnected;
  }, [isConnected]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(), 300);
  }, []);

  // Create & delete = full refetch
  useSocketEvent('expenses-me-item:created', debouncedRefetch);
  useSocketEvent('expenses-me-item:deleted', debouncedRefetch);
  useSocketEvent('expenses-me-project:created', debouncedRefetch);
  useSocketEvent('expenses-me-project:updated', debouncedRefetch);
  useSocketEvent('expenses-me-project:deleted', debouncedRefetch);

  const updateGlobalItem = useCallback((itemId: string, patch: Partial<BackendProjectItem>) => {
    setGlobalItemsById(prev => {
      const newMap = new Map(prev);
      const item = newMap.get(itemId);
      if (item) {
        newMap.set(itemId, { ...item, ...patch });
      }
      return newMap;
    });

    setSections(prev =>
      prev.map(section => ({
        ...section,
        projects: section.projects.map(proj => ({
          ...proj,
          backendItems: proj.backendItems.map(item =>
            item.id === itemId ? { ...item, ...patch } : item
          ),
        })),
      }))
    );
  }, []);

  // Patch-based handler
  const handlePatchEvent = useCallback((data: PatchEventPayload) => {
    if (data.entity !== 'expensesMEItem') return;
    if (!myUserId) return;

    const result = livePatch.handlePatchEvent(data, myUserId);
    if (result.apply && result.patch && result.entityId) {
      updateGlobalItem(result.entityId, result.patch);
    }
  }, [myUserId, livePatch, updateGlobalItem]);

  useSocketEvent('entity:patched', handlePatchEvent);

  const onItemUpdated = useCallback((updatedItem: BackendProjectItem) => {
    const mapped = mapExpensesMEItemToBackendItem(updatedItem as any);

    setGlobalItemsById(prev => {
      const newMap = new Map(prev);
      newMap.set(mapped.id, mapped);
      return newMap;
    });

    setSections(prev =>
      prev.map(section => ({
        ...section,
        projects: section.projects.map(proj => ({
          ...proj,
          backendItems: proj.backendItems.map(item =>
            item.id === mapped.id ? mapped : item
          ),
        })),
      }))
    );
  }, []);

  const handleItemCreated = useCallback((projectId: string, item: BackendProjectItem) => {
    const mapped = mapExpensesMEItemToBackendItem(item as any);
    setGlobalItemsById(prev => {
      if (prev.has(mapped.id)) return prev;
      const next = new Map(prev);
      next.set(mapped.id, mapped);
      return next;
    });
    setSections(prev =>
      prev.map(section => ({
        ...section,
        projects: section.projects.map(proj => {
          if (proj.frontend.projectId !== projectId) return proj;
          const alreadyExists = proj.backendItems.some(i => i.id === mapped.id);
          if (alreadyExists) return proj;
          return { ...proj, backendItems: [...proj.backendItems, mapped] };
        }),
      }))
    );
  }, []);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    await deleteExpensesMissingExtraProject(projectId);
    await fetchData();
  }, [fetchData]);

  const handleProjectUpdate = useCallback(async (_projectId: string) => {
    await fetchData();
  }, [fetchData]);

  const handleCreateProject = useCallback(async (data: NewProjectData): Promise<{ success: boolean; error?: string }> => {
    try {
      const project = await createExpensesMissingExtraProject({
        bucket: data.sectionId,
        projectNo: String(data.projectNumber),
        name: data.projectName,
      });

      for (const typeName of data.selectedTypes) {
        await createExpensesMissingExtraItem(project.id, { type: typeName.toUpperCase() as any });
      }

      for (const customTypeName of data.customTypes) {
        const code = customTypeName.substring(0, 10).toUpperCase().replace(/\s+/g, '_');
        const res = await apiFetch('/api/custom-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: customTypeName, code }),
        });
        if (res.ok) {
          const customType = await res.json();
          await createExpensesMissingExtraItem(project.id, { customTypeId: customType.id } as any);
        }
      }

      await fetchData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create project' };
    }
  }, [fetchData]);

  const filteredSections = React.useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return sections;
    return sections.map(section => ({
      ...section,
      projects: (() => {
        const exact: typeof section.projects = [], starts: typeof section.projects = [], contains: typeof section.projects = [];
        section.projects.forEach(p => {
          const num = String(p.raw.projectNo ?? '').toLowerCase();
          if (num === q) exact.push(p);
          else if (num.startsWith(q)) starts.push(p);
          else if (num.includes(q)) contains.push(p);
        });
        return [...exact, ...starts, ...contains];
      })(),
    })).filter(s => s.projects.length > 0);
  }, [sections, projectSearch]);

  const existingProjectNumbers = React.useMemo(() => {
    const result: Record<string, number[]> = {};
    sections.forEach(section => {
      result[section.id] = section.projects
        .map(p => parseInt(p.raw.projectNo))
        .filter(n => !isNaN(n));
    });
    return result;
  }, [sections]);

  const getReactiveItems = useCallback((backendItems: BackendProjectItem[]) => {
    const typeOrder = TYPE_ORDER.map(t => t.toUpperCase());
    return backendItems
      .map(item => globalItemsById.get(item.id) || item)
      .sort((a, b) => {
        const aTypeIndex = typeOrder.indexOf(a.type || '');
        const bTypeIndex = typeOrder.indexOf(b.type || '');
        if (aTypeIndex !== bTypeIndex) return aTypeIndex - bTypeIndex;
        const aPri = getVendorPriority(a);
        const bPri = getVendorPriority(b);
        if (aPri !== bPri) return aPri - bPri;
        if (aPri < 2) {
          return extractPFSequence(a.pfCode) - extractPFSequence(b.pfCode);
        }
        return (a.vendor?.name || '').localeCompare(b.vendor?.name || '');
      });
  }, [globalItemsById]);

  const onViewportScroll = useCallback(() => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    if (bottomBarRef.current && viewportRef.current) {
      bottomBarRef.current.scrollLeft = viewportRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isSyncing.current = false; });
  }, []);

  const onBottomScroll = useCallback(() => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    if (viewportRef.current && bottomBarRef.current) {
      viewportRef.current.scrollLeft = bottomBarRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isSyncing.current = false; });
  }, []);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const measure = () => {
      const w = vp.scrollWidth;
      if (w > 0) setContentWidth(w);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    const child = vp.firstElementChild;
    if (child) ro.observe(child);
    const timer = setInterval(measure, 500);

    return () => { ro.disconnect(); clearInterval(timer); };
  }, [canAccessPage]);

  if (permissionsLoading) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Loading...</h1>
        <p>Checking permissions...</p>
      </div>
    );
  }

  if (!canAccessPage) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Access Denied</h1>
        <p>You don't have permission to access the Expenses Missing & Extra page.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'white', borderBottom: '1px solid #e9ecef', padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            backgroundColor: '#c41e3a', color: 'white', padding: '4px 16px',
            borderRadius: 4, fontSize: 20, fontWeight: 700, letterSpacing: 1,
          }}>
            EXPENSES MISSING & EXTRA
          </span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={projectSearch}
              onChange={e => setProjectSearch(e.target.value)}
              placeholder="Proje ara..."
              style={{ width: '200px', padding: '6px 28px 6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', outline: 'none' }}
            />
            {projectSearch && (
              <span onClick={() => setProjectSearch('')} style={{ position: 'absolute', right: '8px', cursor: 'pointer', color: '#9ca3af', fontSize: '14px', fontWeight: '700' }}>×</span>
            )}
          </div>
          <button
            onClick={() => setAddProjectOpen(true)}
            style={{ padding: '8px 16px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: 4, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}
          >
            + Add Project
          </button>
        </div>
      </div>

      <AddProjectDrawer
        isOpen={addProjectOpen}
        onClose={() => setAddProjectOpen(false)}
        onCreateProject={handleCreateProject}
        existingProjectNumbers={existingProjectNumbers}
      />

      <div
        ref={viewportRef}
        onScroll={onViewportScroll}
        style={{
          flex: 1,
          overflowX: 'scroll',
          overflowY: 'visible',
          padding: 20,
          paddingBottom: 30,
        }}
      >
        {isLoading && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            Loading expenses missing & extra projects...
          </div>
        )}

        {error && !isLoading && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>
            Error: {error}
          </div>
        )}

        {!isLoading && filteredSections.map((section) => (
          <section key={section.id} style={{
            '--supplier-section-header': '56px',
            '--supplier-topgroup-row': '60px',
            '--supplier-colhead-row': '32px',
            '--supplier-data-row': '40px',
            '--supplier-totals-row': '32px',
          } as React.CSSProperties}>
            {section.projects.map((proj, idx) => {
              const showRegionHeader = idx === 0;
              const reactiveItems = getReactiveItems(proj.backendItems);

              return (
                <div key={proj.frontend.projectId} style={{ width: '100%', overflowX: 'visible' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    gap: `${LAYOUT_GAP}px`,
                    flexWrap: 'nowrap',
                    width: 'fit-content',
                    maxWidth: 'none',
                    marginBottom: '18px',
                  }}>
                    <div style={{ flex: '0 0 auto' }}>
                      <ProjectBlock
                        mode="expenses-me"
                        project={proj.frontend}
                        sectionLabel={section.label}
                        backendItems={reactiveItems}
                        globalItemsById={globalItemsById}
                        updateGlobalItem={updateGlobalItem}
                        onProjectUpdate={handleProjectUpdate}
                        onDeleteProject={handleDeleteProject}
                        onSupplierItemUpdated={onItemUpdated}
                        onItemCreated={handleItemCreated}
                        showSectionHeader={showRegionHeader}
                        enableAccountingColumns={false}
                      />
                    </div>

                    <div style={{ flex: '0 0 auto' }}>
                      <AccountingGrid
                        items={reactiveItems}
                        sectionLabel={section.label}
                        showSectionHeader={showRegionHeader}
                        mode="expenses-me"
                        updateGlobalItem={updateGlobalItem}
                        onItemUpdated={onItemUpdated}
                      />
                    </div>

                    <div style={{ flex: '0 0 auto' }}>
                      <PaymentsGrid
                        items={reactiveItems}
                        sectionLabel={section.label}
                        projectId={proj.frontend.projectId}
                        showSectionHeader={showRegionHeader}
                        mode="expenses-me"
                        updateGlobalItem={updateGlobalItem}
                      />
                    </div>

                    <div style={{ flex: '0 0 auto' }}>
                      <InvoiceReceiptGrid
                        items={reactiveItems}
                        sectionLabel={section.label}
                        projectId={proj.frontend.projectId}
                        showSectionHeader={showRegionHeader}
                        mode="expenses-me"
                        updateGlobalItem={updateGlobalItem}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </div>

      <div
        ref={bottomBarRef}
        onScroll={onBottomScroll}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: 18, overflowX: 'scroll', overflowY: 'hidden',
          zIndex: 9999, backgroundColor: '#e8e8e8', borderTop: '1px solid #bbb',
        }}
      >
        <div ref={bottomInnerRef} style={{ height: 1, width: contentWidth }} />
      </div>
    </div>
  );
};

export default ExpensesMissingExtra;
