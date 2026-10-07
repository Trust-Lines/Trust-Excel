import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { BackendProjectItem } from '../lib/projects';
import { parseMoneyInput, formatMoneyDisplay } from '../utils/moneyUtils';
import { apiFetch } from '../lib/auth';

// Helper to convert any value to number safely
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

// Format money for display with currency symbol (like accounting table)
const formatDisplayWithCurrency = (value: number, currency: 'USD' | 'TL'): string => {
  if (value <= 0) return '-';
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return currency === 'USD' ? `$${formatted}` : `₺${formatted}`;
};

// Sanitize money input - allow only numbers, decimals, commas
const sanitizeMoneyInput = (value: string): string => {
  // Allow only digits, decimal point, and comma
  let sanitized = value.replace(/[^0-9.,]/g, '');

  // Handle multiple decimal points - keep only first one
  const decimalParts = sanitized.split('.');
  if (decimalParts.length > 2) {
    sanitized = decimalParts[0] + '.' + decimalParts.slice(1).join('');
  }

  return sanitized;
};

// ✅ PAYMENT COLUMNS: Define payment sections for complex 3-section layout
interface PaymentSection {
  name: 'duePayment' | 'payments1' | 'payments2';
  label: string;
  columns: PaymentColumn[];
  editable: boolean;
}

interface PaymentColumn {
  key: 'dueUsd' | 'dueTl' | 'payUsd1' | 'payUsd2' | 'payTl1' | 'payTl2';
  label: string;
  width: number;
  dataField?: string; // For editable columns only
}

const buildVisiblePaymentSections = (permissionOverrides?: {
  isColumnVisible?: (columnKey: string) => boolean;
  isColumnEditable?: (columnKey: string) => boolean;
}): PaymentSection[] => {
  const baseSections: PaymentSection[] = [
    {
      name: 'duePayment',
      label: 'DUE PAYMENT',
      editable: false,
      columns: [
        { key: 'dueUsd', label: 'USD', width: PAYMENTS_WIDTHS.duePayment },
        { key: 'dueTl', label: 'TL', width: PAYMENTS_WIDTHS.duePayment }
      ]
    },
    {
      name: 'payments1',
      label: 'PAYMENTS 1',
      editable: true,
      columns: [
        { key: 'payUsd1', label: 'USD', width: PAYMENTS_WIDTHS.payments1, dataField: 'payUsd1' },
        { key: 'payTl1', label: 'TL', width: PAYMENTS_WIDTHS.payments1, dataField: 'payTl1' }
      ]
    },
    {
      name: 'payments2',
      label: 'PAYMENTS 2',
      editable: true,
      columns: [
        { key: 'payUsd2', label: 'USD', width: PAYMENTS_WIDTHS.payments2, dataField: 'payUsd2' },
        { key: 'payTl2', label: 'TL', width: PAYMENTS_WIDTHS.payments2, dataField: 'payTl2' }
      ]
    }
  ];

  // ✅ FILTER HIDDEN COLUMNS: Filter out hidden columns from each section
  const visibleSections = baseSections.map(section => ({
    ...section,
    columns: section.columns.filter(col =>
      !permissionOverrides?.isColumnVisible || permissionOverrides.isColumnVisible(col.key)
    )
  })).filter(section => section.columns.length > 0); // Remove sections with no visible columns


  // 🔍 PAYMENT COLUMN MAPPING DEBUG

  // Test permission checks for each column
  if (permissionOverrides?.isColumnVisible) {
    ['dueUsd', 'dueTl', 'payUsd1', 'payUsd2', 'payTl1', 'payTl2'].forEach(_col => {
    });
  }

  return visibleSections;
};

// Payment column widths (matching visual design)
const PAYMENTS_WIDTHS = {
  duePayment: 120,   // Each column in Due Payment table
  payments1: 120,    // Each column in Payments 1 table
  payments2: 120,    // Each column in Payments 2 table
  gap: 16,           // Gap between mini tables
  get total() {
    // Structure: [Due Payment: USD+TL] + gap + [Payments1: USD+TL] + gap + [Payments2: USD+TL]
    // Total: (2×120) + (2×120) + (2×120) + (2×16) = 240 + 240 + 240 + 32 = 752px
    return (2 * this.duePayment) + (2 * this.payments1) + (2 * this.payments2) + (2 * this.gap);
  }
} as const;

interface PaymentsGridProps {
  items: BackendProjectItem[];
  sectionLabel: string;
  projectId: string;
  showSectionHeader: boolean;
  mode?: 'projects' | 'missingExtra' | 'directOrder' | 'expenses-p' | 'expenses-do' | 'expenses-me';
  updateGlobalItem?: (itemId: string, patch: Partial<BackendProjectItem>) => void;
  onTotalsChange?: (totals: { payUsd: number; payTl: number }) => void;
  permissionOverrides?: {
    isColumnVisible?: (columnKey: string) => boolean;
    isColumnEditable?: (columnKey: string) => boolean;
    isColumnReadOnly?: (columnKey: string) => boolean;
  };
}

/** Statuses at or beyond READY_TO_RECEIVE qualify for full due payment */
const GREEN_THRESHOLD_STATUSES = [
  'READY_TO_RECEIVE', 'RECEIVED', 'READY',
  'SENT_TO_TLINES', 'PARTIAL_SENT', 'SENT',
];

// Helper to calculate due payment amounts (yellow paid auto-reduces green due payment)
// Exported so supplier sheets can compute due payment grand totals with identical logic
export const calculateRemaining = (item: BackendProjectItem, mode?: string): { remainingUsd: number; remainingTl: number } => {
  const isExpensesP = mode === 'expenses-p' || mode === 'expenses-do' || mode === 'expenses-me';
  const itemAny = item as any;

  const pfTl = isExpensesP ? toNumber(itemAny.expensesTl) : toNumber(item.pfTl);
  const invoice = toNumber(itemAny.invoice);
  const invoiceAsUsd = pfTl > 0 ? 0 : invoice;
  const invoiceAsTl = pfTl > 0 ? invoice : 0;
  const paidUsd = toNumber(item.paidUsd1) + toNumber(item.paidUsd2);
  const paidTl = toNumber(item.paidTl1) + toNumber(item.paidTl2);

  // In expenses-p mode, all items are treated as SIGNED (no PF signing concept)
  const isPfSigned = isExpensesP ? true : (item.pfSignStatus === 'SIGNED');
  const isWaitingPayment = item.status === 'WAITING_PAYMENT';
  const isGreenEligible = GREEN_THRESHOLD_STATUSES.includes(item.status || '');

  // Not signed → no due payment
  if (!isPfSigned) {
    return { remainingUsd: 0, remainingTl: 0 };
  }

  // WAITING_PAYMENT + signed → partial amount based on paymentRule, minus paid
  if (isWaitingPayment) {
    const pct = parseFloat(String(item.paymentRule || '0')) / 100;
    return {
      remainingUsd: Math.max(0, invoiceAsUsd * pct - paidUsd),
      remainingTl: Math.max(0, invoiceAsTl * pct - paidTl),
    };
  }

  // Status >= RTR + signed → full remaining (invoice minus paid)
  if (isGreenEligible) {
    return {
      remainingUsd: Math.max(0, invoiceAsUsd - paidUsd),
      remainingTl: Math.max(0, invoiceAsTl - paidTl),
    };
  }

  // ORDERED, NOT_ORDERED, or other statuses → no due payment yet
  return { remainingUsd: 0, remainingTl: 0 };
};

// Individual payment row component
interface PaymentRowProps {
  item: BackendProjectItem;
  projectId: string;
  mode?: string;
  paymentValues: {
    payUsd1: string;
    payUsd2: string;
    payTl1: string;
    payTl2: string;
  };
  onPaymentChange: (itemId: string, field: string, value: string) => void;
  onPaymentBlur: (itemId: string, field: string, value: string) => void;
  onPaymentFocus: (itemId: string, field: string) => void;
  permissionOverrides?: {
    isColumnVisible?: (columnKey: string) => boolean;
    isColumnEditable?: (columnKey: string) => boolean;
    isColumnReadOnly?: (columnKey: string) => boolean;
  };
}

const PaymentRow: React.FC<PaymentRowProps> = React.memo(({
  item,
  projectId,
  mode,
  paymentValues,
  onPaymentChange,
  onPaymentBlur,
  onPaymentFocus,
  permissionOverrides
}) => {
  const { remainingUsd, remainingTl } = calculateRemaining(item, mode);

  // ✅ SECTION FILTERING: Get visible sections based on permissions
  const visibleSections = buildVisiblePaymentSections(permissionOverrides);

  // ✅ EARLY RETURN: Don't render if no visible sections
  if (visibleSections.length === 0) {
    return null;
  }


  // 🔍 DEBUG: Log permission decisions

  return (
    <div style={{
      display: 'flex',
      height: 'var(--supplier-data-row, 44px)',
      minHeight: 'var(--supplier-data-row, 44px)',
      maxHeight: 'var(--supplier-data-row, 44px)',
      backgroundColor: 'transparent',
      boxSizing: 'border-box'
    }}>
      {/* ✅ DYNAMIC SECTIONS: Render only visible sections */}
      {visibleSections.map((section, sectionIndex) => (
        <React.Fragment key={section.name}>
          {/* Section Columns */}
          {section.columns.map((column, columnIndex) => {
            // ✅ DUE PAYMENT COLUMNS: Auto-calculated from yellow paid
            if (column.key === 'dueUsd' || column.key === 'dueTl') {
              const value = column.key === 'dueUsd' ? remainingUsd : remainingTl;
              const currency = column.key === 'dueUsd' ? 'USD' : 'TL';

              return (
                <div
                  key={column.key}
                  style={{
                    width: `${column.width}px`,
                    height: '100%',
                    padding: '0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    borderRight: columnIndex < section.columns.length - 1 ? '1px solid #d0d0d0' : 'none',
                    borderBottom: '1px solid #d0d0d0',
                    backgroundColor: 'var(--payments-light-bg, #e8f5e9)',
                    fontSize: '12px',
                    fontWeight: '500',
                    boxSizing: 'border-box',
                  }}
                >
                  {formatDisplayWithCurrency(value, currency)}
                </div>
              );
            }

            // ✅ EDITABLE COLUMNS: Payment input fields
            if (column.dataField) {
              // ✅ INDIVIDUAL COLUMN CHECK: Use per-column permission
              const isColumnEditable = permissionOverrides?.isColumnEditable ?
                permissionOverrides.isColumnEditable(column.key) : true;

              return (
                <div
                  key={`${projectId}:${item.id}:${column.dataField}`}
                  style={{
                    width: `${column.width}px`,
                    height: '100%',
                    borderRight: columnIndex < section.columns.length - 1 ? '1px solid #d0d0d0' : 'none',
                    borderBottom: '1px solid #d0d0d0',
                    backgroundColor: isColumnEditable ? 'var(--payments-light-bg, #e8f5e9)' : '#f5f5f5',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={paymentValues[column.dataField as keyof typeof paymentValues]}
                    disabled={!isColumnEditable}
                    onChange={(e) => {
                      if (isColumnEditable) {
                        onPaymentChange(item.id, column.dataField!, e.target.value);
                      }
                    }}
                    onBlur={(e) => {
                      if (isColumnEditable) {
                        onPaymentBlur(item.id, column.dataField!, e.target.value);
                      }
                    }}
                    onFocus={(e) => {
                      if (isColumnEditable) {
                        onPaymentFocus(item.id, column.dataField!);
                        e.target.select();
                      }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      height: '100%',
                      padding: '4px 8px',
                      border: 'none',
                      textAlign: 'right',
                      backgroundColor: 'transparent',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      color: isColumnEditable ? 'inherit' : '#999',
                      cursor: isColumnEditable ? 'text' : 'not-allowed'
                    }}
                  />
                </div>
              );
            }

            return null; // Fallback for unknown column types
          })}

          {/* ✅ DYNAMIC GAP: Only add gap between sections */}
          {sectionIndex < visibleSections.length - 1 && (
            <div style={{
              width: `${PAYMENTS_WIDTHS.gap}px`,
              backgroundColor: 'transparent',
              height: '100%'
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
});

const PaymentsGrid: React.FC<PaymentsGridProps> = ({
  items,
  sectionLabel,
  projectId,
  showSectionHeader,
  mode = 'projects',
  updateGlobalItem,
  onTotalsChange,
  permissionOverrides
}) => {
  // ✅ SECTION FILTERING: Get visible sections and calculate dynamic width
  const visibleSections = buildVisiblePaymentSections(permissionOverrides);
  const totalWidth = visibleSections.reduce((sectionSum, section) => {
    const sectionWidth = section.columns.reduce((colSum, col) => colSum + col.width, 0);
    return sectionSum + sectionWidth;
  }, 0) + (Math.max(0, visibleSections.length - 1) * PAYMENTS_WIDTHS.gap);

  // ✅ EARLY RETURN: Don't render grid if no visible sections
  if (visibleSections.length === 0) {
    return null;
  }


  // Local state for payment inputs (per item)
  const [paymentValues, setPaymentValues] = useState<Record<string, {
    payUsd1: string;
    payUsd2: string;
    payTl1: string;
    payTl2: string;
  }>>({});

  // Initialize state for new items from backend paid fields
  // In expenses-p mode: PAYMENTS 1/2 are independent from AccountingGrid — don't pre-fill from backend
  const isExpensesP = mode === 'expenses-p' || mode === 'expenses-do' || mode === 'expenses-me';
  useEffect(() => {
    const newState: typeof paymentValues = {};
    items.forEach(item => {
      const key = `${projectId}:${item.id}`;
      if (!paymentValues[key]) {
        if (isExpensesP) {
          // expenses-p: PAYMENTS 1/2 start empty — AccountingGrid manages paid fields
          newState[key] = { payUsd1: '', payUsd2: '', payTl1: '', payTl2: '' };
        } else {
          // Other modes: Initialize from backend paid fields
          const numUsd1 = toNumber(item.paidUsd1);
          const numUsd2 = toNumber(item.paidUsd2);
          const numTl1 = toNumber(item.paidTl1);
          const numTl2 = toNumber(item.paidTl2);

          newState[key] = {
            payUsd1: numUsd1 > 0 ? formatMoneyDisplay(numUsd1) : '',
            payUsd2: numUsd2 > 0 ? formatMoneyDisplay(numUsd2) : '',
            payTl1: numTl1 > 0 ? formatMoneyDisplay(numTl1) : '',
            payTl2: numTl2 > 0 ? formatMoneyDisplay(numTl2) : ''
          };
        }
      }
    });
    if (Object.keys(newState).length > 0) {
      setPaymentValues(prev => ({ ...prev, ...newState }));
    }
  }, [items, projectId, isExpensesP]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePaymentChange = useCallback((itemId: string, field: string, rawValue: string) => {
    const key = `${projectId}:${itemId}`;

    // Use proper money input sanitization (same as accounting table)
    const sanitized = sanitizeMoneyInput(rawValue);

    setPaymentValues(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { payUsd1: '', payUsd2: '', payTl1: '', payTl2: '' }),
        [field]: sanitized
      }
    }));
  }, [projectId]);

  // Backend save function for payment values
  const saveToBackend = useCallback(async (itemId: string, field: string, value: number) => {
    try {
      // Field mapping for payments (same as accounting - paid fields)
      const fieldMap = {
        payUsd1: 'paidUsd1',
        payUsd2: 'paidUsd2',
        payTl1: 'paidTl1',
        payTl2: 'paidTl2'
      } as const;

      const backendField = fieldMap[field as keyof typeof fieldMap];
      if (!backendField) {
        console.error('❌ PAYMENT_SAVE_ERROR: Invalid field', { field });
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

      // Build payload
      const payload = { [backendField]: value };


      const response = await apiFetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save payment ${field}: ${response.status} ${errorText}`);
      }

      const updatedItem = await response.json();

      // Update global item state if callback provided
      if (updateGlobalItem) {
        updateGlobalItem(itemId, updatedItem);
      }
    } catch (error) {
      console.error('❌ PAYMENT_SAVE_ERROR', { itemId, field, value, error });
      // TODO: Show error toast to user
    }
  }, [mode, updateGlobalItem]);

  const handlePaymentFocus = useCallback((itemId: string, field: string) => {
    const key = `${projectId}:${itemId}`;
    const currentValue = paymentValues[key]?.[field as keyof typeof paymentValues[typeof key]] || '';

    // Parse the formatted value back to raw number for editing
    const numValue = parseMoneyInput(currentValue);
    const rawValue = numValue && numValue > 0 ? numValue.toString() : '';

    setPaymentValues(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { payUsd1: '', payUsd2: '', payTl1: '', payTl2: '' }),
        [field]: rawValue
      }
    }));
  }, [projectId, paymentValues]);

  const handlePaymentBlur = useCallback((itemId: string, field: string, rawValue: string) => {
    const key = `${projectId}:${itemId}`;

    // Parse input using proper money parser (same as accounting table)
    const numValue = parseMoneyInput(rawValue);
    const finalValue = numValue !== null ? numValue : 0;

    // Format for display (same as accounting table)
    const formatted = formatMoneyDisplay(finalValue);

    setPaymentValues(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { payUsd1: '', payUsd2: '', payTl1: '', payTl2: '' }),
        [field]: formatted
      }
    }));


    // Save to backend - but NOT in expenses-p mode (AccountingGrid manages paidUsd/paidTl fields)
    if (!isExpensesP) {
      saveToBackend(itemId, field, finalValue);
    }
  }, [projectId, saveToBackend, isExpensesP]);

  // Calculate totals for each mini table
  const totals = useMemo(() => {
    let dueUsd = 0, dueTl = 0;
    let payUsd1 = 0, payUsd2 = 0;
    let payTl1 = 0, payTl2 = 0;

    items.forEach(item => {
      const { remainingUsd, remainingTl } = calculateRemaining(item, mode);
      dueUsd += remainingUsd;
      dueTl += remainingTl;

      const key = `${projectId}:${item.id}`;
      const values = paymentValues[key];
      if (values) {
        // Use parseMoneyInput to properly parse formatted money strings like "123,123.00"
        payUsd1 += parseMoneyInput(values.payUsd1) || 0;
        payUsd2 += parseMoneyInput(values.payUsd2) || 0;
        payTl1 += parseMoneyInput(values.payTl1) || 0;
        payTl2 += parseMoneyInput(values.payTl2) || 0;
      }
    });

    return { dueUsd, dueTl, payUsd1, payUsd2, payTl1, payTl2 };
  }, [items, projectId, paymentValues, mode]);

  // Callback to parent with combined totals
  React.useEffect(() => {
    if (onTotalsChange) {
      const payUsd = totals.payUsd1 + totals.payUsd2; // All USD payments total
      const payTl = totals.payTl1 + totals.payTl2;   // All TL payments total
      onTotalsChange({ payUsd, payTl });
    }
  }, [totals, onTotalsChange]);

  return (
    <div style={{
      width: `${totalWidth}px`,
      minWidth: `${totalWidth}px`,
      maxWidth: `${totalWidth}px`,
    }}>
      {/* Section Header - GREEN BAR */}
      {showSectionHeader && (
        <div style={{
          height: 'var(--supplier-section-header, 44px)',
          minHeight: 'var(--supplier-section-header, 44px)',
          maxHeight: 'var(--supplier-section-header, 44px)',
          backgroundColor: 'var(--payments-section-bg, #2f4b1f)',
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
          border: '1px solid #1f3515',
          boxSizing: 'border-box'
        }}>
          PAYMENTS {sectionLabel.replace('TLines ', 'T LINES ').toUpperCase()}
        </div>
      )}

      {/* Project Header Spacer (matches ProjectBlock height) - REMOVED, not needed */}

      {/* ✅ DYNAMIC TOP GROUP ROW: Section labels based on visible sections */}
      <div className="pay-topgroup-row" style={{
        display: 'flex',
        height: 'var(--supplier-topgroup-row, 34px)',
        minHeight: 'var(--supplier-topgroup-row, 34px)',
        maxHeight: 'var(--supplier-topgroup-row, 34px)',
        backgroundColor: 'transparent',
        fontSize: '11px',
        fontWeight: '600',
        color: 'white',
        margin: '0',
        padding: '0',
        boxSizing: 'border-box',
        alignItems: 'center'
      }}>
        {visibleSections.map((section, sectionIndex) => {
          const sectionWidth = section.columns.reduce((sum, col) => sum + col.width, 0);

          return (
            <React.Fragment key={section.name}>
              <div style={{
                width: `${sectionWidth}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                backgroundColor: 'var(--payments-header-bg, #2f5233)'
              }}>
                {section.label}
              </div>
              {/* ✅ DYNAMIC GAP: Only add gap between sections */}
              {sectionIndex < visibleSections.length - 1 && (
                <div style={{
                  width: `${PAYMENTS_WIDTHS.gap}px`,
                  backgroundColor: 'transparent',
                  height: '100%'
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ✅ DYNAMIC COLUMN HEADERS ROW: Currency labels based on visible columns */}
      <div className="pay-colhead-row" style={{
        display: 'flex',
        height: 'var(--supplier-colhead-row, 34px)',
        minHeight: 'var(--supplier-colhead-row, 34px)',
        maxHeight: 'var(--supplier-colhead-row, 34px)',
        backgroundColor: 'transparent',
        color: 'white',
        fontWeight: '600',
        fontSize: '11px',
        margin: '0',
        padding: '0',
        boxSizing: 'border-box',
        alignItems: 'center'
      }}>
        {visibleSections.map((section, sectionIndex) => (
          <React.Fragment key={section.name}>
            {/* Section Column Headers */}
            {section.columns.map((column, columnIndex) => (
              <div
                key={column.key}
                style={{
                  width: `${column.width}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: columnIndex < section.columns.length - 1 ? '1px solid #3f5b2f' : 'none',
                  height: '100%',
                  backgroundColor: 'var(--payments-totals-bg, #1f3515)',
                  boxSizing: 'border-box'
                }}
              >
                {column.label}
              </div>
            ))}
            {/* ✅ DYNAMIC GAP: Only add gap between sections */}
            {sectionIndex < visibleSections.length - 1 && (
              <div style={{
                width: `${PAYMENTS_WIDTHS.gap}px`,
                backgroundColor: 'transparent',
                height: '100%'
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Data Rows */}
      {items.map((item) => {
        const key = `${projectId}:${item.id}`;
        const values = paymentValues[key] || { payUsd1: '', payUsd2: '', payTl1: '', payTl2: '' };

        return (
          <PaymentRow
            key={item.id}
            item={item}
            projectId={projectId}
            mode={mode}
            paymentValues={values}
            onPaymentChange={handlePaymentChange}
            onPaymentBlur={handlePaymentBlur}
            onPaymentFocus={handlePaymentFocus}
            permissionOverrides={permissionOverrides}
          />
        );
      })}

      {/* ✅ DYNAMIC TOTALS ROW: Display totals for visible sections only */}
      <div style={{
        display: 'flex',
        height: 'var(--supplier-totals-row, 36px)',
        minHeight: 'var(--supplier-totals-row, 36px)',
        maxHeight: 'var(--supplier-totals-row, 36px)',
        backgroundColor: 'transparent',
        fontWeight: '700',
        fontSize: '12px',
        color: '#1f3515',
        margin: '0',
        padding: '0',
        boxSizing: 'border-box'
      }}>
        {visibleSections.map((section, sectionIndex) => (
          <React.Fragment key={section.name}>
            {/* Section Column Totals */}
            {section.columns.map((column, columnIndex) => {
              // ✅ CALCULATE TOTALS: Get appropriate total value for this column
              let totalValue = 0;
              let currency: 'USD' | 'TL' = 'USD';

              if (column.key === 'dueUsd') {
                totalValue = totals.dueUsd;
                currency = 'USD';
              } else if (column.key === 'dueTl') {
                totalValue = totals.dueTl;
                currency = 'TL';
              } else if (column.key === 'payUsd1') {
                totalValue = totals.payUsd1;
                currency = 'USD';
              } else if (column.key === 'payUsd2') {
                totalValue = totals.payUsd2;
                currency = 'USD';
              } else if (column.key === 'payTl1') {
                totalValue = totals.payTl1;
                currency = 'TL';
              } else if (column.key === 'payTl2') {
                totalValue = totals.payTl2;
                currency = 'TL';
              }

              return (
                <div
                  key={column.key}
                  style={{
                    width: `${column.width}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '0 8px',
                    borderRight: columnIndex < section.columns.length - 1 ? '1px solid #a5d6a7' : 'none',
                    borderTop: '2px solid #2f4b1f',
                    backgroundColor: 'var(--payments-light-bg, #e8f5e9)',
                    height: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  {formatDisplayWithCurrency(totalValue, currency)}
                </div>
              );
            })}
            {/* ✅ DYNAMIC GAP: Only add gap between sections */}
            {sectionIndex < visibleSections.length - 1 && (
              <div style={{
                width: `${PAYMENTS_WIDTHS.gap}px`,
                backgroundColor: 'transparent',
                height: '100%'
              }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default PaymentsGrid;
