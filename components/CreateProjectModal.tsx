import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CreateProjectData, PROJECT_BUCKETS } from '../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectData) => Promise<void>;
  mode?: 'projects' | 'directOrder';
  title?: string;
  projectNoPlaceholder?: string;
  projectNoPrefix?: string;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode = 'projects',
  title,
  projectNoPlaceholder,
}) => {
  const [formData, setFormData] = useState<CreateProjectData>({
    projectNo: '',
    name: '',
    address: '',
    bucket: 'TLINES_NE',
    description: '',
    status: 'PRE_PROJECT',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalTitle = title || (mode === 'directOrder' ? 'Create Direct Order' : 'Create Project');
  const placeholder = projectNoPlaceholder || (mode === 'directOrder' ? 'e.g. DO-01' : 'e.g. P301');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate project number format for Direct Order
      if (mode === 'directOrder' && formData.projectNo) {
        const projectNo = formData.projectNo.trim();
        if (projectNo && !projectNo.startsWith('DO-')) {
          // Auto-prefix with DO- if it's just a number
          if (/^\d+$/.test(projectNo)) {
            setFormData(prev => ({ ...prev, projectNo: `DO-${projectNo}` }));
          } else {
            setError('Direct Order project number must start with DO- (e.g. DO-01)');
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Validate required fields
      if (!formData.name.trim()) {
        setError('Project name is required');
        setIsSubmitting(false);
        return;
      }

      if (!formData.address.trim()) {
        setError('Address is required');
        setIsSubmitting(false);
        return;
      }

      await onSubmit(formData);

      // Reset form
      setFormData({
        projectNo: '',
        name: '',
        address: '',
        bucket: 'NE',
        description: '',
        status: 'PRE_PROJECT',
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateProjectData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ width: '500px', maxWidth: '90vw' }}>
        <div className="modal-header">
          <h3>{modalTitle}</h3>
          <button type="button" onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '20px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c33',
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="projectNo">
              {mode === 'directOrder' ? 'DO Number' : 'Project Number'}
            </label>
            <input
              type="text"
              id="projectNo"
              value={formData.projectNo}
              onChange={(e) => handleInputChange('projectNo', e.target.value)}
              placeholder={placeholder}
              className="form-input"
            />
            {mode === 'directOrder' && (
              <small style={{ color: '#666' }}>
                Leave empty for auto-generation or enter number (e.g. "01" will become "DO-01")
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="name">Project Name *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter project name"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address *</label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter project address"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="bucket">Section</label>
            <select
              id="bucket"
              value={formData.bucket}
              onChange={(e) => handleInputChange('bucket', e.target.value)}
              className="form-input"
            >
              {PROJECT_BUCKETS.map(bucket => (
                <option key={bucket} value={bucket}>
                  {bucket}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter project description (optional)"
              className="form-input"
              rows={3}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : `Create ${mode === 'directOrder' ? 'Direct Order' : 'Project'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CreateProjectModal;