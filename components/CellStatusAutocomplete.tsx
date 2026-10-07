import React, { useState, useEffect, useRef, useCallback } from 'react';
import AnchoredDropdown from './ui/AnchoredDropdown';
import { getStatusStyle } from '../utils/statusStyles';

interface CellStatusAutocompleteProps {
  value: string;
  onSave: (status: string) => void;
  onCancel: () => void;
  triggerRef: React.RefObject<HTMLDivElement>;
  itemId: string;
  projectId: string;
}

interface StatusOption {
  value: string;
  label: string;
  description?: string;
}

// Status options - matching backend enum values
const STATUS_OPTIONS: StatusOption[] = [
  { value: 'HOLD_T', label: 'HOLD / T', description: 'Hold - MR.T' },
  { value: 'HOLD_PM', label: 'HOLD / PM', description: 'Hold - Project Management' },
  { value: 'HOLD_BOOKS', label: 'HOLD BOOKS', description: 'Hold - books' },
  { value: 'NOT_ORDERED', label: 'NOT ORDERED', description: 'Not yet ordered' },
  { value: 'TO_ORDER', label: 'TO ORDER', description: 'Queued to be ordered' },
  { value: 'BOOKS_IN_PROGRESS', label: 'BOOKS IN PROGRESS', description: 'Order books being prepared' },
  { value: 'ORDERED', label: 'ORDERED', description: 'Ordered - STD will be set to today' },
  { value: 'WAITING_PAYMENT', label: 'WAITING PAYMENT', description: 'Waiting for payment' },
  { value: 'ASSEMBLY', label: 'ASSEMBLY', description: 'In assembly' },
  { value: 'READY_TO_RECEIVE', label: 'READY TO RECEIVE', description: 'Ready for delivery' },
  { value: 'RECEIVED', label: 'RECEIVED', description: 'Received at facility' },
  { value: 'READY', label: 'READY', description: 'Ready for installation - RDY will be set to today' },
  { value: 'SENT_TO_TLINES', label: 'SENT TO TLINES', description: 'Sent to TLines' },
  { value: 'PARTIAL_SENT', label: 'PARTIAL SENT', description: 'Partially sent' },
  { value: 'SENT', label: 'SENT', description: 'Fully sent' }
];

const CellStatusAutocomplete: React.FC<CellStatusAutocompleteProps> = ({
  value,
  onSave,
  onCancel,
  triggerRef,
  itemId: _itemId,
  projectId: _projectId
}) => {
  // ✨ FIXED: Separate display value from search query
  const [searchTerm, setSearchTerm] = useState(value || ''); // What shows in input
  const [searchQuery, setSearchQuery] = useState(''); // What actually filters the list
  const [isDropdownOpen, setIsDropdownOpen] = useState(true); // ✨ Open immediately
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>(STATUS_OPTIONS); // ✨ Show all options initially
  const [hasUserTyped, setHasUserTyped] = useState(false); // Track if user has actually typed

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Focus input on mount and select existing text
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // ✨ FIXED: Highlight currently selected option in dropdown on open
  useEffect(() => {
    if (isDropdownOpen && !hasUserTyped) {
      // Find current value in the options list (check both value and label)
      const currentIndex = statusOptions.findIndex(option =>
        option.label === value || option.value === value
      );
      if (currentIndex >= 0) {
        setSelectedIndex(currentIndex);
      }
    }
  }, [isDropdownOpen, hasUserTyped, statusOptions, value]);

  // ✨ FIXED: Only filter when user has actually typed, not on initial value
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // ✨ Filter based on searchQuery (what user typed), not searchTerm (display value)
    debounceTimeoutRef.current = setTimeout(() => {
      filterStatuses(searchQuery);
    }, 50);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // ✨ IMPROVED: Filter status options, showing all when query is empty
  const filterStatuses = useCallback((query: string) => {
    let filtered: StatusOption[];

    if (!query || query.trim() === '') {
      // ✨ Show ALL options when no search term (proper dropdown behavior)
      filtered = STATUS_OPTIONS;
    } else {
      // Filter based on search term
      filtered = STATUS_OPTIONS.filter(status =>
        status.label.toLowerCase().includes(query.toLowerCase()) ||
        status.value.toLowerCase().includes(query.toLowerCase()) ||
        (status.description && status.description.toLowerCase().includes(query.toLowerCase()))
      );
    }

    setStatusOptions(filtered);
    setSelectedIndex(-1);

  }, []);

  // ✨ FIXED: Handle input change - separate display from search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue); // Update display value
    setSearchQuery(newValue); // Update search filter
    setHasUserTyped(true); // Mark that user has typed
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        onCancel();
        break;

      case 'Enter':
        e.preventDefault();
        if (isDropdownOpen && selectedIndex >= 0 && statusOptions[selectedIndex]) {
          handleStatusSelect(statusOptions[selectedIndex]);
        } else {
          onCancel();
        }
        break;

      case 'Tab':
        e.preventDefault();
        if (isDropdownOpen && selectedIndex >= 0 && statusOptions[selectedIndex]) {
          handleStatusSelect(statusOptions[selectedIndex]);
        } else {
          onCancel();
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (isDropdownOpen) {
          const maxIndex = statusOptions.length - 1;
          setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isDropdownOpen) {
          setSelectedIndex(prev => Math.max(prev - 1, -1));
        }
        break;

      default:
        // Continue typing
        break;
    }
  };

  // ✨ FIXED: Handle status selection - reset search state
  const handleStatusSelect = (option: StatusOption) => {

    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    setSearchQuery(''); // ✨ Reset search query
    setHasUserTyped(false); // ✨ Reset user typing flag
    setSearchTerm(option.label); // ✨ Update display value

    // CRITICAL: ORDERED status auto-sets STD to today
    if (option.value === 'ORDERED') {
    }

    // Save the status value (backend will handle STD auto-set)
    onSave(option.value);
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;


    // Don't close if clicking on dropdown, modal, or any status-related element
    if (relatedTarget && (
      relatedTarget.closest('[data-status-autocomplete]') ||
      relatedTarget.closest('[role="dialog"]') ||
      relatedTarget.closest('.status-dropdown') ||
      relatedTarget.closest('.anchored-dropdown')
    )) {
      return;
    }

    // Use setTimeout(0) to check activeElement AFTER event cycle
    setTimeout(() => {
      const currentActiveElement = document.activeElement;

      // Check if focus moved to status-related elements
      const isInsideStatusUI = currentActiveElement && (
        inputRef.current?.contains(currentActiveElement) ||
        triggerRef.current?.contains(currentActiveElement) ||
        currentActiveElement.closest('[data-status-autocomplete]') ||
        currentActiveElement.closest('.status-dropdown') ||
        currentActiveElement.closest('.anchored-dropdown')
      );

      if (isInsideStatusUI) {
        return;
      }

      if (!isDropdownOpen) {
        onCancel();
      } else {
      }
    }, 0);
  };

  // Get status style using centralized system
  const getStatusStyleForOption = (statusLabel: string) => {
    return getStatusStyle(statusLabel);
  };

  return (
    <>
      {/* INLINE INPUT for status */}
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="cell-status-autocomplete"
        placeholder="Select or type to filter..."
        data-status-autocomplete="input"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          padding: '8px 12px',
          fontSize: '14px',
          background: 'white',
          borderRadius: '2px',
          boxShadow: '0 0 0 2px #2563eb',
          boxSizing: 'border-box',
          fontFamily: 'inherit'
        }}
      />

      {/* SHARED ANCHORED DROPDOWN for status options */}
      <AnchoredDropdown
        isOpen={isDropdownOpen}
        onClose={() => {
          setIsDropdownOpen(false);
        }}
        triggerRef={triggerRef}
        field="status"
        minWidth={250}
        maxHeight={300}
        className="status-dropdown"
      >
        <div data-status-autocomplete="dropdown" style={{ padding: '4px 0' }}>
          {/* No results */}
          {statusOptions.length === 0 && (
            <div style={{
              padding: '12px 16px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              No matching status found
            </div>
          )}

          {/* Status options */}
          {statusOptions.map((option, index) => (
            <div
              key={option.value}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleStatusSelect(option);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                backgroundColor: selectedIndex === index ? '#eff6ff' : 'transparent',
                borderLeft: `4px solid ${getStatusStyleForOption(option.label).backgroundColor}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{
                fontWeight: '500',
                color: 'black' // 🎨 YAZI HEP SİYAH
              }}>
                {option.label}
                {option.value === 'ORDERED' && (
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '12px',
                    fontWeight: 'normal',
                    color: 'black' // 🎨 YAZI HEP SİYAH
                  }}>
                    📅 (Sets STD to today)
                  </span>
                )}
              </div>
              {option.description && (
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {option.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </AnchoredDropdown>
    </>
  );
};

export default CellStatusAutocomplete;