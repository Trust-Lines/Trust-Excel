import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVendors } from '../lib/projects';

interface Vendor {
  id: string;
  name: string;
  code: string;
}

interface VendorSelectorProps {
  selectedVendorCode?: string;
  onVendorSelect?: (vendor: Vendor) => void;
}

const VendorSelector: React.FC<VendorSelectorProps> = ({
  selectedVendorCode,
  onVendorSelect
}) => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load vendors on mount
  useEffect(() => {
    const loadVendors = async () => {
      try {
        setIsLoading(true);
        const vendorList = await getVendors();
        setVendors(vendorList);
      } catch (error) {
        console.error('Failed to load vendors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVendors();
  }, []);

  // Filter vendors based on search term
  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <h2 style={{
        margin: '0 0 16px 0',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#333'
      }}>
        Select Vendor / Supplier
      </h2>

      {/* Search input */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="Search vendors by name or code..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
            marginBottom: '8px'
          }}
        />
      </div>

      {/* Vendor list */}
      <div style={{
        maxHeight: '360px',
        overflowY: 'auto',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: 'white'
      }}>
        {isLoading ? (
          <div style={{ padding: '12px 16px', color: '#666', fontSize: '14px' }}>
            Loading vendors...
          </div>
        ) : filteredVendors.length === 0 ? null : (
          filteredVendors.map(vendor => {
            const isSelected = selectedVendorCode === vendor.code;
            return (
              <div
                key={vendor.id}
                onClick={() => {
                  if (onVendorSelect) {
                    onVendorSelect(vendor);
                  }
                  navigate(`/suppliers/${vendor.code}/p`);
                }}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  backgroundColor: isSelected ? '#e5f3ff' : 'transparent',
                  borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent',
                  borderBottom: '1px solid #f0f0f0',
                  fontWeight: isSelected ? 600 : 'normal',
                  color: '#333',
                  transition: 'background-color 0.1s'
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ fontWeight: 600, marginRight: '8px' }}>{vendor.code}</span>
                <span style={{ color: '#666' }}>— {vendor.name}</span>
              </div>
            );
          })
        )}
      </div>

      {searchTerm && filteredVendors.length === 0 && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          No vendors found matching "{searchTerm}"
        </div>
      )}

      {selectedVendorCode && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: '#d1ecf1',
          color: '#0c5460',
          border: '1px solid #bee5eb',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          Selected: <strong>{selectedVendorCode}</strong>
        </div>
      )}
    </div>
  );
};

export default VendorSelector;