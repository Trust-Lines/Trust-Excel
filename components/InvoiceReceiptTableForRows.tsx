import React, { useState, useEffect } from 'react';
import { getInvoiceReceiptsByMode, upsertInvoiceReceiptByItem } from '../lib/supplier-invoice-receipts';
import type { InvoiceReceiptRow } from '../lib/supplier-invoice-receipts';

interface InvoiceReceiptTableForRowsProps {
  vendorCode: string;
  mode: string; // "PROJECT", "MISSING_EXTRA", "DIRECT_ORDER"
  region: string;
  projectId?: string; // ✅ NEW: Project-based filtering
  rows: Array<{ id: string }>; // Items in same order as payments table
}

/**
 * Invoice & Receipt table that aligns row-by-row with payments table
 * Each row corresponds to an item in the payments table
 */
const InvoiceReceiptTableForRows: React.FC<InvoiceReceiptTableForRowsProps> = ({
  vendorCode,
  mode,
  region,
  projectId,
  rows
}) => {
  const [invoiceData, setInvoiceData] = useState<Record<string, InvoiceReceiptRow>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [vendorCode, mode, projectId]);

  const loadData = async () => {
    try {
      // ✅ PROJECT-BASED: Load only for specific project
      const result = await getInvoiceReceiptsByMode(vendorCode, mode, projectId);
      setInvoiceData(result.itemMap || {});
    } catch (err) {
      console.error('Failed to load invoice receipt data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = async (
    itemId: string,
    field: 'transactionNo' | 'invoiceNumber' | 'quickBook',
    value: string
  ) => {
    try {
      const updatedRow = await upsertInvoiceReceiptByItem(itemId, {
        itemId,
        mode,
        vendorCode,
        region,
        projectId: projectId || '', // ✅ PROJECT-BASED
        [field]: value,
      });
      setInvoiceData(prev => ({ ...prev, [itemId]: updatedRow }));
    } catch (err) {
      console.error('Failed to update field:', err);
    }
  };

  if (loading) {
    return <div style={{ width: '480px', padding: '20px', fontSize: 'px', color: '#666' }}>Loading...</div>;
  }

  return (
    <div style={{ width: '420px', flexShrink: 0 }}>
      {/* No region title bar - handled by parent component */}

      {/* Header Spacer - Matches payments headers for perfect alignment */}
      <div style={{
        height: 'calc(var(--gridHeaderH2) + var(--gridHeaderH3))', /* DUE PAYMENT + USD TL headers combined */
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderTop: 'none',
        borderBottom: 'none',
      }} />

      {/* Tables Container - Reduced padding for cleaner look */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '4px 6px', /* ✅ Reduced padding */
        border: '1px solid #dee2e6',
        borderTop: 'none',
        borderRadius: '0 0 4px 4px',
      }}>
        {/* Two-table layout with standardized row heights */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
          {/* Table A: Transaction No + Invoice Number */}
          <div style={{ flex: '1' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#343a40', color: 'white' }}>
                  <th style={{
                    height: 'var(--gridHeaderH3)', /* ✅ Standardized height */
                    padding: '0 8px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: '600',
                    border: '1px solid #495057',
                    boxSizing: 'border-box'
                  }}>
                    TRANSACTION NO
                  </th>
                  <th style={{
                    height: 'var(--gridHeaderH3)', /* ✅ Standardized height */
                    padding: '0 8px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: '600',
                    border: '1px solid #495057',
                    boxSizing: 'border-box'
                  }}>
                    INVOICE NUMBER
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const invoiceRow = invoiceData[item.id];
                  return (
                    <tr key={`invoice-${item.id}`} style={{ height: 'var(--gridRowHeight)' /* ✅ Standardized row height */ }}>
                      <td style={{
                        height: 'var(--gridRowHeight)', /* ✅ Standardized height */
                        padding: '0',
                        border: '1px solid #dee2e6',
                        backgroundColor: 'white',
                        boxSizing: 'border-box'
                      }}>
                        <input
                          type="text"
                          value={invoiceRow?.transactionNo || ''}
                          onBlur={(e) => handleUpdateField(item.id, 'transactionNo', e.target.value)}
                          style={{
                            width: '100%',
                            height: '100%',
                            padding: '3px 6px', /* ✅ Reduced padding */
                            border: 'none',
                            backgroundColor: 'transparent',
                            fontSize: '12px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>
                      <td style={{
                        height: 'var(--gridRowHeight)', /* ✅ Standardized height */
                        padding: '0',
                        border: '1px solid #dee2e6',
                        backgroundColor: 'white',
                        boxSizing: 'border-box'
                      }}>
                        <input
                          type="text"
                          value={invoiceRow?.invoiceNumber || ''}
                          onBlur={(e) => handleUpdateField(item.id, 'invoiceNumber', e.target.value)}
                          style={{
                            width: '100%',
                            height: '100%',
                            padding: '3px 6px', /* ✅ Reduced padding */
                            border: 'none',
                            backgroundColor: 'transparent',
                            fontSize: '12px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table B: Quick Book */}
          <div style={{ width: '120px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#343a40', color: 'white' }}>
                  <th style={{
                    height: 'var(--gridHeaderH3)', /* ✅ Standardized height */
                    padding: '0 8px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: '600',
                    border: '1px solid #495057',
                    boxSizing: 'border-box'
                  }}>
                    QUICK BOOK
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const invoiceRow = invoiceData[item.id];
                  return (
                    <tr key={`quickbook-${item.id}`} style={{ height: 'var(--gridRowHeight)' /* ✅ Standardized row height */ }}>
                      <td style={{
                        height: 'var(--gridRowHeight)', /* ✅ Standardized height */
                        padding: '0',
                        border: '1px solid #dee2e6',
                        backgroundColor: 'white',
                        boxSizing: 'border-box'
                      }}>
                        <input
                          type="text"
                          value={invoiceRow?.quickBook || ''}
                          onBlur={(e) => handleUpdateField(item.id, 'quickBook', e.target.value)}
                          style={{
                            width: '100%',
                            height: '100%',
                            padding: '3px 6px', /* ✅ Reduced padding */
                            border: 'none',
                            backgroundColor: 'transparent',
                            fontSize: '12px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceReceiptTableForRows;