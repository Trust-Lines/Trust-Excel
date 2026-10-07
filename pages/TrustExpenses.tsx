import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useLivePatchStore, PatchEventPayload } from '../hooks/useLivePatchStore';
import TrustExpensePSheet from './trust-expenses/TrustExpensePSheet';
import { useTablePermissions, PAGE_KEYS } from '../hooks/useTablePermissions';
import { useSocket } from '../contexts/SocketContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
const TrustExpenses: React.FC = () => {
  const { hasPageAccess, loading: permissionsLoading } = useTablePermissions();

  const canAccessPage = hasPageAccess(PAGE_KEYS.TRUST_EXPENSES);

  // Refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const bottomInnerRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  const exportRef = useRef<(() => void) | null>(null);
  const gridRefreshRef = useRef<(() => void) | null>(null);

  // Track content width for bottom scrollbar
  const [contentWidth, setContentWidth] = useState(5000);

  // Socket.IO: real-time updates
  const { joinRooms, leaveRooms, isConnected, userId: myUserId } = useSocket();
  const prevConnected = useRef(isConnected);
  const livePatch = useLivePatchStore();

  useEffect(() => {
    joinRooms(['trust-expenses']);
    return () => { leaveRooms(['trust-expenses']); };
  }, [joinRooms, leaveRooms]);

  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      gridRefreshRef.current?.();
    }
    prevConnected.current = isConnected;
  }, [isConnected]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => gridRefreshRef.current?.(), 300);
  }, []);

  // Patch-based handler: TrustExpenses delegates state to TrustExpensePSheet,
  // so we do a lightweight refresh for item patches (child manages its own state)
  const handlePatchEvent = useCallback((data: PatchEventPayload) => {
    if (data.entity !== 'trustExpenseItem') return;
    if (!myUserId) return;

    const result = livePatch.handlePatchEvent(data, myUserId);
    if (result.apply) {
      // Trigger a lightweight refresh in the child sheet
      debouncedRefetch();
    }
  }, [myUserId, livePatch, debouncedRefetch]);

  useSocketEvent('entity:patched', handlePatchEvent);

  // Create & delete = full refetch
  useSocketEvent('trust-expense-item:created', debouncedRefetch);
  useSocketEvent('trust-expense-item:deleted', debouncedRefetch);
  useSocketEvent('trust-expense-project:created', debouncedRefetch);
  useSocketEvent('trust-expense-project:updated', debouncedRefetch);
  useSocketEvent('trust-expense-project:deleted', debouncedRefetch);

  // Viewport → bottom bar sync
  const onViewportScroll = useCallback(() => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    if (bottomBarRef.current && viewportRef.current) {
      bottomBarRef.current.scrollLeft = viewportRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isSyncing.current = false; });
  }, []);

  // Bottom bar → viewport sync
  const onBottomScroll = useCallback(() => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    if (viewportRef.current && bottomBarRef.current) {
      viewportRef.current.scrollLeft = bottomBarRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isSyncing.current = false; });
  }, []);

  // Watch content width changes
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
    // Also observe the first child (the PSheet wrapper)
    const child = vp.firstElementChild;
    if (child) ro.observe(child);

    // Fallback polling for dynamic content
    const timer = setInterval(measure, 500);

    return () => { ro.disconnect(); clearInterval(timer); };
  }, [canAccessPage]);

  if (permissionsLoading) {
    return (
      <div className="trust-expenses-page" style={{ padding: 20 }}>
        <h1>Loading...</h1>
        <p>Checking permissions...</p>
      </div>
    );
  }

  if (!canAccessPage) {
    return (
      <div className="trust-expenses-page" style={{ padding: 20 }}>
        <h1>Access Denied</h1>
        <p>You don't have permission to access the Trust Expenses page.</p>
      </div>
    );
  }

  return (
    <div className="trust-expenses-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sticky Header */}
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
            TRUST EXPENSES
          </span>
        </h1>
        <button
          onClick={() => exportRef.current?.()}
          style={{
            padding: '8px 16px', backgroundColor: '#16a34a', color: 'white',
            border: 'none', borderRadius: 4, fontSize: 14, cursor: 'pointer', fontWeight: 600,
          }}
        >
          Export Excel
        </button>
      </div>

      {/* Scrollable viewport - native scrollbar hidden, synced with fixed bottom bar */}
      <div
        ref={viewportRef}
        className="te-content-scroll"
        onScroll={onViewportScroll}
        style={{
          flex: 1,
          overflowX: 'scroll',
          overflowY: 'visible',
          padding: 20,
          paddingBottom: 30,
        }}
      >
        <TrustExpensePSheet
          onRefreshRef={(fn) => { gridRefreshRef.current = fn; }}
          onExportRef={(fn) => { exportRef.current = fn; }}
        />
      </div>

      {/* Fixed bottom scrollbar - always visible */}
      <div
        ref={bottomBarRef}
        onScroll={onBottomScroll}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 18,
          overflowX: 'scroll',
          overflowY: 'hidden',
          zIndex: 9999,
          backgroundColor: '#e8e8e8',
          borderTop: '1px solid #bbb',
        }}
      >
        <div ref={bottomInnerRef} style={{ height: 1, width: contentWidth }} />
      </div>
    </div>
  );
};

export default TrustExpenses;
