import React, { useState, useEffect, useCallback } from 'react';
import type { TrustExpenseItem } from '../../types/trustExpense';
import { apiFetch } from '../../lib/auth';
import { ROW_HEIGHT } from '../../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const INVOICE_WIDTHS = {
  transactionNo: 140,
  invoiceNumber: 140,
  quickBook: 120,
  gap: 16,
};

interface InvoiceRowProps {
  item: TrustExpenseItem;
  invoiceValues: {
    transactionNo: string;
    invoiceNumber: string;
    quickBook: string;
  };
  onInvoiceChange: (itemId: string, field: string, value: string) => void;
  onInvoiceBlur: (itemId: string, field: string, value: string) => void;
}

const InvoiceRow: React.FC<InvoiceRowProps> = React.memo(({
  item,
  invoiceValues,
  onInvoiceChange,
  onInvoiceBlur,
}) => {
  const totalWidth = INVOICE_WIDTHS.transactionNo + INVOICE_WIDTHS.invoiceNumber + INVOICE_WIDTHS.quickBook + (2 * INVOICE_WIDTHS.gap);

  const columns = [
    { key: 'transactionNo' as const, label: 'TRANSACTION NO', width: INVOICE_WIDTHS.transactionNo },
    { key: 'invoiceNumber' as const, label: 'INVOICE NUMBER', width: INVOICE_WIDTHS.invoiceNumber },
    { key: 'quickBook' as const, label: 'QUICK BOOK', width: INVOICE_WIDTHS.quickBook },
  ];

  return (
    <div style={{
      display: 'flex', height: `${ROW_HEIGHT}px`, width: `${totalWidth}px`,
      borderBottom: '1px solid #d0d0d0', backgroundColor: 'white', boxSizing: 'border-box'
    }}>
      {columns.map((column, index) => {
        if (column.key === 'quickBook') {
          const isDone = (invoiceValues.quickBook || '') === 'Done';
          return (
            <React.Fragment key={column.key}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  const newValue = isDone ? '' : 'Done';
                  onInvoiceChange(item.id, 'quickBook', newValue);
                  onInvoiceBlur(item.id, 'quickBook', newValue);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  width: `${column.width}px`, height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDone ? '#D1FAE5' : 'white',
                  color: isDone ? '#065F46' : '#999',
                  fontWeight: isDone ? '600' : 'normal',
                  fontSize: '11px',
                  borderRight: index < columns.length - 1 ? '1px solid #d0d0d0' : 'none',
                  boxSizing: 'border-box', userSelect: 'none',
                }}
              >
                {isDone ? 'Done' : '-'}
              </div>
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={column.key}>
            <input
              key={`${item.id}:${column.key}`}
              type="text"
              value={invoiceValues[column.key] || ''}
              onChange={(e) => onInvoiceChange(item.id, column.key, e.target.value)}
              onBlur={(e) => onInvoiceBlur(item.id, column.key, e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={column.label}
              style={{
                width: `${column.width}px`, height: '100%', padding: '4px 8px',
                border: 'none',
                borderRight: index < columns.length - 1 ? '1px solid #d0d0d0' : 'none',
                textAlign: 'left', backgroundColor: 'white',
                fontSize: '12px', boxSizing: 'border-box', outline: 'none',
              }}
            />
            {index < columns.length - 1 && (
              <div style={{ width: `${INVOICE_WIDTHS.gap}px`, backgroundColor: 'white', height: '100%' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});

interface TrustExpenseInvoiceGridProps {
  items: TrustExpenseItem[];
  showSectionHeader: boolean;
  sectionLabel: string;
  updateGlobalItem?: (itemId: string, patch: Partial<TrustExpenseItem>) => void;
}

const TrustExpenseInvoiceGrid: React.FC<TrustExpenseInvoiceGridProps> = ({
  items,
  showSectionHeader,
  sectionLabel,
  updateGlobalItem,
}) => {
  const totalWidth = INVOICE_WIDTHS.transactionNo + INVOICE_WIDTHS.invoiceNumber + INVOICE_WIDTHS.quickBook + (2 * INVOICE_WIDTHS.gap);

  const [invoiceValues, setInvoiceValues] = useState<Record<string, {
    transactionNo: string; invoiceNumber: string; quickBook: string;
  }>>({});

  useEffect(() => {
    const newState: typeof invoiceValues = {};
    items.forEach(item => {
      const key = item.id;
      if (!invoiceValues[key]) {
        newState[key] = {
          transactionNo: item.invoiceTransactionNo || '',
          invoiceNumber: item.invoiceNumber || '',
          quickBook: item.quickBook || '',
        };
      }
    });
    if (Object.keys(newState).length > 0) {
      setInvoiceValues(prev => ({ ...prev, ...newState }));
    }
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInvoiceChange = useCallback((itemId: string, field: string, value: string) => {
    const key = itemId;
    setInvoiceValues(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { transactionNo: '', invoiceNumber: '', quickBook: '' }),
        [field]: value
      }
    }));
  }, []);

  const saveToBackend = useCallback(async (itemId: string, field: string, value: string) => {
    try {
      const fieldMap = {
        transactionNo: 'invoiceTransactionNo',
        invoiceNumber: 'invoiceNumber',
        quickBook: 'quickBook'
      } as const;
      const backendField = fieldMap[field as keyof typeof fieldMap];
      if (!backendField) return;

      const response = await apiFetch(`${API_URL}/trust-expenses/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [backendField]: value })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save invoice: ${response.status} ${errorText}`);
      }

      const updatedItem = await response.json();
      if (updateGlobalItem) {
        updateGlobalItem(itemId, updatedItem);
      }
    } catch (error) {
      console.error('Failed to save invoice:', error);
    }
  }, [updateGlobalItem]);

  const handleInvoiceBlur = useCallback((itemId: string, field: string, value: string) => {
    saveToBackend(itemId, field, value);
  }, [saveToBackend]);

  const columns = [
    { key: 'transactionNo', label: 'TRANSACTION NO', width: INVOICE_WIDTHS.transactionNo },
    { key: 'invoiceNumber', label: 'INVOICE NUMBER', width: INVOICE_WIDTHS.invoiceNumber },
    { key: 'quickBook', label: 'QUICK BOOK', width: INVOICE_WIDTHS.quickBook },
  ];

  return (
    <div style={{ width: `${totalWidth}px`, minWidth: `${totalWidth}px`, maxWidth: `${totalWidth}px` }}>
      {/* Section Header - GRAY BAR */}
      {showSectionHeader && (
        <div style={{
          height: '44px', minHeight: '44px', maxHeight: '44px',
          backgroundColor: '#696969', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '700', fontSize: '15px', letterSpacing: '1px',
          borderRadius: '6px 6px 0 0', border: '1px solid #696969', boxSizing: 'border-box'
        }}>
          INVOICE & RECEIPT {sectionLabel}
        </div>
      )}

      {/* Top Group Row */}
      <div style={{
        display: 'flex', height: '34px', minHeight: '34px', maxHeight: '34px',
        backgroundColor: '#7d7d7d', fontSize: '11px', fontWeight: '600', color: 'white',
        borderBottom: '1px solid #696969', alignItems: 'center', justifyContent: 'center'
      }}>
        INVOICE & RECEIPT
      </div>

      {/* Column Headers */}
      <div style={{
        display: 'flex', height: '34px',
        backgroundColor: '#696969', color: 'white', fontWeight: '600', fontSize: '11px',
        borderBottom: '2px solid #696969', alignItems: 'center'
      }}>
        {columns.map((column, index) => (
          <React.Fragment key={column.key}>
            <div style={{
              width: `${column.width}px`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRight: index < columns.length - 1 ? '1px solid #696969' : 'none', height: '100%'
            }}>
              {column.label}
            </div>
            {index < columns.length - 1 && (
              <div style={{ width: `${INVOICE_WIDTHS.gap}px`, backgroundColor: '#696969', height: '100%' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Data Rows */}
      {items.map(item => {
        const key = item.id;
        const values = invoiceValues[key] || { transactionNo: '', invoiceNumber: '', quickBook: '' };
        return (
          <InvoiceRow
            key={item.id} item={item}
            invoiceValues={values}
            onInvoiceChange={handleInvoiceChange}
            onInvoiceBlur={handleInvoiceBlur}
          />
        );
      })}
    </div>
  );
};

export default TrustExpenseInvoiceGrid;
