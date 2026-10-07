import React, { useEffect, useState, useRef, useCallback } from 'react';
import AnchoredDropdown from './ui/AnchoredDropdown';
import { renameContainerGlobally, getContainerNames } from '../lib/containers';

interface ContainerCellEditorProps {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  onRename?: (oldName: string, newName: string) => void;
  triggerRef?: React.RefObject<HTMLElement>;
}

// Default 20 container names
const DEFAULT_CONTAINERS = Array.from({ length: 20 }, (_, i) => `CONTAINER ${i + 1}`);

const ContainerCellEditor: React.FC<ContainerCellEditorProps> = ({
  value,
  onSave,
  onCancel,
  onRename,
  triggerRef
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [containerList, setContainerList] = useState<string[]>(DEFAULT_CONTAINERS);
  const [selectedNames, setSelectedNames] = useState<Set<string>>(() => {
    if (!value || !value.trim()) return new Set();
    return new Set(value.split(',').map(s => s.trim()).filter(Boolean));
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  // The cell itself is a real text input now — type directly instead of only
  // picking from the dropdown. A bare number ("23") shorthands to "CONTAINER 23".
  const [typedValue, setTypedValue] = useState(value || '');
  const normalizeContainers = (raw: string): string =>
    raw.split(',').map(s => s.trim()).filter(Boolean)
      .map(t => (/^\d+$/.test(t) ? `CONTAINER ${t}` : t.toUpperCase()))
      .join(', ');

  const localTriggerRef = useRef<HTMLInputElement>(null);
  const effectiveTriggerRef = triggerRef || localTriggerRef;
  const dropdownOpenedRef = useRef(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Open dropdown immediately
  useEffect(() => {
    setIsDropdownOpen(true);
    dropdownOpenedRef.current = true;
  }, []);

  // Pull in every container name actually in use (e.g. "CONTAINER 23" typed on
  // some other row) so the picker list isn't stuck at the fixed 1–20 defaults.
  useEffect(() => {
    getContainerNames().then(names => {
      if (!names.length) return;
      setContainerList(prev => [...new Set([...prev, ...names])]);
    });
  }, []);

  // This editor only exists because the cell click already fired — the browser's
  // native click-to-focus can't reach an input that didn't exist yet at click time,
  // so it has to be focused explicitly once it mounts.
  useEffect(() => {
    localTriggerRef.current?.focus();
    localTriggerRef.current?.select();
  }, []);

  // Focus edit input when editing
  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  const toggleContainer = useCallback((name: string) => {
    setSelectedNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      setTypedValue(Array.from(next).join(', ')); // keep the typed-text box in sync with checkbox picks
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    setIsDropdownOpen(false);
    dropdownOpenedRef.current = false;
    onSave(normalizeContainers(typedValue));
  }, [typedValue, onSave]);

  const handleCancel = useCallback(() => {
    setIsDropdownOpen(false);
    dropdownOpenedRef.current = false;
    onCancel();
  }, [onCancel]);

  const handleDropdownClose = useCallback((reason?: string) => {
    if (!dropdownOpenedRef.current) return;
    if (editingIndex !== null || isRenaming) return;

    if (reason === 'escape' || reason === 'cancel') {
      handleCancel();
    } else {
      setTimeout(() => {
        if (dropdownOpenedRef.current && editingIndex === null && !isRenaming) {
          handleSave();
        }
      }, 100);
    }
  }, [handleSave, handleCancel, editingIndex, isRenaming]);

  const startRename = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingIndex(index);
    setEditValue(containerList[index]);
  }, [containerList]);

  const executeRename = useCallback(async () => {
    if (editingIndex === null) return;

    const rawEdit = editValue.trim();
    // Typing just a number ("23") is shorthand for "CONTAINER 23" — no need to type the full name.
    const newName = /^\d+$/.test(rawEdit) ? `CONTAINER ${rawEdit}` : rawEdit.toUpperCase();
    const oldName = containerList[editingIndex];

    if (!newName || newName === oldName) {
      setEditingIndex(null);
      return;
    }

    setIsRenaming(true);
    try {
      await renameContainerGlobally(oldName, newName);

      // Update local list
      setContainerList(prev => {
        const next = [...prev];
        next[editingIndex] = newName;
        return next;
      });

      // Update selection if old name was selected
      setSelectedNames(prev => {
        if (prev.has(oldName)) {
          const next = new Set(prev);
          next.delete(oldName);
          next.add(newName);
          return next;
        }
        return prev;
      });

      setEditingIndex(null);

      // Notify parent for instant UI refresh
      if (onRename) onRename(oldName, newName);
    } catch (error) {
      console.error('Failed to rename container:', error);
    } finally {
      setIsRenaming(false);
    }
  }, [editingIndex, editValue, containerList, onRename]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDropdownOpen || editingIndex !== null) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen, handleSave, handleCancel, editingIndex]);

  return (
    <div className="container-cell-editor">
      <input
        ref={localTriggerRef}
        value={typedValue}
        placeholder="CONTAINER"
        onChange={(e) => setTypedValue(e.target.value)}
        onFocus={() => {
          if (!dropdownOpenedRef.current) {
            setIsDropdownOpen(true);
            dropdownOpenedRef.current = true;
          }
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            const normalized = normalizeContainers(typedValue);
            setIsDropdownOpen(false);
            dropdownOpenedRef.current = false;
            onSave(normalized);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
          }
        }}
        style={{
          width: '100%',
          padding: '6px 8px',
          backgroundColor: 'white',
          color: typedValue ? '#000' : '#9ca3af',
          fontWeight: typedValue ? 500 : 400,
          cursor: 'text',
          border: '2px solid #2196f3',
          borderRadius: '2px',
          fontSize: '12px',
          fontFamily: 'inherit',
          minHeight: '28px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      <AnchoredDropdown
        isOpen={isDropdownOpen}
        onClose={handleDropdownClose}
        triggerRef={effectiveTriggerRef}
        field="containerNo"
        minWidth={280}
        maxHeight={400}
        className="container-dropdown"
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '400px' }}>
          {/* Header */}
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e9ecef',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            color: '#6c757d',
            letterSpacing: '0.5px',
            flex: '0 0 auto'
          }}>
            Select Containers
          </div>

          {/* Container list */}
          <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '4px 0', minHeight: 0 }}>
            {containerList.map((name, index) => {
              const isSelected = selectedNames.has(name);
              const isEditing = editingIndex === index;

              return (
                <div
                  key={index}
                  style={{
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                    borderLeft: isSelected ? '3px solid #1976d2' : '3px solid transparent',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isEditing) e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !isEditing) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Checkbox */}
                  <div
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (!isEditing) toggleContainer(name);
                    }}
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid',
                      borderColor: isSelected ? '#1976d2' : '#d1d5db',
                      borderRadius: '3px',
                      backgroundColor: isSelected ? '#1976d2' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      flex: '0 0 16px',
                    }}
                  >
                    {isSelected && '✓'}
                  </div>

                  {/* Name or edit input */}
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') { e.preventDefault(); executeRename(); }
                        else if (e.key === 'Escape') { e.preventDefault(); setEditingIndex(null); }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      disabled={isRenaming}
                      style={{
                        flex: 1,
                        padding: '2px 6px',
                        border: '1px solid #1976d2',
                        borderRadius: '3px',
                        fontSize: '12px',
                        outline: 'none',
                        backgroundColor: isRenaming ? '#f0f0f0' : 'white',
                      }}
                    />
                  ) : (
                    <span
                      onMouseDown={(e) => { e.preventDefault(); toggleContainer(name); }}
                      style={{
                        flex: 1,
                        cursor: 'pointer',
                        color: isSelected ? '#1976d2' : '#333',
                        fontWeight: isSelected ? '600' : 'normal',
                      }}
                    >
                      {name}
                    </span>
                  )}

                  {/* Edit / Save button */}
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '4px', flex: '0 0 auto' }}>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); executeRename(); }}
                        disabled={isRenaming}
                        style={{
                          padding: '2px 6px', border: '1px solid #16a34a', borderRadius: '3px',
                          fontSize: '10px', backgroundColor: '#16a34a', color: 'white',
                          cursor: isRenaming ? 'wait' : 'pointer', opacity: isRenaming ? 0.6 : 1,
                        }}
                      >
                        {isRenaming ? '...' : 'Save'}
                      </button>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingIndex(null); }}
                        disabled={isRenaming}
                        style={{
                          padding: '2px 6px', border: '1px solid #d1d5db', borderRadius: '3px',
                          fontSize: '10px', backgroundColor: 'white', color: '#6b7280', cursor: 'pointer',
                        }}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <button
                      onMouseDown={(e) => startRename(index, e)}
                      title="Rename"
                      style={{
                        padding: '2px 6px', border: '1px solid #d1d5db', borderRadius: '3px',
                        fontSize: '10px', backgroundColor: 'white', color: '#6b7280',
                        cursor: 'pointer', flex: '0 0 auto', opacity: 0.6,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
                    >
                      ✎
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #e9ecef',
            display: 'flex', gap: '8px', justifyContent: 'flex-end',
            flex: '0 0 auto', position: 'sticky', bottom: 0, zIndex: 1,
          }}>
            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleCancel(); }}
              style={{
                padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px',
                fontSize: '11px', backgroundColor: 'white', color: '#6b7280',
                cursor: 'pointer', fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleSave(); }}
              style={{
                padding: '4px 8px', border: '1px solid #1976d2', borderRadius: '4px',
                fontSize: '11px', backgroundColor: '#1976d2', color: 'white',
                cursor: 'pointer', fontWeight: '500'
              }}
            >
              Apply ({selectedNames.size})
            </button>
          </div>
        </div>
      </AnchoredDropdown>
    </div>
  );
};

export default ContainerCellEditor;
