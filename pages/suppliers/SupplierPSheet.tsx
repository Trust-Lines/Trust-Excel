import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLivePatchStore, PatchEventPayload } from '../../hooks/useLivePatchStore';
import { getProjects } from '../../lib/projects';
import type { BackendProject, BackendProjectItem } from '../../lib/projects';
import { apiFetch } from '../../lib/auth';
import ProjectBlock from '../../components/ProjectBlock';
import { extractVendorCode } from '../../lib/vendorUtils';
import { sortBackendItems } from '../../types';
import { normalizeProjectNoForDisplay } from '../../lib/projectNoUtils';
import { useColumnPermissions } from '../../hooks/useColumnPermissions';
import { useSupplierColumnPermissions } from '../../hooks/useSupplierColumnPermissions';
import { TABLE_KEYS } from '../../lib/permissionKeys';
import { getGridWidthPx } from '../../lib/gridWidth';
import PaymentsGrid, { calculateRemaining } from '../../components/PaymentsGrid';
import { getProjectColor } from '../../lib/projectColor';
import { parseMoneyInput, formatMoneyDisplay, prepareMoneyForBackend, formatReadonlyMoney } from '../../utils/moneyUtils';
import { useSocket } from '../../contexts/SocketContext';
import { useSocketEvent } from '../../hooks/useSocketEvent';
import InvoiceReceiptGrid from '../../components/InvoiceReceiptGrid';
import { useAuth } from '../../contexts/AuthContext';
import { exportSupplierToExcel } from '../../utils/excel/exportSupplierExcel';

import { SupplierFilterConfig, hasActiveSupplierFilters, itemPassesSupplierFilter, SupplierFilterOptions, buildSupplierFilterOptions, projectMatchesHalfFilter } from '../../components/SupplierFilterBar';

interface SupplierPSheetProps {
  vendorCode: string;
  filter?: SupplierFilterConfig;
  onFilterOptions?: (options: SupplierFilterOptions) => void;
}

// ✅ UNIFIED PERMISSION LOADING: Load both table actions and column rules
import { useSupplierPermissionResolver } from '../../hooks/useSupplierPermissionResolver';

const useSupplierPermissions = (roleId?: string) => {
  const [permissionsData, setPermissionsData] = useState<{
    tableActionsByKey: Record<string, { view: boolean; edit: boolean; export: boolean }>;
    columnRulesByKey: Record<string, Record<string, 'hidden' | 'readonly' | 'editable'>>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleId) {
      console.warn('[PERM_FETCH] No roleId, skipping fetch');
      setLoading(false);
      return;
    }

    const loadPermissions = async () => {
      // Public endpoint — any authenticated user can access their own role permissions
      const url = '/api/permissions/supplier/my-permissions';
      console.warn('[PERM_FETCH] GET', url, { roleId });

      try {
        const response = await apiFetch(url);
        console.warn('[PERM_FETCH] status', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.warn('[PERM_FETCH] ERROR response', response.status, errorText);
          setPermissionsData({ tableActionsByKey: {}, columnRulesByKey: {} });
          return;
        }

        const data = await response.json();
        console.warn('[PERM_FETCH] json', JSON.stringify(data, null, 2));

        const resolved = {
          tableActionsByKey: data.data?.tableActionsByKey || {},
          columnRulesByKey: data.data?.columnRulesByKey || {},
        };

        console.warn('[PERM_FETCH] resolved', {
          tableActionKeys: Object.keys(resolved.tableActionsByKey),
          columnRuleKeys: Object.keys(resolved.columnRulesByKey),
          sampleRules: Object.entries(resolved.columnRulesByKey).slice(0, 2),
        });

        setPermissionsData(resolved);
      } catch (err) {
        console.warn('[PERM_FETCH] error', err);
        setPermissionsData({ tableActionsByKey: {}, columnRulesByKey: {} });
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [roleId]);

  return { permissionsData, loading };
};

// ========== PIXEL-PERFECT ALIGNMENT CONSTANTS ==========

// Accounting column constants (source of truth)
const ACCOUNTING_WIDTHS = {
  paid: 120,        // Individual paid column width
  paidDate: 100,    // Date column next to paid
  remaining: 140,   // Individual remaining column width
  notOrdered: 140,  // Individual not ordered column width
  gap: 30,          // Gap between column groups (synced with --accounting-gap-width CSS var)
  get total() {
    // Structure: [PaidUSD1,Date] + gap + [PaidUSD2,Date] + gap + [PaidTL1,Date] + gap + [PaidTL2,Date] + gap + [RemUSD,RemTL] + gap + [NotOrderedUSD,NotOrderedTL]
    return (4 * this.paid) + (4 * this.paidDate) + (2 * this.remaining) + (2 * this.notOrdered) + (5 * this.gap);
  }
} as const;

// Payments column widths
const PAYMENTS_WIDTHS = {
  duePayment: 120,
  payments1: 120,
  payments2: 120,
  gap: 16,
  get total() {
    return (2 * this.duePayment) + (2 * this.payments1) + (2 * this.payments2) + (2 * this.gap);
  }
} as const;

// Invoice column widths (matching InvoiceReceiptGrid)
const INVOICE_WIDTHS = {
  transactionNo: 140,
  invoiceNumber: 140,
  quickBook: 120,
  invoiceDate: 120,
  gap: 16,
  get total() {
    return this.transactionNo + this.invoiceNumber + this.quickBook + this.invoiceDate + (3 * this.gap);
  }
} as const;

// Layout constants
const LAYOUT_CONSTANTS = {
  gap: 24,                           // Gap between blocks
  leftWidth: 'var(--leftWidth)',    // Dynamic from gridWidth.ts
  rightWidth: `${ACCOUNTING_WIDTHS.total}px`,  // Fixed accounting width
  paymentsWidth: `${PAYMENTS_WIDTHS.total}px`,  // Fixed payments width
  invoiceWidth: `${INVOICE_WIDTHS.total}px`,    // Fixed invoice width

  // Exact row heights for perfect alignment
  sectionHeader: 44,
  projectHeader: 52,
  columnHeader: 36,
  dataRow: 44,
  totalsRow: 36
} as const;

// Safe numeric conversion helper to handle all possible input types
const toNumber = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'string') {
    const cleaned = v.replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  // fallback for objects like Prisma Decimal
  if (typeof v === 'object') {
    if (typeof (v as any).toNumber === 'function') return (v as any).toNumber();
    if (typeof (v as any).toString === 'function') {
      const n = Number(String(v));
      return Number.isFinite(n) ? n : 0;
    }
  }
  return 0;
};

// Section Total Row Component
const SectionTotalRow: React.FC<{
  sectionLabel: string;
  totals: { pfUsd: number; pfTl: number; invoice: number; invoiceTl: number; hasData: boolean };
  isColumnVisible: (columnKey: string) => boolean;
  shouldShowMoneyTotals: () => boolean;
  gridWidthPx: string;
}> = ({ sectionLabel, totals, isColumnVisible, shouldShowMoneyTotals, gridWidthPx }) => {
  if (!totals.hasData || !shouldShowMoneyTotals()) {
    return null;
  }

  const sectionName = sectionLabel.replace('TLines ', '').toUpperCase();
  // Use passed permission function for money columns
  const showUsdTotal = isColumnVisible('pfUsd');
  const showTlTotal = isColumnVisible('pfTl');
  const showInvoiceTotal = isColumnVisible('invoice');
  const showInvoiceTlTotal = isColumnVisible('invoiceTl');

  if (!showUsdTotal && !showTlTotal && !showInvoiceTotal && !showInvoiceTlTotal) {
    return null;
  }

  return (
    <div style={{
      position: 'relative',
      width: gridWidthPx,
      minWidth: gridWidthPx,
      maxWidth: gridWidthPx,
      height: '45px',
      backgroundColor: '#2563eb',
      color: 'white',
      borderRadius: '6px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '3px solid #0066ff' // Thicker bright blue border
    }}>
      <div style={{
        textAlign: 'center',
        fontWeight: '700',
        fontSize: '16px',
        letterSpacing: '0.5px'
      }}>
        {sectionName} TOTALS
      </div>
      <div style={{
        position: 'absolute',
        right: '363px',
        display: 'flex',
        gap: '40px',
        alignItems: 'center'
      }}>
        {showUsdTotal && (
          <div style={{
            backgroundColor: '#1d4ed8',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',

            fontWeight: '600',
            gap: '12px',
            fontSize: '14px',
            border: '1px solid #1e40af',
            minWidth: '120px',
            textAlign: 'center'
          }}>
            ${totals.pfUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        {showTlTotal && (
          <div style={{
            backgroundColor: '#1d4ed8',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '14px',
            border: '1px solid #1e40af',
            minWidth: '120px',
            textAlign: 'center'
          }}>
            ₺{totals.pfTl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        {showInvoiceTotal && (
          <div style={{
            backgroundColor: '#1d4ed8',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '14px',
            border: '1px solid #1e40af',
            minWidth: '120px',
            textAlign: 'center'
          }}>
            INV/USD {totals.invoice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        {showInvoiceTlTotal && (
          <div style={{
            backgroundColor: '#1d4ed8',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontWeight: '600',
            marginRight: '150px',
            fontSize: '14px',
            border: '1px solid #1e40af',
            minWidth: '120px',
            textAlign: 'center'
          }}>
            INV/TL {totals.invoiceTl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
      </div>
    </div>
  );
};

// Removed useGlobalScrollSync - using manual scroll sync instead

/**
 * SupplierPSheet - Clean implementation for Supplier P tab
 * 
 * Strategy:
 * 1. Uses ORIGINAL ProjectBlock component (no modifications)
 * 2. Filters data by vendor BEFORE passing to ProjectBlock
 * 3. Renders accounting columns as separate right-side grid
 * 4. Both grids scroll together with ONE page-level horizontal scrollbar
 */
const SupplierPSheet: React.FC<SupplierPSheetProps> = ({ vendorCode, filter, onFilterOptions }) => {
  const { role } = useAuth();
  // ✅ UNIFIED PERMISSION SYSTEM: Load permissions and use resolver
  const { permissionsData, loading: permissionsLoading } = useSupplierPermissions(role?.id);
  const permissionResolver = useSupplierPermissionResolver(permissionsData);
  const mainTab = 'P' as const;

  // Key normalization helper (ensures consistent key format across all lookups)
  const normalizeTab = (tab: string): 'P' | 'ME' | 'DO' => {
    const t = tab.toUpperCase().trim();
    if (t === 'P' || t === 'PROJECTS') return 'P';
    if (t === 'ME' || t === 'MISSINGEXTRA') return 'ME';
    if (t === 'DO' || t === 'DIRECTORDERS') return 'DO';
    return t as 'P' | 'ME' | 'DO';
  };

  // ═══ STEP 0: PROOF that this code is running ═══
  console.warn('[FORCE_PROOF] SupplierPSheet version = 2026-02-10-ACCT2-public-endpoint');

  // ═══ STEP 1: Permission data proof ═══
  console.warn('[PERM_PROOF] roleId', role?.id, 'roleName', role?.name);
  console.warn('[PERM_PROOF] hasPermissionsData', !!permissionsData);
  console.warn('[PERM_PROOF] columnRuleKeys', Object.keys(permissionsData?.columnRulesByKey || {}));
  console.warn('[PERM_PROOF] tableActionKeys', Object.keys(permissionsData?.tableActionsByKey || {}));

  // ═══ STEP 2: Key mismatch proof ═══
  const accountingComputedKey = `supplier:${normalizeTab(mainTab)}:accounting`;
  console.warn('[KEY_PROOF]', { mainTab, normalized: normalizeTab(mainTab), computedKey: accountingComputedKey });
  console.warn('[KEY_PROOF] rulesForKey', permissionsData?.columnRulesByKey?.[accountingComputedKey]);

  const [projects, setProjects] = useState<BackendProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalItemsById, setGlobalItemsById] = useState<Map<string, BackendProjectItem>>(new Map());

  // 🔗 RENDERED ROW TRACKING: Track rendered items per section for perfect alignment

  // 💰 PAYMENTS TOTALS: Track payments totals per project

  // Table permissions using resolver with proper AND logic
  const canViewProjects = permissionResolver.canViewTable(mainTab, 'projects');
  const canViewAccounting = permissionResolver.canViewTable(mainTab, 'accounting');
  const canViewPayments = permissionResolver.canViewTable(mainTab, 'payments');
  const canViewInvoice = permissionResolver.canViewTable(mainTab, 'invoice');

  // ✅ LAYOUT VISIBILITY: Check if tables have any visible columns
  // If all columns in a table are hidden, the table should not render at all
  const ACCOUNTING_COLUMN_KEYS = ['paidUsd1', 'paidUsd1Date', 'paidUsd2', 'paidUsd2Date', 'paidTl1', 'paidTl1Date', 'paidTl2', 'paidTl2Date', 'remainingUsd', 'remainingTl', 'notOrderedUsd', 'notOrderedTl'];
  const PAYMENTS_COLUMN_KEYS = ['dueUsd', 'dueTl', 'payUsd1', 'payUsd2', 'payTl1', 'payTl2'];
  const INVOICE_COLUMN_KEYS = ['transactionNo', 'invoiceNumber', 'quickBook', 'invoiceDate'];

  // ═══ STEP 3: ACCOUNTING single source of truth ═══
  const accountingRules = permissionsData?.columnRulesByKey?.[accountingComputedKey] ?? {};
  const accountingTableEdit = permissionResolver.canEditTable(mainTab, 'accounting');
  const visibleAccountingKeys = ACCOUNTING_COLUMN_KEYS.filter(k => accountingRules[k] !== 'hidden');

  console.warn('[ACCT_KEYS]', {
    computedKey: accountingComputedKey,
    rules: accountingRules,
    visibleKeys: visibleAccountingKeys,
    hiddenKeys: ACCOUNTING_COLUMN_KEYS.filter(k => accountingRules[k] === 'hidden'),
    readonlyKeys: ACCOUNTING_COLUMN_KEYS.filter(k => accountingRules[k] === 'readonly'),
    tableEdit: accountingTableEdit,
  });

  const hasAnyVisibleAccountingColumns = visibleAccountingKeys.length > 0;
  const hasAnyVisiblePaymentsColumns = PAYMENTS_COLUMN_KEYS.some(col =>
    permissionResolver.isColumnVisible(mainTab, 'payments', col)
  );
  const hasAnyVisibleInvoiceColumns = INVOICE_COLUMN_KEYS.some(col =>
    permissionResolver.isColumnVisible(mainTab, 'invoice', col)
  );

  // ✅ FINAL VISIBILITY: Table visible = table view permission AND has visible columns
  const showProjects = canViewProjects;
  const showAccounting = canViewAccounting && hasAnyVisibleAccountingColumns;
  const showPayments = canViewPayments && hasAnyVisiblePaymentsColumns;
  const showInvoice = canViewInvoice && hasAnyVisibleInvoiceColumns;

  // Page-level access: can view if any table is viewable
  const canViewPage = showProjects || showAccounting || showPayments || showInvoice;





  // ✅ PER-PROJECT ALIGNMENT: Each project gets its own accounting block
  // This ensures 1:1 alignment between left ProjectBlock and right AccountingCells
  // No more section-level aggregation that was causing misalignment

  // ✅ CRITICAL: "Projects Columns" admin tab = single source of truth for ALL project tables
  const legacyPermissions = useColumnPermissions();
  useSupplierColumnPermissions(TABLE_KEYS.SUPPLIER_P_SHEET);
  // Wrap isColumnVisible to exclude expenses-only columns in supplier mode
  const isColumnVisibleForGrid = useCallback((key: string) => {
    if (['expensesUsd', 'expensesTl'].includes(key)) return false;
    return legacyPermissions.isColumnVisible(key);
  }, [legacyPermissions.isColumnVisible]);
  const gridWidthPx = getGridWidthPx(isColumnVisibleForGrid, true); // isSupplierMode = true

  // 🔧 DEBUG: Log supplier permissions

  // ✅ PERMISSION OVERRIDES:
  // Projects table → "Projects Columns" admin tab (legacy system, same everywhere in the system)
  // Accounting/Payments/Invoice → Supplier Tracking admin tab (supplier resolver)
  const createPermissionOverrides = (table: 'projects' | 'accounting' | 'payments' | 'invoice') => {
    if (table === 'projects') {
      // Projects columns: controlled by "Projects Columns" admin tab (unified across entire system)
      return {
        isColumnVisible: (columnKey: string) => legacyPermissions.isColumnVisible(columnKey as import('../../lib/columns').ColumnKey),
        isColumnEditable: (columnKey: string) => legacyPermissions.isColumnEditable(columnKey as import('../../lib/columns').ColumnKey),
        isColumnReadOnly: (columnKey: string) => legacyPermissions.isColumnReadOnly(columnKey as import('../../lib/columns').ColumnKey),
      };
    }
    // Supplier-specific tables: controlled by "Supplier Tracking" admin tab
    return {
      isColumnVisible: (columnKey: string) => permissionResolver.isColumnVisible(mainTab, table, columnKey),
      isColumnEditable: (columnKey: string) => permissionResolver.isColumnEditable(mainTab, table, columnKey),
      isColumnReadOnly: (columnKey: string) => permissionResolver.isColumnReadOnly(mainTab, table, columnKey),
    };
  };

  // ═══ ACCOUNTING OVERRIDES: derived from visibleAccountingKeys (single source) ═══
  const accountingPermissionOverrides = {
    isColumnVisible: (col: string) => visibleAccountingKeys.includes(col),
    isColumnEditable: (col: string) =>
      accountingTableEdit && visibleAccountingKeys.includes(col) && accountingRules[col] !== 'readonly',
    isColumnReadOnly: (col: string) =>
      !visibleAccountingKeys.includes(col) ? false : (!accountingTableEdit || accountingRules[col] === 'readonly'),
  };

  const paymentsPermissionOverrides = createPermissionOverrides('payments');
  const invoicePermissionOverrides = createPermissionOverrides('invoice');

  // ✅ DYNAMIC WIDTH: Calculate payments width based on visible columns
  const calculatePaymentsWidth = (): number => {
    const sections = [
      { name: 'due', columns: [{ key: 'dueUsd', w: PAYMENTS_WIDTHS.duePayment }, { key: 'dueTl', w: PAYMENTS_WIDTHS.duePayment }] },
      { name: 'pay1', columns: [{ key: 'payUsd1', w: PAYMENTS_WIDTHS.payments1 }, { key: 'payTl1', w: PAYMENTS_WIDTHS.payments1 }] },
      { name: 'pay2', columns: [{ key: 'payUsd2', w: PAYMENTS_WIDTHS.payments2 }, { key: 'payTl2', w: PAYMENTS_WIDTHS.payments2 }] },
    ];
    const visibleSections = sections.map(s => ({
      ...s,
      columns: s.columns.filter(c => permissionResolver.isColumnVisible(mainTab, 'payments', c.key))
    })).filter(s => s.columns.length > 0);
    if (visibleSections.length === 0) return 0;
    const colWidth = visibleSections.reduce((sum, s) => sum + s.columns.reduce((cs, c) => cs + c.w, 0), 0);
    return colWidth + (visibleSections.length - 1) * PAYMENTS_WIDTHS.gap;
  };


  // ✅ DETAILED TOTALS GATING: Based on real column dependencies
  // pfUsd/pfTl are project columns → use legacy "Projects Columns" permissions
  const shouldShowMoneyTotals = () => {
    if (!canViewProjects) return false;
    return legacyPermissions.isColumnVisible('pfUsd') ||
      legacyPermissions.isColumnVisible('pfTl');
  };

  // ✅ FIXED: Accounting Grand Total gating - table view + money columns
  const shouldShowAccountingGrandTotals = (): boolean => {
    // Step 1: Check if accounting table is viewable
    if (!permissionResolver.canViewTable(mainTab, 'accounting')) {
      return false;
    }

    // Step 2: Check if ANY accounting money columns are visible
    // ✅ CORRECT KEYS: Use actual accounting column keys (not pfUsd/pfTl which are in projects table)
    const accountingMoneyColumns = ['paidUsd1', 'paidUsd2', 'paidTl1', 'paidTl2', 'remainingUsd', 'remainingTl', 'notOrderedUsd', 'notOrderedTl'];
    const hasVisibleMoneyColumn = accountingMoneyColumns.some(col =>
      permissionResolver.isColumnVisible(mainTab, 'accounting', col)
    );


    return hasVisibleMoneyColumn;
  };

  // ✅ FIXED: Payments Grand Total gating - table view + payment columns
  const shouldShowPaymentsGrandTotals = (): boolean => {
    // Step 1: Check if payments table is viewable
    if (!permissionResolver.canViewTable(mainTab, 'payments')) {
      return false;
    }

    // Step 2: Check if ANY payment money columns are visible
    const paymentMoneyColumns = ['dueUsd', 'dueTl', 'payUsd1', 'payUsd2', 'payTl1', 'payTl2'];
    const hasVisiblePaymentColumn = paymentMoneyColumns.some(col =>
      permissionResolver.isColumnVisible(mainTab, 'payments', col)
    );


    return hasVisiblePaymentColumn;
  };


  // Stable individual accounting row component to prevent focus loss
  interface AccountingRowProps {
    item: BackendProjectItem;
    projectId: string;
    onPaidAmountUpdate: (itemId: string, field: string, value: number) => void;
    onPaidAmountSave: (itemId: string, field: string, value: number) => Promise<void>;
    onDateSave: (itemId: string, field: string, value: string | null) => Promise<void>;
    permissionOverrides?: {
      isColumnVisible?: (columnKey: string) => boolean;
      isColumnEditable?: (columnKey: string) => boolean;
      isColumnReadOnly?: (columnKey: string) => boolean;
    };
  }

  const AccountingRow: React.FC<AccountingRowProps> = React.memo(({
    item,
    projectId,
    onPaidAmountUpdate,
    onPaidAmountSave,
    onDateSave,
    permissionOverrides
  }) => {
    // ✅ COLUMN FILTERING: Get visible sections based on permissions
    const visibleSections = buildVisibleAccountingSections(permissionOverrides);

    // ✅ EARLY RETURN: Don't render if no visible columns
    if (visibleSections.length === 0) {
      return null;
    }

    // Money input state - track raw user input for Excel-like UX
    const [localPaidDisplayValues, setLocalPaidDisplayValues] = useState({
      usd1: formatMoneyDisplay(toNumber(item.paidUsd1)),
      usd2: formatMoneyDisplay(toNumber(item.paidUsd2)),
      tl1: formatMoneyDisplay(toNumber(item.paidTl1)),
      tl2: formatMoneyDisplay(toNumber(item.paidTl2)),
    });

    // Date input state for paid date columns
    const formatDateForInput = (dateStr: string | null | undefined): string => {
      if (!dateStr) return '';
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0]; // yyyy-MM-dd for input[type=date]
      } catch { return ''; }
    };

    const [localDateValues, setLocalDateValues] = useState({
      usd1Date: formatDateForInput(item.paidUsd1Date),
      usd2Date: formatDateForInput(item.paidUsd2Date),
      tl1Date: formatDateForInput(item.paidTl1Date),
      tl2Date: formatDateForInput(item.paidTl2Date),
    });

    // Track which paid field is focused (for remaining tooltip)
    const [focusedPaidField, setFocusedPaidField] = useState<string | null>(null);

    // Track if input is in focus (for raw vs formatted display)
    const [inputFocus, setInputFocus] = useState({
      usd1: false,
      usd2: false,
      tl1: false,
      tl2: false,
    });

    // Suppress TypeScript warning for unused variable
    void inputFocus;

    // Refs for cursor position preservation
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({
      usd1: null,
      usd2: null,
      tl1: null,
      tl2: null,
    });

    // Sync local state when item props change (e.g., after save)
    useEffect(() => {
      setLocalPaidDisplayValues({
        usd1: formatMoneyDisplay(toNumber(item.paidUsd1)),
        usd2: formatMoneyDisplay(toNumber(item.paidUsd2)),
        tl1: formatMoneyDisplay(toNumber(item.paidTl1)),
        tl2: formatMoneyDisplay(toNumber(item.paidTl2)),
      });
    }, [item.paidUsd1, item.paidUsd2, item.paidTl1, item.paidTl2]);

    // Sync date state when item props change
    useEffect(() => {
      setLocalDateValues({
        usd1Date: formatDateForInput(item.paidUsd1Date),
        usd2Date: formatDateForInput(item.paidUsd2Date),
        tl1Date: formatDateForInput(item.paidTl1Date),
        tl2Date: formatDateForInput(item.paidTl2Date),
      });
    }, [item.paidUsd1Date, item.paidUsd2Date, item.paidTl1Date, item.paidTl2Date]);

    // Simple money input handler
    const handleChange = useCallback((field: string, rawValue: string) => {
      // Clean: only numbers and one decimal point
      let cleaned = rawValue.replace(/[^0-9.]/g, '');

      // Handle multiple dots
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
      }

      // Limit decimal to 2 places
      if (cleaned.includes('.')) {
        const [int, dec] = cleaned.split('.');
        cleaned = int + '.' + (dec || '').substring(0, 2);
      }

      // Add thousand separators
      let formatted = cleaned;
      if (cleaned.includes('.')) {
        const [int, dec] = cleaned.split('.');
        formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec;
      } else if (cleaned.length > 3) {
        formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }

      setLocalPaidDisplayValues(prev => ({ ...prev, [field]: formatted }));

      const numValue = parseMoneyInput(cleaned);
      onPaidAmountUpdate(item.id, field, numValue ?? 0);
    }, [item.id, onPaidAmountUpdate]);

    const handleBlur = useCallback((field: string, rawValue: string) => {
      const numValue = parseMoneyInput(rawValue);

 // Enhanced debug log

      // Format for display (Excel-like: show formatted version after blur)
      const formattedValue = formatMoneyDisplay(numValue);
      setLocalPaidDisplayValues(prev => ({ ...prev, [field]: formattedValue }));
      setInputFocus(prev => ({ ...prev, [field]: false }));
      setFocusedPaidField(null);

      // Save to backend (preserving 0 as 0, not null)
      const backendValue = prepareMoneyForBackend(numValue);
      onPaidAmountSave(item.id, field, backendValue ?? 0);
    }, [item.id, onPaidAmountSave]);

    const handleFocus = useCallback((field: string) => {
 // Debug log

      setFocusedPaidField(field);
      setInputFocus(prev => ({ ...prev, [field]: true }));

      // Switch to raw display for editing (remove commas, keep just the number)
      let currentValue: number;
      switch (field) {
        case 'usd1': currentValue = toNumber(item.paidUsd1); break;
        case 'usd2': currentValue = toNumber(item.paidUsd2); break;
        case 'tl1': currentValue = toNumber(item.paidTl1); break;
        case 'tl2': currentValue = toNumber(item.paidTl2); break;
        default: currentValue = 0;
      }

      const rawValue = currentValue === 0 ? '' : currentValue.toString();
      setLocalPaidDisplayValues(prev => ({ ...prev, [field]: rawValue }));
    }, [item.paidUsd1, item.paidUsd2, item.paidTl1, item.paidTl2]);

    const getAccountingValues = () => {
      const pfTl = toNumber(item.pfTl);
      const invoice = toNumber((item as any).invoice);
      const invoiceAsUsd = pfTl > 0 ? 0 : invoice;
      const invoiceAsTl = pfTl > 0 ? invoice : 0;

      const paid1Usd = parseMoneyInput(localPaidDisplayValues.usd1) ?? 0;
      const paid2Usd = parseMoneyInput(localPaidDisplayValues.usd2) ?? 0;
      const paid1Tl = parseMoneyInput(localPaidDisplayValues.tl1) ?? 0;
      const paid2Tl = parseMoneyInput(localPaidDisplayValues.tl2) ?? 0;

      const totalPaidUsd = paid1Usd + paid2Usd;
      const totalPaidTl = paid1Tl + paid2Tl;

      const isPfSigned = item.pfSignStatus === 'SIGNED';
      const isNotOrdered = item.status === 'NOT_ORDERED';

      let remainingUsd = 0;
      let remainingTl = 0;
      let notOrderedUsd = 0;
      let notOrderedTl = 0;
      let showNotSignedLabel = false;

      if (!isPfSigned) {
        showNotSignedLabel = true;
        notOrderedUsd = invoiceAsUsd;
        notOrderedTl = invoiceAsTl;
      } else if (isNotOrdered) {
        notOrderedUsd = invoiceAsUsd;
        notOrderedTl = invoiceAsTl;
      } else {
        remainingUsd = Math.max(0, invoiceAsUsd - totalPaidUsd);
        remainingTl = Math.max(0, invoiceAsTl - totalPaidTl);
      }

      return {
        paidDisplay: localPaidDisplayValues,
        remainingUsd,
        remainingTl,
        notOrderedUsd,
        notOrderedTl,
        showNotSignedLabel
      };
    };

    const accounting = getAccountingValues();

    // Helper to get remaining value for a focused paid field
    const getRemainingForField = (field: string): { value: number; currency: 'USD' | 'TL' } | null => {
      const pfTl = toNumber(item.pfTl);
      const invoice = toNumber((item as any).invoice);
      const invoiceAsUsd = pfTl > 0 ? 0 : invoice;
      const invoiceAsTl = pfTl > 0 ? invoice : 0;
      const paid1Usd = parseMoneyInput(localPaidDisplayValues.usd1) ?? 0;
      const paid2Usd = parseMoneyInput(localPaidDisplayValues.usd2) ?? 0;
      const paid1Tl = parseMoneyInput(localPaidDisplayValues.tl1) ?? 0;
      const paid2Tl = parseMoneyInput(localPaidDisplayValues.tl2) ?? 0;

      switch (field) {
        case 'usd1': return { value: Math.max(0, invoiceAsUsd - paid2Usd), currency: 'USD' };
        case 'usd2': return { value: Math.max(0, invoiceAsUsd - paid1Usd), currency: 'USD' };
        case 'tl1': return { value: Math.max(0, invoiceAsTl - paid2Tl), currency: 'TL' };
        case 'tl2': return { value: Math.max(0, invoiceAsTl - paid1Tl), currency: 'TL' };
        default: return null;
      }
    };

    // ✅ PERMISSION ENFORCEMENT: Check if paid amount fields are editable
    const arePaidFieldsEditable = () => {
      // For accounting, we check permissions for the financial columns (paid amounts)
      // The column keys correspond to the paid amount fields: paidUsd1, paidUsd2, paidTl1, paidTl2
      const financialColumns = ['paidUsd1', 'paidUsd2', 'paidTl1', 'paidTl2'];

      // If permission overrides are provided, use them
      if (permissionOverrides?.isColumnEditable) {
        // All paid fields should be editable for the accounting section to be editable
        return financialColumns.some(col => permissionOverrides.isColumnEditable!(col));
      }

      // Default: editable if no permission overrides
      return true;
    };

    arePaidFieldsEditable(); // Check accounting editability for side effects

    // ✅ PERMISSION ENFORCEMENT: Check if specific column is editable
    const isColumnEditable = useCallback((columnKey: string) => {
      const canEdit = permissionOverrides?.isColumnEditable ?
        permissionOverrides.isColumnEditable(columnKey) : true;

      // Gated debug: set localStorage.DEBUG_PERM = '1' to enable per-cell logs
      if (localStorage.getItem('DEBUG_PERM') === '1') {
      }

      return canEdit;
    }, [item.id, permissionOverrides]);

    // Helper to check if column is a date column
    const isDateColumn = (columnKey: string) => columnKey.endsWith('Date') && columnKey.startsWith('paid');

    // Helper for data row border
    const getDataBorderRight = (_sectionName: string, colIndex: number, totalCols: number) => {
      if (colIndex >= totalCols - 1) return 'none';
      return '1px solid #ccc';
    };

    // Helper to get column data value
    const getColumnValue = useCallback((column: AccountingColumn) => {
      switch (column.key) {
        case 'paidUsd1': return accounting.paidDisplay.usd1;
        case 'paidUsd1Date': return localDateValues.usd1Date;
        case 'paidUsd2': return accounting.paidDisplay.usd2;
        case 'paidUsd2Date': return localDateValues.usd2Date;
        case 'paidTl1': return accounting.paidDisplay.tl1;
        case 'paidTl1Date': return localDateValues.tl1Date;
        case 'paidTl2': return accounting.paidDisplay.tl2;
        case 'paidTl2Date': return localDateValues.tl2Date;
        case 'remainingUsd':
          return accounting.showNotSignedLabel
            ? <span style={{ color: '#c00', fontWeight: 'bold', fontSize: '10px' }}>NOT SIGNED</span>
            : formatReadonlyMoney(accounting.remainingUsd, 'USD');
        case 'remainingTl':
          return accounting.showNotSignedLabel
            ? ''
            : formatReadonlyMoney(accounting.remainingTl, 'TL');
        case 'notOrderedUsd': return formatReadonlyMoney(accounting.notOrderedUsd, 'USD');
        case 'notOrderedTl': return formatReadonlyMoney(accounting.notOrderedTl, 'TL');
        default: return '';
      }
    }, [accounting, localDateValues]);

    // Helper to get column currency symbol
    const getCurrencySymbol = (column: AccountingColumn): string => {
      if (column.key.includes('Usd')) return '$';
      if (column.key.includes('Tl')) return '₺';
      return '';
    };

    return (
      <div className="acct-data-row" style={{
        display: 'flex',
        height: 'var(--supplier-data-row, 44px)',
        minHeight: 'var(--supplier-data-row, 44px)',
        maxHeight: 'var(--supplier-data-row, 44px)',
        alignItems: 'center',
        fontSize: '12px',
        backgroundColor: 'transparent',
        padding: '0',
        margin: '0',
        boxSizing: 'border-box',
        lineHeight: 'normal'
      }}
        onMouseDown={(e) => {
          // Prevent row container from stealing focus from inputs
          if ((e.target as HTMLElement).tagName !== 'INPUT') {
            e.preventDefault();
          }
        }}>
        {/* ✅ DYNAMIC SECTIONS: Render based on visible sections */}
        {visibleSections.map((section, sectionIndex) => (
          <React.Fragment key={section.name}>
            {/* Section Columns */}
            {section.columns.map((column, columnIndex) => {
              const columnEditable = section.editable && isColumnEditable(column.key);
              const currencySymbol = getCurrencySymbol(column);
              const columnValue = getColumnValue(column);

              // ✅ EDITABLE DATE INPUT: For paid date fields
              if (section.editable && column.dataField && isDateColumn(column.key)) {
                return (
                  <div key={column.key} style={{
                    width: column.width,
                    height: '100%',
                    borderRight: getDataBorderRight(section.name, columnIndex, section.columns.length),
                    borderBottom: '1px solid #ddd',
                    backgroundColor: '#FFF8DC',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <input
                      key={`${projectId}:${item.id}:${column.dataField}`}
                      type="date"
                      value={(columnValue as string) || ''}
                      disabled={!columnEditable}
                      onChange={(e) => {
                        if (columnEditable && column.dataField) {
                          const val = e.target.value;
                          setLocalDateValues(prev => ({ ...prev, [column.dataField!]: val }));
                        }
                      }}
                      onBlur={(e) => {
                        if (columnEditable && column.dataField) {
                          const val = e.target.value;
                          onDateSave(item.id, column.key, val || null);
                        }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      style={{
                        width: '100%',
                        height: '100%',
                        padding: '2px 4px',
                        border: 'none',
                        textAlign: 'center',
                        backgroundColor: columnEditable ? 'transparent' : '#f5f5f5',
                        fontSize: '11px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        color: columnEditable ? 'inherit' : '#999',
                        cursor: columnEditable ? 'pointer' : 'not-allowed'
                      }}
                    />
                  </div>
                );
              }

              // ✅ EDITABLE INPUT: For paid fields
              if (section.editable && column.dataField) {
                return (
                  <div key={column.key} style={{
                    width: column.width,
                    height: '100%',
                    borderRight: getDataBorderRight(section.name, columnIndex, section.columns.length),
                    borderBottom: '1px solid #ddd',
                    backgroundColor: '#FFF8DC',
                    boxSizing: 'border-box',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#666',
                      pointerEvents: 'none'
                    }}>{currencySymbol}</span>
                    <input
                      id={`paid-${column.dataField}-${projectId}-${item.id}`}
                      name={`${column.key}_${item.id}`}
                      ref={(el) => { if (column.dataField) inputRefs.current[column.dataField] = el; }}
                      key={`${projectId}:${item.id}:${column.dataField}`}
                      type="text"
                      inputMode="decimal"
                      value={columnValue as string}
                      disabled={!columnEditable}
                      onChange={(e) => {
                        if (columnEditable && column.dataField) handleChange(column.dataField, e.target.value);
                      }}
                      onBlur={(e) => {
                        if (columnEditable && column.dataField) handleBlur(column.dataField, e.target.value);
                      }}
                      onFocus={(e) => {
                        if (columnEditable && column.dataField) {
                          handleFocus(column.dataField);
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
                        backgroundColor: columnEditable ? 'transparent' : '#f5f5f5',
                        fontSize: '12px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        color: columnEditable ? 'inherit' : '#999',
                        cursor: columnEditable ? 'text' : 'not-allowed'
                      }}
                    />
                    {/* Remaining tooltip on focus */}
                    {focusedPaidField === column.dataField && columnEditable && (() => {
                      const rem = getRemainingForField(column.dataField!);
                      if (!rem || rem.value <= 0) return null;
                      const symbol = rem.currency === 'USD' ? '$' : '₺';
                      return (
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Fill remaining value
                            const formatted = formatMoneyDisplay(rem.value);
                            setLocalPaidDisplayValues(prev => ({ ...prev, [column.dataField!]: formatted }));
                            onPaidAmountUpdate(item.id, column.dataField!, rem.value);
                            onPaidAmountSave(item.id, column.dataField!, rem.value);
                            setFocusedPaidField(null);
                          }}
                          style={{
                            position: 'absolute',
                            bottom: '-24px',
                            left: '0',
                            right: '0',
                            backgroundColor: '#1a1a2e',
                            color: '#4ade80',
                            fontSize: '10px',
                            padding: '3px 6px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            zIndex: 10,
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                          }}
                        >
                          Rem: {symbol}{formatMoneyDisplay(rem.value)}
                        </div>
                      );
                    })()}
                  </div>
                );
              }

              // ✅ READONLY DISPLAY: For remaining/notOrdered fields
              return (
                <div key={column.key} style={{
                  width: column.width,
                  height: '100%',
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  borderRight: getDataBorderRight(section.name, columnIndex, section.columns.length),
                  borderBottom: '1px solid #ddd',
                  backgroundColor: '#FFF8DC',
                  boxSizing: 'border-box',
                  fontSize: '12px'
                }}>
                  {columnValue}
                </div>
              );
            })}
            {/* ✅ DYNAMIC GAP: Clean separator between sub-tables */}
            {sectionIndex < visibleSections.length - 1 && (
              <div style={{
                width: `${ACCOUNTING_WIDTHS.gap}px`,
                backgroundColor: 'transparent',
                height: '100%',
                boxSizing: 'border-box'
              }} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  });

  // ✅ ACCOUNTING COLUMN STRUCTURE: Define dynamic accounting structure
  interface AccountingSection {
    name: 'paidUsd1st' | 'paidUsd2nd' | 'paidTl1st' | 'paidTl2nd' | 'remaining' | 'notOrdered';
    label: string;
    columns: AccountingColumn[];
    editable: boolean;
  }

  interface AccountingColumn {
    key: 'paidUsd1' | 'paidUsd1Date' | 'paidUsd2' | 'paidUsd2Date' | 'paidTl1' | 'paidTl1Date' | 'paidTl2' | 'paidTl2Date' | 'remainingUsd' | 'remainingTl' | 'notOrderedUsd' | 'notOrderedTl';
    label: string;
    width: string; // CSS var
    dataField?: string; // For editable columns only
  }

  // ✅ DYNAMIC WIDTH CALCULATION: Calculate accounting grid width based on visible columns
  const calculateAccountingWidth = (visibleSections: AccountingSection[]): number => {
    if (visibleSections.length === 0) return 0;

    let totalWidth = 0;

    visibleSections.forEach(section => {
      section.columns.forEach(column => {
        // Extract pixel value from CSS var or direct px value
        if (column.key.endsWith('Date') && column.key.startsWith('paid')) {
          totalWidth += ACCOUNTING_WIDTHS.paidDate;
        } else if (column.key.includes('paid')) {
          totalWidth += ACCOUNTING_WIDTHS.paid;
        } else if (column.key.includes('remaining')) {
          totalWidth += ACCOUNTING_WIDTHS.remaining;
        } else if (column.key.includes('notOrdered')) {
          totalWidth += ACCOUNTING_WIDTHS.notOrdered;
        }
      });
    });

    // Add gaps between sections (one less than number of sections)
    totalWidth += (visibleSections.length - 1) * ACCOUNTING_WIDTHS.gap;


    return totalWidth;
  };

  const buildVisibleAccountingSections = (permissionOverrides?: {
    isColumnVisible?: (columnKey: string) => boolean;
    isColumnEditable?: (columnKey: string) => boolean;
  }): AccountingSection[] => {
    const baseSections: AccountingSection[] = [
      {
        name: 'paidUsd1st',
        label: '1st',
        editable: true,
        columns: [
          { key: 'paidUsd1', label: 'Paid/USD', width: `${ACCOUNTING_WIDTHS.paid}px`, dataField: 'usd1' },
          { key: 'paidUsd1Date', label: 'Date', width: `${ACCOUNTING_WIDTHS.paidDate}px`, dataField: 'usd1Date' },
        ]
      },
      {
        name: 'paidUsd2nd',
        label: '2nd',
        editable: true,
        columns: [
          { key: 'paidUsd2', label: 'Paid/USD', width: `${ACCOUNTING_WIDTHS.paid}px`, dataField: 'usd2' },
          { key: 'paidUsd2Date', label: 'Date', width: `${ACCOUNTING_WIDTHS.paidDate}px`, dataField: 'usd2Date' }
        ]
      },
      {
        name: 'paidTl1st',
        label: '1st',
        editable: true,
        columns: [
          { key: 'paidTl1', label: 'Paid/TL', width: `${ACCOUNTING_WIDTHS.paid}px`, dataField: 'tl1' },
          { key: 'paidTl1Date', label: 'Date', width: `${ACCOUNTING_WIDTHS.paidDate}px`, dataField: 'tl1Date' },
        ]
      },
      {
        name: 'paidTl2nd',
        label: '2nd',
        editable: true,
        columns: [
          { key: 'paidTl2', label: 'Paid/TL', width: `${ACCOUNTING_WIDTHS.paid}px`, dataField: 'tl2' },
          { key: 'paidTl2Date', label: 'Date', width: `${ACCOUNTING_WIDTHS.paidDate}px`, dataField: 'tl2Date' }
        ]
      },
      {
        name: 'remaining',
        label: 'Remaining',
        editable: false,
        columns: [
          { key: 'remainingUsd', label: 'USD', width: `${ACCOUNTING_WIDTHS.remaining}px` },
          { key: 'remainingTl', label: 'TL', width: `${ACCOUNTING_WIDTHS.remaining}px` }
        ]
      },
      {
        name: 'notOrdered',
        label: 'Not Ordered',
        editable: false,
        columns: [
          { key: 'notOrderedUsd', label: 'USD', width: `${ACCOUNTING_WIDTHS.notOrdered}px` },
          { key: 'notOrderedTl', label: 'TL', width: `${ACCOUNTING_WIDTHS.notOrdered}px` }
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

    return visibleSections;
  };

  // AccountingCells Component - Cell-based accounting layout (Excel-like)
  interface AccountingCellsProps {
    items: BackendProjectItem[];
    sectionLabel: string;
    projectId: string;
    showSectionHeader: boolean;
    mode?: 'projects' | 'missingExtra';
    updateGlobalItem?: (itemId: string, patch: Partial<BackendProjectItem>) => void;
    onSupplierItemUpdated?: (updatedItem: BackendProjectItem) => void;
    permissionOverrides?: {
      isColumnVisible?: (columnKey: string) => boolean;
      isColumnEditable?: (columnKey: string) => boolean;
      isColumnReadOnly?: (columnKey: string) => boolean;
    };
  }

  const AccountingCells: React.FC<AccountingCellsProps> = ({ items, sectionLabel, projectId, showSectionHeader, mode = 'projects', updateGlobalItem, onSupplierItemUpdated, permissionOverrides }) => {
    // ✅ SECTION FILTERING: Get visible sections based on permissions
    const visibleSections = buildVisibleAccountingSections(permissionOverrides);

    // ✅ EARLY RETURN: Don't render grid if no visible sections
    if (visibleSections.length === 0) {
      return null;
    }


    // Per-project state management: key format "projectId:itemId"
    const [paidAmounts, setPaidAmounts] = useState<Record<string, {
      usd1: number; usd2: number; tl1: number; tl2: number;
    }>>({});

    // Stable callback to prevent re-renders
    const updatePaidAmount = useCallback((itemId: string, field: string, value: number) => {
      const stateKey = `${projectId}:${itemId}`;
      setPaidAmounts(prev => ({
        ...prev,
        [stateKey]: {
          ...(prev[stateKey] || { usd1: 0, usd2: 0, tl1: 0, tl2: 0 }),
          [field]: value
        }
      }));
    }, [projectId]);

    // Helper function for correct endpoint based on mode
    const getUpdateEndpoint = (mode: string, itemId: string) => {
      if (mode === 'missingExtra') return `/api/missing-extra/items/${itemId}`;
      return `/api/projects/items/${itemId}`;
    };

    // API call to save paid amount to backend
    const savePaidAmount = useCallback(async (itemId: string, field: string, value: number) => {
 // Debug başlangıç

      try {
        const fieldMap = {
          usd1: 'paidUsd1',
          usd2: 'paidUsd2',
          tl1: 'paidTl1',
          tl2: 'paidTl2'
        };

        const backendField = fieldMap[field as keyof typeof fieldMap];
        if (!backendField) {
          console.error('❌ FIELD_MAP_ERROR: Unknown field', { field, fieldMap });
          return;
        }

        const projectItem = items.find(item => item.id === itemId);
        if (!projectItem) {
          console.error('❌ ITEM_NOT_FOUND', { itemId, availableItems: items.map(i => i.id) });
          return;
        }

        // Convert value properly: NaN/null/undefined → null, but keep 0 as 0
        const numericValue = (value === null || value === undefined || isNaN(value)) ? null : value;
        const endpoint = getUpdateEndpoint(mode, itemId);

        // 🔍 PROOF LOG: Request being sent
        const response = await apiFetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [backendField]: numericValue })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save ${field}: ${response.status} ${errorText}`);
        }

        const updatedItem = await response.json();

        // 🔍 PROOF LOG: Success response

        // Update global item if available with full response
        if (updateGlobalItem) {
          updateGlobalItem(itemId, updatedItem);
        }
        // Trigger supplier totals recalculation
        if (onSupplierItemUpdated && 'projectId' in updatedItem) {
          onSupplierItemUpdated(updatedItem as BackendProjectItem);
        }
      } catch (error) {
        console.error('❌ SUPPLIER_SAVE_FAIL - DETAILED ERROR:', error);
        console.error('SUPPLIER_SAVE_FAIL', {
          mode,
          endpoint: getUpdateEndpoint(mode, itemId),
          itemId,
          field,
          error: error instanceof Error ? error.message : String(error),
          fullError: error
        });
        // TODO: Show error toast to user
      }
    }, [items, updateGlobalItem, onSupplierItemUpdated]);

    // API call to save date field to backend
    const saveDateField = useCallback(async (itemId: string, field: string, value: string | null) => {
      try {
        const projectItem = items.find(item => item.id === itemId);
        if (!projectItem) return;

        const dateValue = value ? new Date(value).toISOString() : null;
        const endpoint = getUpdateEndpoint(mode, itemId);

        const response = await apiFetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: dateValue })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save ${field}: ${response.status} ${errorText}`);
        }

        const updatedItem = await response.json();

        if (updateGlobalItem) {
          updateGlobalItem(itemId, updatedItem);
        }
        if (onSupplierItemUpdated && 'projectId' in updatedItem) {
          onSupplierItemUpdated(updatedItem as BackendProjectItem);
        }
      } catch (error) {
        console.error('❌ DATE_SAVE_FAIL:', error);
      }
    }, [items, updateGlobalItem, onSupplierItemUpdated]);

    // Initialize paid amounts from backend fields on items change
    useEffect(() => {
      const initialAmounts: Record<string, { usd1: number; usd2: number; tl1: number; tl2: number }> = {};

      items.forEach(item => {
        const stateKey = `${projectId}:${item.id}`;
        initialAmounts[stateKey] = {
          usd1: toNumber(item.paidUsd1),
          usd2: toNumber(item.paidUsd2),
          tl1: toNumber(item.paidTl1),
          tl2: toNumber(item.paidTl2),
        };
      });

      setPaidAmounts(initialAmounts);
    }, [items, projectId]);



    const getAccountingValues = (item: BackendProjectItem) => {
      const stateKey = `${projectId}:${item.id}`;
      const paid = paidAmounts[stateKey] || { usd1: 0, usd2: 0, tl1: 0, tl2: 0 };
      const pfUsd = toNumber(item.pfUsd);
      const pfTl = toNumber(item.pfTl);

      const totalPaidUsd = toNumber(paid.usd1) + toNumber(paid.usd2);
      const totalPaidTl = toNumber(paid.tl1) + toNumber(paid.tl2);

      const isPfSigned = item.pfSignStatus === 'SIGNED';
      const isNotOrdered = item.status === 'NOT_ORDERED';

      let remainingUsd = 0;
      let remainingTl = 0;
      let notOrderedUsd = 0;
      let notOrderedTl = 0;
      let showNotSignedLabel = false;

      if (!isPfSigned) {
        showNotSignedLabel = true;
        notOrderedUsd = pfUsd;
        notOrderedTl = pfTl;
      } else if (isNotOrdered) {
        notOrderedUsd = pfUsd;
        notOrderedTl = pfTl;
      } else {
        remainingUsd = Math.max(0, pfUsd - totalPaidUsd);
        remainingTl = Math.max(0, pfTl - totalPaidTl);
      }

      return {
        paid,
        remainingUsd,
        remainingTl,
        notOrderedUsd,
        notOrderedTl,
        showNotSignedLabel
      };
    };

    // Calculate section totals for the totals row
    const sectionTotals = React.useMemo(() => {
      let totalPaidUsd1 = 0, totalPaidUsd2 = 0, totalPaidTl1 = 0, totalPaidTl2 = 0;
      let totalRemainingUsd = 0, totalRemainingTl = 0;
      let totalNotOrderedUsd = 0, totalNotOrderedTl = 0;

      items.forEach(item => {
        const accounting = getAccountingValues(item);
        totalPaidUsd1 += accounting.paid.usd1;
        totalPaidUsd2 += accounting.paid.usd2;
        totalPaidTl1 += accounting.paid.tl1;
        totalPaidTl2 += accounting.paid.tl2;
        totalRemainingUsd += accounting.remainingUsd;
        totalRemainingTl += accounting.remainingTl;
        totalNotOrderedUsd += accounting.notOrderedUsd;
        totalNotOrderedTl += accounting.notOrderedTl;
      });

      return {
        paidUsd1: totalPaidUsd1, paidUsd2: totalPaidUsd2,
        paidTl1: totalPaidTl1, paidTl2: totalPaidTl2,
        remainingUsd: totalRemainingUsd, remainingTl: totalRemainingTl,
        notOrderedUsd: totalNotOrderedUsd, notOrderedTl: totalNotOrderedTl
      };
    }, [items, paidAmounts]);

    // ✅ CALCULATE DYNAMIC WIDTH: Based on visible columns
    const dynamicWidth = calculateAccountingWidth(visibleSections);
    const dynamicWidthPx = `${dynamicWidth}px`;

    return (
      <div style={{
        width: dynamicWidthPx,
        minWidth: dynamicWidthPx,
        flex: '0 0 auto',
        boxSizing: 'border-box'
      }}>
        {/* Section Header Bar */}
        {showSectionHeader && (
          <div style={{
            width: '100%',
            height: 'var(--supplier-section-header, 44px)',
            minHeight: 'var(--supplier-section-header, 44px)',
            maxHeight: 'var(--supplier-section-header, 44px)',
            backgroundColor: '#b88900',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '16px',
            letterSpacing: '1px',
            marginBottom: '0',
            padding: '0',
            margin: '0',
            boxSizing: 'border-box',
            lineHeight: '1'
          }}>
            ACCOUNTING {sectionLabel.replace('TLines ', '').toUpperCase()}
          </div>
        )}

        {/* ✅ DYNAMIC TOP GROUP ROW: Section labels based on visible sections */}
        <div className="acct-topgroup-row" style={{
          display: 'flex',
          height: 'var(--supplier-topgroup-row, 34px)',
          minHeight: 'var(--supplier-topgroup-row, 34px)',
          maxHeight: 'var(--supplier-topgroup-row, 34px)',
          backgroundColor: 'transparent',
          color: '#000',
          fontSize: '12px',
          fontWeight: '600',
          alignItems: 'center',
          padding: '0',
          margin: '0',
          boxSizing: 'border-box',
          lineHeight: '1'
        }}>
          {visibleSections.map((section, sectionIndex) => {
            return (
              <React.Fragment key={section.name}>
                {/* Section Columns */}
                {section.columns.map((column, columnIndex) => (
                  <div
                    key={column.key}
                    style={{
                      width: column.width,
                      textAlign: 'center',
                      borderRight: columnIndex < section.columns.length - 1 ? '1px solid #000' : 'none',
                      backgroundColor: '#D4AF37',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box'
                    }}
                  >
                    {section.label}
                  </div>
                ))}
                {/* ✅ DYNAMIC GAP: Only add gap between sections */}
                {sectionIndex < visibleSections.length - 1 && (
                  <div style={{
                    width: `${ACCOUNTING_WIDTHS.gap}px`,
                    backgroundColor: 'transparent',
                    height: '100%',
                    boxSizing: 'border-box'
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ✅ DYNAMIC COLUMN HEADERS ROW: Based on visible sections and columns */}
        <div className="acct-colhead-row" style={{
          display: 'flex',
          height: 'var(--supplier-colhead-row, 34px)',
          minHeight: 'var(--supplier-colhead-row, 34px)',
          maxHeight: 'var(--supplier-colhead-row, 34px)',
          backgroundColor: 'transparent',
          color: 'white',
          fontSize: '12px',
          fontWeight: '600',
          alignItems: 'center',
          padding: '0',
          margin: '0',
          boxSizing: 'border-box',
          lineHeight: '1'
        }}>
          {visibleSections.map((section, sectionIndex) => (
            <React.Fragment key={section.name}>
              {/* Section Column Headers */}
              {section.columns.map((column, columnIndex) => (
                <div
                  key={column.key}
                  style={{
                    width: column.width,
                    textAlign: 'center',
                    borderRight: columnIndex < section.columns.length - 1 ? '1px solid #333' : 'none',
                    backgroundColor: '#000',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  {column.label}
                </div>
              ))}
              {/* ✅ DYNAMIC GAP: Only add gap between sections */}
              {sectionIndex < visibleSections.length - 1 && (
                <div style={{
                  width: `${ACCOUNTING_WIDTHS.gap}px`,
                  backgroundColor: 'transparent',
                  height: '100%',
                  boxSizing: 'border-box'
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Data Rows - Stable Components with Individual Keys */}
        {items.map((item) => (
          <AccountingRow
            key={`${projectId}:${item.id}`}
            item={item}
            projectId={projectId}
            onPaidAmountUpdate={updatePaidAmount}
            onPaidAmountSave={savePaidAmount}
            onDateSave={saveDateField}
            permissionOverrides={permissionOverrides}
          />
        ))}

        {/* ✅ DYNAMIC TOTALS ROW: Based on visible sections and columns */}
        <div className="acct-totals-row" style={{
          display: 'flex',
          height: 'var(--supplier-totals-row, 36px)',
          minHeight: 'var(--supplier-totals-row, 36px)',
          maxHeight: 'var(--supplier-totals-row, 36px)',
          alignItems: 'center',
          fontSize: '14px',
          fontWeight: '700',
          backgroundColor: 'transparent',
          color: '#000',
          padding: '0',
          margin: '0',
          boxSizing: 'border-box',
          lineHeight: '1'
        }}>
          {visibleSections.map((section, sectionIndex) => (
            <React.Fragment key={section.name}>
              {/* Section Column Totals */}
              {section.columns.map((column, columnIndex) => {
                const isDate = column.key.endsWith('Date') && column.key.startsWith('paid');
                const totalValue = isDate ? undefined : (sectionTotals as any)[column.key];
                const currencySymbol = column.key.includes('Usd') && !isDate ? '$' : column.key.includes('Tl') && !isDate ? '₺' : '';

                return (
                  <div
                    key={column.key}
                    style={{
                      width: column.width,
                      textAlign: 'right',
                      padding: '0 8px',
                      borderRight: (() => {
                        if (columnIndex >= section.columns.length - 1) return 'none';
                        return '1px solid #000';
                      })(),
                      borderTop: '2px solid #000',
                      backgroundColor: '#D4AF37',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      boxSizing: 'border-box',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}
                  >
                    {isDate ? '' : currencySymbol + formatMoneyDisplay(toNumber(totalValue))}
                  </div>
                );
              })}
              {/* ✅ DYNAMIC GAP: Clean separator between sub-tables */}
              {sectionIndex < visibleSections.length - 1 && (
                <div style={{
                  width: `${ACCOUNTING_WIDTHS.gap}px`,
                  backgroundColor: 'transparent',
                  height: '100%',
                  boxSizing: 'border-box'
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Using natural browser scrolling - simple and reliable

  // Reset state when vendorCode changes
  useEffect(() => {
    setProjects([]);
    setGlobalItemsById(new Map());
    setLoading(true);
    setError(null);
  }, [vendorCode]);

  // Refetch function for on-demand data refresh (e.g. after type changes)
  const refetchProjects = useCallback(async () => {
    try {
      const response = await getProjects();
      setProjects(response.data || []);
      const itemsMap = new Map<string, BackendProjectItem>();
      response.data.forEach((project: BackendProject) => {
        project.items?.forEach((item: BackendProjectItem) => {
          itemsMap.set(item.id, item);
        });
      });
      setGlobalItemsById(itemsMap);
    } catch (err: any) {
      console.error('Error refetching supplier data:', err);
    }
  }, [vendorCode]);

  // onProjectUpdate callback for ProjectBlock (triggers refetch after project edits)
  const handleProjectUpdate = useCallback(async (_projectId: string) => {
    await refetchProjects();
  }, [refetchProjects]);

  // Socket.IO refetch counter - triggers data reload when incremented
  const [refetchCounter, setRefetchCounter] = useState(0);

  // Load projects data
  useEffect(() => {
    let isMounted = true;

    const loadData = async (isPolling = false) => {
      if (!isPolling) {
        setLoading(true);
        setError(null);
      }
      try {
        const response = await getProjects();
        if (!isMounted) return;
        setProjects(response.data || []);

        // Build global items map (for all items, not filtered)
        const itemsMap = new Map<string, BackendProjectItem>();
        response.data.forEach((project: BackendProject) => {
          project.items?.forEach((item: BackendProjectItem) => {
            itemsMap.set(item.id, item);
          });
        });
        setGlobalItemsById(itemsMap);
      } catch (err: any) {
        if (!isMounted) return;
        if (!isPolling) {
          console.error('Error loading supplier data:', err);
          setError(err.message);
        }
      } finally {
        if (isMounted && !isPolling) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [vendorCode, refetchCounter]);

  // Socket.IO: join suppliers room and refetch on changes
  const { joinRooms, leaveRooms, isConnected, userId: myUserId } = useSocket();
  const livePatch = useLivePatchStore();
  const prevConnected = useRef(isConnected);

  useEffect(() => {
    joinRooms(['suppliers']);
    return () => { leaveRooms(['suppliers']); };
  }, [joinRooms, leaveRooms]);

  // Refetch on reconnect (catch missed events)
  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      // Reconnected - silently reload data
      getProjects().then(() => { }).catch(() => { });
      // Trigger re-render by re-running the main effect
      window.dispatchEvent(new Event('ws-reconnect'));
    }
    prevConnected.current = isConnected;
  }, [isConnected]);

  // Listen for project item changes and refetch
  const refetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefetch = useCallback(() => {
    if (refetchRef.current) clearTimeout(refetchRef.current);
    refetchRef.current = setTimeout(() => {
      // Re-trigger the data load effect by toggling a counter
      setRefetchCounter(c => c + 1);
    }, 300);
  }, []);

  useSocketEvent('project-item:created', debouncedRefetch);
  useSocketEvent('project-item:deleted', debouncedRefetch);
  useSocketEvent('project:created', debouncedRefetch);
  useSocketEvent('project:updated', debouncedRefetch);
  useSocketEvent('project:deleted', debouncedRefetch);

  // COMPANY ORDER: Fixed display order (top to bottom)
  const COMPANY_ORDER = [
    'TLines NE',
    'TLines SE',
    'TLines NW',
    'TLines CVW',
    'TLines HQ',
    'TLines TC'
  ];

  // Report filter dropdown options from this vendor's items (before user filters),
  // so the filter bar only offers values that actually exist in the table
  useEffect(() => {
    if (!onFilterOptions) return;
    const vendorItems: BackendProjectItem[] = [];
    const halvesSeen = new Set<string>();
    projects.forEach(project => {
      const projectHasVendorItem = (project.items || []).some(item =>
        !vendorCode || extractVendorCode(item.vendor) === vendorCode
      );
      if (projectHasVendorItem) {
        const p = project as any;
        if (p.halfOfYear && p.halfYear) halvesSeen.add(`${p.halfYear}:${p.halfOfYear}`);
      }
      (project.items || []).forEach(item => {
        if (!vendorCode || extractVendorCode(item.vendor) === vendorCode) {
          vendorItems.push(item);
        }
      });
    });
    onFilterOptions({ ...buildSupplierFilterOptions(vendorItems), halves: [...halvesSeen].sort() });
  }, [projects, vendorCode, onFilterOptions]);

  // Helper: Calculate section totals for blue totals bar
  // PF and Invoice are independent totals — entering an invoice amount must
  // NOT replace/zero-out the PF total, they're summed separately.
  const calculateSectionTotals = (items: BackendProjectItem[]) => {
    let totalUsd = 0;
    let totalTl = 0;
    let totalInvoice = 0;
    let totalInvoiceTl = 0;
    let hasData = false;

    items.forEach(item => {
      const usd = toNumber(item.pfUsd);
      const tl = toNumber(item.pfTl);
      const inv = toNumber(item.invoice);
      const invTl = toNumber(item.invoiceTl);

      totalUsd += usd;
      totalTl += tl;
      totalInvoice += inv;
      totalInvoiceTl += invTl;

      if (usd > 0 || tl > 0 || inv > 0 || invTl > 0) {
        hasData = true;
      }
    });

    return {
      pfUsd: Number(totalUsd),
      pfTl: Number(totalTl),
      invoice: Number(totalInvoice),
      invoiceTl: Number(totalInvoiceTl),
      hasData
    };
  };

  // Helper: Calculate grand totals from items (for grand totals row)
  const calcTotals = (items: BackendProjectItem[]) => {
    let usd = 0;
    let tl = 0;
    let payUsd = 0; // Payments 1 total (payUsd1 + payUsd2)
    let payTl = 0;  // Payments 2 total (payTl1 + payTl2)
    let dueUsd = 0; // Due Payment totals (same logic as PaymentsGrid)
    let dueTl = 0;
    let invoice = 0;
    let invoiceTl = 0;

    items.forEach(item => {
      // PF and Invoice are independent totals (see calculateSectionTotals)
      usd += toNumber(item.pfUsd);
      tl += toNumber(item.pfTl);

      // Add payments totals regardless of status (payments are separate from PF amounts)
      payUsd += toNumber(item.paidUsd1) + toNumber(item.paidUsd2);
      payTl += toNumber(item.paidTl1) + toNumber(item.paidTl2);

      const due = calculateRemaining(item);
      dueUsd += due.remainingUsd;
      dueTl += due.remainingTl;

      invoice += toNumber(item.invoice);
      invoiceTl += toNumber(item.invoiceTl);
    });

    return {
      usd: Number(usd),  // Ensure numeric type
      tl: Number(tl),    // Ensure numeric type
      payUsd: Number(payUsd), // Payments 1 total
      payTl: Number(payTl),   // Payments 2 total
      dueUsd: Number(dueUsd),
      dueTl: Number(dueTl),
      invoice: Number(invoice),
      invoiceTl: Number(invoiceTl),
      usdFormatted: `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      tlFormatted: `₺${tl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    };
  };

  // DATA-DRIVEN REGION GROUPING: Use project.bucket as source of truth
  const regionSections = useMemo(() => {
    // Helper: Get region label from bucket (same as Operational Board)
    const getRegionLabel = (bucket: string): string => {
      if (bucket === 'TLINES_NE') return 'TLines NE';
      if (bucket === 'TLINES_SE') return 'TLines SE';
      if (bucket === 'TLINES_NW') return 'TLines NW';
      if (bucket === 'CVW') return 'TLines CVW';
      if (bucket === 'TLINES_HQ') return 'TLines HQ';
      if (bucket === 'TLINES_TC') return 'TLines TC';
      return bucket;
    };

    // Step 1: Filter by vendor if on vendor-specific page
    let filteredProjects = projects;
    if (vendorCode) {
      filteredProjects = projects.map(project => {
        // Filter items by vendor
        const vendorItems = (project.items || []).filter(item => {
          const itemVendorCode = extractVendorCode(item.vendor);
          return itemVendorCode === vendorCode;
        });

        return {
          ...project,
          items: vendorItems
        };
      }).filter(project => project.items.length > 0); // Only include projects with matching items
    }

    // Step 1b: Apply supplier filters
    if (filter && hasActiveSupplierFilters(filter)) {
      filteredProjects = filteredProjects
        .filter(project => projectMatchesHalfFilter(project, filter.halves || []))
        .map(project => ({
          ...project,
          items: (project.items || []).filter(item => itemPassesSupplierFilter(item, filter))
        })).filter(project => project.items.length > 0);
    }

    // Step 2: Group by region (bucket)
    const byRegion: Record<string, BackendProject[]> = {};
    filteredProjects.forEach(project => {
      const bucket = project.bucket;
      if (!byRegion[bucket]) {
        byRegion[bucket] = [];
      }
      byRegion[bucket].push(project);
    });

    // Step 3: Create result array with region sections in FIXED ORDER
    const grouped: Record<string, BackendProject[]> = {};
    Object.entries(byRegion).forEach(([bucket, projectsList]) => {
      const label = getRegionLabel(bucket);
      grouped[label] = projectsList;
    });

    // Apply fixed ordering
    const orderedKeys = COMPANY_ORDER.filter(k => grouped[k] && grouped[k].length > 0);
    const extras = Object.keys(grouped).filter(k => !COMPANY_ORDER.includes(k)).sort();
    const finalKeys = [...orderedKeys, ...extras];

    const result = finalKeys.map(label => ({
      regionLabel: label,
      bucket: Object.keys(byRegion).find(b => getRegionLabel(b) === label) || label,
      projects: grouped[label] || []
    }));

    // Calculate totals per company and grand total
    const companyTotals = result.map(section => {
      const allItems = section.projects.flatMap(p => p.items || []);
      return {
        regionLabel: section.regionLabel,
        totals: calcTotals(allItems)
      };
    });

    const grandTotal = companyTotals.reduce((acc, company) => ({
      usd: acc.usd + company.totals.usd,
      tl: acc.tl + company.totals.tl,
      payUsd: acc.payUsd + company.totals.payUsd,
      payTl: acc.payTl + company.totals.payTl,
      dueUsd: acc.dueUsd + company.totals.dueUsd,
      dueTl: acc.dueTl + company.totals.dueTl,
      invoice: acc.invoice + company.totals.invoice,
      invoiceTl: acc.invoiceTl + company.totals.invoiceTl
    }), { usd: 0, tl: 0, payUsd: 0, payTl: 0, dueUsd: 0, dueTl: 0, invoice: 0, invoiceTl: 0 });

    return { sections: result, companyTotals, grandTotal };
  }, [projects, vendorCode, filter]);


  // Payments grand total for THIS supplier only (due payment excluded):
  // payments1 + payments2 per currency, from the same vendor-filtered items
  // used by the rest of the page (regionSections)
  const paymentsGrandTotals = useMemo(() => ({
    payUsd: regionSections.grandTotal.payUsd,
    payTl: regionSections.grandTotal.payTl,
    dueUsd: regionSections.grandTotal.dueUsd,
    dueTl: regionSections.grandTotal.dueTl,
  }), [regionSections]);

  // Update global item (for reactive totals + cross-table sync)
  const updateGlobalItem = useCallback((itemId: string, patch: Partial<BackendProjectItem>) => {
    // Update globalItemsById (used by PaymentsGrid, AccountingCells)
    setGlobalItemsById(prev => {
      const newMap = new Map(prev);
      const item = newMap.get(itemId);
      if (item) {
        newMap.set(itemId, { ...item, ...patch });
      }
      return newMap;
    });
    // Update projects state (used by regionSections, totals)
    setProjects(prev =>
      prev.map(project => ({
        ...project,
        items: project.items?.map(item =>
          item.id === itemId ? { ...item, ...patch } : item
        )
      }))
    );
  }, []);

  // Patch-based handler: apply cell-level updates without full refetch
  const handlePatchEvent = useCallback((data: PatchEventPayload) => {
    if (data.entity !== 'projectItem') return;
    if (!myUserId) return;
    const result = livePatch.handlePatchEvent(data, myUserId);
    if (result.apply && result.patch && result.entityId) {
      updateGlobalItem(result.entityId, result.patch);
    }
  }, [myUserId, livePatch, updateGlobalItem]);

  useSocketEvent('entity:patched', handlePatchEvent);

  // 🔥 SUPPLIER P FIX: Single source of truth for immediate UI updates
  const onSupplierItemUpdated = useCallback((updatedItem: BackendProjectItem) => {

    // Update BOTH projects state AND globalItemsById with full updated item
    setProjects(prev =>
      prev.map(project => ({
        ...project,
        items: project.items?.map(item =>
          item.id === updatedItem.id ? updatedItem : item
        )
      }))
    );

    setGlobalItemsById(prev => {
      const newMap = new Map(prev);
      newMap.set(updatedItem.id, updatedItem);
      return newMap;
    });
  }, []);

  const handleExportExcel = useCallback(() => {
    if (regionSections.sections.length === 0) return;
    exportSupplierToExcel({ regionSections: regionSections.sections, vendorCode, mode: 'p', isColumnVisible: legacyPermissions.isColumnVisible });
  }, [regionSections.sections, vendorCode, legacyPermissions.isColumnVisible]);

  if (loading || permissionsLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading supplier data and permissions for {vendorCode}...
      </div>
    );
  }

  if (!canViewPage) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px' }}>
        <h3>Access Restricted</h3>
        <p>You don't have permission to view this supplier page.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px' }}>
        <h3>⚠️ Error Loading Data</h3>
        <p style={{ color: '#c00' }}>{error}</p>
      </div>
    );
  }

  if (regionSections.sections.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>No Projects Found</h3>
        <p>No items found{vendorCode ? ` for vendor: ${vendorCode}` : ''}</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <button
          onClick={handleExportExcel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>Export Excel</span>
        </button>
      </div>
      {/* Main content in global scroll container */}
      <div
        className="global-scroll-container"
        style={{
          // Set CSS variables for pixel-perfect alignment
          '--leftWidth': gridWidthPx,
          '--gapWidth': `${LAYOUT_CONSTANTS.gap}px`,
          '--rightWidth': LAYOUT_CONSTANTS.rightWidth,
          '--paymentsWidth': LAYOUT_CONSTANTS.paymentsWidth,
        } as React.CSSProperties}
      >
        <div
          className="supplierPSheet"
          style={{
            width: 'max-content',
            minWidth: '100%',
          } as React.CSSProperties}
        >
          {/* RENDER PER-REGION: Header Row + Project Rows for pixel-perfect alignment */}
          {regionSections.sections.map((regionSection) => {
            const projects = regionSection.projects || [];
            return (
              <React.Fragment key={regionSection.bucket}>
                <div className="supplierRegionContainer">
                  {/* Project Rows - Each project gets its own row with perfect alignment */}
                  {projects.map((project, projectIndex) => {
                    // Map backend project to frontend format
                    const frontendProject = {
                      projectId: project.id,
                      projectNumber: normalizeProjectNoForDisplay(project.projectNo, 'projects'),
                      projectName: project.name,
                      projectNumberColor: getProjectColor(project as any),
                      address: project.address || '',
                      region: project.bucket,
                      poSignStatusByType: {},
                      rows: [] // Will be computed by ProjectBlock from backendItems
                    };

                    // Show region header only for first project in this region
                    const showRegionHeader = projectIndex === 0;

                    // Sort items with same logic as ProjectBlock for perfect alignment
                    const sortedProjectItems = sortBackendItems(project.items || []);
                    // Filter by vendor code (same as ProjectBlock supplier mode)
                    const projectRenderedItems = vendorCode
                      ? sortedProjectItems.filter(item => item.vendor?.code === vendorCode)
                      : sortedProjectItems;

                    // ✅ LAYOUT REFLOW: Build blocks array - only visible tables render
                    const LAYOUT_GAP = 24;

                    const blocks = [
                      (showProjects || showAccounting) && {
                        key: 'projects-accounting',
                        node: (
                          <div className="supplierAccountingCol">
                            {showProjects && (
                              <div className="supplierPLeftCol">
                                <ProjectBlock
                                  mode="projects"
                                  project={frontendProject}
                                  sectionLabel={regionSection.regionLabel}
                                  backendItems={project.items}
                                  globalItemsById={globalItemsById}
                                  updateGlobalItem={updateGlobalItem}
                                  showSectionHeader={showRegionHeader}
                                  onSupplierItemUpdated={onSupplierItemUpdated}
                                  onProjectUpdate={handleProjectUpdate}
                                  isSupplierMode={true}
                                />
                              </div>
                            )}
                            {showAccounting && (
                              <div className="supplierPRightCol">
                                <AccountingCells
                                  items={projectRenderedItems}
                                  sectionLabel={regionSection.regionLabel}
                                  projectId={project.id}
                                  showSectionHeader={showRegionHeader}
                                  mode="projects"
                                  updateGlobalItem={updateGlobalItem}
                                  onSupplierItemUpdated={onSupplierItemUpdated}
                                  permissionOverrides={accountingPermissionOverrides}
                                />
                              </div>
                            )}
                          </div>
                        )
                      },
                      showPayments && {
                        key: 'payments',
                        node: (
                          <PaymentsGrid
                            items={projectRenderedItems}
                            sectionLabel={regionSection.regionLabel}
                            projectId={project.id}
                            showSectionHeader={showRegionHeader}
                            mode="projects"
                            updateGlobalItem={updateGlobalItem}
                            permissionOverrides={paymentsPermissionOverrides}
                          />
                        )
                      },
                      showInvoice && {
                        key: 'invoice',
                        node: (
                          <InvoiceReceiptGrid
                            items={projectRenderedItems}
                            sectionLabel={regionSection.regionLabel}
                            projectId={project.id}
                            showSectionHeader={showRegionHeader}
                            mode="projects"
                            updateGlobalItem={updateGlobalItem}
                            permissionOverrides={invoicePermissionOverrides}
                          />
                        )
                      },
                    ].filter(Boolean) as { key: string; node: React.ReactNode }[];

                    return (
                      <div key={project.id} style={{ width: '100%', overflowX: 'visible' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'flex-start',
                          gap: `${LAYOUT_GAP}px`,
                          flexWrap: 'nowrap',
                          width: 'fit-content',
                          maxWidth: 'none',
                          marginBottom: '18px',
                        }}>
                          {blocks.map((b) => (
                            <div key={b.key} style={{ flex: '0 0 auto' }}>
                              {b.node}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Section Total Row - after all projects in section */}
                {regionSection.projects.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    gap: '24px',
                    flexWrap: 'nowrap',
                    width: 'fit-content',
                    maxWidth: 'none',
                    marginBottom: '32px',
                  }}>
                    {showProjects && (
                      <div style={{ flex: '0 0 auto' }}>
                        <SectionTotalRow
                          sectionLabel={regionSection.regionLabel}
                          totals={calculateSectionTotals(regionSection.projects.flatMap(p => p.items || []))}
                          isColumnVisible={(col: string) => legacyPermissions.isColumnVisible(col as import('../../lib/columns').ColumnKey)}
                          shouldShowMoneyTotals={shouldShowMoneyTotals}
                          gridWidthPx={gridWidthPx}
                        />
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* FINAL TOTALS ROW - flex layout matching block pattern */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            gap: '24px',
            flexWrap: 'nowrap',
            width: 'fit-content',
            maxWidth: 'none',
            marginBottom: '32px',
          }}>
            {/* LEFT TOTAL: Projects grand total */}
            {showProjects && (
              <div style={{ flex: '0 0 auto' }}>
                <div style={{
                  position: 'relative',
                  width: gridWidthPx,
                  minWidth: gridWidthPx,
                  maxWidth: gridWidthPx,
                  height: '45px',
                  backgroundColor: '#c41e3a',
                  color: 'white',
                  borderRadius: '6px',
                  marginBottom: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #a01729'
                }}>
                  <div style={{
                    textAlign: 'center',
                    fontWeight: '700',
                    fontSize: '16px',
                    letterSpacing: '0.5px'
                  }}>
                    PROJECTS TOTAL
                  </div>
                  <div style={{
                    position: 'absolute',
                    right: '20px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center'
                  }}>
                    {legacyPermissions.isColumnVisible('pfUsd') && (
                      <div style={{
                        backgroundColor: '#a01729',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '14px',
                        border: '1px solid #7a1220',
                        minWidth: '120px',
                        textAlign: 'center'
                      }}>
                        {'$' + formatMoneyDisplay(toNumber(regionSections.grandTotal?.usd))}
                      </div>
                    )}
                    {legacyPermissions.isColumnVisible('pfTl') && (
                      <div style={{
                        backgroundColor: '#a01729',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '14px',
                        border: '1px solid #7a1220',
                        minWidth: '120px',
                        textAlign: 'center'
                      }}>
                        {'₺' + formatMoneyDisplay(toNumber(regionSections.grandTotal?.tl))}
                      </div>
                    )}
                    {legacyPermissions.isColumnVisible('invoice') && (
                      <div style={{
                        backgroundColor: '#a01729',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '14px',
                        border: '1px solid #7a1220',
                        minWidth: '120px',
                        textAlign: 'center'
                      }}>
                        {'INV/USD ' + formatMoneyDisplay(toNumber(regionSections.grandTotal?.invoice))}
                      </div>
                    )}
                    {legacyPermissions.isColumnVisible('invoiceTl') && (
                      <div style={{
                        backgroundColor: '#a01729',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '14px',
                        border: '1px solid #7a1220',
                        minWidth: '120px',
                        textAlign: 'center'
                      }}>
                        {'INV/TL ' + formatMoneyDisplay(toNumber(regionSections.grandTotal?.invoiceTl))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* RIGHT TOTAL: Accounting grand total */}
            {shouldShowAccountingGrandTotals() && (() => {
              const accountingVisibleSections = buildVisibleAccountingSections(accountingPermissionOverrides);
              const accountingDynamicWidth = calculateAccountingWidth(accountingVisibleSections);
              const accountingWidthPx = `${accountingDynamicWidth}px`;

              const hasUsdColumns = accountingVisibleSections.some(s =>
                s.columns.some(c => c.key.includes('Usd'))
              );
              const hasTlColumns = accountingVisibleSections.some(s =>
                s.columns.some(c => c.key.includes('Tl'))
              );

              return (
                <div style={{ flex: '0 0 auto' }}>
                  <div style={{
                    position: 'relative',
                    width: accountingWidthPx,
                    minWidth: accountingWidthPx,
                    maxWidth: accountingWidthPx,
                    height: '45px',
                    backgroundColor: '#b88900',
                    color: 'white',
                    borderRadius: '6px',
                    marginBottom: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #9a7500'
                  }}>
                    <div style={{
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: '16px',
                      letterSpacing: '0.5px'
                    }}>
                      ACCOUNTING GRAND TOTAL
                    </div>
                    <div style={{
                      position: 'absolute',
                      right: '20px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center'
                    }}>
                      {hasUsdColumns && (
                        <div style={{
                          backgroundColor: '#9a7500',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontWeight: '600',
                          fontSize: '14px',
                          border: '1px solid #7a5f00',
                          minWidth: '120px',
                          textAlign: 'center'
                        }}>
                          {'$' + formatMoneyDisplay(toNumber(regionSections.grandTotal?.usd))}
                        </div>
                      )}
                      {hasTlColumns && (
                        <div style={{
                          backgroundColor: '#9a7500',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontWeight: '600',
                          fontSize: '14px',
                          border: '1px solid #7a5f00',
                          minWidth: '120px',
                          textAlign: 'center'
                        }}>
                          {'₺' + formatMoneyDisplay(toNumber(regionSections.grandTotal?.tl))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* PAYMENTS TOTAL: Green payments grand total */}
            {shouldShowPaymentsGrandTotals() && (() => {
              const paymentsDynWidth = `${calculatePaymentsWidth()}px`;
              return (
                <div style={{ flex: '0 0 auto' }}>
                  <div style={{
                    position: 'relative',
                    width: paymentsDynWidth,
                    minWidth: paymentsDynWidth,
                    maxWidth: paymentsDynWidth,
                    height: '45px',
                    backgroundColor: '#2f4b1f',
                    color: 'white',
                    borderRadius: '6px',
                    marginBottom: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #1f3515'
                  }}>
                    <div style={{
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: '16px',
                      letterSpacing: '0.5px'
                    }}>
                      PAYMENTS GRAND TOTAL
                    </div>
                    {/* DUE PAYMENT totals — aligned under the Due Payment columns (left side) */}
                    <div style={{
                      position: 'absolute',
                      left: '8px',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        backgroundColor: '#1f3515',
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '14px',
                        border: '1px solid #0f1a0a',
                        minWidth: '100px',
                        textAlign: 'center'
                      }}>
                        {'$' + formatMoneyDisplay(paymentsGrandTotals.dueUsd)}
                      </div>
                      <div style={{
                        backgroundColor: '#1f3515',
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '14px',
                        border: '1px solid #0f1a0a',
                        minWidth: '100px',
                        textAlign: 'center'
                      }}>
                        {'₺' + formatMoneyDisplay(paymentsGrandTotals.dueTl)}
                      </div>
                    </div>
                    <div style={{
                      position: 'absolute',
                      left: '65%',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        backgroundColor: '#1f3515',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '14px',
                        border: '1px solid #0f1a0a',
                        minWidth: '120px',
                        textAlign: 'center'
                      }}>
                        {'$' + formatMoneyDisplay(paymentsGrandTotals.payUsd)}
                      </div>
                      <div style={{
                        backgroundColor: '#1f3515',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '14px',
                        border: '1px solid #0f1a0a',
                        minWidth: '120px',
                        textAlign: 'center'
                      }}>
                        {'₺' + formatMoneyDisplay(paymentsGrandTotals.payTl)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      </div>

    </>
  );
};

export default SupplierPSheet;
