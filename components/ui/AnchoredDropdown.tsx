import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface AnchoredDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
  children: React.ReactNode;
  className?: string;
  field: 'vendor' | 'poSignStatus' | 'pfSignStatus' | 'orderType' | 'status' | 'containerNo' | 'paymentRule';
  minWidth?: number;
  maxWidth?: number;
  maxHeight?: number;
  gap?: number;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const AnchoredDropdown: React.FC<AnchoredDropdownProps> = ({
  isOpen,
  onClose,
  triggerRef,
  children,
  className = '',
  field,
  minWidth = 200,
  maxWidth,
  maxHeight = 300,
  gap = 6
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<DropdownPosition>({ top: -9999, left: 0, width: 0, maxHeight });

  const computePosition = (): DropdownPosition => {
    if (!triggerRef.current) return { top: -9999, left: 0, width: 0, maxHeight };

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const maxAllowedWidth = maxWidth || window.innerWidth - 16;
    const finalWidth = Math.min(Math.max(triggerRect.width, minWidth), maxAllowedWidth);
    const finalLeft = Math.max(8, Math.min(triggerRect.left, window.innerWidth - finalWidth - 8));

    const preferredTop = triggerRect.bottom + gap;
    const flipped = preferredTop + maxHeight > window.innerHeight;

    let finalTop = flipped
      ? Math.max(8, triggerRect.top - gap - maxHeight)
      : preferredTop;

    const availableSpace = window.innerHeight - finalTop - 8;
    const finalMaxHeight = Math.min(maxHeight, Math.max(availableSpace, 100));

    return { top: finalTop, left: finalLeft, width: finalWidth, maxHeight: finalMaxHeight };
  };

  // Compute position synchronously before browser paint — no measurement phase, no flicker
  useLayoutEffect(() => {
    if (isOpen) {
      setPosition(computePosition());
    }
  }, [isOpen, triggerRef, gap, maxHeight, minWidth, maxWidth]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => {
      setPosition(computePosition());
    };

    window.addEventListener('scroll', handleReposition, { passive: true });
    window.addEventListener('resize', handleReposition, { passive: true });

    const scrollableContainers: Element[] = [];
    if (triggerRef.current) {
      let element = triggerRef.current.parentElement;
      while (element && element !== document.body) {
        const style = window.getComputedStyle(element);
        if (style.overflow === 'auto' || style.overflow === 'scroll' ||
            style.overflowY === 'auto' || style.overflowY === 'scroll' ||
            style.overflowX === 'auto' || style.overflowX === 'scroll') {
          scrollableContainers.push(element);
        }
        element = element.parentElement;
      }
    }

    scrollableContainers.forEach(container => {
      container.addEventListener('scroll', handleReposition, { passive: true });
    });

    return () => {
      window.removeEventListener('scroll', handleReposition);
      window.removeEventListener('resize', handleReposition);
      scrollableContainers.forEach(container => {
        container.removeEventListener('scroll', handleReposition);
      });
    };
  }, [isOpen, triggerRef, gap, maxHeight, minWidth, maxWidth]);

  // 🚨 ENHANCED: Global outside click handler with composedPath and better timing
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node;


      // Use composedPath if available for better shadow DOM support
      const eventPath = event.composedPath ? event.composedPath() : [target];
      const elementsInPath = eventPath.filter(el => el instanceof Element) as Element[];

      // Don't close if clicking inside the dropdown
      if (dropdownRef.current && elementsInPath.some(el => dropdownRef.current?.contains(el))) {
        return;
      }

      // Don't close if clicking on the trigger element
      if (triggerRef.current && elementsInPath.some(el => triggerRef.current?.contains(el))) {
        return;
      }

      // Don't close if clicking on any vendor-related UI (for vendor dropdowns)
      if (field === 'vendor') {
        const hasVendorUI = elementsInPath.some(el =>
          el.closest?.('[data-vendor-autocomplete]') ||
          el.closest?.('.vendor-dropdown') ||
          el.closest?.('.vendor-modal') ||
          el.closest?.('.anchored-dropdown')
        );
        if (hasVendorUI) {
          return;
        }
      }

      // Don't close if clicking on status-option (for PO/PF sign status dropdowns)
      if (field === 'poSignStatus' || field === 'pfSignStatus') {
        const isStatusOption = elementsInPath.some(el =>
          el.classList?.contains('status-option') ||
          el.closest?.('.status-option')
        );
        if (isStatusOption) {
          return;
        }
      }

      // Don't close if clicking on any order-type-related UI (for order type dropdowns)
      if (field === 'orderType') {
        const hasOrderTypeUI = elementsInPath.some(el =>
          el.closest?.('[data-order-type-autocomplete]') ||
          el.closest?.('.order-type-dropdown') ||
          el.closest?.('.anchored-dropdown')
        );
        if (hasOrderTypeUI) {
          return;
        }
      }

      // Don't close if clicking on any status-related UI (for status dropdowns)
      if (field === 'status') {
        const hasStatusUI = elementsInPath.some(el =>
          el.closest?.('[data-status-autocomplete]') ||
          el.closest?.('.status-dropdown') ||
          el.closest?.('.anchored-dropdown')
        );
        if (hasStatusUI) {
          return;
        }
      }

      // Don't close if clicking on any container-related UI (for container dropdowns)
      if (field === 'containerNo') {
        const hasContainerUI = elementsInPath.some(el =>
          el.closest?.('.container-cell-editor') ||
          el.closest?.('.container-dropdown') ||
          el.closest?.('.container-options') ||
          el.closest?.('.container-option') ||
          el.closest?.('.container-cell-display') ||
          el.closest?.('.anchored-dropdown')
        );
        if (hasContainerUI) {
          return;
        }
      }

      // Don't close if clicking on any payment-rule-related UI (for payment rule dropdowns)
      if (field === 'paymentRule') {
        const hasPaymentRuleUI = elementsInPath.some(el =>
          el.closest?.('.payment-rule-dropdown-editor') ||
          el.closest?.('.payment-rule-option') ||
          el.closest?.('.anchored-dropdown')
        );
        if (hasPaymentRuleUI) {
          return;
        }
      }

      // Close on outside click
      onClose();
    };

    // 🚨 CRITICAL FIX: Use both mousedown and pointerdown with capture for better compatibility
    document.addEventListener('mousedown', handleOutsideClick, true);
    document.addEventListener('pointerdown', handleOutsideClick, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick, true);
      document.removeEventListener('pointerdown', handleOutsideClick, true);
    };
  }, [isOpen, onClose, triggerRef, field]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const dropdownStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${position.top}px`,
    left: `${position.left}px`,
    width: `${position.width}px`,
    maxHeight: `${position.maxHeight}px`,
    overflowY: 'auto',
    zIndex: 99999,
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  };

  return createPortal(
    <div
      ref={dropdownRef}
      className={`anchored-dropdown ${className}`}
      style={dropdownStyle}
      tabIndex={0}
      onMouseDown={(e) => e.stopPropagation()} // Prevent outside click when clicking inside
    >
      {children}
    </div>,
    document.body
  );
};

export default AnchoredDropdown;