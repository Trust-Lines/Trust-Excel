import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ProjectType } from '../types';

const SECTION_OPTIONS = [
  { value: 'TLINES_NE', label: 'TLines NE' },
  { value: 'TLINES_SE', label: 'TLines SE' },
  { value: 'TLINES_NW', label: 'TLines NW' },
  { value: 'CVW', label: 'TLines CVW' },
  { value: 'TLINES_HQ', label: 'TLines HQ' },
  { value: 'TLINES_TC', label: 'TLines TC' }
];

const DROPBOX_SECTIONS = ['1-Store Maker', '2-Premium Store Fitout', '3-Design & Build', '4-T Shop'];
const DROPBOX_REGIONS = ['T Lines CVW Projects', 'T Lines NE Projects', 'T Lines NW Projects', 'T Lines SE Projects'];
const DROPBOX_STATUSES = ['Under Working', 'Done'];
const DROPBOX_CLIENT_TYPES = ['Clients', 'Individuals'];

const TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: 'Millwork', label: 'Millwork' },
  { value: 'Shelving', label: 'Shelving' },
  { value: 'Ceiling', label: 'Ceiling' },
  { value: 'Furniture', label: 'Furniture' },
  { value: 'Image', label: 'Image' },
  { value: 'Decoration', label: 'Decoration' }
];

export interface NewProjectData {
  sectionId: string;
  projectNumber: number | string;
  projectName: string;
  address: string;
  selectedTypes: ProjectType[];
  customTypes: string[];
  dropboxSection?: string;
  dropboxRegion?: string;
  dropboxStatus?: string;
  dropboxClientType?: string;
  clientName?: string;
}

interface AddProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (data: NewProjectData) => Promise<{ success: boolean; error?: string }>;
  existingProjectNumbers: Record<string, number[]>; // sectionId -> project numbers
  mode?: 'projects' | 'directOrder'; // NEW: for Direct Order, allow text input
}

const AddProjectDrawer: React.FC<AddProjectDrawerProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  existingProjectNumbers,
  mode = 'projects'
}) => {
  const [formData, setFormData] = useState({
    sectionId: 'TLINES_SE',
    projectNumber: '',
    projectName: '',
    address: '',
    selectedTypes: [] as ProjectType[],
    customTypes: [] as string[],
    selectedCustomTypes: [] as string[],
    customTypeInput: '',
    dropboxSection: '',
    dropboxRegion: '',
    dropboxStatus: '',
    dropboxClientType: '',
    clientName: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOverlayClick = (_event: React.MouseEvent) => {
    // Do nothing — only close via X button or Cancel
  };

  const handleTypeToggle = (type: ProjectType) => {
    setFormData(prev => ({
      ...prev,
      selectedTypes: prev.selectedTypes.includes(type)
        ? prev.selectedTypes.filter(t => t !== type)
        : [...prev.selectedTypes, type]
    }));
  };

  const handleCustomTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCustomTypes: prev.selectedCustomTypes.includes(type)
        ? prev.selectedCustomTypes.filter(t => t !== type)
        : [...prev.selectedCustomTypes, type]
    }));
  };

  const handleAddCustomType = () => {
    const customType = formData.customTypeInput.trim();
    if (!customType) return;

    // Case-insensitive duplicate check
    const existingCustomTypes = formData.customTypes.map(t => t.toLowerCase());
    if (existingCustomTypes.includes(customType.toLowerCase())) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      customTypes: [...prev.customTypes, customType],
      selectedCustomTypes: [...prev.selectedCustomTypes, customType],
      customTypeInput: ''
    }));

    // Focus back to input for quick adding
    setTimeout(() => {
      const input = document.querySelector('input[placeholder="Add custom type..."]') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 0);
  };

  const handleRemoveCustomType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      customTypes: prev.customTypes.filter(t => t !== type),
      selectedCustomTypes: prev.selectedCustomTypes.filter(t => t !== type)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Project number validation
    if (mode === 'directOrder') {
      // Direct Order: Accept text input (e.g., "DO-01")
      if (!formData.projectNumber || formData.projectNumber.trim() === '') {
        newErrors.projectNumber = 'Project number is required';
      }
    } else {
      // Projects: Accept any non-empty string (e.g. "301", "234-per", etc.)
      if (!formData.projectNumber || formData.projectNumber.trim() === '') {
        newErrors.projectNumber = 'Project number is required';
      } else {
        // Check for duplicate project number in the selected section
        const existingNumbers = existingProjectNumbers[formData.sectionId] || [];
        const trimmed = formData.projectNumber.trim();
        const asNum = parseInt(trimmed);
        if (!isNaN(asNum) && existingNumbers.includes(asNum)) {
          newErrors.projectNumber = `Project number ${trimmed} already exists in ${SECTION_OPTIONS.find(s => s.value === formData.sectionId)?.label}`;
        }
      }
    }

    // Project name validation
    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    }

    // Types validation
    const totalTypes = formData.selectedTypes.length + formData.selectedCustomTypes.length;
    if (totalTypes === 0) {
      newErrors.types = 'At least one type must be selected or added';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onCreateProject({
        sectionId: formData.sectionId,
        projectNumber: formData.projectNumber.trim(),
        projectName: formData.projectName.trim(),
        address: formData.address.trim(),
        selectedTypes: formData.selectedTypes,
        customTypes: formData.selectedCustomTypes,
        dropboxSection: formData.dropboxSection || undefined,
        dropboxRegion: formData.dropboxRegion || undefined,
        dropboxStatus: formData.dropboxStatus || undefined,
        dropboxClientType: formData.dropboxClientType || undefined,
        clientName: formData.clientName.trim() || undefined,
      });

      // Debug log for backend payload

      if (result.success) {
        // Reset form and close drawer
        setFormData({
          sectionId: 'TLINES_SE',
          projectNumber: '',
          projectName: '',
          address: '',
          selectedTypes: [],
          customTypes: [],
          selectedCustomTypes: [],
          customTypeInput: '',
          dropboxSection: '',
          dropboxRegion: '',
          dropboxStatus: '',
          dropboxClientType: '',
          clientName: '',
        });
        setErrors({});
        onClose();
      } else {
        setErrors({ submit: result.error || 'Failed to create project' });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    }

    setIsSubmitting(false);
  };

  const handleCancel = () => {
    setFormData({
      sectionId: 'TLINES_SE',
      projectNumber: '',
      projectName: '',
      address: '',
      selectedTypes: [],
      customTypes: [],
      selectedCustomTypes: [],
      customTypeInput: '',
      dropboxSection: '',
      dropboxRegion: '',
      dropboxStatus: '',
      dropboxClientType: '',
      clientName: '',
    });
    setErrors({});
    onClose();
  };

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 15000,
        padding: '16px'
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: '#2c3e50'
            }}
          >
            Add New Project
          </h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content - Scrollable */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          <form onSubmit={handleSubmit} id="add-project-form">
            {/* Section Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Section <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                value={formData.sectionId}
                onChange={(e) => setFormData(prev => ({ ...prev, sectionId: e.target.value }))}
              >
                {SECTION_OPTIONS.map(section => (
                  <option key={section.value} value={section.value}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Number */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Project Number <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.projectNumber ? '#dc2626' : '#d1d5db'}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                value={formData.projectNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, projectNumber: e.target.value }))}
                placeholder={mode === 'directOrder' ? 'e.g. DO-01, DO-02' : 'e.g. 301, 234-per'}
              />
              {errors.projectNumber && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#dc2626' }}>
                  {errors.projectNumber}
                </div>
              )}
              {mode === 'directOrder' && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                  Enter manually (e.g., DO-01, DO-02)
                </div>
              )}
            </div>

            {/* Project Name */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Project Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.projectName ? '#dc2626' : '#d1d5db'}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                value={formData.projectName}
                onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                placeholder="e.g. Office Complex Renovation"
              />
              {errors.projectName && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#dc2626' }}>
                  {errors.projectName}
                </div>
              )}
            </div>

            {/* Address */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Address
              </label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="e.g. 1234 Business Drive, City, State"
              />
            </div>

            {/* Types Multi-select */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Types <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '8px',
                  marginBottom: '12px'
                }}
              >
                {TYPE_OPTIONS.map(type => (
                  <label
                    key={type.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedTypes.includes(type.value)}
                      onChange={() => handleTypeToggle(type.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}

                {/* Custom Types as Checkboxes */}
                {formData.customTypes.map(type => (
                  <label
                    key={`custom-${type}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#059669' // Green color to distinguish custom types
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedCustomTypes.includes(type)}
                      onChange={() => handleCustomTypeToggle(type)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{type}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveCustomType(type);
                      }}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '0',
                        marginLeft: '4px'
                      }}
                      title="Remove custom type"
                    >
                      ✕
                    </button>
                  </label>
                ))}
              </div>


              {/* Add Custom Type */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                  value={formData.customTypeInput}
                  onChange={(e) => setFormData(prev => ({ ...prev, customTypeInput: e.target.value }))}
                  placeholder="Add custom type..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomType())}
                />
                <button
                  type="button"
                  onClick={handleAddCustomType}
                  disabled={!formData.customTypeInput.trim()}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: formData.customTypeInput.trim() ? '#2563eb' : '#f3f4f6',
                    color: formData.customTypeInput.trim() ? '#fff' : '#9ca3af',
                    fontSize: '14px',
                    cursor: formData.customTypeInput.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: '500'
                  }}
                >
                  Add
                </button>
              </div>

              {errors.types && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#dc2626' }}>
                  {errors.types}
                </div>
              )}
            </div>

            {/* Dropbox Folder (Optional) */}
            <div style={{ marginBottom: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
              <div style={{ marginBottom: '12px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                Dropbox Folder
                <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: '400', color: '#9ca3af' }}>
                  (optional — fill all fields to auto-create)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>Section</label>
                  <select
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', backgroundColor: '#fff' }}
                    value={formData.dropboxSection}
                    onChange={(e) => setFormData(prev => ({ ...prev, dropboxSection: e.target.value }))}
                  >
                    <option value="">— select —</option>
                    {DROPBOX_SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>Region</label>
                  <select
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', backgroundColor: '#fff' }}
                    value={formData.dropboxRegion}
                    onChange={(e) => setFormData(prev => ({ ...prev, dropboxRegion: e.target.value }))}
                  >
                    <option value="">— select —</option>
                    {DROPBOX_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>Status</label>
                  <select
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', backgroundColor: '#fff' }}
                    value={formData.dropboxStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, dropboxStatus: e.target.value }))}
                  >
                    <option value="">— select —</option>
                    {DROPBOX_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>Client Type</label>
                  <select
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', backgroundColor: '#fff' }}
                    value={formData.dropboxClientType}
                    onChange={(e) => setFormData(prev => ({ ...prev, dropboxClientType: e.target.value }))}
                  >
                    <option value="">— select —</option>
                    {DROPBOX_CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>Client Name</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', backgroundColor: '#fff' }}
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="e.g. Acme Corp"
                />
              </div>

              {formData.dropboxSection && formData.dropboxRegion && formData.dropboxStatus && formData.dropboxClientType &&
                (formData.dropboxClientType !== 'Clients' || formData.clientName.trim()) && (
                <div style={{ marginTop: '10px', padding: '8px 10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', color: '#0369a1', wordBreak: 'break-all' }}>
                  📁 /D-Projects/T LINES/{formData.dropboxSection}/{formData.dropboxRegion}/{formData.dropboxStatus}/
                  {formData.dropboxClientType === 'Individuals' ? 'Individiuals' : formData.dropboxClientType}
                  {formData.dropboxClientType === 'Clients' && formData.clientName.trim() ? `/${formData.clientName}` : ''}/...
                </div>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  color: '#dc2626',
                  fontSize: '14px',
                  marginBottom: '20px'
                }}
              >
                {errors.submit}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            flexShrink: 0
          }}
        >
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            style={{
              padding: '10px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: '#fff',
              color: '#374151',
              fontSize: '14px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-project-form"
            disabled={isSubmitting}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: isSubmitting ? '#9ca3af' : '#2563eb',
              color: '#fff',
              fontSize: '14px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddProjectDrawer;