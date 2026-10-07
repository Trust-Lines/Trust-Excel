import React, { useState, useEffect, useRef, useCallback } from 'react';
import AddVendorModal from './AddVendorModal';
import AnchoredDropdown from './ui/AnchoredDropdown';
import { Vendor, VendorOption, createVendorOptions } from '../types';
import { getVendors, updateVendor } from '../lib/projects';

interface CellVendorAutocompleteProps {
  value: string;                    // Current vendor display name
  onSave: (vendorId: string) => void;
  onCancel: () => void;
  onVendorEdited?: (vendorId: string, newCode: string, newName: string) => void;
  triggerRef: React.RefObject<HTMLDivElement>;
  itemId: string;                   // Backend item ID for updates
  projectId: string;
}

const CellVendorAutocomplete: React.FC<CellVendorAutocompleteProps> = ({
  value,
  onSave,
  onCancel,
  onVendorEdited,
  triggerRef,
  itemId: _itemId,
  projectId: _projectId
}) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUserTyped, setHasUserTyped] = useState(false);

  // Create vendor modal state
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [prefilledVendorName, setPrefilledVendorName] = useState('');

  // Inline edit state
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const editCodeRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Focus edit code input when editing starts
  useEffect(() => {
    if (editingVendorId && editCodeRef.current) {
      editCodeRef.current.focus();
      editCodeRef.current.select();
    }
  }, [editingVendorId]);

  const handleFocus = () => {
    if (!isDropdownOpen) {
      if (searchTerm.length >= 3) {
        filterVendors(searchTerm);
      } else if (vendors.length > 0) {
        setVendorOptions(createVendorOptions(vendors));
      }
      requestAnimationFrame(() => setIsDropdownOpen(true));
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDropdownOpen) {
      e.preventDefault();
      if (searchTerm.length >= 3) {
        filterVendors(searchTerm);
      } else if (vendors.length > 0) {
        setVendorOptions(createVendorOptions(vendors));
      }
      requestAnimationFrame(() => setIsDropdownOpen(true));
      if (inputRef.current) inputRef.current.focus();
    }
    // When dropdown is already open, don't preventDefault - allow native text selection
  };

  // Load vendors on mount
  useEffect(() => { loadVendors(); }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    if (isDropdownOpen) {
      debounceTimeoutRef.current = setTimeout(() => {
        if (searchQuery.length >= 3) {
          filterVendors(searchQuery);
        } else if (vendors.length > 0) {
          setVendorOptions(createVendorOptions(vendors));
        }
      }, 50);
    }

    return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
  }, [searchQuery, vendors, isDropdownOpen]);

  // Highlight current vendor
  useEffect(() => {
    if (isDropdownOpen && !hasUserTyped && vendorOptions.length > 0) {
      const currentIndex = vendorOptions.findIndex(option =>
        option.displayName === value || option.name === value || option.code === value
      );
      if (currentIndex >= 0) setSelectedIndex(currentIndex);
    }
  }, [isDropdownOpen, hasUserTyped, vendorOptions, value]);

  const loadVendors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const vendorList = await getVendors();
      setVendors(vendorList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendors');
    } finally {
      setIsLoading(false);
    }
  };

  const filterVendors = useCallback((query: string) => {
    if (!vendors.length) return;
    const allOptions = createVendorOptions(vendors);
    const filtered = allOptions.filter(vendor =>
      vendor.displayName.toLowerCase().includes(query.toLowerCase()) ||
      vendor.code.toLowerCase().includes(query.toLowerCase()) ||
      vendor.name.toLowerCase().includes(query.toLowerCase())
    );

    // YSM always at top
    const finalOptions: VendorOption[] = [];
    const ysmVendor = filtered.find(v => v.code === 'YSM');
    if (ysmVendor) finalOptions.push(ysmVendor);
    filtered.forEach(vendor => { if (vendor.code !== 'YSM') finalOptions.push(vendor); });

    setVendorOptions(finalOptions);
    setSelectedIndex(-1);
  }, [vendors]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setSearchQuery(newValue);
    setHasUserTyped(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingVendorId) return; // Don't interfere with edit inputs

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        onCancel();
        break;
      case 'Enter':
        e.preventDefault();
        if (isDropdownOpen && selectedIndex >= 0) {
          const allOptions = createDropdownOptions();
          if (allOptions[selectedIndex]) handleOptionSelect(allOptions[selectedIndex]);
        } else {
          onCancel();
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (isDropdownOpen && selectedIndex >= 0) {
          const allOptions = createDropdownOptions();
          if (allOptions[selectedIndex]) handleOptionSelect(allOptions[selectedIndex]);
        } else {
          onCancel();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (isDropdownOpen) {
          const allOptions = createDropdownOptions();
          setSelectedIndex(prev => Math.min(prev + 1, allOptions.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isDropdownOpen) setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
    }
  };

  const shouldShowCreateOption = (): boolean => {
    if (!searchTerm || searchTerm.length < 2) return false;
    // Show create option when no exact match exists
    const exactMatch = vendorOptions.find(v =>
      v.name.toLowerCase() === searchTerm.toLowerCase() ||
      v.code.toLowerCase() === searchTerm.toLowerCase() ||
      v.displayName.toLowerCase() === searchTerm.toLowerCase()
    );
    return !exactMatch;
  };

  const createDropdownOptions = () => {
    const options = [...vendorOptions];
    if (shouldShowCreateOption()) {
      const vendorName = searchTerm.trim();
      options.push({
        id: 'create-vendor',
        code: 'CREATE',
        name: vendorName,
        displayName: `+ Create new vendor "${vendorName}"`,
      } as VendorOption);
    }
    return options;
  };

  const handleOptionSelect = (option: VendorOption) => {
    if (editingVendorId) return; // Don't select while editing

    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    setSearchQuery('');
    setHasUserTyped(false);
    setSearchTerm(option.displayName);

    if (option.id === 'create-vendor') {
      const vendorName = option.name;
      setPrefilledVendorName(vendorName);
      setIsAddVendorModalOpen(true);
    } else {
      onSave(option.id);
    }
  };

  const handleVendorAdded = async (newVendor: Vendor) => {
    setIsAddVendorModalOpen(false);
    setPrefilledVendorName('');
    await loadVendors();
    setSearchTerm(`${newVendor.code} - ${newVendor.name}`);
    setIsDropdownOpen(false);
    onSave(newVendor.id);
  };

  // Start editing a vendor
  const startEdit = (vendor: VendorOption, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fullVendor = vendors.find(v => v.id === vendor.id);
    if (!fullVendor) return;
    setEditingVendorId(vendor.id);
    setEditCode(fullVendor.code);
    setEditName(fullVendor.name);
  };

  // Save vendor edit
  const saveEdit = async () => {
    if (!editingVendorId || isSavingEdit) return;
    const trimCode = editCode.trim().toUpperCase();
    const trimName = editName.trim();
    if (!trimCode || !trimName) { setEditingVendorId(null); return; }

    const original = vendors.find(v => v.id === editingVendorId);
    if (original && original.code === trimCode && original.name === trimName) {
      setEditingVendorId(null);
      return;
    }

    setIsSavingEdit(true);
    try {
      await updateVendor(editingVendorId, { code: trimCode, name: trimName });

      // Update local vendors list
      setVendors(prev => prev.map(v => v.id === editingVendorId ? { ...v, code: trimCode, name: trimName } : v));

      // Refresh options
      const updatedOptions = createVendorOptions(
        vendors.map(v => v.id === editingVendorId ? { ...v, code: trimCode, name: trimName } : v)
      );
      setVendorOptions(updatedOptions);

      setEditingVendorId(null);

      // Notify parent for instant UI refresh
      if (onVendorEdited) onVendorEdited(editingVendorId, trimCode, trimName);
    } catch (error) {
      console.error('Failed to update vendor:', error);
      alert(error instanceof Error ? error.message : 'Failed to update vendor');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && (
      relatedTarget.closest('[data-vendor-autocomplete]') ||
      relatedTarget.closest('[role="dialog"]') ||
      relatedTarget.closest('.vendor-dropdown') ||
      relatedTarget.closest('.vendor-modal') ||
      relatedTarget.closest('.anchored-dropdown')
    )) return;

    setTimeout(() => {
      const currentActiveElement = document.activeElement;
      const isInsideVendorUI = currentActiveElement && (
        inputRef.current?.contains(currentActiveElement) ||
        triggerRef.current?.contains(currentActiveElement) ||
        currentActiveElement.closest('[data-vendor-autocomplete]') ||
        currentActiveElement.closest('.vendor-dropdown') ||
        currentActiveElement.closest('.anchored-dropdown') ||
        currentActiveElement.closest('.vendor-modal')
      );
      if (isInsideVendorUI) return;
      if (!isDropdownOpen && !isAddVendorModalOpen) onCancel();
    }, 0);
  };

  const dropdownOptions = createDropdownOptions();

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onPointerDown={handlePointerDown}
        className="cell-vendor-autocomplete"
        placeholder="Select or type to filter..."
        data-vendor-autocomplete="input"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          padding: '8px 12px',
          fontSize: '14px',
          background: 'white',
          borderRadius: '2px',
          boxShadow: '0 0 0 2px #007bff',
          boxSizing: 'border-box',
          fontFamily: 'inherit'
        }}
      />

      <AnchoredDropdown
        isOpen={isDropdownOpen}
        onClose={() => {
          if (editingVendorId) return; // Don't close while editing
          setIsDropdownOpen(false);
        }}
        triggerRef={triggerRef}
        field="vendor"
        minWidth={320}
        maxHeight={350}
        className="vendor-dropdown"
      >
        <div data-vendor-autocomplete="dropdown" style={{ padding: '4px 0' }}>
          {isLoading && (
            <div style={{ padding: '12px 16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
              Loading vendors...
            </div>
          )}

          {error && (
            <div style={{ padding: '12px 16px', textAlign: 'center', color: '#dc2626', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {!isLoading && !error && dropdownOptions.length === 0 && (
            <div style={{ padding: '12px 16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
              {vendors.length === 0 ? 'Loading vendors...' : 'No vendors available'}
            </div>
          )}

          {!isLoading && !error && dropdownOptions.map((option, index) => {
            const isEditing = editingVendorId === option.id;

            if (isEditing) {
              return (
                <div
                  key={option.id}
                  data-vendor-autocomplete="edit-row"
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#fffbeb',
                    borderLeft: '4px solid #f59e0b',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      ref={editCodeRef}
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
                        else if (e.key === 'Escape') { e.preventDefault(); setEditingVendorId(null); }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      disabled={isSavingEdit}
                      placeholder="Code"
                      style={{
                        width: '70px',
                        padding: '3px 6px',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        fontSize: '12px',
                        fontWeight: '600',
                        outline: 'none',
                      }}
                    />
                    <span style={{ color: '#9ca3af' }}>-</span>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
                        else if (e.key === 'Escape') { e.preventDefault(); setEditingVendorId(null); }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      disabled={isSavingEdit}
                      placeholder="Name"
                      style={{
                        flex: 1,
                        padding: '3px 6px',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                    <button
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); saveEdit(); }}
                      disabled={isSavingEdit}
                      style={{
                        padding: '2px 8px', border: '1px solid #16a34a', borderRadius: '3px',
                        fontSize: '11px', backgroundColor: '#16a34a', color: 'white',
                        cursor: isSavingEdit ? 'wait' : 'pointer', opacity: isSavingEdit ? 0.6 : 1,
                      }}
                    >
                      {isSavingEdit ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingVendorId(null); }}
                      disabled={isSavingEdit}
                      style={{
                        padding: '2px 8px', border: '1px solid #d1d5db', borderRadius: '3px',
                        fontSize: '11px', backgroundColor: 'white', color: '#6b7280', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={option.id}
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
                  backgroundColor: selectedIndex === index ? '#e5f3ff' : 'transparent',
                  color: option.id === 'create-vendor' ? '#059669' : '#374151',
                  fontWeight: option.code === 'YSM' ? '600' : 'normal',
                  borderLeft: option.code === 'YSM' ? '4px solid #fbbf24' : '4px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {option.id === 'create-vendor' ? (
                  <>
                    <span style={{ color: '#059669', fontWeight: 'bold' }}>+</span>
                    <span style={{ flex: 1 }}>{option.displayName}</span>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1 }}>{option.displayName}</span>
                    <button
                      onMouseDown={(e) => startEdit(option, e)}
                      title="Edit vendor code/name"
                      style={{
                        padding: '2px 6px', border: '1px solid #d1d5db', borderRadius: '3px',
                        fontSize: '10px', backgroundColor: 'white', color: '#6b7280',
                        cursor: 'pointer', opacity: 0.5, lineHeight: 1,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
                    >
                      ✎
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </AnchoredDropdown>

      <AddVendorModal
        isOpen={isAddVendorModalOpen}
        onClose={() => { setIsAddVendorModalOpen(false); setPrefilledVendorName(''); }}
        onVendorAdded={handleVendorAdded}
        prefilledName={prefilledVendorName}
      />
    </>
  );
};

export default CellVendorAutocomplete;
