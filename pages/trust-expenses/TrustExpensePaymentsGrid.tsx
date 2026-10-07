import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { TrustExpenseItem } from '../../types/trustExpense';
import { parseMoneyInput, formatMoneyDisplay } from '../../utils/moneyUtils';
import { apiFetch } from '../../lib/auth';
import { ROW_HEIGHT, TOTAL_ROW_HEIGHT } from '../../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const toNumber = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'string') {
    const parsed = parseFloat(v);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatDisplayWithCurrency = (value: number, currency: 'USD' | 'TL'): string => {
  if (value <= 0) return '-';
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return currency === 'USD' ? `$${formatted}` : `\u20BA${formatted}`;
};

const sanitizeMoneyInput = (value: string): string => {
  let sanitized = value.replace(/[^0-9.,]/g, '');
  const decimalParts = sanitized.split('.');
  if (decimalParts.length > 2) {
    sanitized = decimalParts[0] + '.' + decimalParts.slice(1).join('');
  }
  return sanitized;
};

const PAYMENTS_WIDTHS = {
  duePayment: 120,
  payments1: 120,
  payments2: 120,
  gap: 16,
};

const calculateRemaining = (item: TrustExpenseItem): { remainingUsd: number; remainingTl: number } => {
  const expUsd = toNumber(item.expensesUsd);
  const expTl = toNumber(item.expensesTl);
  const paidUsd = toNumber(item.paidUsd1) + toNumber(item.paidUsd2);
  const paidTl = toNumber(item.paidTl1) + toNumber(item.paidTl2);

  return {
    remainingUsd: Math.max(0, expUsd - paidUsd),
    remainingTl: Math.max(0, expTl - paidTl)
  };
};

interface PaymentRowProps {
  item: TrustExpenseItem;
  paymentValues: {
    payUsd1: string;
    payUsd2: string;
    payTl1: string;
    payTl2: string;
  };
  onPaymentChange: (itemId: string, field: string, value: string) => void;
  onPaymentBlur: (itemId: string, field: string, value: string) => void;
  onPaymentFocus: (itemId: string, field: string) => void;
}

const PaymentRow: React.FC<PaymentRowProps> = React.memo(({
  item,
  paymentValues,
  onPaymentChange,
  onPaymentBlur,
  onPaymentFocus,
}) => {
  const { remainingUsd, remainingTl } = calculateRemaining(item);

  type ReadOnlyCol = { key: string; value: number; currency: 'USD' | 'TL'; editable: false };
  type EditableCol = { key: string; dataField: string; editable: true };
  type PayColumn = ReadOnlyCol | EditableCol;

  const sections: { name: string; columns: PayColumn[] }[] = [
    {
      name: 'duePayment',
      columns: [
        { key: 'dueUsd', value: remainingUsd, currency: 'USD', editable: false },
        { key: 'dueTl', value: remainingTl, currency: 'TL', editable: false },
      ]
    },
    {
      name: 'payments1',
      columns: [
        { key: 'payUsd1', dataField: 'payUsd1', editable: true },
        { key: 'payTl1', dataField: 'payTl1', editable: true },
      ]
    },
    {
      name: 'payments2',
      columns: [
        { key: 'payUsd2', dataField: 'payUsd2', editable: true },
        { key: 'payTl2', dataField: 'payTl2', editable: true },
      ]
    },
  ];

  return (
    <div style={{
      display: 'flex',
      height: `${ROW_HEIGHT}px`,
      minHeight: `${ROW_HEIGHT}px`,
      maxHeight: `${ROW_HEIGHT}px`,
      backgroundColor: 'transparent',
      boxSizing: 'border-box'
    }}>
      {sections.map((section, sectionIndex) => (
        <React.Fragment key={section.name}>
          {section.columns.map((column, colIndex) => {
            if (!column.editable) {
              const col = column as ReadOnlyCol;
              return (
                <div key={col.key} style={{
                  width: `${PAYMENTS_WIDTHS.duePayment}px`,
                  height: '100%',
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  borderRight: colIndex < section.columns.length - 1 ? '1px solid #d0d0d0' : 'none',
                  borderBottom: '1px solid #d0d0d0',
                  backgroundColor: '#e8f5e9',
                  fontSize: '12px',
                  fontWeight: '500',
                  boxSizing: 'border-box'
                }}>
                  {formatDisplayWithCurrency(col.value, col.currency)}
                </div>
              );
            }

            const col = column as EditableCol;
            return (
              <div key={`${item.id}:${col.dataField}`} style={{
                width: `${PAYMENTS_WIDTHS.payments1}px`,
                height: '100%',
                borderRight: colIndex < section.columns.length - 1 ? '1px solid #d0d0d0' : 'none',
                borderBottom: '1px solid #d0d0d0',
                backgroundColor: '#e8f5e9',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={paymentValues[col.dataField as keyof typeof paymentValues]}
                  onChange={(e) => onPaymentChange(item.id, col.dataField, e.target.value)}
                  onBlur={(e) => onPaymentBlur(item.id, col.dataField, e.target.value)}
                  onFocus={(e) => { onPaymentFocus(item.id, col.dataField); e.target.select(); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="0.00"
                  style={{
                    width: '100%', height: '100%', padding: '4px 8px',
                    border: 'none', textAlign: 'right', backgroundColor: 'transparent',
                    fontSize: '12px', boxSizing: 'border-box', outline: 'none',
                  }}
                />
              </div>
            );
          })}
          {sectionIndex < sections.length - 1 && (
            <div style={{ width: `${PAYMENTS_WIDTHS.gap}px`, backgroundColor: 'transparent', height: '100%' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
});

interface TrustExpensePaymentsGridProps {
  items: TrustExpenseItem[];
  showSectionHeader: boolean;
  sectionLabel: string;
  updateGlobalItem?: (itemId: string, patch: Partial<TrustExpenseItem>) => void;
}

const TrustExpensePaymentsGrid: React.FC<TrustExpensePaymentsGridProps> = ({
  items,
  showSectionHeader,
  sectionLabel,
  updateGlobalItem,
}) => {
  const totalWidth = (2 * PAYMENTS_WIDTHS.duePayment) + (2 * PAYMENTS_WIDTHS.payments1) + (2 * PAYMENTS_WIDTHS.payments2) + (2 * PAYMENTS_WIDTHS.gap);

  const [paymentValues, setPaymentValues] = useState<Record<string, {
    payUsd1: string; payUsd2: string; payTl1: string; payTl2: string;
  }>>({});

  useEffect(() => {
    const newState: typeof paymentValues = {};
    items.forEach(item => {
      const key = item.id;
      if (!paymentValues[key]) {
        const numUsd1 = toNumber(item.paidUsd1);
        const numUsd2 = toNumber(item.paidUsd2);
        const numTl1 = toNumber(item.paidTl1);
        const numTl2 = toNumber(item.paidTl2);
        newState[key] = {
          payUsd1: numUsd1 > 0 ? formatMoneyDisplay(numUsd1) : '',
          payUsd2: numUsd2 > 0 ? formatMoneyDisplay(numUsd2) : '',
          payTl1: numTl1 > 0 ? formatMoneyDisplay(numTl1) : '',
          payTl2: numTl2 > 0 ? formatMoneyDisplay(numTl2) : '',
        };
      }
    });
    if (Object.keys(newState).length > 0) {
      setPaymentValues(prev => ({ ...prev, ...newState }));
    }
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePaymentChange = useCallback((itemId: string, field: string, rawValue: string) => {
    const key = itemId;
    const sanitized = sanitizeMoneyInput(rawValue);
    setPaymentValues(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { payUsd1: '', payUsd2: '', payTl1: '', payTl2: '' }),
        [field]: sanitized
      }
    }));
  }, []);

  const saveToBackend = useCallback(async (itemId: string, field: string, value: number) => {
    try {
      const fieldMap = {
        payUsd1: 'paidUsd1', payUsd2: 'paidUsd2',
        payTl1: 'paidTl1', payTl2: 'paidTl2'
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
        throw new Error(`Failed to save payment: ${response.status} ${errorText}`);
      }

      const updatedItem = await response.json();
      if (updateGlobalItem) {
        updateGlobalItem(itemId, updatedItem);
      }
    } catch (error) {
      console.error('Failed to save payment:', error);
    }
  }, [updateGlobalItem]);

  const handlePaymentFocus = useCallback((itemId: string, field: string) => {
    const key = itemId;
    const currentValue = paymentValues[key]?.[field as keyof typeof paymentValues[typeof key]] || '';
    const numValue = parseMoneyInput(currentValue);
    const rawValue = numValue && numValue > 0 ? numValue.toString() : '';
    setPaymentValues(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { payUsd1: '', payUsd2: '', payTl1: '', payTl2: '' }),
        [field]: rawValue
      }
    }));
  }, [paymentValues]);

  const handlePaymentBlur = useCallback((itemId: string, field: string, rawValue: string) => {
    const key = itemId;
    const numValue = parseMoneyInput(rawValue);
    const finalValue = numValue !== null ? numValue : 0;
    const formatted = formatMoneyDisplay(finalValue);
    setPaymentValues(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { payUsd1: '', payUsd2: '', payTl1: '', payTl2: '' }),
        [field]: formatted
      }
    }));
    saveToBackend(itemId, field, finalValue);
  }, [saveToBackend]);

  const totals = useMemo(() => {
    let dueUsd = 0, dueTl = 0, payUsd1 = 0, payUsd2 = 0, payTl1 = 0, payTl2 = 0;
    items.forEach(item => {
      const { remainingUsd, remainingTl } = calculateRemaining(item);
      dueUsd += remainingUsd;
      dueTl += remainingTl;
      const key = item.id;
      const values = paymentValues[key];
      if (values) {
        payUsd1 += parseMoneyInput(values.payUsd1) || 0;
        payUsd2 += parseMoneyInput(values.payUsd2) || 0;
        payTl1 += parseMoneyInput(values.payTl1) || 0;
        payTl2 += parseMoneyInput(values.payTl2) || 0;
      }
    });
    return { dueUsd, dueTl, payUsd1, payUsd2, payTl1, payTl2 };
  }, [items, paymentValues]);

  return (
    <div style={{ width: `${totalWidth}px`, minWidth: `${totalWidth}px`, maxWidth: `${totalWidth}px` }}>
      {/* Section Header - GREEN BAR */}
      {showSectionHeader && (
        <div style={{
          height: '44px', minHeight: '44px', maxHeight: '44px',
          backgroundColor: '#2f4b1f', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '700', fontSize: '15px', letterSpacing: '1px',
          borderRadius: '6px 6px 0 0', border: '1px solid #1f3515', boxSizing: 'border-box'
        }}>
          PAYMENTS {sectionLabel}
        </div>
      )}

      {/* Top Group Row */}
      <div style={{
        display: 'flex', height: '34px', minHeight: '34px', maxHeight: '34px',
        backgroundColor: 'transparent', fontSize: '11px', fontWeight: '600', color: 'white',
        alignItems: 'center'
      }}>
        <div style={{ width: `${2 * PAYMENTS_WIDTHS.duePayment}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#2f5233' }}>DUE PAYMENT</div>
        <div style={{ width: `${PAYMENTS_WIDTHS.gap}px`, backgroundColor: 'transparent', height: '100%' }} />
        <div style={{ width: `${2 * PAYMENTS_WIDTHS.payments1}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#2f5233' }}>PAYMENTS 1</div>
        <div style={{ width: `${PAYMENTS_WIDTHS.gap}px`, backgroundColor: 'transparent', height: '100%' }} />
        <div style={{ width: `${2 * PAYMENTS_WIDTHS.payments2}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#2f5233' }}>PAYMENTS 2</div>
      </div>

      {/* Column Headers */}
      <div style={{
        display: 'flex', height: '34px', minHeight: '34px', maxHeight: '34px',
        backgroundColor: 'transparent', color: 'white', fontWeight: '600', fontSize: '11px',
        alignItems: 'center'
      }}>
        {['USD', 'TL'].map((label, i) => (
          <div key={`due-${label}`} style={{ width: `${PAYMENTS_WIDTHS.duePayment}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: i === 0 ? '1px solid #3f5b2f' : 'none', height: '100%', backgroundColor: '#1f3515', boxSizing: 'border-box' }}>{label}</div>
        ))}
        <div style={{ width: `${PAYMENTS_WIDTHS.gap}px`, backgroundColor: 'transparent', height: '100%' }} />
        {['USD', 'TL'].map((label, i) => (
          <div key={`pay1-${label}`} style={{ width: `${PAYMENTS_WIDTHS.payments1}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: i === 0 ? '1px solid #3f5b2f' : 'none', height: '100%', backgroundColor: '#1f3515', boxSizing: 'border-box' }}>{label}</div>
        ))}
        <div style={{ width: `${PAYMENTS_WIDTHS.gap}px`, backgroundColor: 'transparent', height: '100%' }} />
        {['USD', 'TL'].map((label, i) => (
          <div key={`pay2-${label}`} style={{ width: `${PAYMENTS_WIDTHS.payments2}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: i === 0 ? '1px solid #3f5b2f' : 'none', height: '100%', backgroundColor: '#1f3515', boxSizing: 'border-box' }}>{label}</div>
        ))}
      </div>

      {/* Data Rows */}
      {items.map(item => {
        const key = item.id;
        const values = paymentValues[key] || { payUsd1: '', payUsd2: '', payTl1: '', payTl2: '' };
        return (
          <PaymentRow
            key={item.id} item={item}
            paymentValues={values}
            onPaymentChange={handlePaymentChange}
            onPaymentBlur={handlePaymentBlur}
            onPaymentFocus={handlePaymentFocus}
          />
        );
      })}

      {/* Totals Row */}
      <div style={{
        display: 'flex', height: `${TOTAL_ROW_HEIGHT}px`, minHeight: `${TOTAL_ROW_HEIGHT}px`, maxHeight: `${TOTAL_ROW_HEIGHT}px`,
        backgroundColor: 'transparent', fontWeight: '700', fontSize: '12px', color: '#1f3515',
      }}>
        {[
          { value: totals.dueUsd, currency: 'USD' as const },
          { value: totals.dueTl, currency: 'TL' as const },
        ].map((t, i) => (
          <div key={`due-total-${i}`} style={{
            width: `${PAYMENTS_WIDTHS.duePayment}px`, display: 'flex', alignItems: 'center',
            justifyContent: 'flex-end', padding: '0 8px',
            borderRight: i === 0 ? '1px solid #a5d6a7' : 'none',
            borderTop: '2px solid #2f4b1f', backgroundColor: '#e8f5e9',
            height: '100%', boxSizing: 'border-box'
          }}>
            {formatDisplayWithCurrency(t.value, t.currency)}
          </div>
        ))}
        <div style={{ width: `${PAYMENTS_WIDTHS.gap}px`, backgroundColor: 'transparent', height: '100%' }} />
        {[
          { value: totals.payUsd1, currency: 'USD' as const },
          { value: totals.payTl1, currency: 'TL' as const },
        ].map((t, i) => (
          <div key={`pay1-total-${i}`} style={{
            width: `${PAYMENTS_WIDTHS.payments1}px`, display: 'flex', alignItems: 'center',
            justifyContent: 'flex-end', padding: '0 8px',
            borderRight: i === 0 ? '1px solid #a5d6a7' : 'none',
            borderTop: '2px solid #2f4b1f', backgroundColor: '#e8f5e9',
            height: '100%', boxSizing: 'border-box'
          }}>
            {formatDisplayWithCurrency(t.value, t.currency)}
          </div>
        ))}
        <div style={{ width: `${PAYMENTS_WIDTHS.gap}px`, backgroundColor: 'transparent', height: '100%' }} />
        {[
          { value: totals.payUsd2, currency: 'USD' as const },
          { value: totals.payTl2, currency: 'TL' as const },
        ].map((t, i) => (
          <div key={`pay2-total-${i}`} style={{
            width: `${PAYMENTS_WIDTHS.payments2}px`, display: 'flex', alignItems: 'center',
            justifyContent: 'flex-end', padding: '0 8px',
            borderRight: i === 0 ? '1px solid #a5d6a7' : 'none',
            borderTop: '2px solid #2f4b1f', backgroundColor: '#e8f5e9',
            height: '100%', boxSizing: 'border-box'
          }}>
            {formatDisplayWithCurrency(t.value, t.currency)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrustExpensePaymentsGrid;
