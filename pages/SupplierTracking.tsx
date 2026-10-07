import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import VendorSelector from '../components/VendorSelector';
import SupplierHeader from '../components/SupplierHeader';
import SupplierPSheet from './suppliers/SupplierPSheet';
import SupplierMESheet from './suppliers/SupplierMESheet';
import SupplierDOSheet from './suppliers/SupplierDOSheet';
import SupplierFilterBar, { SupplierFilterConfig, EMPTY_SUPPLIER_FILTER, SupplierFilterOptions, EMPTY_SUPPLIER_FILTER_OPTIONS } from '../components/SupplierFilterBar';
import { getVendors } from '../lib/projects';
import { useTablePermissions, PAGE_KEYS } from '../hooks/useTablePermissions';
import { useColumnPermissions } from '../hooks/useColumnPermissions';
import { exportAllSuppliersExcel } from '../utils/excel/exportAllSuppliersExcel';


interface Vendor {
  id: string;
  name: string;
  code: string;
}

const SupplierTracking: React.FC = () => {
  const { vendorCode } = useParams<{ vendorCode: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);
  const { hasPageAccess, getAccessibleSupplierTabs, loading: permissionsLoading } = useTablePermissions();
  const { isColumnVisible: legacyIsColumnVisible } = useColumnPermissions();
  const [supplierFilter, setSupplierFilter] = useState<SupplierFilterConfig>({ ...EMPTY_SUPPLIER_FILTER });
  const [isExportingAll, setIsExportingAll] = useState(false);

  // Export ALL suppliers into one workbook: Supplier Total sheet + one sheet per vendor
  const handleExportAllSuppliers = async () => {
    if (isExportingAll) return;
    setIsExportingAll(true);
    try {
      await exportAllSuppliersExcel({
        // Same column visibility as the supplier sheets (expenses columns excluded in supplier mode)
        isColumnVisible: (key) =>
          key === 'expensesUsd' || key === 'expensesTl' ? false : legacyIsColumnVisible(key),
      });
    } catch (err) {
      console.error('Export all suppliers failed:', err);
    } finally {
      setIsExportingAll(false);
    }
  };
  // Dropdown options reported by the active sheet (only values that exist in its items)
  const [filterOptions, setFilterOptions] = useState<SupplierFilterOptions>({ ...EMPTY_SUPPLIER_FILTER_OPTIONS });

  // DB-driven page access (no role-name bypass)
  const canAccessSuppliersPage = hasPageAccess(PAGE_KEYS.SUPPLIERS);

  // DB-driven table tabs
  const accessibleTabs = getAccessibleSupplierTabs();



  // Fixed bottom scrollbar refs and sync logic
  const contentRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const scrollInnerRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  // Sync: content → bottom scrollbar
  const handleContentScroll = useCallback(() => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (bottomScrollRef.current && contentRef.current) {
      bottomScrollRef.current.scrollLeft = contentRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isSyncingScroll.current = false; });
  }, []);

  // Sync: bottom scrollbar → content
  const handleBottomScroll = useCallback(() => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (contentRef.current && bottomScrollRef.current) {
      contentRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isSyncingScroll.current = false; });
  }, []);

  // Load vendors on mount and find selected vendor
  useEffect(() => {
    const loadVendors = async () => {
      try {
        const vendorList = await getVendors();
        setAllVendors(vendorList);
        if (vendorCode && vendorList.length > 0) {
          const vendor = vendorList.find(v => v.code === vendorCode);
          setSelectedVendor(vendor || null);
        }
      } catch (error) {
        console.error('Failed to load vendors:', error);
      }
    };

    loadVendors();
  }, [vendorCode]);

  // Close vendor dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(e.target as Node)) {
        setIsVendorDropdownOpen(false);
        setVendorSearchTerm('');
      }
    };
    if (isVendorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVendorDropdownOpen]);

  const filteredVendors = allVendors.filter(v =>
    v.name.toLowerCase().includes(vendorSearchTerm.toLowerCase()) ||
    v.code.toLowerCase().includes(vendorSearchTerm.toLowerCase())
  );

  const handleVendorSwitch = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsVendorDropdownOpen(false);
    setVendorSearchTerm('');
    navigate(`/suppliers/${vendor.code}/${currentTab}`);
  };

  const getCurrentTab = (): 'p' | 'me' | 'do' => {
    const path = location.pathname;
    if (path.endsWith('/me')) return 'me';
    if (path.endsWith('/do')) return 'do';
    return 'p';
  };

  const currentTab = getCurrentTab();

  // Reset filter options when vendor or tab changes (the new sheet will report fresh ones)
  useEffect(() => {
    setFilterOptions({ ...EMPTY_SUPPLIER_FILTER_OPTIONS });
  }, [vendorCode, currentTab]);

  // Redirect to first accessible tab if current tab is not accessible
  useEffect(() => {
    if (vendorCode && accessibleTabs.length > 0 && !accessibleTabs.some(tab => tab.key === currentTab)) {
      const firstAccessibleTab = accessibleTabs[0];
      navigate(`/suppliers/${vendorCode}/${firstAccessibleTab.key}`, { replace: true });
    }
  }, [vendorCode, accessibleTabs, currentTab, navigate]);

  // Keep bottom scrollbar inner width in sync with content scroll width
  useEffect(() => {
    const content = contentRef.current;
    const inner = scrollInnerRef.current;
    if (!content || !inner) return;

    const updateWidth = () => {
      const scrollW = content.scrollWidth;
      inner.style.width = `${scrollW}px`;
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(content);
    if (content.firstElementChild) {
      observer.observe(content.firstElementChild);
    }

    const interval = setInterval(updateWidth, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [currentTab, selectedVendor]);

  const handleTabChange = (tab: 'p' | 'me' | 'do') => {
    if (vendorCode) {
      navigate(`/suppliers/${vendorCode}/${tab}`);
    }
  };

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
  };

  // Check permissions before rendering
  if (permissionsLoading) {
    return (
      <div className="supplier-tracking-page" style={{ padding: '20px' }}>
        <div className="page-header">
          <h1>Loading...</h1>
          <p>Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!canAccessSuppliersPage) {
    return (
      <div className="supplier-tracking-page" style={{ padding: '20px' }}>
        <div className="page-header">
          <h1>Access Denied</h1>
          <p>You don't have permission to access the Suppliers management page.</p>
        </div>
      </div>
    );
  }

  // If no vendor is selected, show vendor selector
  if (!vendorCode || !selectedVendor) {
    return (
      <div className="supplier-tracking-page" style={{ padding: '20px' }}>
        <div className="page-header" style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1>Suppliers / Vendors</h1>
            <p>Select a vendor to view their projects, missing & extra items, and direct orders.</p>
          </div>
          <button
            onClick={handleExportAllSuppliers}
            disabled={isExportingAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: isExportingAll ? '#9ca3af' : '#16a34a',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isExportingAll ? 'wait' : 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1v9M4.5 6.5L8 10l3.5-3.5M2 13.5h12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {isExportingAll ? 'Exporting...' : 'Export Excel (All Suppliers)'}
          </button>
        </div>
        <VendorSelector
          selectedVendorCode={vendorCode}
          onVendorSelect={handleVendorSelect}
        />
      </div>
    );
  }

  // Render vendor-specific content with global horizontal scroll
  return (
    <div className="supplier-tracking-page">
      {/* Fixed Header Content (no horizontal scroll) */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'white',
        borderBottom: '1px solid #e9ecef',
        padding: '20px'
      }}>
        <div className="page-header" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ margin: 0 }}>Suppliers / Vendors</h1>
          <div ref={vendorDropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsVendorDropdownOpen(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: isVendorDropdownOpen ? '#f0f7ff' : '#fff',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 600,
                color: '#1a1a1a',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.15s',
              }}
            >
              <span>{selectedVendor.code} - {selectedVendor.name}</span>
              <span style={{ fontSize: '10px', color: '#6b7280', transform: isVendorDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>▼</span>
            </button>
            {isVendorDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                width: '320px',
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 1000,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '8px' }}>
                  <input
                    type="text"
                    placeholder="Search vendors..."
                    value={vendorSearchTerm}
                    onChange={e => setVendorSearchTerm(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {filteredVendors.map(v => (
                    <div
                      key={v.id}
                      onClick={() => handleVendorSwitch(v)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        backgroundColor: v.code === selectedVendor.code ? '#e5f3ff' : 'transparent',
                        fontWeight: v.code === selectedVendor.code ? 600 : 400,
                        borderLeft: v.code === selectedVendor.code ? '3px solid #007bff' : '3px solid transparent',
                        transition: 'background-color 0.1s',
                      }}
                      onMouseEnter={e => { if (v.code !== selectedVendor.code) e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                      onMouseLeave={e => { if (v.code !== selectedVendor.code) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <span style={{ fontWeight: 600, marginRight: '6px' }}>{v.code}</span>
                      <span style={{ color: '#4b5563' }}>- {v.name}</span>
                    </div>
                  ))}
                  {filteredVendors.length === 0 && (
                    <div style={{ padding: '12px 14px', color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>
                      No vendors found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <SupplierHeader vendor={selectedVendor} />

        {/* Tabs Navigation - Dynamic based on permissions */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e9ecef',
          marginBottom: '0',
          backgroundColor: 'white',
          borderRadius: '8px 8px 0 0'
        }}>
          {accessibleTabs.map((tab, index) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key as 'p' | 'me' | 'do')}
              style={{
                padding: '12px 20px',
                border: 'none',
                backgroundColor: currentTab === tab.key ? '#007bff' : 'transparent',
                color: currentTab === tab.key ? 'white' : '#666',
                fontWeight: currentTab === tab.key ? 'bold' : 'normal',
                cursor: 'pointer',
                borderRadius: index === 0 ? '8px 0 0 0' : (index === accessibleTabs.length - 1 ? '0 8px 0 0' : '0')
              }}
            >
              {selectedVendor.code} {tab.key.toUpperCase()}
            </button>
          ))}
          {accessibleTabs.length === 0 && (
            <div style={{ padding: '12px 20px', color: '#666', fontStyle: 'italic' }}>
              No accessible tables
            </div>
          )}
        </div>

        {/* Supplier Filter Bar */}
        <SupplierFilterBar
          filterConfig={supplierFilter}
          onFilterChange={setSupplierFilter}
          options={filterOptions}
        />
      </div>

      {/* Main Content Area - scrollable horizontally with fixed bottom scrollbar */}
      <div
        ref={contentRef}
        className="supplier-content-scroll"
        onScroll={handleContentScroll}
        style={{
          width: '100%',
          overflowX: 'auto',
          overflowY: 'visible',
          padding: '20px',
          paddingBottom: '40px', // Space for fixed scrollbar
        }}
      >
        {/* Show content only if tab is accessible */}
        {currentTab === 'p' && accessibleTabs.some(tab => tab.key === 'p') && (
          <SupplierPTab vendorCode={selectedVendor.code} filter={supplierFilter} onFilterOptions={setFilterOptions} />
        )}

        {currentTab === 'me' && accessibleTabs.some(tab => tab.key === 'me') && (
          <SupplierMETab vendorCode={selectedVendor.code} filter={supplierFilter} onFilterOptions={setFilterOptions} />
        )}

        {currentTab === 'do' && accessibleTabs.some(tab => tab.key === 'do') && (
          <SupplierDOTab vendorCode={selectedVendor.code} vendorId={selectedVendor.id} filter={supplierFilter} onFilterOptions={setFilterOptions} />
        )}

        {/* Show access denied if trying to access non-permitted tab */}
        {!accessibleTabs.some(tab => tab.key === currentTab) && (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ color: '#6c757d' }}>Access Restricted</h3>
            <p style={{ color: '#6c757d' }}>
              You don't have permission to view this section.
              {accessibleTabs.length > 0 && (
                <>
                  <br />
                  Please select from the available tabs: {accessibleTabs.map(tab => tab.label).join(', ')}.
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Fixed bottom horizontal scrollbar - always visible at viewport bottom */}
      <div
        ref={bottomScrollRef}
        onScroll={handleBottomScroll}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '14px',
          overflowX: 'auto',
          overflowY: 'hidden',
          zIndex: 999,
          backgroundColor: '#f0f0f0',
          borderTop: '1px solid #ccc',
        }}
      >
        <div ref={scrollInnerRef} style={{ height: '1px' }} />
      </div>

    </div>
  );
};

export default SupplierTracking;
// Supplier P Tab Component with ErrorBoundary
class SupplierPErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('SupplierP ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px' }}>
          <h3>⚠️ Error in Supplier P Tab</h3>
          <pre style={{ fontSize: '12px', color: '#c00' }}>{this.state.error?.message}</pre>
          <pre style={{ fontSize: '11px', color: '#666' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const SupplierPTab: React.FC<{ vendorCode: string; filter: SupplierFilterConfig; onFilterOptions?: (opts: SupplierFilterOptions) => void }> = ({ vendorCode, filter, onFilterOptions }) => {
  return (
    <SupplierPErrorBoundary>
      <SupplierPSheet vendorCode={vendorCode} filter={filter} onFilterOptions={onFilterOptions} />
    </SupplierPErrorBoundary>
  );
};

// Supplier ME Tab Component with ErrorBoundary
class SupplierMEErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('SupplierME ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px' }}>
          <h3>⚠️ Error in Supplier ME Tab</h3>
          <pre style={{ fontSize: '12px', color: '#c00' }}>{this.state.error?.message}</pre>
          <pre style={{ fontSize: '11px', color: '#666' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const SupplierMETab: React.FC<{ vendorCode: string; filter: SupplierFilterConfig; onFilterOptions?: (opts: SupplierFilterOptions) => void }> = ({ vendorCode, filter, onFilterOptions }) => {
  return (
    <SupplierMEErrorBoundary>
      <SupplierMESheet vendorCode={vendorCode} filter={filter} onFilterOptions={onFilterOptions} />
    </SupplierMEErrorBoundary>
  );
};

// Supplier DO Tab Component with ErrorBoundary
class SupplierDOErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('SupplierDO ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px' }}>
          <h3>⚠️ Error in Supplier DO Tab</h3>
          <pre style={{ fontSize: '12px', color: '#c00' }}>{this.state.error?.message}</pre>
          <pre style={{ fontSize: '11px', color: '#666' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const SupplierDOTab: React.FC<{ vendorCode: string; vendorId: string; filter: SupplierFilterConfig; onFilterOptions?: (opts: SupplierFilterOptions) => void }> = ({ vendorCode, vendorId, filter, onFilterOptions }) => {
  return (
    <SupplierDOErrorBoundary>
      <SupplierDOSheet vendorCode={vendorCode} vendorId={vendorId} filter={filter} onFilterOptions={onFilterOptions} />
    </SupplierDOErrorBoundary>
  );
};
