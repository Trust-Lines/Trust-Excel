/**
 * useLivePatchStore — Cell-level live update engine.
 *
 * Tracks:
 *  - editingCells: cells currently being edited by the local user
 *  - pendingMutations: optimistic mutations waiting for server confirmation
 *  - queuedRemotePatches: remote patches that arrived while a cell was being edited
 *
 * Provides:
 *  - handlePatchEvent(): process incoming `entity:patched` socket events
 *  - markCellEditing / markCellIdle: track focus/blur
 *  - resolveConflict(): after user finishes editing a cell that has queued remote patches
 */
import { useRef, useCallback } from 'react';

// ───────────────────── Types ─────────────────────
export interface PatchEventPayload {
    entity: string;
    entityId: string;
    parentId: string;
    patch: Record<string, any>;
    updatedAt: string;
    updatedBy: string;
    mutationId: string;
}

export interface PendingMutation {
    entityId: string;
    field: string;
    oldValue: any;
    newValue: any;
    startedAt: number;
}

export interface QueuedRemotePatch {
    value: any;
    updatedAt: string;
    updatedBy: string;
}

export interface PatchResult {
    /** true = caller should apply this patch to local state */
    apply: boolean;
    /** the fields to apply (only set when apply=true) */
    patch?: Record<string, any>;
    /** entity info */
    entityId?: string;
    parentId?: string;
    /** true if the patch was queued for conflict resolution */
    queued?: boolean;
}

// ───────────────────── Hook ─────────────────────

export function useLivePatchStore() {
    // Use refs so handlers never go stale and no unnecessary rerenders
    const editingCellsRef = useRef<Set<string>>(new Set());
    const pendingMutationsRef = useRef<Map<string, PendingMutation>>(new Map());
    const queuedRemotePatchesRef = useRef<Map<string, QueuedRemotePatch>>(new Map());

    // ── Cell editing tracking ──

    const markCellEditing = useCallback((entityId: string, field: string) => {
        const key = `${entityId}:${field}`;
        editingCellsRef.current.add(key);
    }, []);

    const markCellIdle = useCallback((entityId: string, field: string) => {
        const key = `${entityId}:${field}`;
        editingCellsRef.current.delete(key);
    }, []);

    const isCellEditing = useCallback((entityId: string, field: string): boolean => {
        return editingCellsRef.current.has(`${entityId}:${field}`);
    }, []);

    // ── Pending mutations (optimistic UI) ──

    const addPendingMutation = useCallback(
        (mutationId: string, details: PendingMutation) => {
            pendingMutationsRef.current.set(mutationId, details);
        },
        [],
    );

    const confirmMutation = useCallback((mutationId: string) => {
        pendingMutationsRef.current.delete(mutationId);
    }, []);

    const rollbackMutation = useCallback((mutationId: string) => {
        const mutation = pendingMutationsRef.current.get(mutationId);
        pendingMutationsRef.current.delete(mutationId);
        return mutation; // caller can use oldValue to rollback
    }, []);

    // ── Remote patch queue (conflict resolution) ──

    const hasQueuedPatch = useCallback((entityId: string, field: string): boolean => {
        return queuedRemotePatchesRef.current.has(`${entityId}:${field}`);
    }, []);

    const getQueuedPatch = useCallback(
        (entityId: string, field: string): QueuedRemotePatch | undefined => {
            return queuedRemotePatchesRef.current.get(`${entityId}:${field}`);
        },
        [],
    );

    const clearQueuedPatch = useCallback((entityId: string, field: string) => {
        queuedRemotePatchesRef.current.delete(`${entityId}:${field}`);
    }, []);

    const clearAllQueuedPatches = useCallback((entityId: string) => {
        const keysToDelete: string[] = [];
        for (const key of queuedRemotePatchesRef.current.keys()) {
            if (key.startsWith(`${entityId}:`)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach((k) => queuedRemotePatchesRef.current.delete(k));
    }, []);

    // ── Core: handle an incoming patch event ──

    const handlePatchEvent = useCallback(
        (data: PatchEventPayload, myUserId: string): PatchResult => {
            const { entityId, parentId, patch, updatedBy, mutationId } = data;

            // Case 1: This is my own mutation echoed back — just confirm it
            if (updatedBy === myUserId) {
                if (pendingMutationsRef.current.has(mutationId)) {
                    confirmMutation(mutationId);
                }
                // Still apply the patch so server-confirmed values reach local state
                // (e.g., auto-computed fields like pfCode), but filter out
                // fields that are currently being edited by me
                const safePatch: Record<string, any> = {};
                for (const [field, value] of Object.entries(patch)) {
                    if (!editingCellsRef.current.has(`${entityId}:${field}`)) {
                        safePatch[field] = value;
                    }
                }
                return {
                    apply: Object.keys(safePatch).length > 0,
                    patch: safePatch,
                    entityId,
                    parentId,
                };
            }

            // Case 2: Another user's update — check for conflicts
            const safePatch: Record<string, any> = {};
            let hasQueued = false;

            for (const [field, value] of Object.entries(patch)) {
                const cellKey = `${entityId}:${field}`;

                if (editingCellsRef.current.has(cellKey)) {
                    // Cell is being edited locally — queue, don't overwrite
                    queuedRemotePatchesRef.current.set(cellKey, {
                        value,
                        updatedAt: data.updatedAt,
                        updatedBy,
                    });
                    hasQueued = true;
                } else {
                    // Cell is idle — safe to apply immediately
                    safePatch[field] = value;
                }
            }

            return {
                apply: Object.keys(safePatch).length > 0,
                patch: safePatch,
                entityId,
                parentId,
                queued: hasQueued,
            };
        },
        [confirmMutation],
    );

    // ── Conflict resolution ──

    /**
     * Called when user finishes editing a cell (blur/enter).
     * Returns the queued remote value if one exists, or null if no conflict.
     */
    const resolveConflict = useCallback(
        (entityId: string, field: string): QueuedRemotePatch | null => {
            const key = `${entityId}:${field}`;
            const queued = queuedRemotePatchesRef.current.get(key);
            if (!queued) return null;
            // Don't auto-clear — let the caller decide (Keep Mine vs Use Remote)
            return queued;
        },
        [],
    );

    /**
     * User chose "Keep Mine" — clear the queued patch, the user's API call wins.
     */
    const resolveKeepMine = useCallback((entityId: string, field: string) => {
        clearQueuedPatch(entityId, field);
        markCellIdle(entityId, field);
    }, [clearQueuedPatch, markCellIdle]);

    /**
     * User chose "Use Remote" — return the remote value for the caller to apply.
     */
    const resolveUseRemote = useCallback(
        (entityId: string, field: string): any | undefined => {
            const key = `${entityId}:${field}`;
            const queued = queuedRemotePatchesRef.current.get(key);
            clearQueuedPatch(entityId, field);
            markCellIdle(entityId, field);
            return queued?.value;
        },
        [clearQueuedPatch, markCellIdle],
    );

    return {
        // Cell editing
        markCellEditing,
        markCellIdle,
        isCellEditing,

        // Pending mutations
        addPendingMutation,
        confirmMutation,
        rollbackMutation,

        // Remote patch queue
        hasQueuedPatch,
        getQueuedPatch,
        clearQueuedPatch,
        clearAllQueuedPatches,

        // Core handler
        handlePatchEvent,

        // Conflict resolution
        resolveConflict,
        resolveKeepMine,
        resolveUseRemote,
    };
}

export type LivePatchStore = ReturnType<typeof useLivePatchStore>;
