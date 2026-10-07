import React, { useState, useRef, useEffect } from 'react';
import AnchoredDropdown from './ui/AnchoredDropdown';
import { Vendor, VendorOption, createVendorOptions, findVendorById } from '../types';
import { getVendors, createVendor } from '../lib/projects';
import { usePagePermissions } from '../hooks/usePagePermissions';

interface VendorDropdownFieldProps {
  value?: string; // Selected vendor ID
  onChange: (vendorId: string | null, vendor: Vendor | null) => void;
  onAddVendorClick: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const VendorDropdownField: React.FC<VendorDropdownFieldProps> = ({
  value,
  onChange,
  onAddVendorClick,
  placeholder = 'Select vendor...',
  className = '',
  disabled = false
}) => {
  const { canManageMasterData } = usePagePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load vendors on mount
  useEffect(() => {
    loadVendors();
  }, []);

  // Update vendor options when vendors or search term changes
  useEffect(() => {
    if (vendors.length > 0) {
      const options = createVendorOptions(vendors);
      const filtered = searchTerm
        ? options.filter(option =>
            option.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : options;
      setVendorOptions(filtered);
    }
  }, [vendors, searchTerm]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const vendorData = await getVendors();
      setVendors(vendorData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerClick = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    setSearchTerm('');
  };

  const handleVendorSelect = (vendor: VendorOption) => {
    const fullVendor = findVendorById(vendors, vendor.id);

    // Close dropdown immediately
    setIsOpen(false);
    setSearchTerm('');

    // Apply selection immediately
    onChange(vendor.id, fullVendor || null);
  };

  const handleAddVendorClick = () => {
    setIsOpen(false);
    setSearchTerm('');
    onAddVendorClick();
  };

  const handleCreateVendor = async (code: string, name: string) => {
    if (!canManageMasterData) {
      setError('You do not have permission to create vendors');
      return;
    }

    try {
      setCreating(true);
      setError(null);


      const newVendor = await createVendor({ code: code.toUpperCase(), name });


      // Refresh vendor list
      await loadVendors();

      // Close dropdown and apply selection
      setIsOpen(false);
      setSearchTerm('');

      // Select the newly created vendor
      onChange(newVendor.id, newVendor);

    } catch (err) {
      console.error('❌ Failed to create vendor:', err);
      setError(err instanceof Error ? err.message : 'Failed to create vendor');
    } finally {
      setCreating(false);
    }
  };

  // Check if search term matches any existing vendor
  const searchTermExistsAsVendor = (term: string): boolean => {
    if (!term || !term.trim()) return false;
    const normalizedTerm = term.toLowerCase().trim();
    return vendors.some(vendor =>
      vendor.code.toLowerCase() === normalizedTerm ||
      vendor.name.toLowerCase() === normalizedTerm ||
      `${vendor.code} - ${vendor.name}`.toLowerCase() === normalizedTerm
    );
  };

  // Parse search term into code and name for new vendor creation
  const parseSearchTermForVendor = (term: string): { code: string; name: string } | null => {
    if (!term || !term.trim()) return null;

    const cleanTerm = term.trim();

    // If contains " - ", split into code and name
    if (cleanTerm.includes(' - ')) {
      const [code, ...nameParts] = cleanTerm.split(' - ');
      const name = nameParts.join(' - ');
      if (code && name) {
        return { code: code.trim(), name: name.trim() };
      }
    }

    // If it's short (3 chars or less), treat as code and ask for name
    if (cleanTerm.length <= 3) {
      return { code: cleanTerm.toUpperCase(), name: cleanTerm };
    }

    // Otherwise, use first 3 chars as code and full term as name
    return {
      code: cleanTerm.substring(0, 3).toUpperCase(),
      name: cleanTerm
    };
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
  };

  // Get display text for selected vendor
  const selectedVendor = value ? findVendorById(vendors, value) : null;
  const displayText = selectedVendor
    ? `${selectedVendor.code} - ${selectedVendor.name}`
    : placeholder;

  return (
    <div className={`vendor-dropdown-field ${className}`}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className={`vendor-dropdown-trigger ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
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
            color: selectedVendor ? '#000' : '#999',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {displayText}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {selectedVendor && !disabled && (
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
        field="vendor"
        minWidth={250}
        maxHeight={280}
        className="vendor-dropdown-field"
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
              placeholder="Search vendors..."
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
                Loading vendors...
              </div>
            )}

            {error && (
              <div style={{ padding: '12px', color: '#dc3545', fontSize: '14px' }}>
                {error}
                <button
                  onClick={loadVendors}
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

            {/* Create New Option - Show when user typed something that doesn't match existing vendors */}
            {!loading && !error && canManageMasterData && searchTerm && vendorOptions.length === 0 && !searchTermExistsAsVendor(searchTerm) && (
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const parsed = parseSearchTermForVendor(searchTerm);
                  if (parsed) {
                    handleCreateVendor(parsed.code, parsed.name);
                  }
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
                  <>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '16px' }}>+</span>
                    Create new: "{searchTerm}"
                  </>
                )}
              </div>
            )}

            {!loading && !error && vendorOptions.length === 0 && searchTerm && (searchTermExistsAsVendor(searchTerm) || !canManageMasterData) && (
              <div style={{ padding: '12px', color: '#999', fontSize: '14px' }}>
                No vendors found matching "{searchTerm}"
              </div>
            )}

            {!loading && !error && vendorOptions.length === 0 && !searchTerm && (
              <div style={{ padding: '12px', color: '#999', fontSize: '14px' }}>
                No vendors available
              </div>
            )}

            {/* Vendor Options */}
            {vendorOptions.map((vendor) => (
              <div
                key={vendor.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleVendorSelect(vendor);
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  backgroundColor: value === vendor.id ? '#e3f2fd' : 'transparent',
                  borderLeft: value === vendor.id ? '3px solid #1976d2' : '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = value === vendor.id ? '#e3f2fd' : '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = value === vendor.id ? '#e3f2fd' : 'transparent';
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {vendor.code}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>
                  {vendor.name}
                </div>
              </div>
            ))}
          </div>

          {/* Add New Vendor Button - Only show if user can manage master data */}
          {!loading && !error && canManageMasterData && (
            <div style={{ borderTop: '1px solid #eee' }}>
              <button
                onClick={handleAddVendorClick}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#1976d2',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ fontSize: '16px' }}>+</span>
                Add New Vendor
              </button>
            </div>
          )}
        </div>
      </AnchoredDropdown>
    </div>
  );
};

export default VendorDropdownField;