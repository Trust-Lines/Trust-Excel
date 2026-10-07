import React, { useState, useRef, useEffect } from 'react';
import AnchoredDropdown from './ui/AnchoredDropdown';
import { getOrderTypes, createOrderType, OrderType } from '../lib/projects';
import { usePagePermissions } from '../hooks/usePagePermissions';

interface OrderTypeDropdownFieldProps {
  value?: string; // Selected order type name
  onChange: (orderTypeName: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const OrderTypeDropdownField: React.FC<OrderTypeDropdownFieldProps> = ({
  value,
  onChange,
  placeholder = 'Select order type...',
  className = '',
  disabled = false
}) => {
  const { canManageMasterData } = usePagePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter order types based on search term
  const filteredOrderTypes = searchTerm
    ? orderTypes.filter(orderType =>
        orderType.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : orderTypes;

  // Load order types on mount
  useEffect(() => {
    loadOrderTypes();
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const loadOrderTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const orderTypeData = await getOrderTypes();
      setOrderTypes(orderTypeData);
    } catch (err) {
      console.error('❌ Failed to load order types:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order types');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerClick = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    setSearchTerm('');
  };

  const handleOrderTypeSelect = (orderType: OrderType) => {

    // Close dropdown immediately
    setIsOpen(false);
    setSearchTerm('');

    // Apply selection immediately
    onChange(orderType.name);
  };

  const handleCreateOrderType = async (name: string) => {
    if (!canManageMasterData) {
      setError('You do not have permission to create order types');
      return;
    }

    try {
      setCreating(true);
      setError(null);


      const newOrderType = await createOrderType({ name: name.trim() });


      // Refresh order types list
      await loadOrderTypes();

      // Close dropdown and apply selection
      setIsOpen(false);
      setSearchTerm('');

      // Select the newly created order type
      onChange(newOrderType.name);

    } catch (err) {
      console.error('❌ Failed to create order type:', err);
      setError(err instanceof Error ? err.message : 'Failed to create order type');
    } finally {
      setCreating(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  // Check if search term matches any existing order type
  const searchTermExistsAsOrderType = (term: string): boolean => {
    if (!term || !term.trim()) return false;
    const normalizedTerm = term.toLowerCase().trim();
    return orderTypes.some(orderType =>
      orderType.name.toLowerCase() === normalizedTerm
    );
  };

  // Get display text for selected order type
  const displayText = value || placeholder;

  return (
    <div className={`order-type-dropdown-field ${className}`}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className={`order-type-dropdown-trigger ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
        style={{
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: disabled ? '#f5f5f5' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '36px'
        }}
      >
        <span
          style={{
            color: value ? '#000' : '#999',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {displayText}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {value && !disabled && (
            <button
              onClick={handleClear}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: '#999',
                fontSize: '14px'
              }}
              title="Clear selection"
            >
              ✕
            </button>
          )}
          <span style={{ color: '#999', fontSize: '12px' }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Shared Anchored Dropdown */}
      <AnchoredDropdown
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        triggerRef={triggerRef}
        field="orderType"
        minWidth={250}
        maxHeight={280}
        className="order-type-dropdown-field"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '0'
          }}
        >
          {/* Search Input */}
          <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search order types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ddd',
                borderRadius: '2px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Content */}
          <div style={{ overflow: 'auto', maxHeight: '180px', flex: 1 }}>
            {loading && (
              <div style={{ padding: '12px', textAlign: 'center', color: '#999' }}>
                Loading order types...
              </div>
            )}

            {error && (
              <div style={{ padding: '12px', color: '#dc3545', fontSize: '14px' }}>
                {error}
                <button
                  onClick={loadOrderTypes}
                  style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    border: '1px solid #dc3545',
                    background: 'none',
                    color: '#dc3545',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Create New Option - Show when user typed something that doesn't match existing order types */}
            {!loading && !error && canManageMasterData && searchTerm && filteredOrderTypes.length === 0 && !searchTermExistsAsOrderType(searchTerm) && (
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCreateOrderType(searchTerm);
                }}
                style={{
                  padding: '10px 12px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  backgroundColor: '#f0f9ff',
                  borderLeft: '3px solid #1976d2',
                  color: creating ? '#999' : '#1976d2',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (!creating) {
                    e.currentTarget.style.backgroundColor = '#e3f2fd';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                }}
              >
                {creating ? (
                  <span>Creating...</span>
                ) : (
                  <>
                    <span style={{ fontSize: '16px' }}>+</span>
                    Create new: "{searchTerm}"
                  </>
                )}
              </div>
            )}

            {!loading && !error && filteredOrderTypes.length === 0 && searchTerm && (searchTermExistsAsOrderType(searchTerm) || !canManageMasterData) && (
              <div style={{ padding: '12px', color: '#999', fontSize: '14px' }}>
                No order types found matching "{searchTerm}"
              </div>
            )}

            {!loading && !error && filteredOrderTypes.length === 0 && !searchTerm && (
              <div style={{ padding: '12px', color: '#999', fontSize: '14px' }}>
                No order types available
              </div>
            )}

            {/* Order Type Options */}
            {filteredOrderTypes.map((orderType) => (
              <div
                key={orderType.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOrderTypeSelect(orderType);
                }}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  backgroundColor: value === orderType.name ? '#e3f2fd' : 'transparent',
                  borderLeft: value === orderType.name ? '3px solid #1976d2' : '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = value === orderType.name ? '#e3f2fd' : '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = value === orderType.name ? '#e3f2fd' : 'transparent';
                }}
              >
                <div style={{ fontWeight: '500', fontSize: '14px' }}>
                  {orderType.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnchoredDropdown>
    </div>
  );
};

export default OrderTypeDropdownField;