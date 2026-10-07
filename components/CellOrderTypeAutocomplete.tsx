import React, { useState, useEffect, useRef, useCallback } from 'react';
import AnchoredDropdown from './ui/AnchoredDropdown';
import { getOrderTypes, createOrderType, OrderType } from '../lib/projects';

interface CellOrderTypeAutocompleteProps {
  value: string;
  onSave: (orderType: string) => void;
  onCancel: () => void;
  triggerRef: React.RefObject<HTMLDivElement>;
  itemId: string;
  projectId: string;
}

interface OrderTypeOption {
  value: string;
  label: string;
  isCustom?: boolean;
}

const CellOrderTypeAutocomplete: React.FC<CellOrderTypeAutocompleteProps> = ({
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
  const [orderTypeOptions, setOrderTypeOptions] = useState<OrderTypeOption[]>([]);
  const [backendOrderTypes, setBackendOrderTypes] = useState<OrderType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Load order types on mount
  useEffect(() => {
    loadOrderTypes();
  }, []);

  // Load order types from backend
  const loadOrderTypes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const orderTypes = await getOrderTypes();
      setBackendOrderTypes(orderTypes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order types');
      console.error('❌ Failed to load order types:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ✨ FIXED: Only filter when user has actually typed, not on initial value
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // ✨ Filter based on searchQuery (what user typed), not searchTerm (display value)
    debounceTimeoutRef.current = setTimeout(() => {
      filterOrderTypes(searchQuery);
    }, 50);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, backendOrderTypes]);

  // ✨ FIXED: Highlight currently selected option in dropdown on open
  useEffect(() => {
    if (isDropdownOpen && !hasUserTyped && orderTypeOptions.length > 0) {
      // Find current value in the options list
      const currentIndex = orderTypeOptions.findIndex(option =>
        option.label === value || option.value === value
      );
      if (currentIndex >= 0) {
        setSelectedIndex(currentIndex);
      }
    }
  }, [isDropdownOpen, hasUserTyped, orderTypeOptions, value]);

  // ✨ IMPROVED: Filter order types, showing all when query is empty
  const filterOrderTypes = useCallback((query: string) => {
    // Use only backend order types (persistent, tenant-scoped)
    const allOrderTypeNames = backendOrderTypes.map(ot => ot.name);

    let filteredNames: string[];

    if (!query || query.trim() === '') {
      // ✨ Show ALL options when no search term (proper dropdown behavior)
      filteredNames = allOrderTypeNames;
    } else {
      // Filter by search term
      filteredNames = allOrderTypeNames.filter(name =>
        name.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Create options from filtered list
    const standardOptions: OrderTypeOption[] = filteredNames.map(name => ({
      value: name,
      label: name
    }));

    // Check if current search matches exactly
    const exactMatch = standardOptions.find(option =>
      option.value.toLowerCase() === query.toLowerCase()
    );

    const finalOptions = [...standardOptions];

    // Add "Create order type" option if no exact match and query length >= 2
    if (!exactMatch && query.length >= 2) {
      finalOptions.push({
        value: query,
        label: `+ Add order type "${query}"`,
        isCustom: true
      });
    }

    setOrderTypeOptions(finalOptions);
    setSelectedIndex(-1);

  }, [backendOrderTypes]);

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
        if (isDropdownOpen && selectedIndex >= 0 && orderTypeOptions[selectedIndex]) {
          handleOptionSelect(orderTypeOptions[selectedIndex]);
        } else {
          onCancel();
        }
        break;

      case 'Tab':
        e.preventDefault();
        if (isDropdownOpen && selectedIndex >= 0 && orderTypeOptions[selectedIndex]) {
          handleOptionSelect(orderTypeOptions[selectedIndex]);
        } else {
          onCancel();
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (isDropdownOpen) {
          const maxIndex = orderTypeOptions.length - 1;
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

  // ✨ FIXED: Handle option selection - reset search state
  const handleOptionSelect = async (option: OrderTypeOption) => {

    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    setSearchQuery(''); // ✨ Reset search query
    setHasUserTyped(false); // ✨ Reset user typing flag
    setSearchTerm(option.label); // ✨ Update display value

    if (option.isCustom) {
      try {
        await createOrderType({ name: option.value });

        // Refresh order types list
        await loadOrderTypes();
      } catch (err) {
        console.error('❌ Failed to create order type:', err);

      }
    }

    // Save the order type value
    onSave(option.value);
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;


    // Don't close if clicking on dropdown, modal, or any order-type-related element
    if (relatedTarget && (
      relatedTarget.closest('[data-order-type-autocomplete]') ||
      relatedTarget.closest('[role="dialog"]') ||
      relatedTarget.closest('.order-type-dropdown') ||
      relatedTarget.closest('.anchored-dropdown')
    )) {
      return;
    }

    // Delay and check if dropdown is still open to avoid interfering
    setTimeout(() => {
      if (!isDropdownOpen) {
        onCancel();
      } else {
      }
    }, 150);
  };

  return (
    <>
      {/* INLINE INPUT for order type */}
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="cell-order-type-autocomplete"
        placeholder="Select or type to filter..."
        data-order-type-autocomplete="input"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          padding: '8px 12px',
          fontSize: '14px',
          background: 'white',
          borderRadius: '2px',
          boxShadow: '0 0 0 2px #059669',
          boxSizing: 'border-box',
          fontFamily: 'inherit'
        }}
      />

      {/* SHARED ANCHORED DROPDOWN for order type options */}
      <AnchoredDropdown
        isOpen={isDropdownOpen}
        onClose={() => {
          setIsDropdownOpen(false);
        }}
        triggerRef={triggerRef}
        field="orderType"
        minWidth={200}
        maxHeight={280}
        className="order-type-dropdown"
      >
        <div data-order-type-autocomplete="dropdown" style={{ padding: '4px 0' }}>
          {/* Loading state */}
          {isLoading && (
            <div style={{
              padding: '12px 16px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              Loading order types...
            </div>
          )}

          {/* Error state */}
          {error && (
            <div style={{
              padding: '12px 16px',
              textAlign: 'center',
              color: '#dc2626',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* No results */}
          {!isLoading && !error && orderTypeOptions.length === 0 && (
            <div style={{
              padding: '12px 16px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              No matching order types found
            </div>
          )}

          {/* Order type options */}
          {!isLoading && !error && orderTypeOptions.map((option, index) => (
            <div
              key={`${option.value}-${index}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOptionSelect(option);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                backgroundColor: selectedIndex === index ? '#ecfdf5' : 'transparent',
                color: option.isCustom ? '#059669' : '#374151',
                fontWeight: option.isCustom ? '500' : 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {option.isCustom && (
                <span style={{ color: '#059669', fontWeight: 'bold' }}>+</span>
              )}
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      </AnchoredDropdown>
    </>
  );
};

export default CellOrderTypeAutocomplete;