import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

/** Same key as the server (server/src/trust-stock/trust-stock-columns.ts) */
export const TRUST_STOCK_TABLE_KEY = 'trust-stock-grid';

const PRICE_COLUMNS = ['pfUsd', 'pfTl', 'invoice', 'invoiceTl'];

/**
 * The role's Trust Stock column rules (Admin > Roles > Trust Stock columns).
 * Only the listed Trust Stock columns can be restricted; the rest stay as they are.
 * The server applies the same rules, so hidden prices never reach the browser.
 */
export const useTrustStockColumns = () => {
  const { userAccessPolicy } = useAuth();
  return useMemo(() => {
    const rules = userAccessPolicy?.tablePermissions?.[TRUST_STOCK_TABLE_KEY];
    const hidden = new Set(rules?.columnsHidden || []);
    const readOnly = new Set(rules?.columnsReadOnly || []);
    // accounting (remaining = PF − paid) would give away hidden prices
    if (PRICE_COLUMNS.some(c => hidden.has(c))) hidden.add('accounting');
    const isColumnVisible = (key: string) => !hidden.has(key);
    const isColumnEditable = (key: string) => !hidden.has(key) && !readOnly.has(key);
    return {
      isColumnVisible,
      isColumnEditable,
      showAccounting: isColumnVisible('accounting'),
      /** View PDF, Upload PF PDF and the RE-ORDER PF (all show prices) */
      canUsePdfs: isColumnVisible('pfPdf'),
    };
  }, [userAccessPolicy]);
};
