import React, { useState, useEffect, useCallback } from 'react';
import type { BackendProjectItem } from '../lib/projects';
import { apiFetch } from '../lib/auth';

// ✅ INVOICE COLUMNS: Define base invoice columns for permission filtering
interface InvoiceColumn {
  key: 'transactionNo' | 'invoiceNumber' | 'quickBook' | 'invoiceDate';
  label: string;
  width: number;
}

const buildVisibleInvoiceColumns = (permissionOverrides?: {
  isColumnVisible?: (columnKey: string) => boolean;
  isColumnEditable?: (columnKey: string) => boolean;
}): InvoiceColumn[] => {
  const baseColumns: InvoiceColumn[] = [
    { key: 'transactionNo', label: 'TRANSACTION NO', width: INVOICE_WIDTHS.transactionNo },
    { key: 'invoiceNumber', label: 'INVOICE NUMBER', width: INVOICE_WIDTHS.invoiceNumber },
    { key: 'quickBook', label: 'QUICK BOOK', width: INVOICE_WIDTHS.quickBook },
    { key: 'invoiceDate', label: 'DATE', width: INVOICE_WIDTHS.invoiceDate }
  ];

  // ✅ FILTER HIDDEN COLUMNS: Only return visible columns
  const visibleColumns = baseColumns.filter(col =>
    !permissionOverrides?.isColumnVisible || permissionOverrides.isColumnVisible(col.key)
  );


  // 🔍 INVOICE COLUMN MAPPING DEBUG

  // Test permission checks for each column
  if (permissionOverrides?.isColumnVisible) {
    ['transactionNo', 'invoiceNumber', 'quickBook', 'invoiceDate'].forEach(_col => {
    });
  }

  return visibleColumns;
};

// Invoice column widths (matching visual design)
const INVOICE_WIDTHS = {
  transactionNo: 140,    // Transaction number column
  invoiceNumber: 140,    // Invoice number column
  quickBook: 120,        // QuickBook column
  invoiceDate: 120,      // Date column
  gap: 16,               // Gap between mini tables
  get total() {
    // Total width calculation
    return this.transactionNo + this.invoiceNumber + this.quickBook + this.invoiceDate + (3 * this.gap);
  }
} as const;

interface InvoiceReceiptGridProps {
  items: BackendProjectItem[];
  sectionLabel: string;
  projectId: string;
  showSectionHeader: boolean;
  mode?: 'projects' | 'missingExtra' | 'directOrder' | 'expenses-p' | 'expenses-do' | 'expenses-me';
  updateGlobalItem?: (itemId: string, patch: Partial<BackendProjectItem>) => void;
  permissionOverrides?: {
    isColumnVisible?: (columnKey: string) => boolean;
    isColumnEditable?: (columnKey: string) => boolean;
    isColumnReadOnly?: (columnKey: string) => boolean;
  };
}

// Individual invoice row component
interface InvoiceRowProps {
  item: BackendProjectItem;
  projectId: string;
  invoiceValues: {
    transactionNo: string;
    invoiceNumber: string;
    quickBook: string;
    invoiceDate: string;
  };
  onInvoiceChange: (itemId: string, field: string, value: string) => void;
  onInvoiceBlur: (itemId: string, field: string, value: string) => void;
  permissionOverrides?: {
    isColumnVisible?: (columnKey: string) => boolean;
    isColumnEditable?: (columnKey: string) => boolean;
    isColumnReadOnly?: (columnKey: string) => boolean;
  };
}

const InvoiceRow: React.FC<InvoiceRowProps> = React.memo(({
  item,
  projectId,
  invoiceValues,
  onInvoiceChange,
  onInvoiceBlur,
  permissionOverrides
}) => {
  // ✅ COLUMN FILTERING: Get visible columns based on permissions
  const visibleColumns = buildVisibleInvoiceColumns(permissionOverrides);

  // ✅ DYNAMIC WIDTH: Calculate based on visible columns
  const totalWidth = visibleColumns.reduce((sum, col) => sum + col.width, 0) +
    (Math.max(0, visibleColumns.length - 1) * INVOICE_WIDTHS.gap);

  // ✅ EARLY RETURN: Don't render if no visible columns
  if (visibleColumns.length === 0) {
    return null;
  }


  // ✅ OLD LOGIC KEPT for backward compatibility
  const areInvoiceFieldsEditable = () => {
    const invoiceColumns = ['transactionNo', 'invoiceNumber', 'quickBook'];
    if (permissionOverrides?.isColumnEditable) {
      return invoiceColumns.some(col => permissionOverrides.isColumnEditable!(col));
    }
    return true;
  };

  areInvoiceFieldsEditable();

  // 🔍 DEBUG: Log permission decisions for invoice fields

  return (
    <div style={{
      display: 'flex',
      height: 'var(--supplier-data-row, 44px)',
      width: `${totalWidth}px`,
      borderBottom: '1px solid #d0d0d0',
      backgroundColor: 'white',
      boxSizing: 'border-box'
    }}>
      {/* ✅ DYNAMIC COLUMNS: Render only visible columns */}
      {visibleColumns.map((column, index) => {
        // ✅ AND RULE: Check if this specific column is editable
        const isColumnEditable = permissionOverrides?.isColumnEditable ?
          permissionOverrides.isColumnEditable(column.key) : true;

        // ✅ QuickBook: Render as clickable "Done" toggle instead of text input
        if (column.key === 'quickBook') {
          const isDone = (invoiceValues[column.key] || '') === 'Done';
          return (
            <React.Fragment key={column.key}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isColumnEditable) return;
                  const newValue = isDone ? '' : 'Done';
                  onInvoiceChange(item.id, 'quickBook', newValue);
                  onInvoiceBlur(item.id, 'quickBook', newValue);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  width: `${column.width}px`,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isColumnEditable ? 'pointer' : 'not-allowed',
                  backgroundColor: isDone ? '#D1FAE5' : 'var(--invoice-light-bg, white)',
                  color: isDone ? '#065F46' : '#999',
                  fontWeight: isDone ? '600' : 'normal',
                  fontSize: '11px',
                  borderRight: index < visibleColumns.length - 1 ? '1px solid #d0d0d0' : 'none',
                  boxSizing: 'border-box',
                  userSelect: 'none',
                }}
              >
                {isDone ? 'Done' : '-'}
              </div>
            </React.Fragment>
          );
        }

        // ✅ DATE INPUT: For invoiceDate column
        if (column.key === 'invoiceDate') {
          return (
            <React.Fragment key={column.key}>
              <input
                key={`${projectId}:${item.id}:${column.key}`}
                type="date"
                value={invoiceValues[column.key] || ''}
                disabled={!isColumnEditable}
                onChange={(e) => {
                  if (isColumnEditable) {
                    onInvoiceChange(item.id, column.key, e.target.value);
                  }
                }}
                onBlur={(e) => {
                  if (isColumnEditable) {
                    onInvoiceBlur(item.id, column.key, e.target.value);
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                style={{
                  width: `${column.width}px`,
                  height: '100%',
                  padding: '2px 4px',
                  border: 'none',
                  borderRight: index < visibleColumns.length - 1 ? '1px solid #d0d0d0' : 'none',
                  textAlign: 'center',
                  backgroundColor: isColumnEditable ? 'var(--invoice-light-bg, white)' : '#f5f5f5',
                  fontSize: '11px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  color: isColumnEditable ? 'inherit' : '#999',
                  cursor: isColumnEditable ? 'pointer' : 'not-allowed'
                }}
              />
              {index < visibleColumns.length - 1 && (
                <div style={{ width: `${INVOICE_WIDTHS.gap}px`, backgroundColor: 'white', height: '100%' }} />
              )}
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={column.key}>
            <input
              key={`${projectId}:${item.id}:${column.key}`}
              type="text"
              value={invoiceValues[column.key] || ''}
              disabled={!isColumnEditable}
              onChange={(e) => {
                // ✅ GUARD: Only call onChange if editable
                if (isColumnEditable) {
                  onInvoiceChange(item.id, column.key, e.target.value);
                }
              }}
              onBlur={(e) => {
                // ✅ GUARD: Only call onBlur if editable
                if (isColumnEditable) {
                  onInvoiceBlur(item.id, column.key, e.target.value);
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={column.label}
              style={{
                width: `${column.width}px`,
                height: '100%',
                padding: '4px 8px',
                border: 'none',
                borderRight: index < visibleColumns.length - 1 ? '1px solid #d0d0d0' : 'none',
                textAlign: 'left',
                backgroundColor: isColumnEditable ? 'var(--invoice-light-bg, white)' : '#f5f5f5',
                fontSize: '12px',
                boxSizing: 'border-box',
                outline: 'none',
                color: isColumnEditable ? 'inherit' : '#999',
                cursor: isColumnEditable ? 'text' : 'not-allowed'
              }}
            />
            {/* ✅ DYNAMIC GAP: Only add gap between columns */}
            {index < visibleColumns.length - 1 && (
              <div style={{ width: `${INVOICE_WIDTHS.gap}px`, backgroundColor: 'white', height: '100%' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});

const InvoiceReceiptGrid: React.FC<InvoiceReceiptGridProps> = ({
  items,
  sectionLabel,
  projectId,
  showSectionHeader,
  mode = 'projects',
  updateGlobalItem,
  permissionOverrides
}) => {
  // ✅ COLUMN FILTERING: Get visible columns and calculate dynamic width
  const visibleColumns = buildVisibleInvoiceColumns(permissionOverrides);
  const totalWidth = visibleColumns.reduce((sum, col) => sum + col.width, 0) +
    (Math.max(0, visibleColumns.length - 1) * INVOICE_WIDTHS.gap);

  // ✅ EARLY RETURN: Don't render grid if no visible columns
  if (visibleColumns.length === 0) {
    return null;
  }


  // Local state for invoice inputs (per item)
  const formatDateForInput = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch { return ''; }
  };

  const [invoiceValues, setInvoiceValues] = useState<Record<string, {
    transactionNo: string;
    invoiceNumber: string;
    quickBook: string;
    invoiceDate: string;
  }>>({});

  // Initialize state for new items from backend invoice fields
  useEffect(() => {
    const newState: typeof invoiceValues = {};
    items.forEach(item => {
      const key = `${projectId}:${item.id}`;
      if (!invoiceValues[key]) {
        newState[key] = {
          transactionNo: item.invoiceTransactionNo || '',
          invoiceNumber: item.invoiceNumber || '',
          quickBook: item.quickBook || '',
          invoiceDate: formatDateForInput(item.invoiceDate)
        };
      }
    });
    if (Object.keys(newState).length > 0) {
      setInvoiceValues(prev => ({ ...prev, ...newState }));
    }
  }, [items, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInvoiceChange = useCallback((itemId: string, field: string, value: string) => {
    const key = `${projectId}:${itemId}`;

    setInvoiceValues(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { transactionNo: '', invoiceNumber: '', quickBook: '', invoiceDate: '' }),
        [field]: value
      }
    }));
  }, [projectId]);

  // Backend save function for invoice values
  const saveToBackend = useCallback(async (itemId: string, field: string, value: string) => {
    try {
      // Field mapping for invoice fields
      const fieldMap: Record<string, string> = {
        transactionNo: 'invoiceTransactionNo',
        invoiceNumber: 'invoiceNumber',
        quickBook: 'quickBook',
        invoiceDate: 'invoiceDate'
      };

      const backendField = fieldMap[field];
      if (!backendField) {
        console.error('❌ INVOICE_SAVE_ERROR: Invalid field', { field });
        return;
      }

      // Determine endpoint based on mode
      const endpoint = mode === 'missingExtra'
        ? `/api/missing-extra/items/${itemId}`
        : mode === 'directOrder'
        ? `/api/direct-orders/${projectId}/items/${itemId}`
        : mode === 'expenses-p'
        ? `/api/expenses-p/items/${itemId}`
        : mode === 'expenses-do'
        ? `/api/expenses-direct-order/items/${itemId}`
        : mode === 'expenses-me'
        ? `/api/expenses-missing-extra/items/${itemId}`
        : `/api/projects/items/${itemId}`;

      // Build payload - convert date to ISO string for backend
      const payloadValue = field === 'invoiceDate' ? (value ? new Date(value).toISOString() : null) : value;
      const payload = { [backendField]: payloadValue };


      const response = await apiFetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save invoice ${field}: ${response.status} ${errorText}`);
      }

      const updatedItem = await response.json();

      // Update global item state if callback provided
      if (updateGlobalItem) {
        updateGlobalItem(itemId, updatedItem);
      }
    } catch (error) {
      console.error('❌ INVOICE_SAVE_ERROR', { itemId, field, value, error });
      // TODO: Show error toast to user
    }
  }, [mode, projectId, updateGlobalItem]);

  const handleInvoiceBlur = useCallback((itemId: string, field: string, value: string) => {

    // Save to backend - use proper API endpoint
    saveToBackend(itemId, field, value);
  }, [projectId, saveToBackend]);

  return (
    <div style={{
      width: `${totalWidth}px`,
      minWidth: `${totalWidth}px`,
      maxWidth: `${totalWidth}px`,
    }}>
      {/* Section Header - ORANGE BAR */}
      {showSectionHeader && (
        <div style={{
          height: 'var(--supplier-section-header, 44px)',
          minHeight: 'var(--supplier-section-header, 44px)',
          maxHeight: 'var(--supplier-section-header, 44px)',
          backgroundColor: 'var(--invoice-section-bg, #696969)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: '15px',
          letterSpacing: '1px',
          borderRadius: '6px 6px 0 0',
          marginBottom: '0',
          margin: '0',
          padding: '0',
          border: '1px solid #696969',
          boxSizing: 'border-box'
        }}>
          INVOICE & RECEIPT {sectionLabel.replace('TLines ', 'T LINES ').toUpperCase()}
        </div>
      )}

      {/* Top Group Row: Main table label (INVOICE & RECEIPT) */}
      {/* This row aligns with Payments's "DUE PAYMENT / PAYMENTS 1 / PAYMENTS 2" top label row */}
      <div className="invoice-topgroup-row" style={{
        display: 'flex',
        height: 'var(--supplier-topgroup-row, 34px)',
        minHeight: 'var(--supplier-topgroup-row, 34px)',
        maxHeight: 'var(--supplier-topgroup-row, 34px)',
        backgroundColor: 'var(--invoice-header-bg, #7d7d7d)',
        fontSize: '11px',
        fontWeight: '600',
        color: 'white',
        borderBottom: '1px solid var(--invoice-header-border, #696969)',
        margin: '0',
        padding: '0',
        boxSizing: 'border-box',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        INVOICE & RECEIPT
      </div>

      {/* ✅ DYNAMIC COLUMN HEADERS: Render only visible column headers */}
      <div className="invoice-colhead-row" style={{
        display: 'flex',
        height: 'var(--supplier-colhead-row, 34px)',
        backgroundColor: 'var(--invoice-totals-bg, #696969)',
        color: 'white',
        fontWeight: '600',
        fontSize: '11px',
        borderBottom: '2px solid #696969',
        alignItems: 'center'
      }}>
        {visibleColumns.map((column, index) => (
          <React.Fragment key={column.key}>
            <div style={{
              width: `${column.width}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: index < visibleColumns.length - 1 ? '1px solid #696969' : 'none',
              height: '100%'
            }}>
              {column.label}
            </div>
            {/* ✅ DYNAMIC GAP: Only add gap between headers */}
            {index < visibleColumns.length - 1 && (
              <div style={{
                width: `${INVOICE_WIDTHS.gap}px`,
                backgroundColor: 'var(--invoice-totals-bg, #696969)',
                height: '100%'
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Data Rows */}
      {items.map((item) => {
        const key = `${projectId}:${item.id}`;
        const values = invoiceValues[key] || { transactionNo: '', invoiceNumber: '', quickBook: '', invoiceDate: '' };

        return (
          <InvoiceRow
            key={item.id}
            item={item}
            projectId={projectId}
            invoiceValues={values}
            onInvoiceChange={handleInvoiceChange}
            onInvoiceBlur={handleInvoiceBlur}
            permissionOverrides={permissionOverrides}
          />
        );
      })}
    </div>
  );
};

export default InvoiceReceiptGrid;