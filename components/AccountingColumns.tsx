import React, { useState, useCallback } from 'react';

/**
 * Accounting data per item (row-level)
 */
export interface RowAccountingData {
  itemId: string;
  paidUsd1: number;
  paidUsd2: number;
  paidTl1: number;
  paidTl2: number;
  // Calculated fields
  remainingUsd: number;
  remainingTl: number;
  notOrderedUsd: number;
  notOrderedTl: number;
  showNotSignedRemaining: boolean;
}

/**
 * Calculate accounting values for a single row
 */
export function calculateRowAccounting(
  itemId: string,
  _pfUsd: number,
  pfTl: number,
  status: string,
  pfSignStatus: string,
  paidUsd1: number,
  paidUsd2: number,
  paidTl1: number,
  paidTl2: number,
  invoice: number = 0,
): RowAccountingData {
  const paidUsdTotal = paidUsd1 + paidUsd2;
  const paidTlTotal = paidTl1 + paidTl2;

  // Invoice replaces pfUsd/pfTl as the base amount.
  // Determine currency from pf values: if pfTl > 0 it's a TL deal, otherwise USD.
  const invoiceAsTl = pfTl > 0 ? invoice : 0;
  const invoiceAsUsd = pfTl > 0 ? 0 : invoice;

  let remainingUsd = Math.max(invoiceAsUsd - paidUsdTotal, 0);
  let remainingTl = Math.max(invoiceAsTl - paidTlTotal, 0);
  let notOrderedUsd = 0;
  let notOrderedTl = 0;
  let showNotSignedRemaining = false;

  // Classification logic
  if (status === 'NOT ORDERED') {
    // Rule 1: NOT_ORDERED -> amounts go to Not Ordered columns
    notOrderedUsd = remainingUsd;
    notOrderedTl = remainingTl;
    remainingUsd = 0;
    remainingTl = 0;
  } else if (pfSignStatus !== 'SIGNED') {
    // Rule 2: Not signed -> show indicator in Remaining
    showNotSignedRemaining = true;
  }
  // Rule 3: Signed and not NOT_ORDERED -> show in Remaining (default)

  return {
    itemId,
    paidUsd1,
    paidUsd2,
    paidTl1,
    paidTl2,
    remainingUsd,
    remainingTl,
    notOrderedUsd,
    notOrderedTl,
    showNotSignedRemaining
  };
}

/**
 * Format currency value with thousands separator and 2 decimals
 */
export function formatAccountingValue(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) {
    return '-';
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Accounting cell - editable numeric input for paid amounts (Excel gold style)
 */
export const EditableAccountingCell: React.FC<{
  value: number;
  currency: string;
  onSave: (value: number) => void;
  editable: boolean;
}> = ({ value, currency, onSave, editable }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleClick = () => {
    if (editable) {
      setIsEditing(true);
      setEditValue(value.toString());
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    const numValue = trimmed === '' ? 0 : (parseFloat(trimmed) || 0);
    if (numValue !== value) {
      onSave(numValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value.toString());
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        style={{
          width: '100%',
          height: '100%',
          border: '2px solid #d4af37',
          padding: '4px 8px',
          fontSize: '13px',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          backgroundColor: '#fef3c7'
        }}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={editable ? 'accounting-data-cell accounting-data-cell-editable' : 'accounting-data-cell'}
    >
      <span className="accounting-currency-icon">{currency}</span>
      <span>{formatAccountingValue(value)}</span>
    </div>
  );
};

/**
 * Read-only accounting cell for calculated values (Excel gold style)
 */
export const ReadOnlyAccountingCell: React.FC<{
  value: number;
  currency: string;
  showNotSigned?: boolean;
}> = ({ value, currency, showNotSigned = false }) => {
  if (showNotSigned) {
    return (
      <div className="accounting-not-signed">
        NOT SIGNED
      </div>
    );
  }

  return (
    <div className="accounting-data-cell">
      <span className="accounting-currency-icon">{currency}</span>
      <span>{formatAccountingValue(value)}</span>
    </div>
  );
};

/**
 * Accounting row cells - renders all 8 accounting columns for a single row
 */
export const AccountingRowCells: React.FC<{
  rowData: RowAccountingData;
  onPaidUpdate: (field: 'paidUsd1' | 'paidUsd2' | 'paidTl1' | 'paidTl2', value: number) => void;
  editable: boolean;
}> = ({ rowData, onPaidUpdate, editable }) => {
  return (
    <>
      {/* Paid USD 1st */}
      <div className="row-cell col-accounting-paid-usd-1">
        <EditableAccountingCell
          value={rowData.paidUsd1}
          currency="$"
          onSave={(val) => onPaidUpdate('paidUsd1', val)}
          editable={editable}
        />
      </div>

      {/* Paid USD 2nd */}
      <div className="row-cell col-accounting-paid-usd-2">
        <EditableAccountingCell
          value={rowData.paidUsd2}
          currency="$"
          onSave={(val) => onPaidUpdate('paidUsd2', val)}
          editable={editable}
        />
      </div>

      {/* Paid TL 1st */}
      <div className="row-cell col-accounting-paid-tl-1">
        <EditableAccountingCell
          value={rowData.paidTl1}
          currency="₺"
          onSave={(val) => onPaidUpdate('paidTl1', val)}
          editable={editable}
        />
      </div>

      {/* Paid TL 2nd */}
      <div className="row-cell col-accounting-paid-tl-2">
        <EditableAccountingCell
          value={rowData.paidTl2}
          currency="₺"
          onSave={(val) => onPaidUpdate('paidTl2', val)}
          editable={editable}
        />
      </div>

      {/* Remaining USD */}
      <div className="row-cell col-accounting-remaining-usd">
        <ReadOnlyAccountingCell
          value={rowData.remainingUsd}
          currency="$"
          showNotSigned={rowData.showNotSignedRemaining}
        />
      </div>

      {/* Remaining TL */}
      <div className="row-cell col-accounting-remaining-tl">
        <ReadOnlyAccountingCell
          value={rowData.remainingTl}
          currency="₺"
          showNotSigned={rowData.showNotSignedRemaining}
        />
      </div>

      {/* Not Ordered USD */}
      <div className="row-cell col-accounting-not-ordered-usd">
        <ReadOnlyAccountingCell
          value={rowData.notOrderedUsd}
          currency="$"
        />
      </div>

      {/* Not Ordered TL */}
      <div className="row-cell col-accounting-not-ordered-tl">
        <ReadOnlyAccountingCell
          value={rowData.notOrderedTl}
          currency="₺"
        />
      </div>
    </>
  );
};

/**
 * Hook to manage paid amounts state
 */
export function useAccountingState() {
  const [paidAmounts, setPaidAmounts] = useState<Map<string, {
    paidUsd1: number;
    paidUsd2: number;
    paidTl1: number;
    paidTl2: number;
  }>>(new Map());

  const getPaidAmounts = useCallback((itemId: string) => {
    return paidAmounts.get(itemId) || {
      paidUsd1: 0,
      paidUsd2: 0,
      paidTl1: 0,
      paidTl2: 0
    };
  }, [paidAmounts]);

  const updatePaidAmount = useCallback((
    itemId: string,
    field: 'paidUsd1' | 'paidUsd2' | 'paidTl1' | 'paidTl2',
    value: number
  ) => {
    setPaidAmounts(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(itemId) || { paidUsd1: 0, paidUsd2: 0, paidTl1: 0, paidTl2: 0 };
      newMap.set(itemId, { ...current, [field]: value });
      return newMap;
    });
  }, []);

  return { getPaidAmounts, updatePaidAmount };
}
