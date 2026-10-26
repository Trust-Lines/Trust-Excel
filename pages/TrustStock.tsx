import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { useLivePatchStore, PatchEventPayload } from '../hooks/useLivePatchStore';
import ProjectBlock from '../components/ProjectBlock';
import AccountingGrid from '../components/AccountingGrid';
import TrustStockPdfImportModal from '../components/TrustStockPdfImportModal';
import TrustStockContentsModal from '../components/TrustStockContentsModal';
import { useTablePermissions, PAGE_KEYS } from '../hooks/useTablePermissions';
import { useSocket } from '../contexts/SocketContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { apiFetch } from '../lib/auth';
import {
  getTrustStockGroups, createTrustStockGroup, deleteTrustStockGroup, createTrustStockItem,
  mapTrustStockGroupToProject, mapTrustStockItemToBackendItem, TrustStockGroup,
} from '../lib/trust-stock';
import { sortItemsForDisplay } from '../types';
import type { Project } from '../types';
import type { BackendProjectItem } from '../lib/projects';

/* ============================================================================
 * TRUST STOCK
 * Goods Trust buys for its own stock (Trust Stock company): which vendor,
 * which PF, what price, what was paid. One block per stock purchase
 * ("STOCK 1", "STOCK 2" …) using the same table as the Projects page, with the
 * yellow ACCOUNTING grid (payments) next to it.
 * ========================================================================== */

const SECTION_LABEL = 'Trust Stock';
const LAYOUT_GAP = 24;
const STANDARD_TYPES = ['Millwork', 'Shelving', 'Ceiling', 'Image', 'Furniture', 'Decoration'];

interface GroupView {
  raw: TrustStockGroup;
  frontend: Project;
  backendItems: BackendProjectItem[];
}

// Same column permissions apply on every row of this page (page access is the gate)
const ALLOW_ALL = { isColumnVisible: () => true, isColumnEditable: () => true };

const TrustStock: React.FC = () => {
  const { hasPageAccess, loading: permissionsLoading } = useTablePermissions();
  const canAccessPage = hasPageAccess(PAGE_KEYS.TRUST_STOCK);

  const [groups, setGroups] = useState<GroupView[]>([]);
  const [globalItemsById, setGlobalItemsById] = useState<Map<string, BackendProjectItem>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [contentsOpen, setContentsOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const data = await getTrustStockGroups();
      const items = new Map<string, BackendProjectItem>();
      const views = data.map(g => {
        const backendItems = (g.items || []).map(mapTrustStockItemToBackendItem);
        backendItems.forEach(i => items.set(i.id, i));
        return { raw: g, frontend: mapTrustStockGroupToProject(g), backendItems };
      });
      setGroups(views);
      setGlobalItemsById(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Trust Stock');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccessPage) fetchData();
  }, [canAccessPage, fetchData]);

  // ── Live updates ──
  const { joinRooms, leaveRooms, isConnected, userId: myUserId } = useSocket();
  const prevConnected = useRef(isConnected);
  const livePatch = useLivePatchStore();

  useEffect(() => {
    joinRooms(['trust-stock']);
    return () => { leaveRooms(['trust-stock']); };
  }, [joinRooms, leaveRooms]);

  useEffect(() => {
    if (isConnected && !prevConnected.current) fetchData();
    prevConnected.current = isConnected;
  }, [isConnected, fetchData]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(), 300);
  }, [fetchData]);

  useSocketEvent('trust-stock:group-created', debouncedRefetch);
  useSocketEvent('trust-stock:group-updated', debouncedRefetch);
  useSocketEvent('trust-stock:group-deleted', debouncedRefetch);
  useSocketEvent('trust-stock:item-created', debouncedRefetch);
  useSocketEvent('trust-stock:item-deleted', debouncedRefetch);

  const updateGlobalItem = useCallback((itemId: string, patch: Partial<BackendProjectItem>) => {
    setGlobalItemsById(prev => {
      const item = prev.get(itemId);
      if (!item) return prev;
      const next = new Map(prev);
      next.set(itemId, { ...item, ...patch });
      return next;
    });
    setGroups(prev => prev.map(g => ({
      ...g,
      backendItems: g.backendItems.map(i => (i.id === itemId ? { ...i, ...patch } : i)),
    })));
  }, []);

  const handlePatchEvent = useCallback((data: PatchEventPayload) => {
    if (data.entity !== 'trustStockItem' || !myUserId) return;
    const result = livePatch.handlePatchEvent(data, myUserId);
    if (result.apply && result.patch && result.entityId) updateGlobalItem(result.entityId, result.patch);
  }, [myUserId, livePatch, updateGlobalItem]);
  useSocketEvent('entity:patched', handlePatchEvent);

  const onItemUpdated = useCallback((updated: BackendProjectItem) => {
    const mapped = (updated as any).groupId ? mapTrustStockItemToBackendItem(updated as any) : updated;
    updateGlobalItem(mapped.id, mapped);
  }, [updateGlobalItem]);

  const handleItemCreated = useCallback((groupId: string, item: BackendProjectItem) => {
    setGlobalItemsById(prev => (prev.has(item.id) ? prev : new Map(prev).set(item.id, item)));
    setGroups(prev => prev.map(g => (
      g.frontend.projectId !== groupId || g.backendItems.some(i => i.id === item.id)
        ? g
        : { ...g, backendItems: [...g.backendItems, item] }
    )));
  }, []);

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    await deleteTrustStockGroup(groupId);
    await fetchData();
  }, [fetchData]);

  const handleGroupUpdate = useCallback(async () => { await fetchData(); }, [fetchData]);

  // Same row order as the Projects table
  const getReactiveItems = useCallback((backendItems: BackendProjectItem[]) => {
    return sortItemsForDisplay(backendItems.map(item => globalItemsById.get(item.id) || item));
  }, [globalItemsById]);

  const visibleGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(g =>
      g.raw.code.toLowerCase().includes(q)
      || g.raw.name.toLowerCase().includes(q)
      || g.backendItems.some(i =>
        (i.pfCode || '').toLowerCase().includes(q)
        || ((i as any).orderNo || '').toLowerCase().includes(q)
        || (i.vendor?.code || '').toLowerCase().includes(q)
        || (i.vendor?.name || '').toLowerCase().includes(q)),
    );
  }, [groups, search]);

  const nextCode = useMemo(() => {
    let max = 0;
    groups.forEach(g => { const m = g.raw.code.match(/^STOCK\s*(\d+)$/i); if (m) max = Math.max(max, +m[1]); });
    return `STOCK ${max + 1}`;
  }, [groups]);

  // ── Horizontal scroll bar pinned to the bottom (same as the other big tables) ──
  const viewportRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);
  const [contentWidth, setContentWidth] = useState(3000);
  const sync = (from: React.RefObject<HTMLDivElement>, to: React.RefObject<HTMLDivElement>) => () => {
    if (isSyncing.current || !from.current || !to.current) return;
    isSyncing.current = true;
    to.current.scrollLeft = from.current.scrollLeft;
    requestAnimationFrame(() => { isSyncing.current = false; });
  };
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const measure = () => { if (vp.scrollWidth > 0) setContentWidth(vp.scrollWidth); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    if (vp.firstElementChild) ro.observe(vp.firstElementChild);
    return () => ro.disconnect();
  }, [canAccessPage, groups.length]);

  if (permissionsLoading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!canAccessPage) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Access Denied</h1>
        <p>You don't have permission to access the Trust Stock page.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'white',
        borderBottom: '1px solid #e9ecef', padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <h1 style={{ margin: 0 }}>
          <span style={{ backgroundColor: '#0f766e', color: 'white', padding: '4px 16px', borderRadius: 4, fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>
            TRUST STOCK
          </span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Stock / PF code / order no / vendor…"
              style={{ width: 260, padding: '6px 28px 6px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, outline: 'none' }}
            />
            {search && (
              <span onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: 5, cursor: 'pointer', color: '#9ca3af', fontWeight: 700 }}>×</span>
            )}
          </div>
          <button
            onClick={() => setContentsOpen(true)}
            style={{ padding: '8px 14px', backgroundColor: '#fff', color: '#0f766e', border: '1px solid #0f766e', borderRadius: 4, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}
          >
            Stock Contents
          </button>
          <button
            onClick={() => setPdfOpen(true)}
            style={{ padding: '8px 14px', backgroundColor: '#115e59', color: 'white', border: 'none', borderRadius: 4, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}
          >
            Upload PF PDF
          </button>
          <button
            onClick={() => setNewOpen(true)}
            style={{ padding: '8px 16px', backgroundColor: '#0f766e', color: 'white', border: 'none', borderRadius: 4, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}
          >
            + New Stock
          </button>
        </div>
      </div>

      {pdfOpen && (
        <TrustStockPdfImportModal onClose={() => setPdfOpen(false)} onImported={async () => { setPdfOpen(false); await fetchData(); }} />
      )}
      {contentsOpen && <TrustStockContentsModal onClose={() => setContentsOpen(false)} />}

      {newOpen && (
        <NewStockModal
          defaultCode={nextCode}
          onClose={() => setNewOpen(false)}
          onCreated={async () => { setNewOpen(false); await fetchData(); }}
        />
      )}

      {/* Tables */}
      <div ref={viewportRef} onScroll={sync(viewportRef, bottomBarRef)} style={{ flex: 1, overflowX: 'scroll', overflowY: 'visible', padding: 20, paddingBottom: 30 }}>
        {isLoading && <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading Trust Stock…</div>}
        {error && !isLoading && <div style={{ padding: 40, textAlign: 'center', color: '#dc3545' }}>Error: {error}</div>}
        {!isLoading && !error && groups.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
            No stock purchases yet. Click <b>+ New Stock</b> to add the first one.
          </div>
        )}
        {!isLoading && groups.length > 0 && visibleGroups.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Nothing matches “{search}”.</div>
        )}

        <section style={{
          '--supplier-section-header': '56px',
          '--supplier-topgroup-row': '60px',
          '--supplier-colhead-row': '32px',
          '--supplier-data-row': '40px',
          '--supplier-totals-row': '32px',
        } as React.CSSProperties}>
          {visibleGroups.map((g, idx) => {
            const items = getReactiveItems(g.backendItems);
            return (
              <div key={g.frontend.projectId} style={{ display: 'flex', alignItems: 'flex-start', gap: LAYOUT_GAP, width: 'fit-content', marginBottom: 18 }}>
                <div style={{ flex: '0 0 auto' }}>
                  <ProjectBlock
                    mode="trust-stock"
                    project={g.frontend}
                    sectionLabel={SECTION_LABEL}
                    backendItems={items}
                    globalItemsById={globalItemsById}
                    updateGlobalItem={updateGlobalItem}
                    onProjectUpdate={handleGroupUpdate}
                    onDeleteProject={handleDeleteGroup}
                    onSupplierItemUpdated={onItemUpdated}
                    onItemCreated={handleItemCreated}
                    showSectionHeader={idx === 0}
                    permissionOverrides={ALLOW_ALL as any}
                  />
                </div>
                <div style={{ flex: '0 0 auto' }}>
                  <AccountingGrid
                    items={items}
                    sectionLabel={SECTION_LABEL}
                    showSectionHeader={idx === 0}
                    mode="trust-stock"
                    updateGlobalItem={updateGlobalItem}
                    onItemUpdated={onItemUpdated}
                  />
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <div ref={bottomBarRef} onScroll={sync(bottomBarRef, viewportRef)} style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 18, overflowX: 'scroll', overflowY: 'hidden',
        zIndex: 9999, backgroundColor: '#e8e8e8', borderTop: '1px solid #bbb',
      }}>
        <div style={{ height: 1, width: contentWidth }} />
      </div>
    </div>
  );
};

/** New stock purchase: code (next "STOCK n" suggested), optional name, starting types. */
const NewStockModal: React.FC<{ defaultCode: string; onClose: () => void; onCreated: () => void }> = ({ defaultCode, onClose, onCreated }) => {
  const [code, setCode] = useState(defaultCode);
  const [name, setName] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [customType, setCustomType] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (t: string) => setTypes(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const group = await createTrustStockGroup({ code: code.trim(), name: name.trim() });
      for (const t of types) await createTrustStockItem(group.id, { type: t.toUpperCase() });
      const custom = customType.trim();
      if (custom) {
        const res = await apiFetch('/api/custom-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: custom, code: custom.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10), isGlobal: true }),
        });
        if (res.ok) {
          const ct = await res.json();
          await createTrustStockItem(group.id, { customTypeId: ct.id });
        }
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create stock');
      setSaving(false);
    }
  };

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, width: 420, maxWidth: '100%', padding: 22, boxShadow: '0 20px 40px rgba(0,0,0,.25)' }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 18 }}>New stock purchase</h2>

        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Stock code</label>
        <input value={code} onChange={e => setCode(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', margin: '4px 0 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />

        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Name / note (optional)</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. GOS stock order October" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', margin: '4px 0 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />

        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Types (one row each — you can add more later)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
          {STANDARD_TYPES.map(t => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={types.includes(t)} onChange={() => toggle(t)} /> {t}
            </label>
          ))}
        </div>
        <input value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Custom type (optional)" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', marginBottom: 12, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />

        {error && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '8px 14px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={submit}
            disabled={saving || !code.trim() || (types.length === 0 && !customType.trim())}
            style={{ padding: '8px 16px', border: 'none', background: '#0f766e', color: '#fff', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: saving || !code.trim() || (types.length === 0 && !customType.trim()) ? 0.5 : 1 }}
          >
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrustStock;
