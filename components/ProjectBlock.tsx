import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Project, TYPE_ORDER, ProjectType, TypeGroup, createItemsMap, sortProjectItemsInTypeGroup, extractPFSequence, getVendorPriority } from '../types';
import { ROW_HEIGHT, TOTAL_ROW_HEIGHT } from '../constants';
import ProjectHeader from './ProjectHeader';
import SectionSeparator from './SectionSeparator';
import InlineEditPanel from './InlineEditPanel';
import ProjectMenu from './ProjectMenu';
import AddToGroupModal from './AddToGroupModal';
import { getGridWidthPx, COLUMN_WIDTHS } from '../lib/gridWidth';
import { apiFetch } from '../lib/auth';
import { getProjectColorFromMap, ProjectColor } from '../lib/projectColor';
import { displayProjectNo, parseDuplicateMarker } from '../lib/displayHelpers';
import {
  TextEditor,
  DateEditor,
  VendorEditor,
  OrderTypeEditor,
  StatusEditor,
  PfSignStatusEditor,
  PoSignStatusEditor,
  PaymentRuleEditor,
  CellVendorAutocomplete,
  CellOrderTypeAutocomplete,
  CellStatusAutocomplete
} from './InlineEditors';
import ContainerCellEditor from './ContainerCellEditor';
import { BackendProjectItem, updateProjectItem, createProjectItem, deleteProjectItem, mapBackendTypeToFrontend, mapTypeToEnum, mapSignStatusToFrontend } from '../lib/projects';
import { createMissingExtraItem, updateMissingExtraItem, deleteMissingExtraItem } from '../lib/missing-extra';
import { PfGroup } from '../lib/pf-groups';
import { updateDirectOrderItem, createDirectOrderItem, deleteDirectOrderItem } from '../lib/direct-orders';
import { updateExpensesPItem, createExpensesPItem, deleteExpensesPItem } from '../lib/expenses-p';
import { updateExpensesDirectOrderItem, createExpensesDirectOrderItem, deleteExpensesDirectOrderItem } from '../lib/expenses-direct-order';
import { updateExpensesMissingExtraItem, createExpensesMissingExtraItem, deleteExpensesMissingExtraItem } from '../lib/expenses-missing-extra';
import { formatDateCell } from '../lib/dateUtils';
import { getContainerDisplayText } from '../utils/containerUtils';
import { useColumnPermissions } from '../hooks/useColumnPermissions';
import { ColumnKey } from '../lib/columns';
import { usePaymentRules } from '../contexts/PaymentRulesContext';
import {
  useAccountingState,
  calculateRowAccounting,
  EditableAccountingCell,
  ReadOnlyAccountingCell,
  formatAccountingValue
} from './AccountingColumns';
import { getStatusStyle } from '../utils/statusStyles';
import { useUndoStack } from '../hooks/useUndoStack';
import { useAuth } from '../contexts/AuthContext';

// Error Boundary to prevent white screen crashes
class InlineEditPanelErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // Error handling for InlineEditPanel crashes
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '20px',
          backgroundColor: '#fee2e2',
          border: '1px solid #dc2626',
          borderRadius: '8px',
          color: '#dc2626',
          zIndex: 50000
        }}>
          <h3>Panel Error</h3>
          <p>The edit panel encountered an error and has been closed to prevent crashes.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onError();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface EditingState {
  projectId: string;
  itemId: string; // CRITICAL FIX: Use itemId instead of __rowIndex
  field: string;
  typeGroup?: ProjectType;
}

interface VendorEditState {
  typeGroup: ProjectType;
  projectItems: BackendProjectItem[];
  currentItemId: string; // ✅ ID-based instead of index
  itemsById: Map<string, BackendProjectItem>; // ✅ Fast lookup map
  clickedCellRect: DOMRect; // ✅ CRITICAL FIX: Store exact clicked cell position
}

interface ProjectBlockProps {
  mode?: 'projects' | 'missingExtra' | 'directOrder' | 'expenses-p' | 'expenses-do' | 'expenses-me';
  project: Project;
  sectionLabel: string; // Section label (e.g., "TLines NE", "CVW") - required for section header
  backendItems?: BackendProjectItem[]; // Optional backend items for vendor editing
  globalItemsById?: Map<string, BackendProjectItem>; // Global items state for reactive totals
  updateGlobalItem?: (itemId: string, patch: Partial<BackendProjectItem>) => void; // Global item update function
  onProjectUpdate?: (projectId: string) => Promise<void>; // Callback to refresh project data
  onItemCreated?: (projectId: string, item: BackendProjectItem) => void; // Surgical row insert after create
  onDeleteProject?: (projectId: string) => Promise<void>; // Callback to delete project
  supplierVendorCodeFilter?: string; // SUPPLIER MODE: Filter rows by vendor code at render time
  enableAccountingColumns?: boolean; // SUPPLIER MODE: Show accounting columns (Paid, Remaining, Not Ordered)
  showSectionHeader?: boolean; // Show section separator header (only for first project in section)
  onSupplierItemUpdated?: (updatedItem: BackendProjectItem) => void; // SUPPLIER MODE: Callback for immediate UI updates
  isSupplierMode?: boolean; // SUPPLIER MODE: Hide PO Sign Status column when true
  // Dashboard highlighting
  highlightedItemId?: string | null;
  highlightField?: string | null;
  // 🚨 PERMISSION OVERRIDES: Allow supplier components to override column permissions
  permissionOverrides?: {
    isColumnVisible?: (columnKey: string) => boolean;
    isColumnEditable?: (columnKey: string) => boolean;
    isColumnReadOnly?: (columnKey: string) => boolean;
  };
  // HALF-YEAR ASSIGNMENT: project selection checkbox (Projects page only)
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (projectId: string) => void;
  // PF GROUPS: right-click "Add to Group" menu (Projects tab only)
  enableGrouping?: boolean;
  pfGroups?: PfGroup[];
}

const ProjectBlock: React.FC<ProjectBlockProps> = ({ mode = 'projects', project, sectionLabel, backendItems, globalItemsById: _globalItemsById, updateGlobalItem, onProjectUpdate, onItemCreated, onDeleteProject, supplierVendorCodeFilter, enableAccountingColumns = false, showSectionHeader = false, onSupplierItemUpdated, isSupplierMode = false, permissionOverrides, highlightedItemId: highlightedItemIdProp, highlightField: highlightFieldProp, selectable = false, isSelected = false, onToggleSelect, enableGrouping = false, pfGroups = [] }) => {

  // Access control: get allowedTypes for restricted row detection
  const { userAccessPolicy, isAdmin } = useAuth();
  const allowedTypes = userAccessPolicy?.allowedTypes;

  // FIXED: Single source of truth - store items by itemId to prevent data loss
  const [itemsById, setItemsById] = useState<Map<string, BackendProjectItem>>(new Map());
  
  // Accounting state management (supplier mode only)
  const { getPaidAmounts, updatePaidAmount } = useAccountingState();

  // Undo stack - CTRL+Z support for last 3 mutations (global singleton)
  const undoEntityType = mode === 'directOrder' ? 'directOrderItem' as const
    : mode === 'missingExtra' ? 'missingExtraItem' as const
    : (mode === 'expenses-p' || mode === 'expenses-do' || mode === 'expenses-me') ? 'expensesPItem' as const
    : 'projectItem' as const;
  const undoCallback = useCallback(() => {
    if (onProjectUpdate) onProjectUpdate(project.projectId);
  }, [onProjectUpdate, project.projectId]);
  const { push: pushUndo } = useUndoStack(undoCallback, project.projectId);


  // ✅ GLOBAL SMART PRE-FILL: Find latest container date across ALL projects
  const getLatestContainerDate = async (containerNo: string): Promise<string | null> => {
    if (!containerNo) return null;

    const trimmedContainerNo = containerNo.trim().toUpperCase();


    try {
      // Use new global API to search across all projects
      const { getLatestContainerDate: fetchLatestDate } = await import('../lib/containers');
      const latestDateISO = await fetchLatestDate(trimmedContainerNo);

      if (latestDateISO) {
        // Convert ISO date to YYYY-MM-DD format for frontend
        const dateObj = new Date(latestDateISO);
        const formattedDate = dateObj.toISOString().split('T')[0];
        return formattedDate;
      } else {
        return null;
      }
    } catch (error) {
      console.error(`❌ GLOBAL_SEARCH_ERROR for ${trimmedContainerNo}:`, error);
      return null;
    }
  };

  // Helper functions for mode-based API calls
  const createItem = async (itemData: any) => {
    if (mode === 'missingExtra') {
      return await createMissingExtraItem(project.projectId, itemData);
    } else if (mode === 'directOrder') {
      return await createDirectOrderItem(project.projectId, itemData);
    } else if (mode === 'expenses-p') {
      return await createExpensesPItem(project.projectId, itemData);
    } else if (mode === 'expenses-do') {
      return await createExpensesDirectOrderItem(project.projectId, itemData);
    } else if (mode === 'expenses-me') {
      return await createExpensesMissingExtraItem(project.projectId, itemData);
    } else {
      return await createProjectItem(project.projectId, itemData);
    }
  };

  const updateItem = async (itemId: string, itemData: any) => {
    if (mode === 'missingExtra') {
      return await updateMissingExtraItem(itemId, itemData);
    } else if (mode === 'directOrder') {
      return await updateDirectOrderItem(project.projectId, itemId, itemData);
    } else if (mode === 'expenses-p') {
      return await updateExpensesPItem(itemId, itemData);
    } else if (mode === 'expenses-do') {
      return await updateExpensesDirectOrderItem(itemId, itemData);
    } else if (mode === 'expenses-me') {
      return await updateExpensesMissingExtraItem(itemId, itemData);
    } else {
      return await updateProjectItem(itemId, itemData);
    }
  };

  const deleteItemApi = async (itemId: string) => {
    if (mode === 'missingExtra') {
      await deleteMissingExtraItem(itemId);
    } else if (mode === 'directOrder') {
      await deleteDirectOrderItem(project.projectId, itemId);
    } else if (mode === 'expenses-p') {
      await deleteExpensesPItem(itemId);
    } else if (mode === 'expenses-do') {
      await deleteExpensesDirectOrderItem(itemId);
    } else if (mode === 'expenses-me') {
      await deleteExpensesMissingExtraItem(itemId);
    } else {
      await deleteProjectItem(project.projectId, itemId);
    }
  };

  // ============================================================
  // STATE DECLARATIONS FIRST
  // ============================================================

  // Removed unused tempRows state
  const [projectMetadata, setProjectMetadata] = useState<Omit<Project, 'rows'>>({
    projectId: project.projectId,
    projectNumber: project.projectNumber,
    projectName: project.projectName,
    projectNumberColor: project.projectNumberColor, // Initial from prop
    address: project.address || '',
    region: project.region || '',
    poSignStatusByType: project.poSignStatusByType
  });

  // ✅ DEBUG: Log when ProjectBlock receives new project prop
  useEffect(() => {
  }, [JSON.stringify(project.poSignStatusByType), project.projectId]);

  const [editingCell, setEditingCell] = useState<EditingState | null>(null);
  const [vendorEditState, setVendorEditState] = useState<VendorEditState | null>(null);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [addToGroupOpen, setAddToGroupOpen] = useState(false);
  const [rowContextMenu, setRowContextMenu] = useState<{ x: number; y: number; itemId: string; type: string } | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [colorRecalcTrigger, setColorRecalcTrigger] = useState(0); // Force color recalculation
  const cellRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});
  const typeClickRef = useRef<HTMLDivElement>(null);
  const projectHeaderRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // ✅ COMPUTE COLOR AFTER STATE DECLARATIONS
  // ============================================================

  // 1. Extract data needed for color calculation
  // Use local isUrgent state for immediate updates, fall back to project prop
  const isUrgentManual = isUrgent || (project as any).isUrgent === true || (project as any).urgentManual === true;

  // 2. State for computed color - will be set by useEffect once itemsById is populated
  const [currentProjectColor, setCurrentProjectColor] = useState<ProjectColor>('orange'); // Default until items load

  // 🔧 PREVENT COLOR LOOP: Track last applied color
  const lastAppliedColorRef = useRef<string>('');

  // Track item statuses so color recalcs when a status changes (without size change)
  const itemStatusSignature = useMemo(
    () => Array.from(itemsById.values()).map(i => `${i.id}:${i.status ?? ''}`).join('|'),
    [itemsById]
  );

  // 3. Recalculate color after itemsById or isUrgent changes - MAP ONLY APPROACH
  useEffect(() => {
    // In Supplier mode project.rows is [], so build fallback rows from itemsById
    const effectiveRows = project.rows?.length > 0
      ? project.rows
      : Array.from(itemsById.values()).map(item => ({ itemId: item.id }));
    const projectForColor = effectiveRows === project.rows
      ? project
      : { ...project, rows: effectiveRows };

    const calculatedColor = getProjectColorFromMap({
      project: projectForColor,
      itemsById,
      isUrgentOverride: isUrgentManual
    });

    // 🔧 EXTRA PROTECTION: Early return if color unchanged
    if (calculatedColor === lastAppliedColorRef.current) {
      return;
    }

    setCurrentProjectColor(prev => {
      const newColor = prev === calculatedColor ? prev : calculatedColor;
      lastAppliedColorRef.current = newColor;
      return newColor;
    });
  }, [project.projectId, project.rows, itemsById.size, itemStatusSignature, isUrgent, colorRecalcTrigger]);

  // ✅ Update color when currentProjectColor changes
  useEffect(() => {

    setProjectMetadata(prev => ({
      ...prev,
      projectNumberColor: currentProjectColor
    }));
  }, [currentProjectColor, project.projectId]);

  // 🔍 RENDER DEBUG: Log every render with color info (temporarily disabled for performance)
  //
  const poSignStatusEditorRef = useRef<HTMLDivElement>(null);

  // ── Generic drag-to-select helper ──
  type DragField = 'containerNo' | 'pfSignStatus' | 'status';
  const [dragSelectedRowIds, setDragSelectedRowIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragField, setDragField] = useState<DragField>('containerNo');
  const [dragAnchorId, setDragAnchorId] = useState<string | null>(null);
  const dragRowIdsOrderRef = useRef<string[]>([]);
  // Refs for stale-closure-safe reads in async save handlers
  const dragFieldRef = useRef<DragField>('containerNo');
  const dragSelectedRowIdsRef = useRef<Set<string>>(new Set());

  const handleDragCellMouseDown = useCallback((e: React.MouseEvent, itemId: string, field: DragField) => {
    if (!itemId) return;
    e.preventDefault();
    setIsDragging(true);
    setDragField(field);
    dragFieldRef.current = field;
    setDragAnchorId(itemId);
    setDragSelectedRowIds(new Set([itemId]));
    dragSelectedRowIdsRef.current = new Set([itemId]);
  }, []);

  const handleDragCellMouseEnter = useCallback((itemId: string) => {
    if (!isDragging || !dragAnchorId || !itemId) return;
    const ids = dragRowIdsOrderRef.current;
    const anchorIdx = ids.indexOf(dragAnchorId);
    const curIdx = ids.indexOf(itemId);
    if (anchorIdx === -1 || curIdx === -1) return;
    const [start, end] = anchorIdx <= curIdx ? [anchorIdx, curIdx] : [curIdx, anchorIdx];
    const newSet = new Set(ids.slice(start, end + 1));
    setDragSelectedRowIds(newSet);
    dragSelectedRowIdsRef.current = newSet;
  }, [isDragging, dragAnchorId]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const anchorId = dragAnchorId;
    const field = dragField;
    setDragAnchorId(null);
    if (anchorId && dragSelectedRowIds.size > 0) {
      setEditingCell({ projectId: project.projectId, itemId: anchorId, field });
    }
  }, [isDragging, dragAnchorId, dragField, dragSelectedRowIds, project.projectId]);

  useEffect(() => {
    if (!isDragging) return;
    const up = () => handleDragEnd();
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, [isDragging, handleDragEnd]);


  // Auth and permissions hooks
  // ✅ PERMISSION SYSTEM: Use overrides from supplier context or default to Projects permissions
  const defaultPermissions = useColumnPermissions();
  const baseIsColumnVisible = permissionOverrides?.isColumnVisible || defaultPermissions.isColumnVisible;
  const isExpensesPMode = mode === 'expenses-p' || mode === 'expenses-do' || mode === 'expenses-me';
  const EXPENSES_HIDE_COLS = ['pfCode', 'pfSignStatus', 'poSignStatus', 'pfUsd', 'pfTl', 'rtd', 'containerDate'];
  const EXPENSES_SHOW_COLS = ['expensesUsd', 'expensesTl'];
  const isColumnVisible = useCallback((key: string) => {
    if (isExpensesPMode) {
      if (EXPENSES_HIDE_COLS.includes(key)) return false;
      if (EXPENSES_SHOW_COLS.includes(key)) return true;
    } else {
      if (EXPENSES_SHOW_COLS.includes(key)) return false;
    }
    return baseIsColumnVisible(key);
  }, [baseIsColumnVisible, isExpensesPMode]);
  const isColumnEditable = permissionOverrides?.isColumnEditable || defaultPermissions.isColumnEditable;
  const { paymentRules, addRule: addPaymentRule } = usePaymentRules();

  // Initialize isUrgent from project data
  useEffect(() => {
    const projectUrgent = (project as any).isUrgent === true || (project as any).urgentManual === true;
    setIsUrgent(projectUrgent);
  }, [project.projectId, (project as any).isUrgent, (project as any).urgentManual]);

  // Compute current project color including local urgent state and current items data
  const applyPatch = async (itemId: string, patchPayload: any, _field: string) => {
    try {
      // 🔍 PROOF LOG: Request being sent
      // expenses-p: remap 'rtr' → 'rtrd' for backend compatibility
      let apiPayload = patchPayload;
      if (isExpensesPMode && 'rtr' in patchPayload) {
        const { rtr, ...rest } = patchPayload;
        apiPayload = { ...rest, rtrd: rtr };
      }

      // 1. Update backend via API
      const updatedItem = await updateItem(itemId, apiPayload);

      // 2. IMMEDIATELY update local state for instant UI feedback
      setItemsById(prev => {
        const newMap = new Map(prev);
        const currentItem = newMap.get(itemId);
        if (currentItem) {
          // Merge the updated fields with the current item
          // Preserve customType if not returned by backend to prevent "Unknown" type display
          const mergedItem = {
            ...currentItem,
            ...patchPayload,
            // Also update with the response data in case backend transforms anything
            ...updatedItem,
            customType: updatedItem.customType || currentItem.customType,
            // expenses-p: map backend 'rtrd' → frontend 'rtr'
            ...(isExpensesPMode && updatedItem.rtrd !== undefined ? { rtr: updatedItem.rtrd } : {}),
          };
          newMap.set(itemId, mergedItem);

          // 💰 CRITICAL: Also update global state for reactive section totals
          if (updateGlobalItem) {
            updateGlobalItem(itemId, mergedItem);
          }

          // 🔥 SUPPLIER FIX: Update parent state for immediate UI refresh
          if (onSupplierItemUpdated && 'projectId' in updatedItem) {
            onSupplierItemUpdated(updatedItem as BackendProjectItem);
          }
        }
        return newMap;
      });

    } catch (error) {
      throw error;
    }
  };
  // 🔧 STABLE DEPENDENCIES: Create signatures to prevent infinite re-renders
  // PF GROUPS: this project's own (typeLabel -> [{number, rank}]) badges — shown
  // on the TYPE cell whenever a type has been added to a group, regardless of
  // whether the Groups filter is active, so it's always clear at a glance.
  const groupBadgesByType = useMemo(() => {
    const map = new Map<string, { number: number; rank: number }[]>();
    if (!enableGrouping) return map;
    pfGroups.forEach(g => g.members.forEach(m => {
      if (m.projectId !== project.projectId) return;
      const arr = map.get(m.typeLabel) || [];
      arr.push({ number: g.number, rank: m.rank });
      map.set(m.typeLabel, arr);
    }));
    return map;
  }, [enableGrouping, pfGroups, project.projectId]);

  const stablePoSignSignature = useMemo(() => {
    if (!project.poSignStatusByType) return '';
    const sortedEntries = Object.entries(project.poSignStatusByType)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, status]) => `${type}=${status}`)
      .join('|');
    return sortedEntries;
  }, [project.poSignStatusByType]);

  // projectSignature used for memoization debugging when needed
  // `${project.projectId}:${project.projectNumber}:${project.projectName}:${isUrgent}:${project.address || ''}:${project.region || ''}:${stablePoSignSignature}:${project.rows.length}`

  const backendItemsSignature = useMemo(() => (
    (backendItems ?? []).map(i =>
      `${i.id}:${i.updatedAt ?? ''}:${i.vendorId ?? ''}:${i.type ?? ''}:${i.pfUsd ?? ''}:${i.pfTl ?? ''}:${i.status ?? ''}:${i.pfSignStatus ?? ''}:${i.poSignStatus ?? ''}:${i.orderType ?? ''}:${i.statusNote ?? ''}:${i.std ?? ''}:${i.etd ?? ''}:${i.rtr ?? ''}:${i.rtd ?? ''}:${i.rdy ?? ''}:${i.ftd ?? ''}:${i.snd ?? ''}:${i.containerNo ?? ''}:${i.containerDate ?? ''}:${i.pfCode ?? ''}:${i.paidUsd1 ?? ''}:${i.paidUsd2 ?? ''}:${i.paidTl1 ?? ''}:${i.paidTl2 ?? ''}:${i.paidUsd1Date ?? ''}:${i.paidUsd2Date ?? ''}:${i.paidTl1Date ?? ''}:${i.paidTl2Date ?? ''}:${i.invoiceDate ?? ''}:${i.invoice ?? ''}:${(i as any).invoiceTl ?? ''}`
    ).join('|')
  ), [backendItems]);

  // Stable signature for filtered row item IDs - triggers re-sync when filters change
  const rowItemIdsSignature = useMemo(() =>
    project.rows.map(r => r.itemId || '').join(','),
    [project.rows]
  );

  // 🔧 PREVENT REDUNDANT PARENT UPDATES: Track last sent metadata
  const lastSentMetadataRef = useRef<string>('');

  // CRITICAL FIX: Merge backend items with local state, preserving existing data
  useEffect(() => {

    // 🔧 GUARD: Only update parent when metadata actually changes
    const currentMetadataSignature = `${project.projectId}:${project.projectNumber}:${project.projectName}:${currentProjectColor}:${project.address || ''}:${project.region || ''}:${stablePoSignSignature}`;

    if (currentMetadataSignature !== lastSentMetadataRef.current) {
      setProjectMetadata({
        projectId: project.projectId,
        projectNumber: project.projectNumber,
        projectName: project.projectName,
        projectNumberColor: currentProjectColor,
        address: project.address || '',
        region: project.region || '',
        poSignStatusByType: project.poSignStatusByType
      });
      lastSentMetadataRef.current = currentMetadataSignature;
    }

    // 🔍 SUPPLIER MODE FIX: If backendItems is provided, use it as source of truth
    // This handles the case where project.rows is empty but backendItems has data
    if (backendItems && backendItems.length > 0) {
      setItemsById(currentItems => {
        const newItemsById = new Map(currentItems);

        // If project.rows is empty (Supplier P mode), backendItems already carries
        // the active supplier filters and is the full source of truth: add new
        // items AND drop the ones no longer present — otherwise items filtered
        // out (e.g. deselected types) keep rendering from stale itemsById state
        if (project.rows.length === 0) {
          const backendItemIds = new Set(backendItems.map(item => item.id));
          backendItems.forEach(backendItem => {
            newItemsById.set(backendItem.id, backendItem);
          });
          for (const [itemId] of newItemsById) {
            if (!backendItemIds.has(itemId)) {
              newItemsById.delete(itemId);
            }
          }
        } else {
          // Merge ALL backendItems into itemsById regardless of active filters.
          // Filtered-out items must stay in itemsById so computedRows can apply
          // filter logic at render time — deleting them here causes type sections
          // to permanently disappear when a status change removes an item from
          // the current filter match set.
          const backendItemIds = new Set(backendItems.map(item => item.id));

          backendItems.forEach(backendItem => {
            const existingItem = newItemsById.get(backendItem.id);
            const mergedItem = {
              ...backendItem,
              pfCode: backendItem.pfCode !== undefined
                ? backendItem.pfCode
                : existingItem?.pfCode || null,
              vendorId: backendItem.vendorId || existingItem?.vendorId || null,
              // Preserve locally-set containerDate when backendItems is stale (null)
              // but local state has a value (set via applyPatch before missingExtraCases was updated)
              containerDate: backendItem.containerDate !== null && backendItem.containerDate !== undefined
                ? backendItem.containerDate
                : (existingItem?.containerDate ?? null),
            };
            newItemsById.set(backendItem.id, mergedItem);
          });

          // Remove only items genuinely absent from the project (deleted server-side)
          for (const [itemId] of newItemsById) {
            if (!backendItemIds.has(itemId)) {
              newItemsById.delete(itemId);
            }
          }
        }

        return newItemsById;
      });
    }
  }, [project.projectId, backendItemsSignature, rowItemIdsSignature, currentProjectColor, stablePoSignSignature, project.projectNumber, project.projectName, project.address, project.region]);

  // DERIVED STATE: Convert itemsById to rows for rendering (SINGLE SOURCE OF TRUTH)
  const computedRows = useMemo(() => {
    // Apply the filter that project.rows already carries (type/status/vendor filters).
    // itemsById intentionally stores ALL project items; filtering happens here so
    // a status change that removes an item from the active filter set doesn't
    // permanently delete it from storage.
    const filteredRowIds = new Set(project.rows.map(r => r.itemId).filter(Boolean));
    const baseItems = filteredRowIds.size > 0
      ? Array.from(itemsById.values()).filter(item => filteredRowIds.has(item.id))
      : Array.from(itemsById.values()); // supplier P mode: project.rows is empty, show all

    // Sort items using the same logic as mapBackendProjectToFrontend
    const sortedItems = baseItems.sort((a, b) => {
      // First: Group by type (maintain type order) - use same order as types.ts
      const typeOrder = TYPE_ORDER.map(t => t.toUpperCase());
      const aTypeIndex = typeOrder.indexOf(a.type || '');
      const bTypeIndex = typeOrder.indexOf(b.type || '');
      if (aTypeIndex !== bTypeIndex) {
        return aTypeIndex - bTypeIndex;
      }

      // Phase 2: Priority vendors on top (YSM=0, GOS=1, others=2)
      const aPri = getVendorPriority(a);
      const bPri = getVendorPriority(b);
      if (aPri !== bPri) return aPri - bPri;

      // Phase 3: Within same priority vendor, sort by PF sequence
      if (aPri < 2) {
        return extractPFSequence(a.pfCode) - extractPFSequence(b.pfCode);
      }

      // Phase 4: Others keep creation order
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });

    // SUPPLIER MODE: Apply additional vendor filtering at final render stage
    let finalItems = sortedItems;
    if (supplierVendorCodeFilter) {
      const extractVendorCode = (item: BackendProjectItem): string | null => {
        if (item.vendor?.code) {
          return item.vendor.code;
        }
        // Fallback: extract from vendor display string if it exists as string
        const vendorStr = (item as any).vendorDisplay || (item as any).vendorString;
        if (typeof vendorStr === 'string' && vendorStr.includes(' - ')) {
          return vendorStr.split(' - ')[0];
        }
        return null;
      };

      finalItems = sortedItems.filter(item => {
        const itemVendorCode = extractVendorCode(item);
        return itemVendorCode === supplierVendorCodeFilter;
      });

      // PROOF LOGGING - Show which vendors are actually being rendered
    }

    // Helper: check if item type is restricted for current user
    const isItemRestricted = (item: BackendProjectItem): boolean => {
      // Admin or no allowedTypes config = no restrictions
      if (isAdmin || !allowedTypes) return false;
      // Custom type: check customTypeIds
      if (item.customTypeId) {
        return !(allowedTypes.customTypeIds ?? []).includes(item.customTypeId);
      }
      // Enum type: check enumTypes
      if (item.type) {
        return !(allowedTypes.enumTypes ?? []).includes(item.type);
      }
      return false;
    };

    // Map to frontend row format
    return finalItems.map(item => ({
      type: mapBackendTypeToFrontend(item.type, item.customType),
      pfCode: item.pfCode || '',
      vendor: item.vendor
        ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name)
        : '',
      vendorId: item.vendorId || '',
      orderType: item.orderType || '',
      pfSignStatus: mapSignStatusToFrontend(item.pfSignStatus),
      poSignStatus: mapSignStatusToFrontend(item.poSignStatus),
      status: item.status?.replace(/_/g, ' ') || '',
      statusNote: item.statusNote || '',
      std: item.std || '',
      etd: item.etd || '',
      rtd: item.rtd || '',
      rtr: item.rtr || '',
      rdy: item.rdy || '',
      ftd: item.ftd || '',
      snd: item.snd || '',
      pfUsd: item.pfUsd ? item.pfUsd.toString() : '',
      pfTl: item.pfTl ? item.pfTl.toString() : '',
      invoice: item.invoice != null ? item.invoice.toString() : '',
      invoiceTl: (item as any).invoiceTl != null ? (item as any).invoiceTl.toString() : '',
      paymentRule: item.paymentRule || '',
      containerNo: item.containerNo || '',
      containerDate: item.containerDate ? new Date(item.containerDate).toISOString().split('T')[0] : '', // ✅ ITEM-LEVEL: Container date from individual item
      expensesUsd: (item as any).expensesUsd ? (item as any).expensesUsd.toString() : '',
      expensesTl: (item as any).expensesTl ? (item as any).expensesTl.toString() : '',
      customTypeId: item.customTypeId || null,
      itemId: item.id, // Critical for updates
      isRestricted: isItemRestricted(item)
    }));
  }, [itemsById, project.rows, supplierVendorCodeFilter, isAdmin, allowedTypes]);

  // DERIVED STATE: Generate projectData from itemsById for backwards compatibility
  const projectData: Project = useMemo(() => ({
    ...projectMetadata,
    // ✅ FIXED: Use computed rows from itemsById (SINGLE SOURCE OF TRUTH)
    rows: computedRows,
    poSignStatusByType: projectMetadata.poSignStatusByType
  }), [projectMetadata, computedRows]); // 🔧 STABLE: Memoize to prevent recreation on every render

  // Dashboard highlighting: use prop and auto-clear after 3 seconds
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(highlightedItemIdProp || null);
  const [highlightField, setHighlightField] = useState<string | null>(highlightFieldProp || null);

  // Status note context menu + dialog state
  const [noteMenu, setNoteMenu] = useState<{ x: number; y: number; itemId: string; hasNote: boolean } | null>(null);
  const [noteDialog, setNoteDialog] = useState<{ itemId: string; text: string; mode: 'view' | 'edit' } | null>(null);

  // Price note context menu + dialog state
  const [priceNoteMenu, setPriceNoteMenu] = useState<{ x: number; y: number; itemId: string; field: string; hasNote: boolean } | null>(null);
  const [priceNoteDialog, setPriceNoteDialog] = useState<{ itemId: string; field: string; text: string; mode: 'view' | 'edit' } | null>(null);

  useEffect(() => {
    if (highlightedItemIdProp) {
      setHighlightedItemId(highlightedItemIdProp);
      setHighlightField(highlightFieldProp || null);

      // Scroll to the highlighted row after a short delay (allow DOM to render)
      const scrollTimer = setTimeout(() => {
        const row = document.querySelector(`[data-item-id="${highlightedItemIdProp}"]`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);

      // Clear highlight after 3 seconds
      const clearTimer = setTimeout(() => {
        setHighlightedItemId(null);
        setHighlightField(null);
      }, 3500);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [highlightedItemIdProp, highlightFieldProp]);

  // Calculate dynamic grid width based on visible columns
  const gridWidthPx = useMemo(() => {
    return getGridWidthPx(isColumnVisible, isSupplierMode);
  }, [isColumnVisible, isSupplierMode]);

  // 💰 CALCULATE TOTALS for PF USD and PF TL (excluding restricted rows)
  const projectTotals = React.useMemo(() => {
    const visibleRows = computedRows.filter(row => !row.isRestricted);
    const totalUsd = visibleRows.reduce((sum, row) => {
      const value = parseFloat(row.pfUsd) || 0;
      return sum + value;
    }, 0);

    const totalTl = visibleRows.reduce((sum, row) => {
      const value = parseFloat(row.pfTl) || 0;
      return sum + value;
    }, 0);

    const totalExpensesUsd = visibleRows.reduce((sum, row) => {
      const value = parseFloat(row.expensesUsd || '') || 0;
      return sum + value;
    }, 0);

    const totalExpensesTl = visibleRows.reduce((sum, row) => {
      const value = parseFloat(row.expensesTl || '') || 0;
      return sum + value;
    }, 0);

    const totalInvoice = visibleRows.reduce((sum, row) => {
      const value = parseFloat(row.invoice || '') || 0;
      return sum + value;
    }, 0);

    const totalInvoiceTl = visibleRows.reduce((sum, row) => {
      const value = parseFloat((row as any).invoiceTl || '') || 0;
      return sum + value;
    }, 0);

    return {
      pfUsd: totalUsd,
      pfTl: totalTl,
      expensesUsd: totalExpensesUsd,
      expensesTl: totalExpensesTl,
      invoice: totalInvoice,
      invoiceTl: totalInvoiceTl
    };
  }, [computedRows]);

  // 💰 FORMAT CURRENCY with thousands separators and 2 decimals
  const formatCurrency = (value: number): string => {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Update row to item mapping whenever derived projectData changes
  useEffect(() => {
    // 🚨 CRITICAL FIX: Only use backend items that correspond to filtered rows
    // The projectData.rows are already filtered by parent, so we need matching backend items
    const filteredBackendItems: BackendProjectItem[] = [];

    computedRows.forEach(row => {
      // Find the backend item that has the same id as this filtered row's itemId
      const backendItem = Array.from(itemsById.values()).find(item => item.id === row.itemId);
      if (backendItem) {
        filteredBackendItems.push(backendItem);
      }
    });

    buildRowToItemMapping(projectData, filteredBackendItems);
  }, [itemsById, computedRows]); // 🔧 STABLE: Use computedRows directly instead of projectData.rows



  // CRITICAL FIX: Helper to update only the specific item, preventing bulk apply bug
  // ⚠️ MUST BE DEFINED BEFORE useEffect that uses it (line 543-567)
  const updateItemInState = (itemId: string, patch: Partial<{ vendor: string; vendorId: string; pfCode: string; orderType: string; status: string; std: string | null; pfSignStatus: string; poSignStatus: string; etd: string | null; rtd: string | null; rtr: string | null; rdy: string | null; ftd: string | null; snd: string | null; containerNo: string; containerDate: string; paymentRule: string; pfUsd: string; pfTl: string; invoice: string; invoiceTl: string }>) => {


    setItemsById(currentItems => {
      const existingItem = currentItems.get(itemId);
      if (!existingItem) {
        console.error('❌ ITEM_NOT_FOUND_IN_STATE', { itemId, availableItemIds: Array.from(currentItems.keys()) });
        return currentItems;
      }


      const newItems = new Map(currentItems);

      // Apply patch to backend item structure
      const updatedItem: BackendProjectItem & { __source: string } = {
        ...existingItem,
        // Map frontend patch fields to backend fields
        pfCode: patch.pfCode ?? existingItem.pfCode,
        vendorId: patch.vendorId ?? existingItem.vendorId, // Update vendorId if provided
        orderType: patch.orderType ?? existingItem.orderType,
        pfSignStatus: (patch.pfSignStatus === 'NOT SIGNED' ? 'NOT_SIGNED' :
                      patch.pfSignStatus === 'READY TO SIGN' ? 'READY_TO_SIGN' :
                      patch.pfSignStatus === 'SIGNED' ? 'SIGNED' :
                      patch.pfSignStatus === 'WAITING TLINES TO SIGN' ? 'WAITING_TLINES_TO_SIGN' :
                      patch.pfSignStatus === 'WAITING T TO SIGN' ? 'WAITING_T_TO_SIGN' :
                      patch.pfSignStatus === 'SIGNED WITH EST PRICE' ? 'SIGNED_WITH_EST_PRICE' : existingItem.pfSignStatus),
        poSignStatus: (patch.poSignStatus === 'NOT SIGNED' ? 'NOT_SIGNED' :
                      patch.poSignStatus === 'READY TO SIGN' ? 'READY_TO_SIGN' :
                      patch.poSignStatus === 'SIGNED' ? 'SIGNED' :
                      patch.poSignStatus === 'WAITING TLINES TO SIGN' ? 'WAITING_TLINES_TO_SIGN' :
                      patch.poSignStatus === 'WAITING T TO SIGN' ? 'WAITING_T_TO_SIGN' : existingItem.poSignStatus),
        status: (patch.status === 'HOLD T' ? 'HOLD_T' :
                patch.status === 'HOLD PM' ? 'HOLD_PM' :
                patch.status ? patch.status.replace(/ /g, '_').toUpperCase() as any : existingItem.status),
        std: 'std' in patch ? (patch.std ?? null) : existingItem.std,
        etd: 'etd' in patch ? (patch.etd ?? null) : existingItem.etd,
        rtd: 'rtd' in patch ? (patch.rtd ?? null) : existingItem.rtd,
        rtr: 'rtr' in patch ? (patch.rtr ?? null) : existingItem.rtr,
        rdy: 'rdy' in patch ? (patch.rdy ?? null) : existingItem.rdy,
        ftd: 'ftd' in patch ? (patch.ftd ?? null) : existingItem.ftd,
        snd: 'snd' in patch ? (patch.snd ?? null) : existingItem.snd,
        containerNo: patch.containerNo ?? existingItem.containerNo,
        containerDate: patch.containerDate ? new Date(patch.containerDate + 'T00:00:00.000Z').toISOString() : existingItem.containerDate,
        paymentRule: patch.paymentRule ?? existingItem.paymentRule,
        // 💰 CRITICAL: Handle pfUsd and pfTl with proper number conversion
        pfUsd: patch.pfUsd !== undefined ? (patch.pfUsd === '' ? null : parseFloat(patch.pfUsd) || null) : existingItem.pfUsd,
        pfTl: patch.pfTl !== undefined ? (patch.pfTl === '' ? null : parseFloat(patch.pfTl) || null) : existingItem.pfTl,
        invoice: patch.invoice !== undefined ? (patch.invoice === '' ? null : parseFloat(patch.invoice) || null) : existingItem.invoice,
        invoiceTl: patch.invoiceTl !== undefined ? (patch.invoiceTl === '' ? null : parseFloat(patch.invoiceTl) || null) : (existingItem as any).invoiceTl,
        updatedAt: new Date().toISOString(),
        // 🧩 PROOF-BASED DEBUG: Track data source
        __source: "itemsById_after_patch"
      };

      // Update vendor display if patch includes vendor info
      if (patch.vendor && !patch.vendor.includes(' - ')) {
        // If vendor patch doesn't include code-name format, preserve existing vendor relation
      } else if (patch.vendor) {
        // Parse vendor display format "CODE - NAME" back to vendor relation structure
        const [code, ...nameParts] = patch.vendor.split(' - ');
        if (code && nameParts.length > 0) {
          updatedItem.vendor = {
            id: existingItem.vendor?.id || '',
            code: code,
            name: nameParts.join(' - ')
          };
        }
      }

      newItems.set(itemId, updatedItem);

      return newItems;
    });

    // 🎨 FORCE COLOR RECALCULATION: Trigger after item update
    setTimeout(() => {
      setColorRecalcTrigger(prev => prev + 1);
    }, 0);
  };

  // ✅ LISTEN FOR GLOBAL SYNC EVENTS: Update local state when other projects sync container dates
  useEffect(() => {
    const handleGlobalContainerSync = (event: CustomEvent) => {
      const { containerNo: _containerNo, containerDate: _containerDate, affectedItems } = event.detail;


      // Update any matching containers in this project
      if (affectedItems) {
        affectedItems.forEach((item: any) => {
          const localItem = itemsById.get(item.itemId);
          if (localItem) {
            // Convert ISO date to display format
            const displayDate = item.containerDate ? new Date(item.containerDate).toISOString().split('T')[0] : '';
            updateItemInState(item.itemId, {
              containerDate: displayDate
            });
          }
        });
      }
    };

    // Add event listener
    window.addEventListener('globalContainerSync', handleGlobalContainerSync as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('globalContainerSync', handleGlobalContainerSync as EventListener);
    };
  }, [itemsById, updateItemInState]);

  // CRITICAL FIX: Build precise row -> itemId mapping to prevent bulk apply bug
  const buildRowToItemMapping = (projectData: Project, backendItems?: BackendProjectItem[]) => {
    const newMap = new Map<number, string>();

    if (!backendItems) {
      return;
    }

    // Map each row to its corresponding backend item using position and type matching
    projectData.rows.forEach((row, __rowIndex) => {
      // Find the backend item that matches this row's position within its type group
      const rowsOfSameType = projectData.rows.filter(r => r.type === row.type);
      const positionInType = rowsOfSameType.indexOf(row);

      const itemsOfSameType = backendItems
        .filter(item => mapBackendTypeToFrontend(item.type, item.customType) === row.type)
        .sort((a, b) => {
          // Apply same sorting as frontend display
          const aPri = getVendorPriority(a);
          const bPri = getVendorPriority(b);
          if (aPri !== bPri) return aPri - bPri;

          if (aPri < 2) {
            return extractPFSequence(a.pfCode) - extractPFSequence(b.pfCode);
          }

          return (a.vendor?.name || '').localeCompare(b.vendor?.name || '');
        });

      const correspondingItem = itemsOfSameType[positionInType];
      if (correspondingItem) {
        newMap.set(__rowIndex, correspondingItem.id);
      }
    });

  };

  // Helper function to create type groups from project data
  const createTypeGroupsFromProject = (project: Project) => {
    const typeGroupMap = new Map();

    // If project has no rows, create empty type groups for proper layout
    if (project.rows.length === 0) {
      // No type groups to display - this is correct for projects with no line items
      return typeGroupMap;
    }

    // Group existing rows by type
    project.rows.forEach(row => {
      if (!typeGroupMap.has(row.type)) {
        // Use stored PO Sign Status from project's poSignStatusByType field
        const poSignStatus = project.poSignStatusByType[row.type] || '';
        typeGroupMap.set(row.type, { type: row.type, poSignStatus, rows: [] });
      }
      typeGroupMap.get(row.type).rows.push(row);
    });

    return typeGroupMap;
  };

  // Create type groups with PO Sign Status
  const typeGroupsMap = createTypeGroupsFromProject(projectData);

  // Include ALL types (enum + custom) while preserving order for known types
  const knownTypeGroups = TYPE_ORDER
    .filter(type => typeGroupsMap.has(type))
    .map(type => typeGroupsMap.get(type));

  // Add custom types that are not in TYPE_ORDER
  const allTypeNames = Array.from(typeGroupsMap.keys());
  const customTypeGroups = allTypeNames
    .filter(typeName => !TYPE_ORDER.includes(typeName))
    .map(typeName => typeGroupsMap.get(typeName));

  const typeGroups: TypeGroup[] = [...knownTypeGroups, ...customTypeGroups];

  // Keep drag-select row order ref in sync with current rows
  const allRowItemIds = typeGroups.flatMap(g => g.rows.map(r => r.itemId).filter((id): id is string => !!id));
  dragRowIdsOrderRef.current = allRowItemIds;

  // Helper to get or create cell ref
  const getCellRef = (cellKey: string) => {
    if (!cellRefs.current[cellKey]) {
      cellRefs.current[cellKey] = React.createRef<HTMLDivElement>();
    }
    return cellRefs.current[cellKey];
  };

  // Helper function for consistent header cell styling
  const getHeaderCellStyle = (columnKey: ColumnKey) => ({
    display: isColumnVisible(columnKey) ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    fontSize: '11px',
    fontWeight: '600',
    padding: '0 8px',
    minHeight: '32px',
    borderRight: '1px solid #333',
    backgroundColor: '#000000',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  });

  const handleProjectHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Left click no longer opens delete menu - just log or do nothing
  };

  const handleProjectHeaderRightClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent browser context menu
    e.stopPropagation();
    setIsProjectMenuOpen(!isProjectMenuOpen);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (onDeleteProject) {
      try {
        await onDeleteProject(projectId);
      } catch (error) {
      }
    } else {
    }
  };

  const handleProjectMenuClose = () => {
    setIsProjectMenuOpen(false);
  };

  const handleRowContextMenu = (e: React.MouseEvent, itemId: string, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!itemId) return;
    setRowContextMenu({ x: e.clientX, y: e.clientY, itemId, type });
  };

  const handleDeleteRow = async () => {
    if (!rowContextMenu) return;
    const { itemId } = rowContextMenu;
    setRowContextMenu(null);
    try {
      await deleteItemApi(itemId);
      // Remove from local state
      if (updateGlobalItem) {
        updateGlobalItem(itemId, { __deleted: true } as any);
      }
      // Trigger refresh
      if (onProjectUpdate) {
        onProjectUpdate(project.projectId);
      }
    } catch (error) {
      console.error('Failed to delete row:', error);
    }
  };

  const handleToggleUrgent = async (projectId: string, shouldBeUrgent: boolean) => {
    try {
      // Optimistic UI update
      setIsUrgent(shouldBeUrgent);

      // Determine API endpoint based on mode
      let apiEndpoint: string;
      if (mode === 'directOrder') {
        apiEndpoint = `/api/direct-orders/${projectId}`;
      } else if (mode === 'missingExtra') {
        apiEndpoint = `/api/missing-extra/cases/${projectId}`;
      } else if (mode === 'expenses-p') {
        apiEndpoint = `/api/expenses-p/projects/${projectId}`;
      } else if (mode === 'expenses-do') {
        apiEndpoint = `/api/expenses-direct-order/projects/${projectId}`;
      } else if (mode === 'expenses-me') {
        apiEndpoint = `/api/expenses-missing-extra/projects/${projectId}`;
      } else {
        // Regular projects
        apiEndpoint = `/api/projects/${projectId}`;
      }

      // Call PATCH API
      await apiFetch(apiEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isUrgent: shouldBeUrgent }),
      });


      // Local state is already updated optimistically above; no full reload needed.
      // The WebSocket entity:patched event will sync other clients.
    } catch (error) {
      // Revert optimistic update on error
      setIsUrgent(!shouldBeUrgent);
      console.error('❌ Failed to update urgent status:', error);
      alert('Failed to update urgent status. Please try again.');
    }
  };

  const [isProjectEditing, setIsProjectEditing] = useState(false);
  const handleEditProject = async (projectId: string, field: 'name' | 'address' | 'types' | 'bucket', value: any) => {
    if (isProjectEditing) return; // Prevent double-save
    setIsProjectEditing(true);
    try {
      if (field === 'bucket') {
        const moveEndpoint = mode === 'directOrder' ? `/api/direct-orders/${projectId}/move-region`
          : mode === 'missingExtra' ? `/api/missing-extra/cases/${projectId}/move-region`
          : mode === 'expenses-p' ? `/api/expenses-p/projects/${projectId}/move-region`
          : mode === 'expenses-do' ? `/api/expenses-direct-order/projects/${projectId}/move-region`
          : mode === 'expenses-me' ? `/api/expenses-missing-extra/projects/${projectId}/move-region`
          : `/api/projects/${projectId}/move-region`;
        const moveResponse = await apiFetch(moveEndpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket: value }),
        });
        if (!moveResponse.ok) {
          const errData = await moveResponse.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to move project to region');
        }
        setProjectMetadata(prev => ({ ...prev, region: value }));
      } else if (field === 'types') {
        const selectedTypes: string[] = value;
        const currentTypes = Array.from(typeGroupsMap.keys());
        const typesToRemove = currentTypes.filter(t => !selectedTypes.includes(t));
        const typesToAdd = selectedTypes.filter(t => !currentTypes.includes(t));

        const itemDeleteBase = mode === 'directOrder' ? `/api/direct-orders/${projectId}/items`
          : mode === 'missingExtra' ? `/api/missing-extra/items`
          : mode === 'expenses-p' ? `/api/expenses-p/items`
          : mode === 'expenses-do' ? `/api/expenses-direct-order/items`
          : mode === 'expenses-me' ? `/api/expenses-missing-extra/items`
          : `/api/projects/${projectId}/items`;
        const itemCreateBase = mode === 'directOrder' ? `/api/direct-orders/${projectId}/items`
          : mode === 'missingExtra' ? `/api/missing-extra/cases/${projectId}/items`
          : mode === 'expenses-p' ? `/api/expenses-p/projects/${projectId}/items`
          : mode === 'expenses-do' ? `/api/expenses-direct-order/projects/${projectId}/items`
          : mode === 'expenses-me' ? `/api/expenses-missing-extra/projects/${projectId}/items`
          : `/api/projects/${projectId}/items`;

        // Remove items of unchecked types (in parallel — one round trip instead of N)
        const itemsToRemove = Array.from(itemsById.values()).filter(item =>
          typesToRemove.includes(mapBackendTypeToFrontend(item.type, item.customType))
        );
        const deleteResults = await Promise.all(itemsToRemove.map(item =>
          apiFetch(`${itemDeleteBase}/${item.id}`, { method: 'DELETE' })
            .then(res => (res.ok ? item.id : null))
            .catch(() => null)
        ));
        const removedItemIds = deleteResults.filter((id): id is string => !!id);

        // Optimistic: remove deleted items from local + global state immediately
        if (removedItemIds.length > 0) {
          setItemsById(prev => {
            const newMap = new Map(prev);
            removedItemIds.forEach(id => newMap.delete(id));
            return newMap;
          });
        }

        // Add empty items for newly checked types (in parallel) - parse response to get real items
        const standardTypes = ['MILLWORK', 'SHELVING', 'CEILING', 'IMAGE', 'FURNITURE', 'DECORATION'];
        const needsCustomTypes = typesToAdd.some(t => !standardTypes.includes(mapTypeToEnum(t)));
        let customTypes: Array<{ id: string; name: string; code?: string }> = [];
        if (needsCustomTypes) {
          const customRes = await apiFetch('/api/custom-types');
          customTypes = customRes.ok ? await customRes.json() : [];
        }
        const createResults = await Promise.all(typesToAdd.map(async (typeName): Promise<BackendProjectItem | null> => {
          const backendType = mapTypeToEnum(typeName);
          let body: Record<string, string>;
          let customType: { id: string; name: string; code?: string } | undefined;
          if (standardTypes.includes(backendType)) {
            body = { type: backendType };
          } else {
            // Custom type: create the item against the custom type's id
            customType = customTypes.find(ct => ct.name.toLowerCase() === typeName.toLowerCase());
            if (!customType) return null;
            body = { customTypeId: customType.id };
          }
          try {
            const response = await apiFetch(itemCreateBase, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            if (!response.ok) return null;
            const newItem = await response.json();
            if (!newItem?.id) return null;
            // Make sure the row renders under the right custom type name right away
            if (customType && !newItem.customType) newItem.customType = customType;
            return newItem as BackendProjectItem;
          } catch {
            return null;
          }
        }));
        const createdItems = createResults.filter((i): i is BackendProjectItem => !!i);

        // Optimistic: add new items to local state immediately
        if (createdItems.length > 0) {
          setItemsById(prev => {
            const newMap = new Map(prev);
            createdItems.forEach(item => newMap.set(item.id, item));
            return newMap;
          });
        }

        // Update project metadata types
        const apiEndpoint = mode === 'directOrder' ? `/api/direct-orders/${projectId}`
          : mode === 'missingExtra' ? `/api/missing-extra/cases/${projectId}`
          : mode === 'expenses-p' ? `/api/expenses-p/projects/${projectId}`
          : mode === 'expenses-do' ? `/api/expenses-direct-order/projects/${projectId}`
          : mode === 'expenses-me' ? `/api/expenses-missing-extra/projects/${projectId}`
          : `/api/projects/${projectId}`;
        await apiFetch(apiEndpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ types: selectedTypes }),
        });

        // The parent list decides which rows this block renders — tell it about the
        // change so the new type shows up without a page refresh. Our own socket
        // events are excluded by the server, so nothing else would do it.
        removedItemIds.forEach(id => updateGlobalItem?.(id, { __deleted: true } as any));
        createdItems.forEach(item => onItemCreated?.(projectId, item));
        // Background re-sync with the server (doesn't block closing the menu)
        if (onProjectUpdate) Promise.resolve(onProjectUpdate(projectId)).catch(() => {});
      } else {
        // name or address
        const apiEndpoint = mode === 'directOrder' ? `/api/direct-orders/${projectId}`
          : mode === 'missingExtra' ? `/api/missing-extra/cases/${projectId}`
          : mode === 'expenses-p' ? `/api/expenses-p/projects/${projectId}`
          : mode === 'expenses-do' ? `/api/expenses-direct-order/projects/${projectId}`
          : mode === 'expenses-me' ? `/api/expenses-missing-extra/projects/${projectId}`
          : `/api/projects/${projectId}`;
        await apiFetch(apiEndpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        });
        if (field === 'name') {
          setProjectMetadata(prev => ({ ...prev, projectName: value }));
        } else if (field === 'address') {
          setProjectMetadata(prev => ({ ...prev, address: value }));
        }
      }

      // projectMetadata already updated locally above; WebSocket syncs other clients.
    } catch (error) {
      console.error(`Failed to update project ${field}:`, error);
      alert(`Failed to update project ${field}. Please try again.`);
    } finally {
      setIsProjectEditing(false);
    }
  };

  // Handler for type cell click - CRITICAL FIX: Capture clicked cell position
  const handleTypeClick = (typeGroup: TypeGroup, e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if 'type' column is editable before allowing editing
    if (!isColumnEditable('type')) {
      return; // Prevent editing
    }

    // Use actual click point — TYPE cell spans many rows so its element rect.bottom
    // is at the very bottom of all those rows, not where the user clicked.
    const clickedElement = e.currentTarget as HTMLElement;
    const rect = clickedElement.getBoundingClientRect();
    const clickedCellRect = {
      top: e.clientY - 2,
      left: rect.left,
      bottom: e.clientY + 2,
      right: rect.right,
      width: rect.width,
      height: 4,
      x: rect.left,
      y: e.clientY - 2
    } as DOMRect;

    // FIXED: Don't auto-create rows - only open edit panel
    if (!backendItems) {
      return;
    }

    // Filter items of this type
    const typeItems = backendItems.filter(item =>
      mapBackendTypeToFrontend(item.type, item.customType) === typeGroup.type
    );
    const sortedItems = sortProjectItemsInTypeGroup(typeItems);

    if (sortedItems.length === 0) {
      // TODO: Show a message or highlight "+ Add Item" button
      return;
    }

    // Open panel with first item selected + CLICKED CELL POSITION

    setVendorEditState({
      typeGroup: typeGroup.type as any,
      projectItems: sortedItems,
      currentItemId: sortedItems[0].id,
      itemsById: createItemsMap(sortedItems),
      clickedCellRect: clickedCellRect // ✅ CRITICAL FIX: Pass exact clicked position
    });

  };
  // Handler for item updates from vendor edit panel
  const handleItemUpdated = async (updatedItem: BackendProjectItem) => {

    // IMMEDIATE: Update main table state so changes appear instantly
    setItemsById(prevItemsById => {
      const newItemsById = new Map(prevItemsById);
      newItemsById.set(updatedItem.id, updatedItem);
      return newItemsById;
    });


    // itemsById already updated above with the full backend response (includes PF code, vendor).
    // WebSocket entity:patched event will sync other clients; no full reload needed here.

    // KEEP PANEL OPEN - do not close after autosave
    // Panel will only close when user explicitly closes it or navigates away
  };

  // Handler for new items added from vendor edit panel
  const handleItemAdded = async (newItem: BackendProjectItem) => {

    // FIRST: Update vendorEditState immediately so user sees new item in panel
    if (vendorEditState && (
      vendorEditState.projectItems.length === 0 ||
      newItem.type === vendorEditState.projectItems[0]?.type ||
      // Handle custom types comparison
      (newItem.customTypeId && vendorEditState.projectItems[0]?.customTypeId === newItem.customTypeId)
    )) {
      const updatedProjectItems = [...vendorEditState.projectItems, newItem];
      const sortedItems = sortProjectItemsInTypeGroup(updatedProjectItems);
      setVendorEditState({
        ...vendorEditState,
        projectItems: sortedItems,
        currentItemId: newItem.id, // Switch to the newly created item
        itemsById: createItemsMap(sortedItems)
      });

    }

    // Inherit PO sign status from the type group if already signed
    // If existing items in this type are SIGNED/READY_TO_SIGN, new item inherits that status
    const newItemType = mapBackendTypeToFrontend(newItem.type, newItem.customType);
    const existingTypeItems = Array.from(itemsById.values()).filter(item =>
      mapBackendTypeToFrontend(item.type, item.customType) === newItemType
    );

    let inheritedPoStatus: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN' | null = null;
    if (existingTypeItems.length > 0) {
      // Priority: SIGNED variants > READY_TO_SIGN > NOT_SIGNED
      const inheritable = ['SIGNED', 'WAITING_TLINES_TO_SIGN', 'WAITING_T_TO_SIGN'] as const;
      const signedItem = inheritable
        .map(st => existingTypeItems.find(item => item.poSignStatus === st))
        .find(Boolean);
      if (signedItem) {
        inheritedPoStatus = signedItem.poSignStatus as any;
      } else if (existingTypeItems.some(item => item.poSignStatus === 'READY_TO_SIGN')) {
        inheritedPoStatus = 'READY_TO_SIGN';
      }
    }

    const itemWithInheritedStatus = inheritedPoStatus
      ? { ...newItem, poSignStatus: inheritedPoStatus }
      : newItem;

    // IMMEDIATE: Update main table state so user sees new item instantly in table
    setItemsById(prevItemsById => {
      const newItemsById = new Map(prevItemsById);
      newItemsById.set(newItem.id, itemWithInheritedStatus);
      return newItemsById;
    });

    // Also update global state so the item persists across re-renders
    if (updateGlobalItem) {
      updateGlobalItem(newItem.id, itemWithInheritedStatus);
    }

    // Update project.rows in parent so computedRows immediately includes the new item
    if (onItemCreated) {
      onItemCreated(project.projectId, itemWithInheritedStatus);
    }

    // If inherited a signed status, persist it to backend immediately
    if (inheritedPoStatus) {
      applyPatch(newItem.id, { poSignStatus: inheritedPoStatus }, 'poSignStatus').catch(err =>
        console.error('Failed to inherit PO sign status for new item:', err)
      );
    }

    // NOTE: No full project refresh here — local state is already updated above.
    // Full refresh (loadProjects) causes scroll-to-top. WebSocket events handle other clients.
  };

  // Handler for navigation in vendor edit panel
  const handleVendorEditNavigate = (newIndex: number) => {
    if (vendorEditState &&
        newIndex >= 0 &&
        newIndex < vendorEditState.projectItems.length &&
        vendorEditState.projectItems[newIndex]) {
      const newItemId = vendorEditState.projectItems[newIndex].id;
      setVendorEditState({
        ...vendorEditState,
        currentItemId: newItemId
      });
    } else {
    }
  };

  // Handler to close vendor edit panel
  const handleVendorEditClose = () => {
    setVendorEditState(null);
  };

  const handleCellEdit = (itemId: string, field: string, typeGroup?: ProjectType) => {
    setEditingCell({ projectId: projectData.projectId, itemId, field, typeGroup });
  };

  const handleCellClick = (
    e: React.MouseEvent,
    itemId: string,
    field: string,
    typeGroup?: ProjectType
  ) => {
    e.stopPropagation(); // Prevent event bubbling

    // Check if column is editable before allowing editing
    if (!isColumnEditable(field as ColumnKey)) {
      return; // Prevent editing
    }

    // Check if column is hidden
    if (!isColumnVisible(field as ColumnKey)) {
      return; // Prevent editing
    }

    // Check if itemId exists
    if (!itemId) {
      return; // Prevent editing
    }

    handleCellEdit(itemId, field, typeGroup);
  };


  const handleCellSave = async (value: string) => {
    if (!editingCell) return;


    // Push undo entry before mutation
    const currentItem = itemsById.get(editingCell.itemId);
    if (currentItem && !editingCell.itemId.startsWith('new-row-')) {
      pushUndo({
        entityType: undoEntityType,
        entityId: editingCell.itemId,
        parentId: project.projectId,
        previousValues: { [editingCell.field]: currentItem[editingCell.field as keyof typeof currentItem] ?? null },
        description: `Changed ${editingCell.field}`,
      });
    }

    if (editingCell.field === 'poSignStatus') {
      // Map display value to enum value
      const mapPoSignStatusToEnum = (displayValue: string): 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN' => {
        switch (displayValue) {
          case 'NOT SIGNED': return 'NOT_SIGNED';
          case 'READY TO SIGN': return 'READY_TO_SIGN';
          case 'SIGNED': return 'SIGNED';
          case 'WAITING TLINES TO SIGN': return 'WAITING_TLINES_TO_SIGN';
          case 'WAITING T TO SIGN': return 'WAITING_T_TO_SIGN';
          default:
            return 'NOT_SIGNED';
        }
      };

      const enumValue = mapPoSignStatusToEnum(value);

      try {
        // Use applyPatch for full global sync
        await applyPatch(editingCell.itemId, { poSignStatus: enumValue }, 'poSignStatus');
      } catch (error) {
      }
    } else {
      // 💰 CRITICAL: Handle pfUsd/pfTl with backend persistence and immediate UI update
      if (editingCell.field === 'pfCode') {
        const patchPayload = { pfCode: value || null };
        applyPatch(editingCell.itemId, patchPayload, editingCell.field)
          .then(() => {})
          .catch((_error) => {});
      } else if (editingCell.field === 'pfUsd' || editingCell.field === 'pfTl' || editingCell.field === 'expensesUsd' || editingCell.field === 'expensesTl' || editingCell.field === 'invoice' || editingCell.field === 'invoiceTl') {
        const parsed = parseFloat(value);
        const numericValue = value === '' ? null : (isNaN(parsed) ? null : parsed);
        const patchPayload = { [editingCell.field]: numericValue };
        // Use applyPatch for backend persistence + immediate UI update
        applyPatch(editingCell.itemId, patchPayload, editingCell.field)
          .then(() => {
          })
          .catch((_error) => {
          });
      } else {
        // CRITICAL FIX: Use updateItemInState instead of row index manipulation for other fields
        updateItemInState(editingCell.itemId, {
          [editingCell.field]: value
        });
      }
    }

    setEditingCell(null);
  };

  // Handler for PF Sign Status updates with backend persistence
  const handlePfSignStatusSave = async (itemId: string, pfSignStatus: string, ____rowIndex?: number) => {
    if (isMutating) return;
    setIsMutating(true);

    const mapPfSignStatusToEnum = (displayValue: string): 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN' | 'SIGNED_WITH_EST_PRICE' => {
      switch (displayValue) {
        case 'NOT SIGNED': return 'NOT_SIGNED';
        case 'READY TO SIGN': return 'READY_TO_SIGN';
        case 'SIGNED': return 'SIGNED';
        case 'WAITING TLINES TO SIGN': return 'WAITING_TLINES_TO_SIGN';
        case 'WAITING T TO SIGN': return 'WAITING_T_TO_SIGN';
        case 'SIGNED WITH EST PRICE': return 'SIGNED_WITH_EST_PRICE';
        default: return 'NOT_SIGNED';
      }
    };

    setEditingCell(null);

    // If multiple rows are drag-selected, apply to all; otherwise just this one
    const activeDragIds = dragSelectedRowIdsRef.current;
    const activeDragField = dragFieldRef.current;
    const targetIds = activeDragIds.size > 1 && activeDragField === 'pfSignStatus'
      ? [...activeDragIds]
      : [itemId];
    setDragSelectedRowIds(new Set());
    dragSelectedRowIdsRef.current = new Set();

    try {
      for (const id of targetIds) {
        if (id.startsWith('new-row-')) continue;
        const oldItem = itemsById.get(id);
        if (oldItem) {
          pushUndo({
            entityType: undoEntityType, entityId: id, parentId: project.projectId,
            previousValues: { pfSignStatus: oldItem.pfSignStatus ?? null },
            description: 'Changed PF Sign Status',
          });
        }
        updateItemInState(id, { pfSignStatus });
        try {
          await applyPatch(id, { pfSignStatus: mapPfSignStatusToEnum(pfSignStatus) }, 'pfSignStatus');
        } catch (patchError) {
          console.error('PF Sign Status update failed, rolling back:', patchError);
          const oldEnum = oldItem?.pfSignStatus;
          if (oldEnum) {
            const oldDisplay = mapSignStatusToFrontend(oldEnum);
            updateItemInState(id, { pfSignStatus: oldDisplay });
          }
        }
      }
    } catch (error) {
      console.error('PF Sign Status handler error:', error);
    } finally {
      setIsMutating(false);
    }
  };


  // 🎯 TYPE-LEVEL PO SIGN STATUS: Handler for updating entire type group
  const handlePoSignStatusSaveByType = async (itemId: string, poSignStatus: string) => {

    if (isMutating) return;
    setIsMutating(true);

    try {
      // Map display values to backend enum values
      const mapPoSignStatusToEnum = (displayValue: string): 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN' => {
        switch (displayValue) {
          case 'NOT SIGNED': return 'NOT_SIGNED';
          case 'READY TO SIGN': return 'READY_TO_SIGN';
          case 'SIGNED': return 'SIGNED';
          case 'WAITING TLINES TO SIGN': return 'WAITING_TLINES_TO_SIGN';
          case 'WAITING T TO SIGN': return 'WAITING_T_TO_SIGN';
          default: return 'NOT_SIGNED';
        }
      };

      const enumValue = mapPoSignStatusToEnum(poSignStatus);

      // Find the clicked item to get its type
      const clickedItem = itemsById.get(itemId);
      if (!clickedItem) {
        console.error('❌ CLICKED ITEM NOT FOUND', { itemId });
        return;
      }

      const clickedItemType = mapBackendTypeToFrontend(clickedItem.type, clickedItem.customType);

      // Find all items in the same type group
      const allItems = Array.from(itemsById.values());
      const typeItems = allItems.filter(item => {
        const itemType = mapBackendTypeToFrontend(item.type, item.customType);
        return itemType === clickedItemType;
      });


      // Push undo for each affected item
      typeItems.forEach(item => {
        pushUndo({ entityType: undoEntityType, entityId: item.id, parentId: project.projectId,
          previousValues: { poSignStatus: item.poSignStatus ?? null }, description: 'Changed PO Sign Status (type)' });
      });

      // Sequential on purpose: the backend issues/removes PF codes on PO status changes, and
      // parallel requests for the same project+type could pick the same next PF number.
      for (const item of typeItems) {
        await applyPatch(item.id, { poSignStatus: enumValue }, 'poSignStatus');
      }

    } catch (error) {
      console.error('❌ TYPE-LEVEL PO UPDATE ERROR', { itemId, error });
    } finally {
      setIsMutating(false);
    }

    setEditingCell(null);
  };

  // Handler for date fields (ETD/RTD/RTR/FTD) with backend persistence
  const handleDateSave = async (itemId: string, field: 'std' | 'etd' | 'rtd' | 'rtr' | 'ftd', dateValue: string, ___rowIndex?: number) => {
    // Guard against double-clicks
    if (isMutating) return;
    setIsMutating(true);

    try {
      if (itemId.startsWith('new-row-')) {
        // TODO: Handle new rows - temporarily disabled during state refactor
        setEditingCell(null);
        return;
      }

      // Push undo entry before mutation
      const oldItem = itemsById.get(itemId);
      if (oldItem) {
        pushUndo({
          entityType: undoEntityType,
          entityId: itemId,
          parentId: project.projectId,
          previousValues: { [field]: oldItem[field as keyof typeof oldItem] ?? null },
          description: `Changed ${field}`,
        });
      }

      const patchPayload = { [field]: dateValue || null };

      // 🎯 Use unified applyPatch function for immediate UI update
      await applyPatch(itemId, patchPayload, field);

    } catch (error) {
    } finally {
      setIsMutating(false);
    }

    // Close the editor AFTER state update
    setEditingCell(null);
  };

  // Handler for container number with backend persistence
  const handlePaymentRuleSave = async (itemId: string, paymentRule: string, ___rowIndex?: number) => {

    // Guard against double-clicks
    if (isMutating) {
      return;
    }

    setIsMutating(true);

    try {
      if (itemId.startsWith('new-row-')) {
        // TODO: Handle new rows - temporarily disabled during state refactor
        setEditingCell(null);
        return;
      } else {
        // Push undo entry before mutation
        const oldItem = itemsById.get(itemId);
        if (oldItem) {
          pushUndo({
            entityType: undoEntityType,
            entityId: itemId,
            parentId: project.projectId,
            previousValues: { paymentRule: oldItem.paymentRule ?? null },
            description: 'Changed payment rule',
          });
        }

        // Use applyPatch for full global sync (backend + local state + updateGlobalItem + onSupplierItemUpdated)
        await applyPatch(itemId, { paymentRule: paymentRule === '' ? null : paymentRule }, 'paymentRule');

      }
    } catch (error) {
    } finally {
      setIsMutating(false);
    }

    // Close the editor AFTER state update
    setEditingCell(null);
  };

  const handleContainerNoSave = async (itemId: string, containerNo: string, ___rowIndex?: number) => {
    if (isMutating) return;
    if (itemId.startsWith('new-row-')) { setEditingCell(null); return; }

    setEditingCell(null);

    // If multiple rows are drag-selected, apply to all; otherwise just this one
    const activeDragIds = dragSelectedRowIdsRef.current;
    const targetIds = activeDragIds.size > 1
      ? [...activeDragIds]
      : [itemId];
    setDragSelectedRowIds(new Set());
    dragSelectedRowIdsRef.current = new Set();

    // Fetch date once for the container number
    let previousDate: string | null = null;
    if (containerNo) {
      try { previousDate = await getLatestContainerDate(containerNo); } catch {}
    }

    for (const id of targetIds) {
      if (id.startsWith('new-row-')) continue;
      const oldItem = itemsById.get(id);
      if (oldItem) {
        pushUndo({ entityType: undoEntityType, entityId: id, parentId: project.projectId,
          previousValues: { containerNo: oldItem.containerNo ?? null }, description: 'Changed container' });
      }
      await applyPatch(id, { containerNo: containerNo || null }, 'containerNo');
      if (containerNo && previousDate) {
        try {
          await applyPatch(id, {
            containerDate: new Date(previousDate).toISOString()
          }, 'containerDate');
        } catch (err) {
          console.error('Container date sync failed:', err);
        }
      }
    }
  };

  // Handle container rename - update ALL items in this project that had the old name
  const handleContainerRename = useCallback((oldName: string, newName: string) => {
    setItemsById(prev => {
      const newMap = new Map(prev);
      newMap.forEach((item, id) => {
        if (item.containerNo && item.containerNo.toUpperCase() === oldName.toUpperCase()) {
          const updated = { ...item, containerNo: newName };
          newMap.set(id, updated);
          if (updateGlobalItem) updateGlobalItem(id, { containerNo: newName });
          if (onSupplierItemUpdated) onSupplierItemUpdated(updated as BackendProjectItem);
        }
      });
      return newMap;
    });
  }, [updateGlobalItem, onSupplierItemUpdated]);

  const handleContainerDateSave = async (itemId: string, containerDate: string, rowIndex?: number) => {
    // Guard against double-clicks
    if (isMutating) {
      return;
    }

    setIsMutating(true);

    try {
      // ✅ ITEM-LEVEL: Container date is now an item-level field
      // Check if this is a new row or existing item
      if (!itemId || itemId.startsWith('new-row-')) {
        // New item - use row creation logic
        if (rowIndex !== undefined) {
          const row = projectData.rows[rowIndex];
          if (!row) return;

          const newItemData = {
            type: row.type?.toUpperCase() as any,
            vendorId: row.vendorId || undefined,
            orderType: row.orderType || undefined,
            status: row.status || undefined,
            pfSignStatus: row.pfSignStatus || undefined,
            poSignStatus: row.poSignStatus || undefined,
            std: row.std || undefined,
            etd: row.etd || undefined,
            rtd: row.rtd || undefined,
            rtr: row.rtr || undefined,
            ftd: row.ftd || undefined,
            containerNo: row.containerNo || undefined,
            containerDate: containerDate ? new Date(containerDate + 'T00:00:00.000Z').toISOString() : undefined
          };

          await createItem(newItemData);
        }
      } else {
        // Push undo before mutation
        const oldItem = itemsById.get(itemId);
        if (oldItem) {
          pushUndo({ entityType: undoEntityType, entityId: itemId, parentId: project.projectId,
            previousValues: { containerDate: oldItem.containerDate ?? null }, description: 'Changed container date' });
        }

        // Use applyPatch for instant UI + global sync
        const isoDate = containerDate ? new Date(containerDate + 'T00:00:00.000Z').toISOString() : null;
        await applyPatch(itemId, { containerDate: isoDate }, 'containerDate');
      }


      // ✅ GLOBAL AUTO-ASSIGNMENT: If this is a single container number, apply to ALL matching containers across ALL projects
      await applyContainerDateToMatchingContainersGlobally(itemId, containerDate);
    } catch (error) {
      console.error('❌ Failed to update container date:', error);
      alert('Failed to update container date. Please try again.');
    } finally {
      setIsMutating(false);
    }

    // Close the editor
    setEditingCell(null);
  };

  // ✅ GLOBAL AUTO-ASSIGNMENT: Apply container date to ALL matching containers
  const applyContainerDateToMatchingContainersGlobally = async (sourceItemId: string, containerDate: string) => {
    try {
      const sourceItem = itemsById.get(sourceItemId);
      if (!sourceItem || !sourceItem.containerNo) return;

      const sourceContainerNo = sourceItem.containerNo.trim();
      if (!sourceContainerNo) return;

      const isoDate = containerDate ? new Date(containerDate + 'T00:00:00.000Z').toISOString() : null;
      const displayDate = containerDate || '';

      // 1. Immediately update ALL items in this project that share the same container (case-insensitive)
      const matchKey = sourceContainerNo.toLowerCase();
      itemsById.forEach((item, id) => {
        if (item.containerNo && item.containerNo.trim().toLowerCase() === matchKey) {
          updateItemInState(id, { containerDate: displayDate });
        }
      });

      // 2. Persist to backend for all projects via sync API
      const { syncContainerDate } = await import('../lib/containers');
      const syncResult = await syncContainerDate(sourceContainerNo, isoDate);

      // 3. Broadcast to other ProjectBlock instances (other projects on same page)
      const globalSyncEvent = new CustomEvent('globalContainerSync', {
        detail: { containerNo: sourceContainerNo, containerDate, affectedItems: syncResult?.details ?? [] }
      });
      window.dispatchEvent(globalSyncEvent);

    } catch (error) {
      console.error('❌ GLOBAL_CONTAINER_AUTO_ASSIGNMENT_ERROR:', error);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
  };

  // Handle vendor code/name edit - update ALL items using this vendor instantly
  const handleVendorEdited = useCallback((vendorId: string, newCode: string, newName: string) => {
    setItemsById(prev => {
      const newMap = new Map(prev);
      // Find old vendor code from first matching item
      let oldCode = '';
      for (const item of prev.values()) {
        if (item.vendorId === vendorId && item.vendor?.code) {
          oldCode = item.vendor.code;
          break;
        }
      }
      newMap.forEach((item, id) => {
        if (item.vendorId === vendorId) {
          // Update PF code: replace old vendor code prefix with new one
          let newPfCode = item.pfCode;
          if (oldCode && newCode && item.pfCode && item.pfCode.startsWith(`${oldCode}-`)) {
            newPfCode = `${newCode}-${item.pfCode.slice(oldCode.length + 1)}`;
          }
          const updated = {
            ...item,
            pfCode: newPfCode,
            vendor: { ...(item.vendor || {}), id: vendorId, code: newCode, name: newName },
          };
          newMap.set(id, updated as any);
          if (updateGlobalItem) updateGlobalItem(id, updated as any);
          if (onSupplierItemUpdated) onSupplierItemUpdated(updated as BackendProjectItem);
        }
      });
      return newMap;
    });
  }, [updateGlobalItem, onSupplierItemUpdated]);

  // Status note save/delete handler
  const handleStatusNoteSave = useCallback(async (itemId: string, noteText: string) => {
    const value = noteText.trim();
    const oldItem = itemsById.get(itemId);
    if (oldItem) {
      pushUndo({ entityType: undoEntityType, entityId: itemId, parentId: project.projectId,
        previousValues: { statusNote: oldItem.statusNote ?? '' }, description: value ? 'Changed note' : 'Deleted note' });
    }
    try {
      await applyPatch(itemId, { statusNote: value }, 'statusNote');
    } catch (err) {
      console.error('Failed to save status note:', err);
    }
    setNoteDialog(null);
    setNoteMenu(null);
  }, [applyPatch, itemsById, pushUndo, undoEntityType, project.projectId]);

  // Price note save/delete handler
  const handlePriceNoteSave = useCallback(async (itemId: string, field: string, noteText: string) => {
    const value = noteText.trim();
    const oldItem = itemsById.get(itemId);
    const currentNotes = (oldItem?.priceNotes as Record<string, string> | null) || {};
    const updatedNotes = value
      ? { ...currentNotes, [field]: value }
      : (() => { const n = { ...currentNotes }; delete n[field]; return n; })();
    try {
      await applyPatch(itemId, { priceNotes: updatedNotes }, 'priceNotes');
      setItemsById(prev => {
        const newMap = new Map(prev);
        const item = newMap.get(itemId);
        if (item) newMap.set(itemId, { ...item, priceNotes: Object.keys(updatedNotes).length > 0 ? updatedNotes : null });
        return newMap;
      });
    } catch (err) {
      console.error('Failed to save price note:', err);
    }
    setPriceNoteDialog(null);
    setPriceNoteMenu(null);
  }, [applyPatch, itemsById, project.projectId]);

  // Handler for vendor selection from CellVendorAutocomplete - FIXED: ID-based updates
  const handleVendorSave = async (itemId: string, vendorId: string) => {
    // Guard against double-clicks
    if (isMutating) return;
    setIsMutating(true);

    try {

      // Push undo entry before mutation
      const oldItemForVendor = itemsById.get(itemId);
      if (oldItemForVendor) {
        pushUndo({
          entityType: undoEntityType,
          entityId: itemId,
          parentId: project.projectId,
          previousValues: { vendorId: oldItemForVendor.vendorId ?? null },
          description: 'Changed vendor',
        });
      }

      // Use applyPatch for full global sync (updateGlobalItem + onSupplierItemUpdated)
      await applyPatch(itemId, { vendorId: vendorId || undefined }, 'vendorId');

    } catch (error) {
    } finally {
      setIsMutating(false);
    }

    // Close the editor AFTER state update
    setEditingCell(null);
  };

  // Handler for vendor selection on new rows (creates new backend item) - FIXED: Type mapping
  const handleNewRowVendorSave = async (__rowIndex: number, vendorId: string) => {

    // ADDED: isMutating guard to prevent double-clicks
    if (isMutating) {
      return;
    }

    const row = projectData.rows[__rowIndex];
    if (!row) {
      return;
    }

    setIsMutating(true);

    try {
      // 1. FIXED: Proper frontend-to-backend type mapping with validation
      const frontendToBackendTypeMap: Record<string, string> = {
        'Millwork': 'MILLWORK',
        'Shelving': 'SHELVING',
        'Ceiling': 'CEILING',
        'Image': 'IMAGE',
        'Furniture': 'FURNITURE',
        'Decoration': 'DECORATION'
      };

      const backendType = frontendToBackendTypeMap[row.type];
      if (!backendType) {
        return;
      }
      // 2. Create new backend item via API with correct type
      const newItemData = {
        type: backendType as any, // Type assertion since we validated above
        vendorId: vendorId || undefined,
        orderType: row.orderType || undefined,
        pfSignStatus: 'NOT_SIGNED' as const,
        poSignStatus: 'NOT_SIGNED' as const,
        status: 'NOT_ORDERED' as const,
        std: row.std || undefined,
        etd: row.etd || undefined,
        rtd: row.rtd || undefined,
        rtr: row.rtr || undefined,
        ftd: row.ftd || undefined,
        containerNo: row.containerNo || undefined
      };
      // 3. IMMEDIATE backend creation
      const createdItem = await createItem(newItemData);

      // 4. Update local state immediately (no full refresh to preserve scroll)
      if (createdItem) {
        setItemsById(prev => {
          const newMap = new Map(prev);
          newMap.set(createdItem.id, createdItem);
          return newMap;
        });
        if (updateGlobalItem) {
          updateGlobalItem(createdItem.id, createdItem);
        }
        // Surgically add the new row to project.rows so computedRows picks it up instantly
        if (onItemCreated) {
          onItemCreated(project.projectId, createdItem);
        }
      }

    } catch (error) {
    } finally {
      // ADDED: Always reset isMutating flag
      setIsMutating(false);
    }

    // 6. Close the editor
    setEditingCell(null);
  };

  // Handler for order type selection - INLINE AUTOCOMPLETE
  const handleOrderTypeSave = async (itemId: string, orderType: string, ___rowIndex?: number) => {
    if (isMutating) return;
    if (itemId.startsWith('new-row-')) { setEditingCell(null); return; }

    // Push undo before mutation
    const oldItem = itemsById.get(itemId);
    if (oldItem) {
      pushUndo({ entityType: undoEntityType, entityId: itemId, parentId: project.projectId,
        previousValues: { orderType: oldItem.orderType ?? null }, description: 'Changed order type' });
    }

    setEditingCell(null);
    await applyPatch(itemId, { orderType: orderType || null }, 'orderType');
  };

  // Handler for status selection - INLINE AUTOCOMPLETE WITH STD AUTO-SET
  const handleStatusSave = async (itemId: string, status: string, ___rowIndex?: number) => {

    // Guard against double-clicks
    if (isMutating) {
      return;
    }

    // Determine target IDs — bulk if multiple drag-selected in status field
    const activeDragIds = dragSelectedRowIdsRef.current;
    const activeDragField = dragFieldRef.current;
    const targetIds = activeDragIds.size > 1 && activeDragField === 'status'
      ? [...activeDragIds]
      : [itemId];
    setDragSelectedRowIds(new Set());
    dragSelectedRowIdsRef.current = new Set();
    setEditingCell(null);

    // BUSINESS RULE: Check if user is selecting READY on already-READY item with RTD (single only)
    if (targetIds.length === 1 && status === 'READY' && !itemId.startsWith('new-row-')) {
      const existingItem = itemsById.get(itemId);
      if (existingItem && existingItem.status === 'READY' && existingItem.rtd) {
        const rtdDate = new Date(existingItem.rtd).toLocaleDateString();
        const confirmMessage = `This item is already READY. RTD was previously set on ${rtdDate} and will not change unless you edit RTD manually.\n\nDo you want to proceed with updating the status?`;
        if (!confirm(confirmMessage)) {
          return;
        }
      }
    }

    setIsMutating(true);

    for (const id of targetIds) {
      if (id.startsWith('new-row-')) continue;

      const existingItemForUndo = itemsById.get(id);
      const previousStatus = existingItemForUndo?.status;

      // Push undo entry before mutation
      if (existingItemForUndo) {
        pushUndo({
          entityType: undoEntityType,
          entityId: id,
          parentId: project.projectId,
          previousValues: {
            status: previousStatus ?? null,
            std: existingItemForUndo.std ?? null,
            etd: existingItemForUndo.etd ?? null,
            rtr: existingItemForUndo.rtr ?? null,
            rtd: existingItemForUndo.rtd ?? null,
            rdy: existingItemForUndo.rdy ?? null,
            ftd: existingItemForUndo.ftd ?? null,
            snd: existingItemForUndo.snd ?? null,
          },
          description: `Changed status to ${status}`,
        });
      }

      // OPTIMISTIC UPDATE
      updateItemInState(id, { status });

      try {
        const updatedItem = await updateItem(id, { status: status || undefined });
        const statusPatch: any = {
          status,
          std: updatedItem.std !== undefined ? updatedItem.std : undefined,
          etd: updatedItem.etd !== undefined ? updatedItem.etd : undefined,
          rtr: isExpensesPMode
            ? (updatedItem.rtrd !== undefined ? updatedItem.rtrd : undefined)
            : (updatedItem.rtr !== undefined ? updatedItem.rtr : undefined),
          rtd: updatedItem.rtd !== undefined ? updatedItem.rtd : undefined,
          rdy: updatedItem.rdy !== undefined ? updatedItem.rdy : undefined,
          ftd: updatedItem.ftd !== undefined ? updatedItem.ftd : undefined,
          snd: updatedItem.snd !== undefined ? updatedItem.snd : undefined,
          pfSignStatus: updatedItem.pfSignStatus,
          poSignStatus: updatedItem.poSignStatus,
          pfCode: updatedItem.pfCode || undefined,
          containerNo: updatedItem.containerNo || undefined
        };
        Object.keys(statusPatch).forEach(key => {
          if (statusPatch[key] === undefined) delete statusPatch[key];
        });
        updateItemInState(id, statusPatch);
        if (updateGlobalItem) {
          updateGlobalItem(id, { ...statusPatch, status: statusPatch.status?.replace(/ /g, '_').toUpperCase() });
        }
        if (onSupplierItemUpdated && 'projectId' in updatedItem) {
          onSupplierItemUpdated(updatedItem as BackendProjectItem);
        }
      } catch (error) {
        if (existingItemForUndo?.status) {
          updateItemInState(id, { status: existingItemForUndo.status.replace(/_/g, ' ') });
        }
      }
    }

    setIsMutating(false);
  };

  const isEditing = (itemId: string, field: string) => {
    return editingCell?.itemId === itemId && editingCell?.field === field;
  };

  // Removed unused function: isTypeGroupEditing

  // Handler for PF USD updates with backend persistence
  const handlePfUsdSave = async (itemId: string, pfUsdValue: string, ___rowIndex?: number) => {
    if (itemId.startsWith('new-row-')) { setEditingCell(null); return; }
    const cleaned = pfUsdValue.replace(/,/g, '').trim();
    const numericValue = cleaned === '' ? null : parseFloat(cleaned);
    const finalValue = numericValue !== null && isNaN(numericValue) ? null : numericValue;
    // Push undo
    const oldItem = itemsById.get(itemId);
    if (oldItem) {
      pushUndo({ entityType: undoEntityType, entityId: itemId, parentId: project.projectId,
        previousValues: { pfUsd: oldItem.pfUsd ?? null }, description: 'Changed PF USD' });
    }
    setEditingCell(null);
    await applyPatch(itemId, { pfUsd: finalValue }, 'pfUsd');
  };

  // Handler for PF TL updates with backend persistence
  const handlePfTlSave = async (itemId: string, pfTlValue: string, ___rowIndex?: number) => {
    if (itemId.startsWith('new-row-')) { setEditingCell(null); return; }
    const cleaned = pfTlValue.replace(/,/g, '').trim();
    const numericValue = cleaned === '' ? null : parseFloat(cleaned);
    const finalValue = numericValue !== null && isNaN(numericValue) ? null : numericValue;
    // Push undo
    const oldItem = itemsById.get(itemId);
    if (oldItem) {
      pushUndo({ entityType: undoEntityType, entityId: itemId, parentId: project.projectId,
        previousValues: { pfTl: oldItem.pfTl ?? null }, description: 'Changed PF TL' });
    }
    setEditingCell(null);
    await applyPatch(itemId, { pfTl: finalValue }, 'pfTl');
  };

  const handleExpensesUsdSave = async (itemId: string, value: string, ___rowIndex?: number) => {
    if (itemId.startsWith('new-row-')) { setEditingCell(null); return; }
    const cleaned = value.replace(/,/g, '');
    const numericValue = parseFloat(cleaned) || 0;
    const oldItem = itemsById.get(itemId);
    if (oldItem) {
      pushUndo({ entityType: undoEntityType, entityId: itemId, parentId: project.projectId,
        previousValues: { expensesUsd: (oldItem as any).expensesUsd ?? null }, description: 'Changed Expenses USD' });
    }
    setEditingCell(null);
    await applyPatch(itemId, { expensesUsd: numericValue || null }, 'expensesUsd');
  };

  const handleExpensesTlSave = async (itemId: string, value: string, ___rowIndex?: number) => {
    if (itemId.startsWith('new-row-')) { setEditingCell(null); return; }
    const cleaned = value.replace(/,/g, '');
    const numericValue = parseFloat(cleaned) || 0;
    const oldItem = itemsById.get(itemId);
    if (oldItem) {
      pushUndo({ entityType: undoEntityType, entityId: itemId, parentId: project.projectId,
        previousValues: { expensesTl: (oldItem as any).expensesTl ?? null }, description: 'Changed Expenses TL' });
    }
    setEditingCell(null);
    await applyPatch(itemId, { expensesTl: numericValue || null }, 'expensesTl');
  };

  const renderEditor = (field: string, value: string, cellRef?: React.RefObject<HTMLDivElement>, __rowIndex?: number) => {
    const commonProps = {
      value,
      onSave: handleCellSave,
      onCancel: handleCellCancel
    };

    const statusProps = {
      ...commonProps,
      triggerRef: cellRef!
    };

    switch (field) {
      case 'vendor':
        // Use inline vendor autocomplete for vendor fields
        if (__rowIndex !== undefined && cellRef) {
          // 🚨 CRITICAL FIX: Use editingCell.itemId instead of rowToItemMap to prevent wrong item updates
          const mappedItemId = editingCell?.itemId;

          if (mappedItemId) {
            // Existing item - use correct item ID from editingCell (prevents wrong item selection)
            return (
              <CellVendorAutocomplete
                value={value}
                onSave={(vendorId) => handleVendorSave(mappedItemId, vendorId)}
                onCancel={handleCellCancel}
                onVendorEdited={handleVendorEdited}
                triggerRef={cellRef}
                itemId={mappedItemId}
                projectId={projectData.projectId}
              />
            );
          } else {
            // New row without backend item - use temporary ID and create new item
            const tempItemId = `new-row-${__rowIndex}`;
            return (
              <CellVendorAutocomplete
                value={value}
                onSave={(vendorId) => handleNewRowVendorSave(__rowIndex, vendorId)}
                onCancel={handleCellCancel}
                onVendorEdited={handleVendorEdited}
                triggerRef={cellRef}
                itemId={tempItemId}
                projectId={projectData.projectId}
              />
            );
          }
        }
        // Final fallback to VendorEditor
        return <VendorEditor {...commonProps} />;
      case 'orderType':
        // Use inline order type autocomplete for order type fields
        if (__rowIndex !== undefined && cellRef) {
          // 🚨 CRITICAL FIX: Use editingCell.itemId instead of rowToItemMap to prevent wrong item updates
          const itemIdForOrderType = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <CellOrderTypeAutocomplete
              value={value}
              onSave={(orderType) => handleOrderTypeSave(itemIdForOrderType, orderType, __rowIndex)}
              onCancel={handleCellCancel}
              triggerRef={cellRef}
              itemId={itemIdForOrderType}
              projectId={projectData.projectId}
            />
          );
        }
        return <OrderTypeEditor {...commonProps} />;
      case 'status':
        // Use inline status autocomplete for status fields
        if (__rowIndex !== undefined && cellRef) {
          // 🚨 CRITICAL FIX: Use editingCell.itemId instead of rowToItemMap to prevent wrong item updates
          const itemIdForStatus = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <CellStatusAutocomplete
              value={value}
              onSave={(status) => handleStatusSave(itemIdForStatus, status, __rowIndex)}
              onCancel={handleCellCancel}
              triggerRef={cellRef}
              itemId={itemIdForStatus}
              projectId={projectData.projectId}
            />
          );
        }
        return <StatusEditor {...statusProps} />;
      case 'pfSignStatus':
        // Use dedicated handler for PF sign status with backend persistence
        if (__rowIndex !== undefined && cellRef) {
          // 🚨 CRITICAL FIX: Use editingCell.itemId instead of rowToItemMap to prevent wrong item updates
          const itemIdForPfSign = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <PfSignStatusEditor
              value={value}
              onSave={(pfSignStatus) => handlePfSignStatusSave(itemIdForPfSign, pfSignStatus, __rowIndex)}
              onCancel={handleCellCancel}
              triggerRef={cellRef}
            />
          );
        }
        return <PfSignStatusEditor {...statusProps} />;
      case 'poSignStatus':
        // 🎯 TYPE-LEVEL: Use type-level handler for PO sign status updates
        if (__rowIndex !== undefined && cellRef) {
          const itemIdForPoSign = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <PoSignStatusEditor
              value={value}
              onSave={(poSignStatus) => handlePoSignStatusSaveByType(itemIdForPoSign, poSignStatus)}
              onCancel={handleCellCancel}
              triggerRef={cellRef}
            />
          );
        }
        return <PoSignStatusEditor {...statusProps} />;
      case 'std':
      case 'etd':
      case 'rtd':
      case 'rtr':
      case 'ftd':
        // Use dedicated handler for date fields with backend persistence
        if (__rowIndex !== undefined && cellRef) {
          // 🚨 CRITICAL FIX: Use editingCell.itemId instead of rowToItemMap to prevent wrong item updates
          const itemIdForDate = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <DateEditor
              value={value}
              onSave={(dateValue) => handleDateSave(itemIdForDate, field as 'std' | 'etd' | 'rtd' | 'ftd', dateValue, __rowIndex)}
              onCancel={handleCellCancel}
            />
          );
        }
        return <DateEditor {...commonProps} />;
      case 'paymentRule':
        // Use dedicated payment rule editor for backend persistence
        if (__rowIndex !== undefined && cellRef) {
          // 🚨 CRITICAL FIX: Use editingCell.itemId instead of rowToItemMap to prevent wrong item updates
          const itemIdForPaymentRule = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <PaymentRuleEditor
              value={value}
              onSave={(paymentRule) => handlePaymentRuleSave(itemIdForPaymentRule, paymentRule, __rowIndex)}
              onCancel={handleCellCancel}
              triggerRef={cellRef}
              paymentRules={paymentRules}
              onRulesUpdated={(rules) => rules.forEach(addPaymentRule)}
            />
          );
        }
        return (
          <PaymentRuleEditor
            {...statusProps}
            paymentRules={paymentRules}
            onRulesUpdated={(rules) => rules.forEach(addPaymentRule)}
          />
        );
      case 'containerNo':
        // Use dedicated container cell editor with dropdown + rename functionality
        if (__rowIndex !== undefined && cellRef) {
          const itemIdForContainer = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <ContainerCellEditor
              value={value}
              onSave={(containerNo) => handleContainerNoSave(itemIdForContainer, containerNo, __rowIndex)}
              onCancel={handleCellCancel}
              onRename={handleContainerRename}
              triggerRef={cellRef}
            />
          );
        }
        return (
          <ContainerCellEditor
            value={value}
            onSave={(containerNo) => handleContainerNoSave('', containerNo)}
            onCancel={handleCellCancel}
            onRename={handleContainerRename}
          />
        );
      case 'containerDate':
        // ✅ ITEM-LEVEL: Container date is now an item-level field
        if (__rowIndex !== undefined && cellRef) {
          // Use editingCell.itemId for existing items, or new-row-X for new items
          const itemIdForContainerDate = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <DateEditor
              value={value}
              onSave={(dateValue) => handleContainerDateSave(itemIdForContainerDate, dateValue, __rowIndex)}
              onCancel={handleCellCancel}
            />
          );
        }
        return (
          <DateEditor
            value={value}
            onSave={(dateValue) => handleContainerDateSave('', dateValue)}
            onCancel={handleCellCancel}
          />
        );
      case 'pfCode':
        // Simple text input for manually editing PF code (custom types only)
        return (
          <input
            type="text"
            defaultValue={value}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'white',
              padding: '4px',
              fontFamily: 'monospace'
            }}
            autoFocus
            onBlur={(e) => handleCellSave(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellSave(e.currentTarget.value);
              } else if (e.key === 'Escape') {
                handleCellCancel();
              }
            }}
          />
        );
      case 'pfUsd':
        // Use numeric editor for PF USD field with currency formatting
        if (__rowIndex !== undefined && cellRef) {
          // 🚨 CRITICAL FIX: Use editingCell.itemId instead of rowToItemMap to prevent wrong item updates
          const itemIdForPfUsd = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={value}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'white',
                padding: '4px',
                fontFamily: 'monospace',
                textAlign: 'right'
              }}
              autoFocus
              onBlur={(e) => handlePfUsdSave(itemIdForPfUsd, e.target.value, __rowIndex)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePfUsdSave(itemIdForPfUsd, e.currentTarget.value, __rowIndex);
                } else if (e.key === 'Escape') {
                  handleCellCancel();
                }
              }}
            />
          );
        }
        return <TextEditor {...commonProps} />;
      case 'pfTl':
        // Use numeric editor for PF TL field with currency formatting
        if (__rowIndex !== undefined && cellRef) {
          // 🚨 CRITICAL FIX: Use editingCell.itemId instead of rowToItemMap to prevent wrong item updates
          const itemIdForPfTl = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={value}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'white',
                padding: '4px',
                fontFamily: 'monospace',
                textAlign: 'right'
              }}
              autoFocus
              onBlur={(e) => handlePfTlSave(itemIdForPfTl, e.target.value, __rowIndex)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePfTlSave(itemIdForPfTl, e.currentTarget.value, __rowIndex);
                } else if (e.key === 'Escape') {
                  handleCellCancel();
                }
              }}
            />
          );
        }
        return <TextEditor {...commonProps} />;
      case 'expensesUsd':
        if (__rowIndex !== undefined && cellRef) {
          const itemIdForExpUsd = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={value}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'white',
                padding: '4px',
                fontFamily: 'monospace',
                textAlign: 'right'
              }}
              autoFocus
              onBlur={(e) => handleExpensesUsdSave(itemIdForExpUsd, e.target.value, __rowIndex)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleExpensesUsdSave(itemIdForExpUsd, e.currentTarget.value, __rowIndex);
                } else if (e.key === 'Escape') {
                  handleCellCancel();
                }
              }}
            />
          );
        }
        return <TextEditor {...commonProps} />;
      case 'expensesTl':
        if (__rowIndex !== undefined && cellRef) {
          const itemIdForExpTl = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={value}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'white',
                padding: '4px',
                fontFamily: 'monospace',
                textAlign: 'right'
              }}
              autoFocus
              onBlur={(e) => handleExpensesTlSave(itemIdForExpTl, e.target.value, __rowIndex)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleExpensesTlSave(itemIdForExpTl, e.currentTarget.value, __rowIndex);
                } else if (e.key === 'Escape') {
                  handleCellCancel();
                }
              }}
            />
          );
        }
        return <TextEditor {...commonProps} />;
      default:
        return <TextEditor {...commonProps} />;
    }
  };

  const getSignStatusStyle = (value: string | undefined | null): { backgroundColor: string; color: string } => {
    if (!value) return { backgroundColor: 'white', color: 'black' };
    if (value === 'SIGNED') return { backgroundColor: '#92d050', color: 'black' };
    if (value === 'WAITING TLINES TO SIGN') return { backgroundColor: '#fb923c', color: 'black' };
    if (value === 'WAITING T TO SIGN') return { backgroundColor: '#a78bfa', color: 'black' };
    if (value === 'SIGNED WITH EST PRICE') return { backgroundColor: '#4ade80', color: 'black' };
    if (value === 'READY TO SIGN') return { backgroundColor: '#ffff00', color: 'black' };
    if (value === 'NOT SIGNED') return { backgroundColor: '#ff0000', color: 'black' };
    return { backgroundColor: 'white', color: 'black' };
  };

  const getStatusClass = (status: string | undefined | null) => {
    if (!status) return '';

    if (status === 'SIGNED') return 'status-approved';
    if (status === 'READY TO SIGN') return 'status-pending';
    if (status === 'NOT SIGNED') return 'status-review';
    if (status.includes('SENT')) return 'status-approved';
    if (status.includes('READY')) return 'status-approved';
    if (status.includes('HOLD')) return 'status-review';
    if (status.includes('ORDERED') || status.includes('ASSEMBLY')) return 'status-in-progress';
    return '';
  };

  // Calculate total height for project number spanning
  const dataRowsHeight = projectData.rows.length * ROW_HEIGHT;
  const minProjectHeight = ROW_HEIGHT; // Minimum height even with no line items
  // TOTAL row is now part of normal layout, so include it in the calculation
  const totalProjectHeight = Math.max(dataRowsHeight + TOTAL_ROW_HEIGHT, minProjectHeight);

  let globalRowIndex = 0;

  return (
    <>
    {/* Grid-width constrained wrapper for both section header and project header */}
    <div style={{ 
      width: gridWidthPx,
      minWidth: gridWidthPx,
      maxWidth: gridWidthPx
    }}>
      {/* Section Header - Only render for first project in section */}
      {showSectionHeader && <SectionSeparator title={sectionLabel} />}
      
      {/* Project Header */}
      <ProjectHeader
        ref={projectHeaderRef}
        project={projectData}
        onClick={handleProjectHeaderClick}
        onContextMenu={handleProjectHeaderRightClick}
      />
    </div>

    <div className="project-block">
      <div className="board-content">
        <div className="project-scroll">
          <div className="board">
            {/* Fixed Left Section - Sticky */}
            <div className="fixed-left">
              {/* Fixed Header */}
              <div className="header-fixed">
                <div
                  className="column-header-cell col-project-no"
                  style={getHeaderCellStyle('projectNo' as ColumnKey)}
                >
                  PROJECT NO
                </div>
                <div
                  className="column-header-cell col-type"
                  style={getHeaderCellStyle('type' as ColumnKey)}
                >
                  TYPE
                </div>
              </div>

              {/* Fixed Body Rows */}
              <div className="rows-fixed">
                {/* Project Number Column */}
                <div
                  className={`projectno-cell project-number-${currentProjectColor}`}
                  onClick={handleProjectHeaderClick}
                  onContextMenu={handleProjectHeaderRightClick}
                  data-debug={`color-${currentProjectColor}-urgent-${isUrgent}-items-${itemsById.size}`}
                  style={{
                    position: 'relative',
                    height: `${totalProjectHeight}px`,
                    backgroundColor: currentProjectColor === 'orange' ? '#DE8244' :
                                   currentProjectColor === 'blue' ? '#6A99D1' :
                                   currentProjectColor === 'red' ? '#E53E3E' : '#9FCF63',
                    display: isColumnVisible('projectNo') ? 'flex' : 'none',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {selectable && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onToggleSelect?.(project.projectId)}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                        zIndex: 2,
                      }}
                    />
                  )}
                  <span className="projectno-text" style={{
                    fontSize: mode === 'missingExtra' ? '14px' : '18px', // Smaller for derived codes
                    fontWeight: '800',
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    {mode === 'missingExtra' && (project as any).derivedProjectCode
                      ? (project as any).derivedProjectCode
                      : displayProjectNo(projectData.projectNumber)}
                    {(() => {
                      const marker = parseDuplicateMarker(projectData.projectNumber);
                      if (marker.kind !== 'old') return null;
                      return (
                        <span
                          title={marker.timestamp
                            ? `Renamed on ${new Date(marker.timestamp).toLocaleString()} when this code was recreated`
                            : 'Kept as old duplicate'}
                          style={{
                            background: 'rgba(0,0,0,0.55)',
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            padding: '2px 6px',
                            borderRadius: '999px',
                            textShadow: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          OLD DUPLICATE
                        </span>
                      );
                    })()}
                  </span>
                </div>

                {/* Type Stack */}
                <div
                  className="type-stack"
                  style={{ display: isColumnVisible('type') ? 'block' : 'none' }}
                >
                  <div className="row-container">
                    {typeGroups.map((typeGroup) => {
                      const typeRowCount = typeGroup.rows.length;
                      // const typeGroupHeight = typeRowCount * ROW_HEIGHT; // Unused variable removed
                      globalRowIndex += typeRowCount;

                      const isTypeGroupRestricted = typeGroup.rows.length > 0 && typeGroup.rows[0].isRestricted;

                      // Turn type cell green when ALL rows in this type are SENT_TO_TLINES or SENT
                      const isAllSentToTlines = typeGroup.rows.length > 0 && typeGroup.rows.every(row => {
                        const s = ((row.status as string) || '').toUpperCase().replace(/[\s-]/g, '_');
                        return s === 'SENT_TO_TLINES' || s === 'SENT';
                      });

                      return (
                        <div key={typeGroup.type} className="type-group-container" style={{ position: 'relative' }}>
                          {/* Type Label - spans the exact height of the group */}
                          <div
                            ref={typeClickRef}
                            className={`type-cell spanning ${isTypeGroupRestricted ? '' : 'clickable'} ${isAllSentToTlines ? 'sent-to-tlines-complete' : ''}`}
                            style={{
                              height: `${typeRowCount * ROW_HEIGHT}px`,
                              position: 'absolute',
                              width: '140px',
                              zIndex: 1,
                              top: 0,
                              left: 0,
                              ...(isTypeGroupRestricted ? { filter: 'blur(4px)', opacity: 0.45, pointerEvents: 'none' } : {}),
                              ...(isAllSentToTlines ? {
                                backgroundColor: '#15803d',
                                color: 'white',
                                fontWeight: '700',
                                borderLeft: '3px solid #052e16',
                              } : {})
                            }}
                            onClick={(e) => !isTypeGroupRestricted && handleTypeClick(typeGroup, e)}
                          >
                            {groupBadgesByType.get(typeGroup.type) && (
                              <div style={{
                                position: 'absolute', top: '4px', left: '4px',
                                display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 2,
                              }}>
                                {groupBadgesByType.get(typeGroup.type)!.map((b, i) => (
                                  <span
                                    key={`${b.number}-${b.rank}-${i}`}
                                    title={`Group ${b.number}, rank ${b.rank}`}
                                    style={{
                                      fontSize: '11px', fontWeight: 800, lineHeight: 1,
                                      background: '#b91c1c', color: '#fff',
                                      borderRadius: '5px', padding: '2px 5px', textShadow: 'none',
                                      whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                                    }}
                                  >
                                    {b.rank}
                                  </span>
                                ))}
                              </div>
                            )}
                            {typeGroup.type}
                          </div>

                          {/* Placeholder rows for proper spacing */}
                          {typeGroup.rows.map((_, index) => (
                            <div key={index} className="row-item" style={{ background: 'transparent' }} />
                          ))}
                        </div>
                      );
                    })}

                    {/* TOTAL Row - Fixed Left Part (TYPE column - empty) */}
                    <div className="row-item total-row">
                      <div className="type-cell spanning" style={{
                        height: `${TOTAL_ROW_HEIGHT}px`,
                        backgroundColor: '#404040',
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        borderRight: '1px solid #555'
                      }}>
                        {/* Empty - TOTAL label will be in FTD column */}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Scroll Right Section */}
            <div className="scroll-right">
              {/* Accounting Section Header Bar + Group Headers */}
              {enableAccountingColumns && false && (
                <>
                  <div style={{ display: 'flex', width: '100%' }}>
                    {/* Empty space for regular columns */}
                    <div style={{ 
                      flex: '1', 
                      minWidth: '1500px',
                      height: '40px'
                    }}></div>
                    
                    {/* Gold Accounting Section Header */}
                    <div className="accounting-section-header-row" style={{
                      width: '1116px',
                      flexShrink: 0
                    }}>
                      ACCOUNTING {sectionLabel.replace('TLines ', '').toUpperCase()}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', width: '100%' }}>
                    {/* Empty space for regular columns */}
                    <div style={{ 
                      flex: '1', 
                      minWidth: '1500px',
                      height: '28px'
                    }}></div>
                    
                    {/* Group headers for accounting columns */}
                    <div className="accounting-group-headers" style={{
                      width: '1116px',
                      flexShrink: 0
                    }}>
                      <div className="col-accounting-spacer"></div>
                      <div className="accounting-group-header accounting-group-header-paid-usd">
                        PAID USD
                        <div style={{ fontSize: '9px', marginLeft: '4px' }}>(1st / 2nd)</div>
                      </div>
                      <div className="col-accounting-gap-paid"></div>
                      <div className="accounting-group-header accounting-group-header-paid-tl">
                        PAID TL
                        <div style={{ fontSize: '9px', marginLeft: '4px' }}>(1st / 2nd)</div>
                      </div>
                      <div className="col-accounting-gap-group"></div>
                      <div className="accounting-group-header accounting-group-header-remaining">REMAINING</div>
                      <div className="col-accounting-gap-group"></div>
                      <div className="accounting-group-header accounting-group-header-not-ordered">NOT ORDERED</div>
                    </div>
                  </div>
                </>
              )}

              {/* Right Header */}
              <div className="header-right">
                <div className="column-header-cell col-pf-code" style={getHeaderCellStyle('pfCode' as ColumnKey)}>PF CODE</div>
                <div className="column-header-cell col-vendor" style={getHeaderCellStyle('vendor' as ColumnKey)}>VENDOR</div>
                <div className="column-header-cell col-order-type" style={getHeaderCellStyle('orderType' as ColumnKey)}>ORDER TYPE</div>
                {!isSupplierMode && (
                  <div className="column-header-cell col-po-sign-status" style={getHeaderCellStyle('poSignStatus' as ColumnKey)}>PO SIGN STATUS</div>
                )}
                <div className="column-header-cell col-pf-sign-status" style={getHeaderCellStyle('pfSignStatus' as ColumnKey)}>PF SIGN STATUS</div>
                <div className="column-header-cell col-status" style={getHeaderCellStyle('status' as ColumnKey)}>STATUS</div>
                <div className="column-header-cell col-std" style={getHeaderCellStyle('std' as ColumnKey)}>STD</div>
                <div className="column-header-cell col-etd" style={getHeaderCellStyle('etd' as ColumnKey)}>ETD</div>
                <div className="column-header-cell col-rtr" style={getHeaderCellStyle('rtr' as ColumnKey)}>RTR</div>
                <div className="column-header-cell col-rtd" style={getHeaderCellStyle('rtd' as ColumnKey)}>RTD</div>
                <div className="column-header-cell col-rdy" style={getHeaderCellStyle('rdy' as ColumnKey)}>RDY</div>
                <div className="column-header-cell col-ftd" style={getHeaderCellStyle('ftd' as ColumnKey)}>FTD</div>
                <div className="column-header-cell col-snd" style={getHeaderCellStyle('snd' as ColumnKey)}>SND</div>
                <div className="column-header-cell col-pf-usd" style={getHeaderCellStyle('pfUsd' as ColumnKey)}>PF / USD</div>
                <div className="column-header-cell col-pf-tl" style={getHeaderCellStyle('pfTl' as ColumnKey)}>PF / TL</div>
                <div className="column-header-cell col-invoice" style={getHeaderCellStyle('invoice' as ColumnKey)}>INV / USD</div>
                <div className="column-header-cell col-invoice-tl" style={getHeaderCellStyle('invoiceTl' as ColumnKey)}>INV / TL</div>
                <div className="column-header-cell col-expenses-usd" style={getHeaderCellStyle('expensesUsd' as ColumnKey)}>EXPENSES / USD</div>
                <div className="column-header-cell col-expenses-tl" style={getHeaderCellStyle('expensesTl' as ColumnKey)}>EXPENSES / TL</div>
                <div className="column-header-cell col-payment-rule" style={getHeaderCellStyle('paymentRule' as ColumnKey)}>PAYMENT RULE</div>
                <div className="column-header-cell col-container-no" style={getHeaderCellStyle('containerNo' as ColumnKey)}>CONTAINER NO</div>
                <div className="column-header-cell col-container-date" style={getHeaderCellStyle('containerDate' as ColumnKey)}>CONTAINER DATE</div>

                {/* Accounting Column Headers (Supplier Mode Only) - Black background with white text */}
                {enableAccountingColumns && (
                  <>
                    <div className="col-accounting-spacer"></div>
                    <div className="column-header-cell col-accounting-paid-usd-1 accounting-column-header">1st</div>
                    <div className="column-header-cell col-accounting-paid-usd-2 accounting-column-header">2nd</div>
                    <div className="col-accounting-gap-paid"></div>
                    <div className="column-header-cell col-accounting-paid-tl-1 accounting-column-header">1st</div>
                    <div className="column-header-cell col-accounting-paid-tl-2 accounting-column-header">2nd</div>
                    <div className="col-accounting-gap-group"></div>
                    <div className="column-header-cell col-accounting-remaining-usd accounting-column-header">USD</div>
                    <div className="column-header-cell col-accounting-remaining-tl accounting-column-header">TL</div>
                    <div className="col-accounting-gap-group"></div>
                    <div className="column-header-cell col-accounting-not-ordered-usd accounting-column-header">USD</div>
                    <div className="column-header-cell col-accounting-not-ordered-tl accounting-column-header">TL</div>
                  </>
                )}
              </div>

              {/* Right Body Rows */}
              <div className="rows-right">
                <div className="row-container">
                  {(() => {
                    globalRowIndex = 0; // Reset for scrollable section
                    return typeGroups.map((typeGroup) => {
                      const startRowIndex = globalRowIndex;
                      const typeRowCount = typeGroup.rows.length;
                      // const typeGroupHeight = typeRowCount * ROW_HEIGHT; // Unused variable removed
                      globalRowIndex += typeRowCount;

                      // Compute PO sign status for this type group
                      const typePoSignStatusForBg = (() => {
                        const typeItemIds = typeGroup.rows.map(r => r.itemId).filter((id): id is string => id != null);
                        const typeItems = typeItemIds.map(id => itemsById.get(id)).filter((item): item is NonNullable<typeof item> => item != null);
                        if (typeItems.length === 0) return '';
                        if (typeItems.every(item => item.poSignStatus === null || item.poSignStatus === undefined)) return '';
                        if (typeItems.every(item => item.poSignStatus === 'SIGNED')) return 'SIGNED';
                        if (typeItems.some(item => item.poSignStatus === 'WAITING_TLINES_TO_SIGN')) return 'WAITING TLINES TO SIGN';
                        if (typeItems.some(item => item.poSignStatus === 'WAITING_T_TO_SIGN')) return 'WAITING T TO SIGN';
                        if (typeItems.some(item => item.poSignStatus === 'READY_TO_SIGN')) return 'READY TO SIGN';
                        return 'NOT SIGNED';
                      })();

                      const isTypeGroupRestricted = typeGroup.rows.length > 0 && typeGroup.rows[0].isRestricted;

                      return (
                        <div key={`${typeGroup.type}-scrollable`} className="type-group-container" style={{ position: 'relative' }}>
                          {/* PO SIGN STATUS - Type level spanning cell */}
                          {!isSupplierMode && isColumnVisible('poSignStatus') && (
                            <div
                              className={`type-cell spanning ${isTypeGroupRestricted ? '' : 'clickable'}`}
                              style={{
                                height: `${typeRowCount * ROW_HEIGHT}px`,
                                position: 'absolute',
                                width: '140px', // PO SIGN STATUS column width
                                zIndex: 100,
                                top: 0,
                                left: `${(['pfCode', 'vendor', 'orderType'] as const).reduce((sum, key) => sum + (isColumnVisible(key) ? COLUMN_WIDTHS[key] : 0), 0)}px`,
                                backgroundColor: getSignStatusStyle(typePoSignStatusForBg).backgroundColor,
                                border: '1px solid #e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: '8px',
                                cursor: isTypeGroupRestricted ? 'default' : 'pointer',
                                pointerEvents: isTypeGroupRestricted ? 'none' : 'auto',
                                ...(isTypeGroupRestricted ? { filter: 'blur(4px)', opacity: 0.45 } : {})
                              }}
                              onClick={(e) => {
                                if (isTypeGroupRestricted) return;
                                e.preventDefault();
                                e.stopPropagation();

                                const firstRowId = typeGroup.rows[0]?.itemId || '';


                                if (firstRowId) {
                                  setEditingCell({
                                    projectId: project.projectId,
                                    itemId: firstRowId,
                                    field: 'poSignStatus'
                                  });
                                }
                              }}
                            >
                              {(() => {
                                // 🚀 CRITICAL FIX: Calculate PO status from actual updated items, not stale project metadata
                                const typeItemIds = typeGroup.rows
                                  .map(row => row.itemId)
                                  .filter((id): id is string => id != null);
                                const typeItems = typeItemIds
                                  .map(id => itemsById.get(id))
                                  .filter((item): item is NonNullable<typeof item> => item != null);

                                // Calculate the actual PO status based on current item states
                                let typePoSignStatus = '';
                                if (typeItems.length > 0) {
                                  const allNull = typeItems.every(item => item.poSignStatus === null || item.poSignStatus === undefined);
                                  const allSigned = typeItems.every(item => item.poSignStatus === 'SIGNED');
                                  const allReady = typeItems.every(item => item.poSignStatus === 'READY_TO_SIGN');
                                  const hasAnyReady = typeItems.some(item => item.poSignStatus === 'READY_TO_SIGN');

                                  if (allNull) {
                                    typePoSignStatus = '';
                                  } else if (allSigned) {
                                    typePoSignStatus = 'SIGNED';
                                  } else if (typeItems.some(item => item.poSignStatus === 'WAITING_TLINES_TO_SIGN')) {
                                    typePoSignStatus = 'WAITING TLINES TO SIGN';
                                  } else if (typeItems.some(item => item.poSignStatus === 'WAITING_T_TO_SIGN')) {
                                    typePoSignStatus = 'WAITING T TO SIGN';
                                  } else if (allReady || hasAnyReady) {
                                    typePoSignStatus = 'READY TO SIGN';
                                  } else {
                                    typePoSignStatus = 'NOT SIGNED';
                                  }
                                }
                                const firstRowId = typeGroup.rows[0]?.itemId || '';

                                // DEBUG: Force show editor when editing
                                const isEditing = editingCell?.field === 'poSignStatus' && editingCell?.itemId === firstRowId;

                                if (isEditing) {
                                }

                                return isEditing ? (
                                  <div style={{ position: 'relative', width: '100%' }}>
                                    <PoSignStatusEditor
                                      value={typePoSignStatus}
                                      triggerRef={poSignStatusEditorRef}
                                      onSave={(poSignStatus) => handlePoSignStatusSaveByType(firstRowId, poSignStatus)}
                                      onCancel={() => setEditingCell(null)}
                                    />
                                  </div>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      color: 'black'
                                    }}
                                  >
                                    {typePoSignStatus}
                                  </span>
                                );
                              })()}
                            </div>
                          )}

                          {/* Individual rows */}
                          {typeGroup.rows.map((row, __rowIndex) => {
                            const actualRowIndex = startRowIndex + __rowIndex;
                            // const isFirstRowInType = __rowIndex === 0; // Unused variable

                            const scrollableFields = [
                              { field: 'pfCode', value: row.pfCode, className: 'col-pf-code', editable: !!row.customTypeId && isColumnEditable('pfCode') },
                              { field: 'vendor', value: row.vendor, className: 'col-vendor', editable: isColumnEditable('vendor') },
                              { field: 'orderType', value: row.orderType, className: 'col-order-type', editable: isColumnEditable('orderType') },
                              // PO SIGN STATUS - show only on first row of type group
                              ...(isSupplierMode ? [] : [{
                                field: 'poSignStatus',
                                value: __rowIndex === 0 ? (project.poSignStatusByType[typeGroup.type] || '') : '',
                                className: 'col-po-sign-status',
                                editable: __rowIndex === 0 && isColumnEditable('poSignStatus'),
                                isFirstInTypeGroup: __rowIndex === 0,
                                typeRowCount: typeGroup.rows.length
                              }]),
                              { field: 'pfSignStatus', value: row.pfSignStatus, className: 'col-pf-sign-status', editable: isColumnEditable('pfSignStatus') },
                              { field: 'status', value: row.status, className: 'col-status', editable: isColumnEditable('status') },
                              { field: 'std', value: formatDateCell(row.std), className: 'col-std', editable: isColumnEditable('std') },
                              { field: 'etd', value: formatDateCell(row.etd), className: 'col-etd', editable: isColumnEditable('etd') },
                              { field: 'rtr', value: formatDateCell(row.rtr), className: 'col-rtr', editable: isColumnEditable('rtr') },
                              { field: 'rtd', value: formatDateCell(row.rtd), className: 'col-rtd', editable: isColumnEditable('rtd') },
                              { field: 'rdy', value: formatDateCell(row.rdy), className: 'col-rdy', editable: false },
                              { field: 'ftd', value: formatDateCell(row.ftd), className: 'col-ftd', editable: isColumnEditable('ftd') },
                              { field: 'snd', value: formatDateCell(row.snd), className: 'col-snd', editable: false },
                              { field: 'pfUsd', value: row.pfUsd, className: 'col-pf-usd', editable: isColumnEditable('pfUsd') },
                              { field: 'pfTl', value: row.pfTl, className: 'col-pf-tl', editable: isColumnEditable('pfTl') },
                              { field: 'invoice', value: row.invoice || '', className: 'col-invoice', editable: isColumnEditable('invoice') },
                              { field: 'invoiceTl', value: (row as any).invoiceTl || '', className: 'col-invoice-tl', editable: isColumnEditable('invoiceTl') },
                              { field: 'expensesUsd', value: row.expensesUsd || '', className: 'col-expenses-usd', editable: isColumnEditable('expensesUsd') },
                              { field: 'expensesTl', value: row.expensesTl || '', className: 'col-expenses-tl', editable: isColumnEditable('expensesTl') },
                              { field: 'paymentRule', value: row.paymentRule, className: 'col-payment-rule', editable: isColumnEditable('paymentRule') },
                              { field: 'containerNo', value: row.containerNo, className: 'col-container-no', editable: isColumnEditable('containerNo') },
                              { field: 'containerDate', value: row.containerDate, className: 'col-container-date', editable: isColumnEditable('containerDate') }
                            ];

                            // Override editable to false for restricted rows
                            if (row.isRestricted) {
                              scrollableFields.forEach(f => { f.editable = false; });
                            }

                            return (
                              <div
                                key={row.itemId || `${typeGroup.type}-${__rowIndex}`}
                                className={`row-item ${highlightedItemId === row.itemId ? 'dashboard-item-highlighted' : ''} ${row.isRestricted ? 'restricted-row' : ''}`}
                                data-item-id={row.itemId}
                                onContextMenu={(e) => !row.isRestricted && row.itemId && handleRowContextMenu(e, row.itemId, row.type || typeGroup.type)}
                                style={row.isRestricted ? { filter: 'blur(4px)', opacity: 0.45, pointerEvents: 'none', userSelect: 'none' } : undefined}
                              >
                                {scrollableFields.filter(cellData => isColumnVisible(cellData.field as ColumnKey)).map((cellData, cellIndex) => {
                                  // Regular cells
                                  const cellKey = `${actualRowIndex}-${cellData.field}`;
                                  const cellRef = getCellRef(cellKey);

                                  // Special handling for PO SIGN STATUS - spanning cell for first row
                                  if (cellData.field === 'poSignStatus') {
                                    if (cellData.isFirstInTypeGroup) {
                                      const isEditingPoStatus = editingCell?.field === 'poSignStatus' && editingCell?.itemId === (row.itemId || '');

                                      return (
                                        <div
                                          key={cellIndex}
                                          ref={cellRef}
                                          className={`row-cell ${cellData.className}`}
                                          style={{
                                            height: `${cellData.typeRowCount * ROW_HEIGHT}px`,
                                            backgroundColor: getSignStatusStyle(cellData.value).backgroundColor,
                                            border: '1px solid #e5e7eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-start',
                                            paddingLeft: '8px',
                                            cursor: 'pointer',
                                            position: 'relative'
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (row.itemId && isColumnEditable('poSignStatus')) {
                                              setEditingCell({
                                                projectId: project.projectId,
                                                itemId: row.itemId,
                                                field: 'poSignStatus'
                                              });
                                            }
                                          }}
                                        >
                                          {isEditingPoStatus ? (
                                            <PoSignStatusEditor
                                              value={cellData.value}
                                              triggerRef={cellRef}
                                              onSave={(poSignStatus) => {
                                                return handlePoSignStatusSaveByType(row.itemId || '', poSignStatus);
                                              }}
                                              onCancel={handleCellCancel}
                                            />
                                          ) : (
                                            <span
                                              style={{
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: 'black'
                                              }}
                                            >
                                              {cellData.value}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    } else {
                                      // Empty cell for other rows in type group
                                      return (
                                        <div
                                          key={cellIndex}
                                          className={`row-cell ${cellData.className}`}
                                          style={{ visibility: 'hidden' }}
                                        />
                                      );
                                    }
                                  }

                                  const cellContent = isEditing(row.itemId || '', cellData.field) && cellData.editable ? (
                                    renderEditor(cellData.field, cellData.value, cellRef, actualRowIndex)
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                      {/* Currency icons for PF USD/TL fields */}
                                      {(cellData.field === 'pfUsd' || cellData.field === 'expensesUsd') && (
                                        <span style={{
                                          color: '#6b7280',
                                          fontSize: '14px',
                                          marginRight: '4px',
                                          fontWeight: '500'
                                        }}>
                                          $
                                        </span>
                                      )}
                                      {(cellData.field === 'pfTl' || cellData.field === 'expensesTl') && (
                                        <span style={{
                                          color: '#6b7280',
                                          fontSize: '14px',
                                          marginRight: '4px',
                                          fontWeight: '500'
                                        }}>
                                          ₺
                                        </span>
                                      )}
                                      {cellData.field === 'invoice' && (
                                        <span style={{
                                          color: '#6b7280',
                                          fontSize: '14px',
                                          marginRight: '4px',
                                          fontWeight: '500'
                                        }}>
                                          $
                                        </span>
                                      )}
                                      {cellData.field === 'invoiceTl' && (
                                        <span style={{
                                          color: '#6b7280',
                                          fontSize: '14px',
                                          marginRight: '4px',
                                          fontWeight: '500'
                                        }}>
                                          ₺
                                        </span>
                                      )}

                                      {/* ETD clear button */}
                                      {cellData.field === 'etd' && cellData.value && row.itemId && isColumnEditable('etd') && (
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDateSave(row.itemId!, 'etd', '', actualRowIndex);
                                          }}
                                          title="ETD tarihini sil"
                                          style={{
                                            cursor: 'pointer',
                                            color: '#ef4444',
                                            fontWeight: '700',
                                            fontSize: '13px',
                                            lineHeight: 1,
                                            marginRight: '4px',
                                            flexShrink: 0,
                                            userSelect: 'none',
                                          }}
                                        >×</span>
                                      )}

                                      {/* Cell value with right alignment for currency fields */}
                                      <span
                                        className={cellData.field === 'status' || cellData.field === 'pfSignStatus' ? '' : getStatusClass(cellData.value)}
                                        style={{
                                          flex: 1,
                                          ...(cellData.field === 'status'
                                            ? {
                                                // STATUS - text only, background on cell
                                                color: getStatusStyle(cellData.value).color,
                                                fontSize: '12px',
                                                fontWeight: '600',
                                              }
                                            : cellData.field === 'pfSignStatus'
                                            ? {
                                                // PF SIGN STATUS - text only, background on cell
                                                color: 'black',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                              }
                                            : cellData.field === 'pfUsd' || cellData.field === 'pfTl' || cellData.field === 'expensesUsd' || cellData.field === 'expensesTl' || cellData.field === 'invoice' || cellData.field === 'invoiceTl'
                                            ? {
                                                fontFamily: 'monospace',
                                                fontWeight: '500'
                                              }
                                            : cellData.field === 'containerNo' && (!cellData.value || cellData.value.trim() === '')
                                            ? {
                                                color: '#9ca3af', // Muted color for placeholder
                                                fontStyle: 'italic'
                                              }
                                            : {})
                                        }}
                                      >
                                        {(cellData.field === 'pfUsd' || cellData.field === 'pfTl' || cellData.field === 'expensesUsd' || cellData.field === 'expensesTl' || cellData.field === 'invoice' || cellData.field === 'invoiceTl')
                                          ? formatCurrency(parseFloat(cellData.value || '0') || 0)
                                          : cellData.field === 'containerNo'
                                          ? getContainerDisplayText(cellData.value)
                                          : cellData.value}
                                      </span>
                                    </div>
                                  );

                                  // Handle cell clicks for inline editing
                                  const handleClick = cellData.editable
                                    ? (e: React.MouseEvent) => {
                                        const itemId = row.itemId;
                                        if (itemId) {
                                          handleCellClick(e, itemId, cellData.field);
                                        }
                                      }
                                    : (_e: React.MouseEvent) => {
                                        // Non-editable cell click handler
                                      };

                                  const isCellHighlighted = highlightedItemId === row.itemId && highlightField === cellData.field;
                                  const isStatusCell = cellData.field === 'status';
                                  const hasStatusNote = isStatusCell && !!row.statusNote;

                                  const isPriceNoteCell = (cellData.field === 'pfUsd' || cellData.field === 'pfTl' || cellData.field === 'invoice' || cellData.field === 'invoiceTl' || cellData.field === 'expensesUsd' || cellData.field === 'expensesTl') && !!row.itemId;
                                  const backendItemForNote = isPriceNoteCell && row.itemId ? itemsById.get(row.itemId) : null;
                                  const hasPriceNote = isPriceNoteCell && !!((backendItemForNote?.priceNotes as Record<string, string> | null)?.[cellData.field]);

                                  const isContainerCell = cellData.field === 'containerNo';
                                  const isPfCell = cellData.field === 'pfSignStatus';
                                  const isStatusDragCell = cellData.field === 'status';
                                  const isDragCell = isContainerCell || isPfCell || isStatusDragCell;
                                  const isDragSelected = isDragCell && row.itemId != null && dragSelectedRowIds.has(row.itemId) && dragField === cellData.field;

                                  return (
                                    <div
                                      key={cellIndex}
                                      ref={cellRef}
                                      className={`row-cell ${cellData.className} ${cellData.editable ? 'clickable' : ''} ${isCellHighlighted ? 'dashboard-cell-highlighted' : ''}`}
                                      onClick={!isDragging ? handleClick : undefined}
                                      onMouseDown={isDragCell && row.itemId && cellData.editable
                                        ? (e) => handleDragCellMouseDown(e, row.itemId!, cellData.field as DragField)
                                        : undefined}
                                      onMouseEnter={isDragCell && row.itemId
                                        ? () => handleDragCellMouseEnter(row.itemId!)
                                        : undefined}
                                      onContextMenu={row.itemId && (isStatusCell || isPriceNoteCell) ? (e: React.MouseEvent) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (isStatusCell) {
                                          setNoteMenu({ x: e.clientX, y: e.clientY, itemId: row.itemId!, hasNote: hasStatusNote });
                                        } else if (isPriceNoteCell) {
                                          setPriceNoteMenu({ x: e.clientX, y: e.clientY, itemId: row.itemId!, field: cellData.field, hasNote: hasPriceNote });
                                        }
                                      } : undefined}
                                      style={{
                                        position: 'relative',
                                        cursor: isDragCell && cellData.editable ? (isDragging ? 'crosshair' : 'pointer') : cellData.editable ? 'pointer' : 'default',
                                        pointerEvents: cellData.editable ? 'auto' : 'auto',
                                        backgroundColor: isDragSelected
                                          ? '#bfdbfe'
                                          : isCellHighlighted
                                          ? undefined
                                          : isStatusCell
                                            ? getStatusStyle(cellData.value).backgroundColor
                                            : cellData.field === 'pfSignStatus'
                                              ? getSignStatusStyle(cellData.value).backgroundColor
                                              : (cellData.field === 'pfUsd' || cellData.field === 'pfTl' || cellData.field === 'expensesUsd' || cellData.field === 'expensesTl' || cellData.field === 'invoice' || cellData.field === 'invoiceTl')
                                                ? 'rgba(147, 197, 253, 0.1)'
                                                : undefined,
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px 8px',
                                        minHeight: '28px',
                                        userSelect: isDragCell ? 'none' : undefined,
                                      }}
                                    >
                                      {cellContent}
                                      {hasStatusNote && (
                                        <span style={{
                                          position: 'absolute',
                                          top: '3px',
                                          right: '3px',
                                          width: '8px',
                                          height: '8px',
                                          borderRadius: '50%',
                                          backgroundColor: '#22c55e',
                                          border: '1px solid rgba(255,255,255,0.8)',
                                          flexShrink: 0,
                                        }} title="Not mevcut" />
                                      )}
                                      {hasPriceNote && (
                                        <span style={{
                                          position: 'absolute',
                                          top: '3px',
                                          right: '3px',
                                          width: '8px',
                                          height: '8px',
                                          borderRadius: '50%',
                                          backgroundColor: '#22c55e',
                                          border: '1px solid rgba(255,255,255,0.8)',
                                          flexShrink: 0,
                                        }} title="Fiyat notu mevcut" />
                                      )}
                                    </div>
                                  );
                                })}
                                
                                {/* Accounting Columns (Supplier Mode / Expenses-P Mode) */}
                                {enableAccountingColumns && (() => {
                                  const itemId = row.itemId || '';
                                  const pfUsd = isExpensesPMode ? (parseFloat(row.expensesUsd || '') || 0) : (parseFloat(row.pfUsd) || 0);
                                  const pfTl = isExpensesPMode ? (parseFloat(row.expensesTl || '') || 0) : (parseFloat(row.pfTl) || 0);
                                  const invoiceAmount = parseFloat((row as any).invoice || '') || 0;
                                  const paidAmounts = getPaidAmounts(itemId);

                                  // In expenses-p mode, treat all as SIGNED (no PF signing concept)
                                  const effectivePfSignStatus = isExpensesPMode ? 'SIGNED' : row.pfSignStatus;

                                  // Calculate accounting data for this row
                                  const accountingData = calculateRowAccounting(
                                    itemId,
                                    pfUsd,
                                    pfTl,
                                    row.status,
                                    effectivePfSignStatus,
                                    paidAmounts.paidUsd1,
                                    paidAmounts.paidUsd2,
                                    paidAmounts.paidTl1,
                                    paidAmounts.paidTl2,
                                    invoiceAmount,
                                  );
                                  
                                  return (
                                    <>
                                      {/* Main spacer column */}
                                      <div className="row-cell col-accounting-spacer"></div>
                                      
                                      {/* Paid USD columns */}
                                      <div className="row-cell col-accounting-paid-usd-1">
                                        <EditableAccountingCell
                                          value={accountingData.paidUsd1}
                                          currency="$"
                                          onSave={(val) => updatePaidAmount(itemId, 'paidUsd1', val)}
                                          editable={true}
                                        />
                                      </div>
                                      <div className="row-cell col-accounting-paid-usd-2">
                                        <EditableAccountingCell
                                          value={accountingData.paidUsd2}
                                          currency="$"
                                          onSave={(val) => updatePaidAmount(itemId, 'paidUsd2', val)}
                                          editable={true}
                                        />
                                      </div>
                                      
                                      {/* Gap between USD and TL paid columns */}
                                      <div className="row-cell col-accounting-gap-paid"></div>
                                      
                                      {/* Paid TL columns */}
                                      <div className="row-cell col-accounting-paid-tl-1">
                                        <EditableAccountingCell
                                          value={accountingData.paidTl1}
                                          currency="₺"
                                          onSave={(val) => updatePaidAmount(itemId, 'paidTl1', val)}
                                          editable={true}
                                        />
                                      </div>
                                      <div className="row-cell col-accounting-paid-tl-2">
                                        <EditableAccountingCell
                                          value={accountingData.paidTl2}
                                          currency="₺"
                                          onSave={(val) => updatePaidAmount(itemId, 'paidTl2', val)}
                                          editable={true}
                                        />
                                      </div>
                                      
                                      {/* Gap before Remaining group */}
                                      <div className="row-cell col-accounting-gap-group"></div>
                                      
                                      {/* Remaining columns */}
                                      <div className="row-cell col-accounting-remaining-usd">
                                        <ReadOnlyAccountingCell
                                          value={accountingData.remainingUsd}
                                          currency="$"
                                          showNotSigned={accountingData.showNotSignedRemaining}
                                        />
                                      </div>
                                      <div className="row-cell col-accounting-remaining-tl">
                                        <ReadOnlyAccountingCell
                                          value={accountingData.remainingTl}
                                          currency="₺"
                                          showNotSigned={accountingData.showNotSignedRemaining}
                                        />
                                      </div>
                                      
                                      {/* Gap before Not Ordered group */}
                                      <div className="row-cell col-accounting-gap-group"></div>
                                      
                                      {/* Not Ordered columns */}
                                      <div className="row-cell col-accounting-not-ordered-usd">
                                        <ReadOnlyAccountingCell
                                          value={accountingData.notOrderedUsd}
                                          currency="$"
                                        />
                                      </div>
                                      <div className="row-cell col-accounting-not-ordered-tl">
                                        <ReadOnlyAccountingCell
                                          value={accountingData.notOrderedTl}
                                          currency="₺"
                                        />
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            );
                          })}
                        </div>
                      );
                    });
                  })()}

                  {/* TOTAL Row - Scrollable Right Part - DYNAMIC COLUMN FILTERING */}
                  <div className="row-item total-row">
                    {(() => {
                      // Define all scrollable columns in order
                      const allScrollableColumns = [
                        { field: 'pfCode', className: 'col-pf-code' },
                        { field: 'vendor', className: 'col-vendor' },
                        { field: 'orderType', className: 'col-order-type' },
                        ...(isSupplierMode ? [] : [{ field: 'poSignStatus', className: 'col-po-sign-status' }]),
                        { field: 'pfSignStatus', className: 'col-pf-sign-status' },
                        { field: 'status', className: 'col-status' },
                        { field: 'std', className: 'col-std' },
                        { field: 'etd', className: 'col-etd' },
                        { field: 'rtr', className: 'col-rtr' },
                        { field: 'rtd', className: 'col-rtd' },
                        { field: 'rdy', className: 'col-rdy' },
                        { field: 'ftd', className: 'col-ftd' },
                        { field: 'snd', className: 'col-snd' },
                        { field: 'pfUsd', className: 'col-pf-usd' },
                        { field: 'pfTl', className: 'col-pf-tl' },
                        { field: 'invoice', className: 'col-invoice' },
                        { field: 'invoiceTl', className: 'col-invoice-tl' },
                        { field: 'expensesUsd', className: 'col-expenses-usd' },
                        { field: 'expensesTl', className: 'col-expenses-tl' },
                        { field: 'paymentRule', className: 'col-payment-rule' },
                        { field: 'containerNo', className: 'col-container-no' },
                        { field: 'containerDate', className: 'col-container-date' }
                      ];

                      // Filter to only visible columns - TRUE COLUMN HIDING (no whitespace)
                      const visibleScrollableColumns = allScrollableColumns.filter(col =>
                        isColumnVisible(col.field as ColumnKey)
                      );

                      return visibleScrollableColumns.map((col) => {
                        // Special styling for money totals and SND label
                        if (col.field === 'snd') {
                          return (
                            <div key={col.field} className={`row-cell ${col.className}`} style={{
                              backgroundColor: '#1e40af',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '11px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              textAlign: 'right',
                              paddingRight: '12px',
                              borderRight: '1px solid #1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end'
                            }}>
                              TOTAL
                            </div>
                          );
                        } else if (col.field === 'pfUsd') {
                          return (
                            <div key={col.field} className={`row-cell ${col.className}`} style={{
                              textAlign: 'left',
                              backgroundColor: '#1e40af',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '11px',
                              paddingLeft: '12px',
                              borderRight: '1px solid #1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start'
                            }}>
                              <span style={{ marginRight: '4px' }}>$</span>
                              {formatCurrency(projectTotals.pfUsd)}
                            </div>
                          );
                        } else if (col.field === 'pfTl') {
                          return (
                            <div key={col.field} className={`row-cell ${col.className}`} style={{
                              textAlign: 'left',
                              backgroundColor: '#1e40af',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '11px',
                              paddingLeft: '12px',
                              borderRight: '1px solid #1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start'
                            }}>
                              <span style={{ marginRight: '4px' }}>₺</span>
                              {formatCurrency(projectTotals.pfTl)}
                            </div>
                          );
                        } else if (col.field === 'expensesUsd') {
                          return (
                            <div key={col.field} className={`row-cell ${col.className}`} style={{
                              textAlign: 'left',
                              backgroundColor: '#1e40af',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '11px',
                              paddingLeft: '12px',
                              borderRight: '1px solid #1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start'
                            }}>
                              <span style={{ marginRight: '4px' }}>$</span>
                              {formatCurrency(projectTotals.expensesUsd)}
                            </div>
                          );
                        } else if (col.field === 'expensesTl') {
                          return (
                            <div key={col.field} className={`row-cell ${col.className}`} style={{
                              textAlign: 'left',
                              backgroundColor: '#1e40af',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '11px',
                              paddingLeft: '12px',
                              borderRight: '1px solid #1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start'
                            }}>
                              <span style={{ marginRight: '4px' }}>₺</span>
                              {formatCurrency(projectTotals.expensesTl)}
                            </div>
                          );
                        } else if (col.field === 'invoice') {
                          return (
                            <div key={col.field} className={`row-cell ${col.className}`} style={{
                              textAlign: 'left',
                              backgroundColor: '#1e40af',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '11px',
                              paddingLeft: '12px',
                              borderRight: '1px solid #1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start'
                            }}>
                              <span style={{ marginRight: '4px' }}>$</span>
                              {formatCurrency(projectTotals.invoice)}
                            </div>
                          );
                        } else if (col.field === 'invoiceTl') {
                          return (
                            <div key={col.field} className={`row-cell ${col.className}`} style={{
                              textAlign: 'left',
                              backgroundColor: '#1e40af',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '11px',
                              paddingLeft: '12px',
                              borderRight: '1px solid #1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start'
                            }}>
                              <span style={{ marginRight: '4px' }}>₺</span>
                              {formatCurrency((projectTotals as any).invoiceTl || 0)}
                            </div>
                          );
                        } else {
                          // All other columns - grey background
                          return (
                            <div key={col.field} className={`row-cell ${col.className} total-grey`}></div>
                          );
                        }
                      });
                    })()}
                    
                    {/* Accounting Totals (Supplier Mode Only) */}
                    {enableAccountingColumns && (() => {
                      // Calculate accounting totals from all rows
                      let totalPaidUsd1 = 0;
                      let totalPaidUsd2 = 0;
                      let totalPaidTl1 = 0;
                      let totalPaidTl2 = 0;
                      let totalRemainingUsd = 0;
                      let totalRemainingTl = 0;
                      let totalNotOrderedUsd = 0;
                      let totalNotOrderedTl = 0;
                      
                      typeGroups.forEach(typeGroup => {
                        typeGroup.rows.forEach(row => {
                          const itemId = row.itemId || '';
                          const pfUsd = isExpensesPMode ? (parseFloat(row.expensesUsd || '') || 0) : (parseFloat(row.pfUsd) || 0);
                          const pfTl = isExpensesPMode ? (parseFloat(row.expensesTl || '') || 0) : (parseFloat(row.pfTl) || 0);
                          const invoiceAmount = parseFloat((row as any).invoice || '') || 0;
                          const paidAmounts = getPaidAmounts(itemId);
                          const effectivePfSignStatus = isExpensesPMode ? 'SIGNED' : row.pfSignStatus;

                          const accountingData = calculateRowAccounting(
                            itemId,
                            pfUsd,
                            pfTl,
                            row.status,
                            effectivePfSignStatus,
                            paidAmounts.paidUsd1,
                            paidAmounts.paidUsd2,
                            paidAmounts.paidTl1,
                            paidAmounts.paidTl2,
                            invoiceAmount,
                          );
                          
                          totalPaidUsd1 += accountingData.paidUsd1;
                          totalPaidUsd2 += accountingData.paidUsd2;
                          totalPaidTl1 += accountingData.paidTl1;
                          totalPaidTl2 += accountingData.paidTl2;
                          totalRemainingUsd += accountingData.remainingUsd;
                          totalRemainingTl += accountingData.remainingTl;
                          totalNotOrderedUsd += accountingData.notOrderedUsd;
                          totalNotOrderedTl += accountingData.notOrderedTl;
                        });
                      });
                      
                      const totalCellStyle = {
                        backgroundColor: '#D4AF37',
                        color: '#000',
                        fontWeight: '700' as const,
                        fontSize: '11px',
                        paddingRight: '12px',
                        borderRight: '1px solid #000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        textAlign: 'right' as const
                      };

                      return (
                        <>
                          <div className="row-cell col-accounting-spacer" style={{ backgroundColor: '#D4AF37' }}></div>
                          <div className="row-cell col-accounting-paid-usd-1" style={totalCellStyle}>
                            <span style={{ marginRight: '4px' }}>$</span>
                            {formatAccountingValue(totalPaidUsd1)}
                          </div>
                          <div className="row-cell col-accounting-paid-usd-2" style={totalCellStyle}>
                            <span style={{ marginRight: '4px' }}>$</span>
                            {formatAccountingValue(totalPaidUsd2)}
                          </div>
                          <div className="row-cell col-accounting-gap-paid" style={{ backgroundColor: '#D4AF37' }}></div>
                          <div className="row-cell col-accounting-paid-tl-1" style={totalCellStyle}>
                            <span style={{ marginRight: '4px' }}>₺</span>
                            {formatAccountingValue(totalPaidTl1)}
                          </div>
                          <div className="row-cell col-accounting-paid-tl-2" style={totalCellStyle}>
                            <span style={{ marginRight: '4px' }}>₺</span>
                            {formatAccountingValue(totalPaidTl2)}
                          </div>
                          <div className="row-cell col-accounting-gap-group" style={{ backgroundColor: '#D4AF37' }}></div>
                          <div className="row-cell col-accounting-remaining-usd" style={totalCellStyle}>
                            <span style={{ marginRight: '4px' }}>$</span>
                            {formatAccountingValue(totalRemainingUsd)}
                          </div>
                          <div className="row-cell col-accounting-remaining-tl" style={totalCellStyle}>
                            <span style={{ marginRight: '4px' }}>₺</span>
                            {formatAccountingValue(totalRemainingTl)}
                          </div>
                          <div className="row-cell col-accounting-gap-group" style={{ backgroundColor: '#D4AF37' }}></div>
                          <div className="row-cell col-accounting-not-ordered-usd" style={totalCellStyle}>
                            <span style={{ marginRight: '4px' }}>$</span>
                            {formatAccountingValue(totalNotOrderedUsd)}
                          </div>
                          <div className="row-cell col-accounting-not-ordered-tl" style={totalCellStyle}>
                            <span style={{ marginRight: '4px' }}>₺</span>
                            {formatAccountingValue(totalNotOrderedTl)}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    {/* Vendor Edit Panel */}
    {vendorEditState && (
        <InlineEditPanelErrorBoundary onError={handleVendorEditClose}>
          <InlineEditPanel
            isOpen={true}
            onClose={handleVendorEditClose}
            clickedCellRect={vendorEditState.clickedCellRect}
            mode={mode}
            projectId={projectData.projectId}
            projectItems={vendorEditState.projectItems}
            currentItemId={vendorEditState.currentItemId}
            itemsById={vendorEditState.itemsById}
            onItemUpdated={handleItemUpdated}
            onItemAdded={handleItemAdded}
            onNavigate={handleVendorEditNavigate}
          />
        </InlineEditPanelErrorBoundary>
    )}

    {/* Project Menu */}
    {isProjectMenuOpen && (
      <ProjectMenu
        isOpen={isProjectMenuOpen}
        onClose={handleProjectMenuClose}
        triggerRef={projectHeaderRef}
        projectId={project.projectId}
        projectName={project.projectName}
        projectAddress={project.address}
        projectTypes={allTypeNames}
        projectBucket={project.region}
        isUrgent={isUrgent}
        enableGrouping={enableGrouping}
        pfGroups={pfGroups}
        onOpenAddToGroup={() => setAddToGroupOpen(true)}
        onDeleteProject={handleDeleteProject}
        onToggleUrgent={handleToggleUrgent}
        onEditProject={handleEditProject}
      />
    )}

    {/* Add to Group — one-screen form (type + group + rank), replaces the old
        click-through-menu flow. Lives outside isProjectMenuOpen since opening it
        closes the right-click menu first. */}
    {addToGroupOpen && (
      <AddToGroupModal
        projectId={project.projectId}
        projectName={project.projectName}
        projectTypes={allTypeNames}
        pfGroups={pfGroups}
        onClose={() => setAddToGroupOpen(false)}
      />
    )}

    {/* Row Context Menu (Delete Row) */}
    {rowContextMenu && (
      <>
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
          onClick={() => setRowContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setRowContextMenu(null); }}
        />
        <div style={{
          position: 'fixed',
          left: rowContextMenu.x,
          top: rowContextMenu.y,
          zIndex: 99999,
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          padding: '4px 0',
          minWidth: '180px',
          fontSize: '13px',
        }}>
          <div style={{ padding: '6px 12px', color: '#6b7280', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {rowContextMenu.type || 'Item'}
          </div>
          <button
            onClick={handleDeleteRow}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#dc2626',
              fontSize: '13px',
              textAlign: 'left',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Delete Row
          </button>
        </div>
      </>
    )}

    {/* Status Note Context Menu */}
    {noteMenu && (
      <>
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
          onClick={() => setNoteMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setNoteMenu(null); }}
        />
        <div style={{
          position: 'fixed',
          left: noteMenu.x,
          top: noteMenu.y,
          zIndex: 99999,
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          padding: '4px 0',
          minWidth: '160px',
          fontSize: '13px',
        }}>
          {noteMenu.hasNote ? (
            <>
              <button
                onClick={() => {
                  const item = itemsById.get(noteMenu.itemId);
                  setNoteDialog({ itemId: noteMenu.itemId, text: item?.statusNote || '', mode: 'view' });
                  setNoteMenu(null);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '8px 14px', border: 'none',
                  backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: '15px' }}>&#128196;</span> Notu Goruntule
              </button>
              <button
                onClick={() => {
                  const item = itemsById.get(noteMenu.itemId);
                  setNoteDialog({ itemId: noteMenu.itemId, text: item?.statusNote || '', mode: 'edit' });
                  setNoteMenu(null);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '8px 14px', border: 'none',
                  backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: '15px' }}>&#9998;</span> Notu Duzenle
              </button>
              <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }} />
              <button
                onClick={() => {
                  handleStatusNoteSave(noteMenu.itemId, '');
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '8px 14px', border: 'none',
                  backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left',
                  color: '#dc2626',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: '15px' }}>&#128465;</span> Notu Sil
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setNoteDialog({ itemId: noteMenu.itemId, text: '', mode: 'edit' });
                setNoteMenu(null);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '8px 14px', border: 'none',
                backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={{ fontSize: '15px' }}>&#10133;</span> Not Ekle
            </button>
          )}
        </div>
      </>
    )}

    {/* Status Note Dialog */}
    {noteDialog && (
      <>
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 99998,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
          onClick={() => setNoteDialog(null)}
        />
        <div style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 99999,
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          padding: '20px',
          width: '380px',
          maxWidth: '90vw',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '14px',
          }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
              {noteDialog.mode === 'view' ? 'Status Notu' : noteDialog.text ? 'Notu Duzenle' : 'Not Ekle'}
            </h3>
            <button
              onClick={() => setNoteDialog(null)}
              style={{
                border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                fontSize: '18px', color: '#9ca3af', lineHeight: 1, padding: '2px',
              }}
            >
              &#10005;
            </button>
          </div>

          {noteDialog.mode === 'view' ? (
            <>
              <div style={{
                padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px',
                fontSize: '14px', color: '#374151', lineHeight: '1.5',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                minHeight: '60px', border: '1px solid #e5e7eb',
              }}>
                {noteDialog.text || '(Bos)'}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setNoteDialog({ ...noteDialog, mode: 'edit' })}
                  style={{
                    padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
                    border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#374151', cursor: 'pointer',
                  }}
                >
                  Duzenle
                </button>
                <button
                  onClick={() => setNoteDialog(null)}
                  style={{
                    padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
                    border: 'none', backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer',
                  }}
                >
                  Kapat
                </button>
              </div>
            </>
          ) : (
            <>
              <textarea
                autoFocus
                defaultValue={noteDialog.text}
                onChange={(e) => setNoteDialog({ ...noteDialog, text: e.target.value })}
                placeholder="Notunuzu yazin..."
                style={{
                  width: '100%', minHeight: '100px', padding: '10px', fontSize: '14px',
                  border: '1px solid #d1d5db', borderRadius: '8px', resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit', lineHeight: '1.5',
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                onBlur={e => (e.target.style.borderColor = '#d1d5db')}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setNoteDialog(null)}
                  style={{
                    padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
                    border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#374151', cursor: 'pointer',
                  }}
                >
                  Iptal
                </button>
                <button
                  onClick={() => handleStatusNoteSave(noteDialog.itemId, noteDialog.text)}
                  style={{
                    padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
                    border: 'none', backgroundColor: '#22c55e', color: '#fff', cursor: 'pointer',
                  }}
                >
                  Kaydet
                </button>
              </div>
            </>
          )}
        </div>
      </>
    )}

    {/* Price Note Context Menu */}
    {priceNoteMenu && (
      <>
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
          onClick={() => setPriceNoteMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setPriceNoteMenu(null); }}
        />
        <div style={{
          position: 'fixed',
          left: priceNoteMenu.x,
          top: priceNoteMenu.y,
          zIndex: 99999,
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          padding: '4px 0',
          minWidth: '160px',
          fontSize: '13px',
        }}>
          {priceNoteMenu.hasNote ? (
            <>
              <button
                onClick={() => {
                  const item = itemsById.get(priceNoteMenu.itemId);
                  const notes = (item?.priceNotes as Record<string, string> | null) || {};
                  setPriceNoteDialog({ itemId: priceNoteMenu.itemId, field: priceNoteMenu.field, text: notes[priceNoteMenu.field] || '', mode: 'view' });
                  setPriceNoteMenu(null);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: '15px' }}>&#128196;</span> Notu Goruntule
              </button>
              <button
                onClick={() => {
                  const item = itemsById.get(priceNoteMenu.itemId);
                  const notes = (item?.priceNotes as Record<string, string> | null) || {};
                  setPriceNoteDialog({ itemId: priceNoteMenu.itemId, field: priceNoteMenu.field, text: notes[priceNoteMenu.field] || '', mode: 'edit' });
                  setPriceNoteMenu(null);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: '15px' }}>&#9998;</span> Notu Duzenle
              </button>
              <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }} />
              <button
                onClick={() => handlePriceNoteSave(priceNoteMenu.itemId, priceNoteMenu.field, '')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', color: '#dc2626' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: '15px' }}>&#128465;</span> Notu Sil
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setPriceNoteDialog({ itemId: priceNoteMenu.itemId, field: priceNoteMenu.field, text: '', mode: 'edit' });
                setPriceNoteMenu(null);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={{ fontSize: '15px' }}>&#10133;</span> Not Ekle
            </button>
          )}
        </div>
      </>
    )}

    {/* Price Note Dialog */}
    {priceNoteDialog && (() => {
      const fieldLabels: Record<string, string> = { pfUsd: 'PF / USD', pfTl: 'PF / TL', invoice: 'INV / USD', invoiceTl: 'INV / TL', expensesUsd: 'Expenses USD', expensesTl: 'Expenses TL' };
      const label = fieldLabels[priceNoteDialog.field] || priceNoteDialog.field;
      return (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99998, backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={() => setPriceNoteDialog(null)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 99999, backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', padding: '20px', width: '380px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
                {priceNoteDialog.mode === 'view' ? `${label} Notu` : priceNoteDialog.text ? 'Notu Duzenle' : `${label} — Not Ekle`}
              </h3>
              <button onClick={() => setPriceNoteDialog(null)} style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#9ca3af', lineHeight: 1, padding: '2px' }}>&#10005;</button>
            </div>
            {priceNoteDialog.mode === 'view' ? (
              <>
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: '14px', color: '#374151', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: '60px', border: '1px solid #e5e7eb' }}>
                  {priceNoteDialog.text || '(Bos)'}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setPriceNoteDialog({ ...priceNoteDialog, mode: 'edit' })} style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#374151', cursor: 'pointer' }}>Duzenle</button>
                  <button onClick={() => setPriceNoteDialog(null)} style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, border: 'none', backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer' }}>Kapat</button>
                </div>
              </>
            ) : (
              <>
                <textarea
                  autoFocus
                  defaultValue={priceNoteDialog.text}
                  onChange={(e) => setPriceNoteDialog({ ...priceNoteDialog, text: e.target.value })}
                  placeholder="Notunuzu yazin..."
                  style={{ width: '100%', minHeight: '100px', padding: '10px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: '1.5', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = '#22c55e')}
                  onBlur={e => (e.target.style.borderColor = '#d1d5db')}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setPriceNoteDialog(null)} style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#374151', cursor: 'pointer' }}>Iptal</button>
                  <button onClick={() => handlePriceNoteSave(priceNoteDialog.itemId, priceNoteDialog.field, priceNoteDialog.text)} style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, border: 'none', backgroundColor: '#22c55e', color: '#fff', cursor: 'pointer' }}>Kaydet</button>
                </div>
              </>
            )}
          </div>
        </>
      );
    })()}
</>
  );
};

function areProjectBlockPropsEqual(prev: ProjectBlockProps, next: ProjectBlockProps): boolean {
  if (prev.project !== next.project) return false;
  if (prev.backendItems !== next.backendItems) return false;
  if (prev.mode !== next.mode) return false;
  if (prev.sectionLabel !== next.sectionLabel) return false;
  if (prev.highlightedItemId !== next.highlightedItemId) return false;
  if (prev.highlightField !== next.highlightField) return false;
  if (prev.showSectionHeader !== next.showSectionHeader) return false;
  if (prev.supplierVendorCodeFilter !== next.supplierVendorCodeFilter) return false;
  if (prev.enableAccountingColumns !== next.enableAccountingColumns) return false;
  if (prev.isSupplierMode !== next.isSupplierMode) return false;
  if (prev.permissionOverrides !== next.permissionOverrides) return false;
  if (prev.selectable !== next.selectable) return false;
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.onToggleSelect !== next.onToggleSelect) return false;
  if (prev.enableGrouping !== next.enableGrouping) return false;
  if (prev.pfGroups !== next.pfGroups) return false;
  // Only re-render if one of THIS project's items changed in the global map
  if (prev.globalItemsById !== next.globalItemsById) {
    const ids = prev.backendItems?.map(i => i.id) ?? [];
    for (const id of ids) {
      if (prev.globalItemsById?.get(id) !== next.globalItemsById?.get(id)) return false;
    }
  }
  return true;
}

export default React.memo(ProjectBlock, areProjectBlockPropsEqual);