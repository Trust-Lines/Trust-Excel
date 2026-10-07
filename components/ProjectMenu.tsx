import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { PfGroup } from '../lib/pf-groups';
import { apiFetch } from '../lib/auth';

interface ProjectMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
  projectId: string;
  projectName: string;
  projectAddress?: string;
  projectTypes?: string[];
  projectBucket?: string;
  isUrgent?: boolean;
  enableGrouping?: boolean; // Projects tab only
  pfGroups?: PfGroup[];
  onOpenAddToGroup?: () => void;
  onDeleteProject: (projectId: string) => void;
  onToggleUrgent: (projectId: string, isUrgent: boolean) => void;
  onEditProject?: (projectId: string, field: 'name' | 'address' | 'types' | 'bucket', value: any) => void | Promise<void>;
}

const BUCKET_OPTIONS = [
  { value: 'TLINES_NE', label: 'TLines NE' },
  { value: 'TLINES_SE', label: 'TLines SE' },
  { value: 'TLINES_NW', label: 'TLines NW' },
  { value: 'CVW', label: 'TLines CVW' },
  { value: 'TLINES_HQ', label: 'TLines HQ' },
  { value: 'TLINES_TC', label: 'TLines TC' },
];

const TYPE_OPTIONS = ['Millwork', 'Shelving', 'Ceiling', 'Image', 'Furniture', 'Decoration'];

const ProjectMenu: React.FC<ProjectMenuProps> = ({
  isOpen,
  onClose,
  triggerRef,
  projectId,
  projectName,
  projectAddress = '',
  projectTypes = [],
  projectBucket = '',
  isUrgent = false,
  enableGrouping = false,
  pfGroups = [],
  onOpenAddToGroup,
  onDeleteProject,
  onToggleUrgent,
  onEditProject
}) => {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState<'name' | 'address' | 'types' | 'region' | 'group' | null>(null);
  const [editTypes, setEditTypes] = useState<string[]>(projectTypes);
  const [newCustomType, setNewCustomType] = useState('');
  const [customTypeError, setCustomTypeError] = useState<string | null>(null);
  const [addingCustomType, setAddingCustomType] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset state only when menu transitions from closed to open
  const [wasOpen, setWasOpen] = useState(false);
  useEffect(() => {
    if (isOpen && !wasOpen) {
      setEditMode(null);
      setEditTypes(projectTypes);
      setIsSaving(false);
    }
    setWasOpen(isOpen);
  }, [isOpen]);

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

  const handleDeleteClick = () => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete the project?\n\n"${projectName}"\n\nThis action cannot be undone and all project data will be permanently deleted.`
    );

    if (isConfirmed) {
      onDeleteProject(projectId);
      onClose();
    }
  };

  const handleUrgentToggle = () => {
    onToggleUrgent(projectId, !isUrgent);
    onClose();
  };

  // Create a new global custom type (name + auto short code) and check it in the list.
  const addCustomType = async () => {
    const name = newCustomType.trim();
    if (!name) return;
    const code = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
    if (!code) { setCustomTypeError('Name needs at least one letter or digit'); return; }
    if (editTypes.some(t => t.toLowerCase() === name.toLowerCase()) || TYPE_OPTIONS.some(t => t.toLowerCase() === name.toLowerCase())) {
      setCustomTypeError('This type already exists'); return;
    }
    setAddingCustomType(true);
    setCustomTypeError(null);
    try {
      const res = await apiFetch('/api/custom-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, code, isGlobal: true }) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to create custom type');
      }
      // Server returns the existing type when the name is already known — use its spelling
      const saved = await res.json().catch(() => null);
      const savedName: string = saved?.name || name;
      setEditTypes(prev => prev.some(t => t.toLowerCase() === savedName.toLowerCase()) ? prev : [...prev, savedName]);
      setNewCustomType('');
    } catch (err) {
      setCustomTypeError(err instanceof Error ? err.message : 'Failed to create custom type');
    } finally {
      setAddingCustomType(false);
    }
  };

  const handleSave = async (field: 'name' | 'address' | 'types' | 'bucket', value: any) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onEditProject?.(projectId, field, value);
      setEditMode(null);
      onClose();
    } catch (error) {
      console.error(`Failed to save ${field}:`, error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // Calculate position based on trigger element
  let position = { top: 0, left: 0 };
  if (triggerRef.current) {
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    position = {
      top: triggerRect.bottom + scrollTop + 4,
      left: triggerRect.left + scrollLeft
    };
  }

  return createPortal(
    <>
      {/* Invisible backdrop — click to close */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 24999,
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isSaving) onClose();
        }}
      />
      {/* Menu panel */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: `${position.top}px`,
          left: `${position.left}px`,
          backgroundColor: '#fff',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          minWidth: '200px',
          zIndex: 25000,
          opacity: isSaving ? 0.6 : 1,
          pointerEvents: isSaving ? 'none' : 'auto',
        }}
      >
        {/* Menu Items */}
        <div style={{ padding: '4px 0' }}>
          {/* Belge Hazırla */}
          <button
            onClick={() => { navigate(`/price-list?projectId=${projectId}`); onClose(); }}
            style={{ width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <span style={{ fontSize: '16px' }}>📋</span>
            Belge Hazırla
          </button>

          {/* Divider */}
          <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

          {/* Toggle Urgent */}
          <button
            onClick={handleUrgentToggle}
            style={{
              width: '100%',
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: isUrgent ? '#059669' : '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ fontSize: '16px' }}>{isUrgent ? '🔽' : '🔺'}</span>
            {isUrgent ? 'Remove Urgent' : 'Make Urgent'}
          </button>

          {enableGrouping && (
            <>
              <button
                onClick={() => { onOpenAddToGroup?.(); onClose(); }}
                style={{ width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ fontSize: '16px' }}>🏷️</span>
                {pfGroups.length === 0 ? 'Create Group' : 'Add to Group...'}
              </button>

              {/* Divider */}
              <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
            </>
          )}

          {/* Divider */}
          <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

          {/* Edit Name */}
          {editMode === 'name' ? (
            <div style={{ padding: '8px 16px' }}>
              <input
                autoFocus
                type="text"
                defaultValue={projectName}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    await handleSave('name', (e.target as HTMLInputElement).value);
                  }
                  if (e.key === 'Escape') setEditMode(null);
                }}
                style={{ width: '100%', padding: '4px 8px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>Press Enter to save</div>
            </div>
          ) : (
            <button onClick={() => setEditMode('name')} style={{ width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
              Edit Name
            </button>
          )}

          {/* Edit Address */}
          {editMode === 'address' ? (
            <div style={{ padding: '8px 16px' }}>
              <input
                autoFocus
                type="text"
                defaultValue={projectAddress}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    await handleSave('address', (e.target as HTMLInputElement).value);
                  }
                  if (e.key === 'Escape') setEditMode(null);
                }}
                style={{ width: '100%', padding: '4px 8px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>Press Enter to save</div>
            </div>
          ) : (
            <button onClick={() => setEditMode('address')} style={{ width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
              Edit Address
            </button>
          )}

          {/* Edit Types */}
          {editMode === 'types' ? (
            <div style={{ padding: '8px 16px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Select project types:</div>
              {/* Standard + custom types merged, no duplicates */}
              {(() => {
                const allOptions = [...TYPE_OPTIONS];
                // Add custom types from projectTypes that aren't in standard list
                projectTypes.forEach(t => {
                  if (!allOptions.includes(t)) allOptions.push(t);
                });
                return allOptions;
              })().map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editTypes.includes(t)}
                    onChange={() => {
                      setEditTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
                    }}
                  />
                  {t}
                  {!TYPE_OPTIONS.includes(t) && <span style={{ fontSize: '11px', color: '#999', marginLeft: '4px' }}>(custom)</span>}
                </label>
              ))}
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                <input
                  type="text"
                  value={newCustomType}
                  placeholder="New custom type"
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => { setNewCustomType(e.target.value); setCustomTypeError(null); }}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); addCustomType(); } }}
                  style={{ flex: 1, minWidth: 0, padding: '4px 8px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                />
                <button
                  onClick={addCustomType}
                  disabled={addingCustomType || !newCustomType.trim()}
                  style={{ padding: '4px 10px', fontSize: '13px', border: 'none', borderRadius: '4px', background: '#374151', color: '#fff', cursor: 'pointer' }}
                >
                  {addingCustomType ? '...' : 'Add'}
                </button>
              </div>
              {customTypeError && <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>{customTypeError}</div>}
              <button
                onClick={() => handleSave('types', editTypes)}
                disabled={isSaving}
                style={{
                  marginTop: '6px',
                  padding: '4px 12px',
                  fontSize: '13px',
                  backgroundColor: isSaving ? '#93c5fd' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isSaving ? 'not-allowed' : 'pointer'
                }}
              >
                {isSaving ? 'Saving...' : 'Save Types'}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditMode('types')} style={{ width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
              Edit Types
            </button>
          )}

          {/* Move Region */}
          {editMode === 'region' ? (
            <div style={{ padding: '8px 16px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Move project to another region:</div>
              {BUCKET_OPTIONS.filter(b => b.value !== projectBucket).map(b => (
                <button
                  key={b.value}
                  onClick={() => handleSave('bucket', b.value)}
                  disabled={isSaving}
                  style={{ display: 'block', width: '100%', padding: '6px 8px', border: 'none', background: 'none', textAlign: 'left', cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: '13px', color: '#374151' }}
                  onMouseEnter={(e) => { if (!isSaving) e.currentTarget.style.backgroundColor = '#e5f3ff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => setEditMode('region')} style={{ width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
              Move Region
            </button>
          )}

          {/* Divider */}
          <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

          {/* Delete Project */}
          <button
            onClick={handleDeleteClick}
            style={{
              width: '100%',
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ fontSize: '16px' }}>🗑️</span>
            Delete Project
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

export default ProjectMenu;
