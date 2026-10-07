import React, { useState, useEffect } from 'react';
import {
  InvoiceReceiptRow,
  getInvoiceReceiptRows,
  createInvoiceReceiptRow,
  updateInvoiceReceiptRow,
  deleteInvoiceReceiptRow
} from '../lib/supplier-invoice-receipts';

interface SupplierInvoiceReceiptBlockProps {
  vendorCode: string;
  region: string;
  blockIndex: number;
}

const SupplierInvoiceReceiptBlock: React.FC<SupplierInvoiceReceiptBlockProps> = ({
  vendorCode,
  region,
  blockIndex
}) => {
  const [rows, setRows] = useState<InvoiceReceiptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [vendorCode, region, blockIndex]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getInvoiceReceiptRows(vendorCode);
      const regionData = result.regions[region as keyof typeof result.regions] || [];
      setRows(regionData);
    } catch (err) {
      console.error('❌ Failed to load invoice receipt data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = async (rowId: string, field: string, value: string) => {
    try {
      await updateInvoiceReceiptRow(rowId, { [field]: value });
      // Reload data to get the latest state
      await loadData();
    } catch (err) {
      console.error('❌ Failed to update field:', err);
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleAddRow = async () => {
    try {
      await createInvoiceReceiptRow({
        vendorCode,
        region,
        blockIndex,
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

  const handleDeleteRow = async (rowId: string) => {
    try {
      await deleteInvoiceReceiptRow(rowId);
      await loadData();
    } catch (err) {
      console.error('❌ Failed to delete row:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete row');
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#666',
        fontSize: '12px'
      }}>
        Loading invoice & receipt data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#dc2626',
        fontSize: '12px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '4px'
      }}>
        ❌ {error}
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      backgroundColor: 'white'
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{
          fontSize: '12px',
          fontWeight: '600',
          color: '#374151'
        }}>
          Invoice & Receipt - {region}
        </span>
        <button
          onClick={handleAddRow}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
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

      {/* Table */}
      <div style={{ padding: '12px' }}>
        {rows.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '12px',
            padding: '20px'
          }}>
            No invoice & receipt data found for this region.
          </div>
        ) : (
          <table style={{ width: '100%', fontSize: '11px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #e5e7eb' }}>
                  Transaction No
                </th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #e5e7eb' }}>
                  Invoice Number
                </th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #e5e7eb' }}>
                  QuickBook
                </th>
                <th style={{ padding: '6px', textAlign: 'center', border: '1px solid #e5e7eb', width: '60px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>
                    <input
                      type="text"
                      value={row.transactionNo}
                      onChange={(e) => handleUpdateField(row.id, 'transactionNo', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '2px 4px',
                        border: 'none',
                        fontSize: '11px'
                      }}
                    />
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>
                    <input
                      type="text"
                      value={row.invoiceNumber}
                      onChange={(e) => handleUpdateField(row.id, 'invoiceNumber', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '2px 4px',
                        border: 'none',
                        fontSize: '11px'
                      }}
                    />
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>
                    <input
                      type="text"
                      value={row.quickBook}
                      onChange={(e) => handleUpdateField(row.id, 'quickBook', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '2px 4px',
                        border: 'none',
                        fontSize: '11px'
                      }}
                    />
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2px',
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
};

export default SupplierInvoiceReceiptBlock;