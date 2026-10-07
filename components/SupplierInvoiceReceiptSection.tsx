import React, { useState, useEffect } from 'react';
import {
  InvoiceReceiptData,
  getInvoiceReceiptRows,
  createInvoiceReceiptRow,
  updateInvoiceReceiptRow,
  deleteInvoiceReceiptRow
} from '../lib/supplier-invoice-receipts';

interface SupplierInvoiceReceiptSectionProps {
  vendorCode: string;
}

const REGIONS = [
  { key: 'TLINES_NE', label: 'T LINES NE' },
  { key: 'TLINES_SE', label: 'T LINES SE' },
  { key: 'TLINES_NW', label: 'T LINES NW' },
  { key: 'TLINES_CVW', label: 'T LINES CVW' },
  { key: 'TLINES_HQ', label: 'T LINES HQ' },
  { key: 'TLINES_TC', label: 'T LINES TC' }
];

const SupplierInvoiceReceiptSection: React.FC<SupplierInvoiceReceiptSectionProps> = ({
  vendorCode
}) => {
  const [data, setData] = useState<InvoiceReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [vendorCode]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getInvoiceReceiptRows(vendorCode);
      setData(result);
    } catch (err) {
      console.error('❌ Failed to load invoice receipt data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = async (region: string) => {
    try {
      await createInvoiceReceiptRow({
        vendorCode,
        region,
        blockIndex: 0,
        transactionNo: '',
        invoiceNumber: '',
        quickBook: ''
      });
      await loadData();
    } catch (err) {
      console.error('❌ Failed to add row:', err);
      setError(err instanceof Error ? err.message : 'Failed to add row');
    }
  };

  const handleUpdateField = async (id: string, field: string, value: string) => {
    try {
      await updateInvoiceReceiptRow(id, { [field]: value });

      // Update local state optimistically
      if (data) {
        const newData = { ...data };
        Object.keys(newData.regions).forEach((regionKey) => {
          newData.regions[regionKey as keyof typeof newData.regions] =
            newData.regions[regionKey as keyof typeof newData.regions].map(row =>
              row.id === id ? { ...row, [field]: value } : row
            );
        });
        setData(newData);
      }
    } catch (err) {
      console.error('❌ Failed to update field:', err);
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleDeleteRow = async (id: string) => {
    try {
      await deleteInvoiceReceiptRow(id);
      await loadData();
    } catch (err) {
      console.error('❌ Failed to delete row:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete row');
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#666',
        fontSize: '14px'
      }}>
        Loading invoice & receipt data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#dc2626',
        fontSize: '14px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '6px',
        margin: '20px 0'
      }}>
        ❌ {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div style={{ marginTop: '40px', marginBottom: '40px' }}>
      {REGIONS.map(({ key, label }) => {
        const rows = data.regions[key] || [];

        return (
          <div key={key} style={{ marginBottom: '30px' }}>
            {/* Region Title Bar */}
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#1f2937',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: '6px 6px 0 0'
            }}>
              <span>{label} - Invoice & Receipt</span>
              <button
                onClick={() => handleAddRow(key)}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                + Add Row
              </button>
            </div>

            {/* Content */}
            <div style={{
              border: '1px solid #d1d5db',
              borderTop: 'none',
              borderRadius: '0 0 6px 6px',
              backgroundColor: 'white'
            }}>
              {rows.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '13px'
                }}>
                  No invoice & receipt data found for {label}.
                  <br />
                  <button
                    onClick={() => handleAddRow(key)}
                    style={{
                      marginTop: '10px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Add First Row
                  </button>
                </div>
              ) : (
                <table style={{ width: '100%', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{
                        padding: '12px',
                        textAlign: 'left',
                        border: '1px solid #e5e7eb',
                        fontWeight: '600'
                      }}>
                        Transaction No
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'left',
                        border: '1px solid #e5e7eb',
                        fontWeight: '600'
                      }}>
                        Invoice Number
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'left',
                        border: '1px solid #e5e7eb',
                        fontWeight: '600'
                      }}>
                        QuickBook
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'center',
                        border: '1px solid #e5e7eb',
                        fontWeight: '600',
                        width: '100px'
                      }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>
                          <input
                            type="text"
                            value={row.transactionNo}
                            onChange={(e) => handleUpdateField(row.id, 'transactionNo', e.target.value)}
                            placeholder="Enter transaction number"
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>
                          <input
                            type="text"
                            value={row.invoiceNumber}
                            onChange={(e) => handleUpdateField(row.id, 'invoiceNumber', e.target.value)}
                            placeholder="Enter invoice number"
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>
                          <input
                            type="text"
                            value={row.quickBook}
                            onChange={(e) => handleUpdateField(row.id, 'quickBook', e.target.value)}
                            placeholder="Enter QuickBook reference"
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SupplierInvoiceReceiptSection;