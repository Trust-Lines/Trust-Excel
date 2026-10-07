import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
  className?: string;
}

const PortalDropdown: React.FC<PortalDropdownProps> = ({
  isOpen,
  onClose,
  triggerRef,
  children,
  className = ''
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 280 });
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const [isPositioning, setIsPositioning] = useState(false);

  // 🚨 CRITICAL FIX: Calculate position using REAL measured height
  const calculatePosition = () => {
    if (!isOpen || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const gap = 6;
    const minWidth = 200;
    const maxDropdownHeight = 280;

    // Step 1: If we don't have measured height yet, position for initial measurement
    if (measuredHeight === null) {
      setIsPositioning(true);
      const initialPosition = {
        top: -1000, // Off-screen for measurement
        left: triggerRect.left,
        width: Math.max(triggerRect.width, minWidth),
        maxHeight: maxDropdownHeight
      };
      setPosition(initialPosition);
      return;
    }

    // Step 2: Calculate final position using real measured dimensions
    const dropdownHeight = measuredHeight;
    const dropdownWidth = measuredWidth || Math.max(triggerRect.width, minWidth);

    // Calculate preferred position (below input)
    const preferredTop = triggerRect.bottom + gap;
    const preferredBottom = preferredTop + dropdownHeight;

    // Determine if we need to flip above
    const flipped = preferredBottom > window.innerHeight;

    // Calculate final top position
    let finalTop: number;
    if (flipped) {
      finalTop = triggerRect.top - gap - dropdownHeight;
      // Clamp to viewport if still would overflow at top
      if (finalTop < 8) {
        finalTop = 8;
      }
    } else {
      finalTop = preferredTop;
    }

    // Clamp left position and width
    const finalLeft = Math.max(8, Math.min(triggerRect.left, window.innerWidth - dropdownWidth - 8));
    const finalWidth = Math.max(triggerRect.width, minWidth);

    // Calculate maxHeight to prevent overflow
    const availableSpace = window.innerHeight - finalTop - 8;
    const finalMaxHeight = Math.min(maxDropdownHeight, availableSpace);

    const position = {
      top: finalTop,
      left: finalLeft,
      width: finalWidth,
      maxHeight: finalMaxHeight
    };

    setPosition(position);
    setIsPositioning(false);

    // 🚨 MANDATORY PROOF LOGS
  };

  // 🚨 CRITICAL: Measure dropdown dimensions when first rendered
  useLayoutEffect(() => {
    if (isOpen && dropdownRef.current && isPositioning) {
      // Measure the real dimensions
      const rect = dropdownRef.current.getBoundingClientRect();
      setMeasuredHeight(rect.height);
      setMeasuredWidth(rect.width);


      // Trigger position calculation with measured dimensions
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }
  }, [isOpen, isPositioning]);

  useEffect(() => {
    // Reset measurements when opening dropdown
    if (isOpen) {
      setMeasuredHeight(null);
      setMeasuredWidth(null);
    }
    calculatePosition();
  }, [isOpen, triggerRef]);

  // Reposition on scroll/resize - Enhanced to handle nested scroll containers
  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => {
      // Use requestAnimationFrame to ensure we reposition after DOM updates
      requestAnimationFrame(() => {
        // If we don't have measurements yet, remeasure first
        if (measuredHeight === null && dropdownRef.current) {
          const rect = dropdownRef.current.getBoundingClientRect();
          setMeasuredHeight(rect.height);
          setMeasuredWidth(rect.width);
        }
        calculatePosition();
      });
    };

    // Listen to window events
    window.addEventListener('scroll', handleReposition, { passive: true });
    window.addEventListener('resize', handleReposition, { passive: true });

    // 🚨 ENHANCED: Listen to scroll events on all scrollable containers
    // Find all scrollable ancestors of the trigger element
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

    // Add listeners to scrollable containers
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
  }, [isOpen, triggerRef, measuredHeight]);

  // Global outside click handler
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      // Don't close if clicking inside the dropdown
      if (dropdownRef.current?.contains(target)) {
        return;
      }

      // Don't close if clicking on the trigger element
      if (triggerRef.current?.contains(target)) {
        return;
      }

      // Close on outside click
      onClose();
    };

    // Use mousedown instead of click for better reliability
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose, triggerRef]);

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

  // Focus management - DON'T auto-focus to prevent page jumping
  // Let the specific input fields handle their own focus

  if (!isOpen) return null;

  const dropdownStyle: React.CSSProperties = {
    position: 'fixed', // 🚨 CRITICAL FIX: Use fixed positioning for viewport-relative placement
    top: `${position.top}px`,
    left: `${position.left}px`,
    width: `${position.width}px`,
    maxHeight: `${position.maxHeight}px`, // 🚨 Use computed maxHeight
    overflowY: 'auto',
    zIndex: 99999, // 🚨 Very high z-index to appear above all content
    // 🚨 CRITICAL: Hide during initial measurement phase
    opacity: isPositioning ? 0 : 1,
    visibility: isPositioning ? 'hidden' : 'visible'
  };

  return createPortal(
    <div
      ref={dropdownRef}
      className={`portal-dropdown ${className}`}
      style={dropdownStyle}
      tabIndex={0}
      onMouseDown={(e) => e.stopPropagation()} // Prevent outside click when clicking inside
    >
      {children}
    </div>,
    document.body
  );
};

export default PortalDropdown;