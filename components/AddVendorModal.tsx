import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createVendor } from '../lib/projects';
import { Vendor } from '../types';

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorAdded: (vendor: Vendor) => void;
  prefilledName?: string; // ADDED: Prefill vendor name from autocomplete
}

const AddVendorModal: React.FC<AddVendorModalProps> = ({
  isOpen,
  onClose,
  onVendorAdded,
  prefilledName = ''
}) => {
  const [name, setName] = useState(prefilledName);
  const [code, setCode] = useState('');
  const [fixedMillworkCodes, setFixedMillworkCodes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update name when prefilledName changes
  useEffect(() => {
    if (prefilledName) {
      setName(prefilledName);
    }
  }, [prefilledName]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Vendor name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const vendorData = {
        name: name.trim(),
        ...(code.trim() && { code: code.trim() }),
        fixedMillworkCodes,
      };

      const newVendor = await createVendor(vendorData);
      onVendorAdded(newVendor);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setCode('');
    setFixedMillworkCodes(false);
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

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
        zIndex: 20000,
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: '#2c3e50'
            }}
          >
            Add New Vendor
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '24px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              color: '#999',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px' }}>
            {/* Error Message */}
            {error && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  color: '#dc2626',
                  fontSize: '14px'
                }}
              >
                {error}
              </div>
            )}

            {/* Name Field */}
            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="vendorName"
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Vendor Name *
              </label>
              <input
                id="vendorName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Premier Millwork Solutions"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: isSubmitting ? '#f9fafb' : '#fff'
                }}
                autoFocus
              />
            </div>

            {/* Code Field */}
            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="vendorCode"
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Vendor Code
              </label>
              <input
                id="vendorCode"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., PMS (optional - auto-generated if empty)"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: isSubmitting ? '#f9fafb' : '#fff'
                }}
                maxLength={10}
              />
              <div
                style={{
                  marginTop: '4px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}
              >
                Leave empty to auto-generate from vendor name
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={fixedMillworkCodes}
                  onChange={(e) => setFixedMillworkCodes(e.target.checked)}
                  disabled={isSubmitting}
                />
                Millwork PF kodu sipariş tipine göre (Basic → M01, Selective → M02, Custom → M03)
              </label>
            </div>

            {/* Info Text */}
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#0369a1',
                marginBottom: '24px'
              }}
            >
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                About PF Codes
              </div>
              <div>
                When you assign this vendor to project items, PF codes will be automatically
                generated using the format: <code style={{ fontFamily: 'monospace' }}>
                {code.trim() || '[CODE]'}-P[PROJECT_NO]-[TYPE][NUM]
                </code>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}
          >
            <button
              type="button"
              onClick={handleClose}
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
              disabled={isSubmitting || !name.trim()}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: isSubmitting || !name.trim() ? '#9ca3af' : '#2563eb',
                color: '#fff',
                fontSize: '14px',
                cursor: isSubmitting || !name.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                position: 'relative',
                zIndex: 21000,
                pointerEvents: 'auto'
              }}
            >
              {isSubmitting && (
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #fff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
              )}
              {isSubmitting ? 'Creating...' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>

      {/* Inline keyframes for loading spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default AddVendorModal;