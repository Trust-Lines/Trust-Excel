import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/auth';

export interface UndoEntry {
  entityType: 'projectItem' | 'directOrderItem' | 'missingExtraItem' | 'expensesPItem';
  entityId: string;
  parentId: string;
  previousValues: Record<string, any>;
  timestamp: number;
  description: string;
}

const MAX_STACK_SIZE = 3;

// ====================== GLOBAL SINGLETON ======================
// Single stack shared across ALL ProjectBlock instances.
// This prevents duplicate listeners and ensures CTRL+Z always
// undoes the globally-last mutation regardless of which project it was in.

let globalStack: UndoEntry[] = [];
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

function globalPush(entry: Omit<UndoEntry, 'timestamp'>) {
  globalStack = [...globalStack, { ...entry, timestamp: Date.now() }].slice(-MAX_STACK_SIZE);
  notifyListeners();
}

function getEndpoint(entityType: UndoEntry['entityType'], entityId: string): string {
  switch (entityType) {
    case 'projectItem':
      return `/api/projects/items/${entityId}`;
    case 'directOrderItem':
      return `/api/direct-orders/items/${entityId}`;
    case 'missingExtraItem':
      return `/api/missing-extra/items/${entityId}`;
    case 'expensesPItem':
      return `/api/expenses-p/items/${entityId}`;
  }
}

// Track undo-complete callbacks per parentId so the correct project refetches
const undoCompleteCallbacks = new Map<string, () => void>();

export function registerUndoCallback(parentId: string, callback: () => void) {
  undoCompleteCallbacks.set(parentId, callback);
}

export function unregisterUndoCallback(parentId: string) {
  undoCompleteCallbacks.delete(parentId);
}

// Simple floating toast for undo feedback
function showUndoToast(message: string) {
  const existing = document.getElementById('undo-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'undo-toast';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#333',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '99999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    transition: 'opacity 0.3s',
    opacity: '1',
  });
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

let isUndoing = false;

async function globalUndo(): Promise<UndoEntry | null> {
  if (globalStack.length === 0 || isUndoing) return null;
  isUndoing = true;

  const entry = globalStack[globalStack.length - 1];
  globalStack = globalStack.slice(0, -1);
  notifyListeners();

  try {
    const endpoint = getEndpoint(entry.entityType, entry.entityId);
    await apiFetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry.previousValues),
    });

    // Call the undo-complete callback for the affected project
    const cb = undoCompleteCallbacks.get(entry.parentId);
    if (cb) cb();

    showUndoToast(`Geri alindi: ${entry.description}`);
    return entry;
  } catch (error) {
    console.error('Undo failed:', error);
    return null;
  } finally {
    isUndoing = false;
  }
}

// ====================== GLOBAL KEYBOARD LISTENER ======================
// Single listener, registered once on first hook mount

let keyboardListenerRegistered = false;

function ensureKeyboardListener() {
  if (keyboardListenerRegistered) return;
  keyboardListenerRegistered = true;

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      // Allow native undo ONLY when actively typing in a focused input
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (isInput && document.activeElement === target) {
        // Check if the input has actual text selection/content being edited right now
        const input = target as HTMLInputElement;
        if (input.value && input.value.length > 0) {
          return; // Let browser handle native undo inside the input
        }
      }

      e.preventDefault();
      globalUndo();
    }
  });
}

// ====================== REACT HOOK ======================

export function useUndoStack(onUndoComplete?: () => void, parentId?: string) {
  const [stackSize, setStackSize] = useState(globalStack.length);

  // Register keyboard listener once
  useEffect(() => {
    ensureKeyboardListener();
  }, []);

  // Subscribe to stack changes
  useEffect(() => {
    const listener = () => setStackSize(globalStack.length);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  // Register undo-complete callback for this project
  useEffect(() => {
    if (parentId && onUndoComplete) {
      registerUndoCallback(parentId, onUndoComplete);
      return () => unregisterUndoCallback(parentId);
    }
  }, [parentId, onUndoComplete]);

  const push = useCallback((entry: Omit<UndoEntry, 'timestamp'>) => {
    globalPush(entry);
  }, []);

  const undo = useCallback(async () => {
    return globalUndo();
  }, []);

  return {
    push,
    undo,
    canUndo: stackSize > 0,
    stackSize,
  };
}
