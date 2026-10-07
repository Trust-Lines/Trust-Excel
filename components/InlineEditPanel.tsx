import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import VendorDropdownField from './VendorDropdownField';
import OrderTypeDropdownField from './OrderTypeDropdownField';
import AddVendorModal from './AddVendorModal';
import { Vendor } from '../types';
import { BackendProjectItem, updateProjectItem, createProjectItem } from '../lib/projects';
import { createMissingExtraItem, updateMissingExtraItem } from '../lib/missing-extra';
import { updateDirectOrderItem, createDirectOrderItem } from '../lib/direct-orders';
import { createExpensesPItem, updateExpensesPItem } from '../lib/expenses-p';
import { createExpensesDirectOrderItem, updateExpensesDirectOrderItem } from '../lib/expenses-direct-order';
import { createExpensesMissingExtraItem, updateExpensesMissingExtraItem } from '../lib/expenses-missing-extra';
import { usePagePermissions } from '../hooks/usePagePermissions';

interface InlineEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  clickedCellRect: DOMRect; // ✅ CRITICAL FIX: Exact clicked cell position
  mode?: 'projects' | 'missingExtra' | 'directOrder' | 'expenses-p' | 'expenses-do' | 'expenses-me'; // Add mode prop for endpoint switching
  projectId: string;
  projectItems: BackendProjectItem[]; // All items in the type group
  currentItemId: string; // ✅ ID-based instead of index
  itemsById: Map<string, BackendProjectItem>; // ✅ Fast lookup map
  onItemUpdated: (updatedItem: BackendProjectItem | any) => void;
  onItemAdded?: (newItem: BackendProjectItem | any) => void; // Optional callback for new items
  onNavigate: (newIndex: number) => void;
}

const InlineEditPanel: React.FC<InlineEditPanelProps> = ({
  isOpen,
  onClose,
  clickedCellRect,
  mode = 'projects',
  projectId,
  projectItems,
  currentItemId,
  itemsById,
  onItemUpdated,
  onItemAdded,
  onNavigate,
}) => {
  const { canAddItems } = usePagePermissions();

  // Helper functions for mode-based API calls
  const createItem = async (itemData: any) => {

    if (mode === 'missingExtra') {
      return await createMissingExtraItem(projectId, itemData);
    } else if (mode === 'directOrder') {
      return await createDirectOrderItem(projectId, itemData);
    } else if (mode === 'expenses-p') {
      return await createExpensesPItem(projectId, itemData);
    } else if (mode === 'expenses-do') {
      return await createExpensesDirectOrderItem(projectId, itemData);
    } else if (mode === 'expenses-me') {
      return await createExpensesMissingExtraItem(projectId, itemData);
    } else {
      return await createProjectItem(projectId, itemData);
    }
  };

  const updateItem = async (itemId: string, itemData: any) => {
    if (mode === 'missingExtra') {
      return await updateMissingExtraItem(itemId, itemData);
    } else if (mode === 'directOrder') {
      return await updateDirectOrderItem(projectId, itemId, itemData);
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

  const panelRef = useRef<HTMLDivElement>(null);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);

  // Compute position synchronously from clickedCellRect — no useEffect, no flash
  const panelPosition = useMemo(() => {
    if (!isOpen || !clickedCellRect) return { top: -9999, left: -9999 };

    const panelWidth = 400;
    const panelHeight = 320;
    const gap = 8;

    let top = clickedCellRect.bottom + gap;
    let left = clickedCellRect.right + gap;

    if (top + panelHeight > window.innerHeight) {
      top = clickedCellRect.top - panelHeight - gap;
    }
    if (left + panelWidth > window.innerWidth) {
      left = clickedCellRect.left - panelWidth - gap;
    }

    top = Math.max(10, Math.min(top, window.innerHeight - panelHeight - 10));
    left = Math.max(10, Math.min(left, window.innerWidth - panelWidth - 10));

    return { top, left };
  }, [isOpen, clickedCellRect, currentItemId]);

  // Form state
  const [vendorId, setVendorId] = useState<string>('');
  const [orderType, setOrderType] = useState<string>('');
  const isSavingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Removed unused isUserInteracting state

  // Note: Order types are now handled internally by OrderTypeDropdownField

  const currentItem = itemsById.get(currentItemId); // ✅ ID-based lookup instead of index

  // Calculate current index for navigation and display (backward compatibility)
  const currentItemIndex = projectItems.findIndex(item => item.id === currentItemId);

  // ✨ DEBUG: Log permissions when component renders
  useEffect(() => {
    if (!canAddItems) {
    } else {
    }
  }, [canAddItems, currentItem?.type]);

  // Initialize form data when item changes
  useEffect(() => {
    if (currentItem) {
      setVendorId(currentItem.vendorId || '');
      setOrderType(currentItem.orderType || '');
      setError(null);
      setHasChanges(false);
    }
  }, [currentItem]);

  // Order types loading is now handled by OrderTypeDropdownField

  // Track changes
  useEffect(() => {
    if (currentItem) {
      const vendorChanged = vendorId !== (currentItem.vendorId || '');
      const orderTypeChanged = orderType !== (currentItem.orderType || '');
      setHasChanges(vendorChanged || orderTypeChanged);
    }
  }, [vendorId, orderType, currentItem]);

  // Autosave with debouncing
  useEffect(() => {
    if (hasChanges && autoSaveEnabled && !isSavingRef.current) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      const timeoutId = setTimeout(async () => {
        try {
          await handleSave();
        } catch (err) {
          // Error handling is done within handleSave
        }
      }, 300);

      autoSaveTimeoutRef.current = timeoutId;

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [hasChanges, autoSaveEnabled, vendorId, orderType]);

  // Cleanup autosave timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Handle outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      // Don't close if clicking inside the panel
      if (panelRef.current?.contains(target)) {
        return;
      }

      // Don't close if clicking on the original TYPE cell area (using clickedCellRect)
      if (clickedCellRect && target instanceof Element) {
        const elementRect = target.getBoundingClientRect();
        const clickX = elementRect.left + elementRect.width / 2;
        const clickY = elementRect.top + elementRect.height / 2;

        // Check if click is near the original TYPE cell
        if (clickX >= clickedCellRect.left - 10 && clickX <= clickedCellRect.right + 10 &&
            clickY >= clickedCellRect.top - 10 && clickY <= clickedCellRect.bottom + 10) {
          return;
        }
      }

      // Don't close during active save
      if (isSavingRef.current) return;

      // Don't close while there are unsaved changes
      if (hasChanges) return;

      onClose();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose, clickedCellRect, hasChanges]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {

        if (isSavingRef.current) return;

        if (!hasChanges) {
          onClose();
        } else {
          if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
            onClose();
          }
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, hasChanges]);

  const handleSave = async () => {
    if (!currentItem || !hasChanges) return;
    if (isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      setError(null);

      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }

      const updateData: any = {};
      if (vendorId !== (currentItem.vendorId || '')) {
        updateData.vendorId = vendorId || null;
      }
      if (orderType !== (currentItem.orderType || '')) {
        updateData.orderType = orderType || null;
      }

      const optimisticItem = {
        ...currentItem,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      onItemUpdated(optimisticItem);

      const updatedItem = await updateItem(currentItem.id, updateData);

      onItemUpdated(updatedItem);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleNavigatePrevious = () => {
    if (currentItemIndex > 0 && currentItemIndex !== -1) {
      const newIndex = currentItemIndex - 1;
      if (newIndex >= 0 && newIndex < projectItems.length) {
        onNavigate(newIndex);
      }
    }
  };

  const handleNavigateNext = () => {
    if (currentItemIndex < projectItems.length - 1 && currentItemIndex !== -1) {
      const newIndex = currentItemIndex + 1;
      if (newIndex >= 0 && newIndex < projectItems.length) {
        onNavigate(newIndex);
      }
    }
  };

  const handleVendorChange = (vendorId: string | null, _vendor: Vendor | null) => {
    setVendorId(vendorId || '');
    // Removed setIsUserInteracting call
  };

  const handleVendorAdded = (newVendor: Vendor) => {
    setVendorId(newVendor.id);
    // Removed setIsUserInteracting call
    // The VendorDropdownField will reload its vendor list automatically
  };

  const handleAddItem = async () => {
    if (!currentItem) return;

    try {
      isSavingRef.current = true;
      setError(null);

      const newItemData: any = {};

      if (currentItem.customTypeId) {
        // For custom types: pass customTypeId (type should be null for custom types)
        newItemData.customTypeId = currentItem.customTypeId;
        newItemData.type = null;
      } else {
        // For standard types: pass the type enum value
        newItemData.type = currentItem.type;
        newItemData.customTypeId = null;
      }


      const newItem = await createItem(newItemData);

      if (onItemAdded) {
        await onItemAdded(newItem);
      }

      // No full project refresh — handleItemAdded updates local state.
      // Full refresh causes scroll-to-top.

      // Parent component (ProjectBlock) will handle switching to the new item
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add new item');
    } finally {
      isSavingRef.current = false;
    }
  };

  if (!isOpen || !currentItem) return null;

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${panelPosition.top}px`,
    left: `${panelPosition.left}px`,
    zIndex: 15000,
    minWidth: '300px',
    maxWidth: '400px'
  };

  return createPortal(
    <>
      <div
        ref={panelRef}
        style={panelStyle}
      >
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                Edit {currentItem.type} Item
              </h3>
              {projectItems.length > 1 && (
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {currentItemIndex + 1} of {projectItems.length}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Add Item Button - only show if user has canAddItems permission */}
              {canAddItems ? (
                <button
                  onClick={handleAddItem}
                  style={{
                    border: '1px solid #059669',
                    backgroundColor: '#ffffff',
                    borderRadius: '4px',
                    color: '#059669',
                    fontSize: '12px',
                    padding: '4px 8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  }}
                  title="Add another item of the same type"
                >
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>+</span>
                  Add Item
                </button>
              ) : (
                <div style={{
                  fontSize: '10px',
                  color: '#ef4444',
                  fontWeight: '600',
                  padding: '2px 4px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '2px'
                }}>
                  [Add Item Hidden - No Permission]
                </div>
              )}

              {/* Autosave Toggle */}
              <button
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: autoSaveEnabled ? '#059669' : '#6b7280',
                  fontSize: '12px',
                  padding: '2px 4px',
                  fontWeight: '500'
                }}
                title={autoSaveEnabled ? 'Disable autosave' : 'Enable autosave'}
              >
                Auto: {autoSaveEnabled ? 'ON' : 'OFF'}
              </button>

              {/* Save Status Indicator */}
              {autoSaveEnabled && hasChanges && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '1px', height: '12px', backgroundColor: '#e5e7eb' }} />
                  <div style={{ color: '#d97706', fontSize: '11px', fontWeight: '500' }}>
                    ● Unsaved
                  </div>
                </div>
              )}

              {/* Navigation */}
              {projectItems.length > 1 && (
                <>
                  <div style={{ width: '1px', height: '16px', backgroundColor: '#e5e7eb', margin: '0 4px' }} />
                  <button
                    onClick={handleNavigatePrevious}
                    disabled={currentItemIndex === 0}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: currentItemIndex === 0 ? 'not-allowed' : 'pointer',
                      color: currentItemIndex === 0 ? '#d1d5db' : '#6b7280',
                      fontSize: '16px',
                      padding: '2px 4px'
                    }}
                    title="Previous item"
                  >
                    ‹
                  </button>
                  <button
                    onClick={handleNavigateNext}
                    disabled={currentItemIndex === projectItems.length - 1}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: currentItemIndex === projectItems.length - 1 ? 'not-allowed' : 'pointer',
                      color: currentItemIndex === projectItems.length - 1 ? '#d1d5db' : '#6b7280',
                      fontSize: '16px',
                      padding: '2px 4px'
                    }}
                    title="Next item"
                  >
                    ›
                  </button>
                  <div style={{ width: '1px', height: '16px', backgroundColor: '#e5e7eb', margin: '0 4px' }} />
                </>
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '16px',
                  padding: '2px 4px'
                }}
                title="Close"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '16px' }}>
            {/* Error Message */}
            {error && (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '8px 10px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  color: '#dc2626',
                  fontSize: '12px'
                }}
              >
                {error}
              </div>
            )}

            {/* Current PF Code */}
            {currentItem.pfCode && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                  Current PF Code
                </label>
                <div
                  style={{
                    padding: '8px 10px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    color: '#374151'
                  }}
                >
                  {currentItem.pfCode}
                </div>
              </div>
            )}

            {/* Vendor Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Vendor
              </label>
              <VendorDropdownField
                value={vendorId}
                onChange={handleVendorChange}
                onAddVendorClick={() => setIsAddVendorModalOpen(true)}
                placeholder="Select vendor..."
                />
            </div>

            {/* Order Type Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Order Type
              </label>
              <OrderTypeDropdownField
                value={orderType}
                onChange={(orderTypeName) => {
                  setOrderType(orderTypeName || '');
                }}
                placeholder="Select order type..."
              />
            </div>

            {/* Autosave Status */}
            {hasChanges && autoSaveEnabled && (
              <div
                style={{
                  padding: '8px 10px',
                  backgroundColor: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#ea580c',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#ea580c',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }}
                />
                Changes will be auto-saved in 300ms...
              </div>
            )}

            {/* Info */}
            {vendorId && (
              <div
                style={{
                  padding: '8px 10px',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#0369a1',
                  marginBottom: '16px'
                }}
              >
                PF code will be automatically generated when you save
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Add Vendor Modal */}
      <AddVendorModal
        isOpen={isAddVendorModalOpen}
        onClose={() => setIsAddVendorModalOpen(false)}
        onVendorAdded={handleVendorAdded}
      />

      {/* Inline keyframes for loading spinner and pulse animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>,
    document.body
  );
};

export default InlineEditPanel;