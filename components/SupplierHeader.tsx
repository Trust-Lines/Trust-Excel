import React, { useState, useEffect } from 'react';
import { getSupplierProfile, updateSupplierProfile, SupplierProfile } from '../lib/supplier-profiles';

interface SupplierHeaderProps {
  vendor?: {
    code: string;
    name: string;
    id: string;
  };
}

const SupplierHeader: React.FC<SupplierHeaderProps> = ({ vendor }) => {
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    companyName: '',
    bankName: '',
    iban: '',
    officialName: '',
    noteDate: '',
  });

  // Load profile when vendor changes
  useEffect(() => {
    if (vendor?.id) {
      loadProfile(vendor.id);
    }
  }, [vendor?.id]);

  const loadProfile = async (vendorId: string) => {
    try {
      const data = await getSupplierProfile(vendorId);
      setProfile(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load supplier profile:', err);
      setError('Failed to load profile');
    }
  };

  const handleEdit = () => {
    // Initialize form with current profile data
    setEditForm({
      companyName: profile?.companyName || '',
      bankName: profile?.bankName || '',
      iban: formatIban(profile?.iban || ''),
      officialName: profile?.officialName || '',
      noteDate: profile?.noteDate ? profile.noteDate.split('T')[0] : '',
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!vendor?.id) return;

    // Validate
    if (editForm.iban && editForm.iban.replace(/\s/g, '').length > 34) {
      setError('IBAN must be at most 34 characters');
      return;
    }

    if (editForm.noteDate) {
      const parsedDate = new Date(editForm.noteDate);
      if (isNaN(parsedDate.getTime())) {
        setError('Invalid date format');
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      const updateData: any = {
        companyName: editForm.companyName || null,
        bankName: editForm.bankName || null,
        iban: editForm.iban ? editForm.iban.replace(/\s/g, '') : null,
        officialName: editForm.officialName || null,
        noteDate: editForm.noteDate || null,
      };

      const updated = await updateSupplierProfile(vendor.id, updateData);
      setProfile(updated);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to save supplier profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Format IBAN with spaces for display (TR00 0000 0000...)
  const formatIban = (iban: string | null): string => {
    if (!iban) return '';
    const cleaned = iban.replace(/\s/g, '');
    return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
  };

  // Display values
  const companyName = profile?.companyName || vendor?.name || 'Company Name';
  const bankName = profile?.bankName || '-';
  const iban = formatIban(profile?.iban || null);
  const officialName = profile?.officialName || '-';
  const displayDate = profile?.noteDate 
    ? new Date(profile.noteDate).toLocaleDateString('tr-TR')
    : '-';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      marginBottom: '20px',
      fontSize: '14px',
      position: 'relative'
    }}>
      {/* Error message */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '0',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          color: '#c00',
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {error}
        </div>
      )}

      {!isEditing ? (
        <>
          {/* View Mode */}
          {/* Left section: Company name and Bank */}
          <div style={{ flex: '1' }}>
            <div style={{
              fontWeight: 'bold',
              fontSize: '16px',
              color: '#333',
              marginBottom: '4px'
            }}>
              {companyName}
            </div>
            <div style={{ color: '#666' }}>
              Bank: {bankName}
            </div>
          </div>

          {/* Middle section: IBAN */}
          <div style={{
            flex: '1',
            textAlign: 'center',
            borderLeft: '1px solid #e9ecef',
            borderRight: '1px solid #e9ecef',
            paddingLeft: '20px',
            paddingRight: '20px'
          }}>
            <div style={{
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '4px'
            }}>
              IBAN
            </div>
            <div style={{
              color: '#666',
              fontSize: '13px',
              fontFamily: 'monospace'
            }}>
              {iban || '-'}
            </div>
          </div>

          {/* Right section: Date and Official Name */}
          <div style={{ flex: '1', textAlign: 'right' }}>
            <div style={{
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '4px'
            }}>
              {displayDate}
            </div>
            <div style={{ color: '#666' }}>
              {officialName}
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={handleEdit}
            style={{
              marginLeft: '20px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✏️ Edit
          </button>
        </>
      ) : (
        <>
          {/* Edit Mode */}
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Company Name</label>
              <input
                type="text"
                value={editForm.companyName}
                onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Bank</label>
              <input
                type="text"
                value={editForm.bankName}
                onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '20px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>IBAN (max 34 chars)</label>
              <input
                type="text"
                value={editForm.iban}
                onChange={(e) => setEditForm({ ...editForm, iban: e.target.value })}
                maxLength={40}
                style={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontFamily: 'monospace'
                }}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Date</label>
              <input
                type="date"
                value={editForm.noteDate}
                onChange={(e) => setEditForm({ ...editForm, noteDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '20px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Official Name</label>
              <input
                type="text"
                value={editForm.officialName}
                onChange={(e) => setEditForm({ ...editForm, officialName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  flex: '1',
                  padding: '8px 16px',
                  backgroundColor: isSaving ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {isSaving ? 'Saving...' : '✓ Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                style={{
                  flex: '1',
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SupplierHeader;