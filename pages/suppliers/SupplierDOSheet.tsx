import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLivePatchStore, PatchEventPayload } from '../../hooks/useLivePatchStore';
import { getDirectOrders } from '../../lib/direct-orders';
import type { BackendProject, BackendProjectItem } from '../../lib/projects';
import { apiFetch } from '../../lib/auth';
import { useAuth } from '../../contexts/AuthContext';
import ProjectBlock from '../../components/ProjectBlock';
import { sortBackendItems } from '../../types';
import { useColumnPermissions } from '../../hooks/useColumnPermissions';
import { useSupplierColumnPermissions } from '../../hooks/useSupplierColumnPermissions';
import { useSupplierPermissionResolver } from '../../hooks/useSupplierPermissionResolver';
import { TABLE_KEYS } from '../../lib/permissionKeys';
import { getGridWidthPx } from '../../lib/gridWidth';
import PaymentsGrid, { calculateRemaining } from '../../components/PaymentsGrid';
import { parseMoneyInput, formatMoneyDisplay, prepareMoneyForBackend, formatReadonlyMoney } from '../../utils/moneyUtils';
import { useSocket } from '../../contexts/SocketContext';
import { useSocketEvent } from '../../hooks/useSocketEvent';
import { getProjectColor } from '../../lib/projectColor';
import InvoiceReceiptGrid from '../../components/InvoiceReceiptGrid';
import { exportSupplierToExcel } from '../../utils/excel/exportSupplierExcel';

import { SupplierFilterConfig, hasActiveSupplierFilters, itemPassesSupplierFilter, SupplierFilterOptions, buildSupplierFilterOptions } from '../../components/SupplierFilterBar';

interface SupplierDOSheetProps {
  vendorCode: string;
  vendorId: string;
  filter?: SupplierFilterConfig;
  onFilterOptions?: (options: SupplierFilterOptions) => void;
}

// ========== PIXEL-PERFECT ALIGNMENT CONSTANTS ==========

// Accounting column constants (source of truth)
const ACCOUNTING_WIDTHS = {
  paid: 120,        // Individual paid column width
  paidDate: 100,    // Date column next to paid
  remaining: 140,   // Individual remaining column width
  notOrdered: 140,  // Individual not ordered column width
  gap: 30,          // Gap between column groups (synced with --accounting-gap-width CSS var)
  get total() {
    // Structure: [PaidUSD1, Date] + gap + [PaidUSD2, Date] + gap + [PaidTL1, Date] + gap + [PaidTL2, Date] + gap + [RemUSD, RemTL] + gap + [NotOrderedUSD, NotOrderedTL]
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

// ✅ ACCOUNTING COLUMN STRUCTURE: Define dynamic accounting structure (from P sheet)
interface AccountingSection {
  name: 'paidUsd1st' | 'paidUsd2nd' | 'paidTl1st' | 'paidTl2nd' | 'remaining' | 'notOrdered';
  label: string;
  columns: AccountingColumn[];
  editable: boolean;
}

interface AccountingColumn {
  key: 'paidUsd1' | 'paidUsd1Date' | 'paidUsd2' | 'paidUsd2Date' | 'paidTl1' | 'paidTl1Date' | 'paidTl2' | 'paidTl2Date' | 'remainingUsd' | 'remainingTl' | 'notOrderedUsd' | 'notOrderedTl';
  label: string;
  width: string;
  dataField?: string;
}

// ✅ DYNAMIC WIDTH CALCULATION: Calculate accounting grid width based on visible columns
const calculateAccountingWidth = (visibleSections: AccountingSection[]): number => {
  if (visibleSections.length === 0) return 0;
  let totalWidth = 0;
  visibleSections.forEach(section => {
    section.columns.forEach(column => {
      if (column.key.includes('paid')) totalWidth += ACCOUNTING_WIDTHS.paid;
      else if (column.key.includes('remaining')) totalWidth += ACCOUNTING_WIDTHS.remaining;
      else if (column.key.includes('notOrdered')) totalWidth += ACCOUNTING_WIDTHS.notOrdered;
    });
  });
  totalWidth += (visibleSections.length - 1) * ACCOUNTING_WIDTHS.gap;
  return totalWidth;
};

// Note: paidDate columns use 'paid' in their key, so they are captured by includes('paid') check above

const buildVisibleAccountingSections = (permissionOverrides?: {
  isColumnVisible?: (columnKey: string) => boolean;
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

  const visibleSections = baseSections.map(section => ({
    ...section,
    columns: section.columns.filter(col =>
      !permissionOverrides?.isColumnVisible || permissionOverrides.isColumnVisible(col.key)
    )
  })).filter(section => section.columns.length > 0);

  return visibleSections;
};

// ✅ PAYMENTS DYNAMIC WIDTH: Calculate payments grid width based on visible columns
interface PaymentSection {
  name: 'duePayment' | 'payments1' | 'payments2';
  label: string;
  columns: { key: string; width: number }[];
  editable: boolean;
}

const buildVisiblePaymentSections = (permissionOverrides?: {
  isColumnVisible?: (columnKey: string) => boolean;
}): PaymentSection[] => {
  const baseSections: PaymentSection[] = [
    {
      name: 'duePayment', label: 'DUE PAYMENT', editable: false,
      columns: [
        { key: 'dueUsd', width: PAYMENTS_WIDTHS.duePayment },
        { key: 'dueTl', width: PAYMENTS_WIDTHS.duePayment }
      ]
    },
    {
      name: 'payments1', label: 'PAYMENTS 1', editable: true,
      columns: [
        { key: 'payUsd1', width: PAYMENTS_WIDTHS.payments1 },
        { key: 'payTl1', width: PAYMENTS_WIDTHS.payments1 }
      ]
    },
    {
      name: 'payments2', label: 'PAYMENTS 2', editable: true,
      columns: [
        { key: 'payUsd2', width: PAYMENTS_WIDTHS.payments2 },
        { key: 'payTl2', width: PAYMENTS_WIDTHS.payments2 }
      ]
    }
  ];

  return baseSections.map(section => ({
    ...section,
    columns: section.columns.filter(col =>
      !permissionOverrides?.isColumnVisible || permissionOverrides.isColumnVisible(col.key)
    )
  })).filter(section => section.columns.length > 0);
};

const calculatePaymentsWidth = (visibleSections: PaymentSection[]): number => {
  if (visibleSections.length === 0) return 0;
  const totalWidth = visibleSections.reduce((sum, section) =>
    sum + section.columns.reduce((colSum, col) => colSum + col.width, 0), 0
  );
  return totalWidth + (visibleSections.length - 1) * PAYMENTS_WIDTHS.gap;
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
 * SupplierDOSheet - Clean implementation for Supplier DO (Direct Orders) tab
 * 
 * Strategy:
 * 1. Uses ORIGINAL ProjectBlock component (no modifications)
 * 2. Filters data by vendor BEFORE passing to ProjectBlock
 * 3. Renders accounting columns as separate right-side grid
 * 4. Both grids scroll together with ONE page-level horizontal scrollbar
 * 5. Data source: Direct Orders API instead of Projects API
 */
const SupplierDOSheet: React.FC<SupplierDOSheetProps> = ({ vendorCode, vendorId, filter, onFilterOptions }) => {
  const { role } = useAuth();

  // ✅ UPDATED: Permission hook to load complete supplier permissions data
  const useSupplierPermissions = (roleId?: string) => {
    const [permissions, setPermissions] = useState<{
      tableActionsByKey: Record<string, { view: boolean; edit: boolean; export: boolean }>;
      columnRulesByKey: Record<string, Record<string, 'hidden' | 'readonly' | 'editable'>>;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!roleId) {
        setLoading(false);
        return;
      }

      const loadPermissions = async () => {
        try {
          const response = await apiFetch('/api/permissions/supplier/my-permissions');
          if (response.ok) {
            const data = await response.json();
            setPermissions({
              tableActionsByKey: data.data?.tableActionsByKey || {},
              columnRulesByKey: data.data?.columnRulesByKey || {},
            });
          }
        } catch (error) {
          console.error('Failed to load supplier permissions:', error);
          setPermissions({ tableActionsByKey: {}, columnRulesByKey: {} });
        } finally {
          setLoading(false);
        }
      };

      loadPermissions();
    }, [roleId]);

    return { permissions, loading };
  };

  const { permissions, loading: permissionsLoading } = useSupplierPermissions(role?.id);

  // ✅ PERMISSION RESOLVER: Create supplier permission resolver for DO tab
  const permissionResolver = useSupplierPermissionResolver(permissions);

  // ✅ Table permissions using resolver with proper AND logic (matches P sheet)
  const mainTab = 'DO' as const;
  const canViewProjects = permissionResolver.canViewTable(mainTab, 'projects');
  const canViewAccounting = permissionResolver.canViewTable(mainTab, 'accounting');
  const canViewPayments = permissionResolver.canViewTable(mainTab, 'payments');
  const canViewInvoice = permissionResolver.canViewTable(mainTab, 'invoice');

  // ✅ LAYOUT VISIBILITY: Check if tables have any visible columns
  const ACCOUNTING_COLUMN_KEYS = ['paidUsd1', 'paidUsd1Date', 'paidUsd2', 'paidUsd2Date', 'paidTl1', 'paidTl1Date', 'paidTl2', 'paidTl2Date', 'remainingUsd', 'remainingTl', 'notOrderedUsd', 'notOrderedTl'];
  const PAYMENTS_COLUMN_KEYS = ['dueUsd', 'dueTl', 'payUsd1', 'payTl1', 'payUsd2', 'payTl2'];
  const INVOICE_COLUMN_KEYS = ['transactionNo', 'invoiceNumber', 'quickBook', 'invoiceDate'];

  const hasAnyVisibleAccountingColumns = ACCOUNTING_COLUMN_KEYS.some(col =>
    permissionResolver.isColumnVisible(mainTab, 'accounting', col)
  );
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

  // One-time permission debug (enable via browser console: localStorage.setItem('DEBUG_SUPPLIER_PERMS','1'))
  if (typeof window !== 'undefined' && localStorage.getItem('DEBUG_SUPPLIER_PERMS')) {
  }

  const [projects, setProjects] = useState<BackendProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalItemsById, setGlobalItemsById] = useState<Map<string, BackendProjectItem>>(new Map());


  // ✅ PER-PROJECT ALIGNMENT: Each project gets its own accounting block
  // This ensures 1:1 alignment between left ProjectBlock and right AccountingCells
  // No more section-level aggregation that was causing misalignment

  // Column permissions and grid width calculation
  // ✅ CRITICAL: "Projects Columns" admin tab = single source of truth for ALL project tables
  const legacyPermissions = useColumnPermissions();
  useSupplierColumnPermissions(TABLE_KEYS.SUPPLIER_DO_SHEET);
  const isColumnVisibleForGrid = useCallback((key: string) => {
    if (['expensesUsd', 'expensesTl'].includes(key)) return false;
    return legacyPermissions.isColumnVisible(key);
  }, [legacyPermissions.isColumnVisible]);
  const gridWidthPx = getGridWidthPx(isColumnVisibleForGrid, true); // isSupplierMode = true

  // For debugging - log supplier permissions

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

  const projectsPermissionOverrides = createPermissionOverrides('projects');
  const accountingPermissionOverrides = createPermissionOverrides('accounting');
  const paymentsPermissionOverrides = createPermissionOverrides('payments');
  const invoicePermissionOverrides = createPermissionOverrides('invoice');

  // ✅ DETAILED TOTALS GATING: Based on real column dependencies
  // pfUsd/pfTl are project columns → use legacy "Projects Columns" permissions
  const shouldShowMoneyTotals = () => {
    if (!canViewProjects) return false;
    return legacyPermissions.isColumnVisible('pfUsd') ||
      legacyPermissions.isColumnVisible('pfTl');
  };

  const shouldShowAccountingGrandTotals = (): boolean => {
    if (!showAccounting) return false;
    const accountingMoneyColumns = ['paidUsd1', 'paidUsd2', 'paidTl1', 'paidTl2', 'remainingUsd', 'remainingTl', 'notOrderedUsd', 'notOrderedTl'];
    return accountingMoneyColumns.some(col =>
      permissionResolver.isColumnVisible(mainTab, 'accounting', col)
    );
  };

  const shouldShowPaymentsGrandTotals = (): boolean => {
    if (!showPayments) return false;
    const paymentMoneyColumns = ['dueUsd', 'dueTl', 'payUsd1', 'payUsd2', 'payTl1', 'payTl2'];
    return paymentMoneyColumns.some(col =>
      permissionResolver.isColumnVisible(mainTab, 'payments', col)
    );
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
    if (visibleSections.length === 0) return null;

    // Money input state
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

    const [inputFocus, setInputFocus] = useState({ usd1: false, usd2: false, tl1: false, tl2: false });
    void inputFocus;

    const [focusedPaidField, setFocusedPaidField] = useState<string | null>(null);

    const inputRefs = useRef({
      usd1: null as HTMLInputElement | null, usd2: null as HTMLInputElement | null,
      tl1: null as HTMLInputElement | null, tl2: null as HTMLInputElement | null,
    });

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

    const handleChange = useCallback((field: string, rawValue: string) => {
      let cleaned = rawValue.replace(/[^0-9.]/g, '');
      const parts = cleaned.split('.');
      if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
      if (cleaned.includes('.')) {
        const [int, dec] = cleaned.split('.');
        cleaned = int + '.' + (dec || '').substring(0, 2);
      }
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
      const formattedValue = formatMoneyDisplay(numValue);
      setLocalPaidDisplayValues(prev => ({ ...prev, [field]: formattedValue }));
      setInputFocus(prev => ({ ...prev, [field]: false }));
      setFocusedPaidField(null);
      const backendValue = prepareMoneyForBackend(numValue);
      onPaidAmountSave(item.id, field, backendValue ?? 0);
    }, [item.id, onPaidAmountSave]);

    const handleFocus = useCallback((field: string) => {
      setFocusedPaidField(field);
      setInputFocus(prev => ({ ...prev, [field]: true }));
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

    const getRemainingForField = (field: string): { value: number; currency: 'USD' | 'TL' } | null => {
      const pfUsd = toNumber(item.pfUsd);
      const pfTl = toNumber(item.pfTl);
      const paid1Usd = parseMoneyInput(localPaidDisplayValues.usd1) ?? 0;
      const paid2Usd = parseMoneyInput(localPaidDisplayValues.usd2) ?? 0;
      const paid1Tl = parseMoneyInput(localPaidDisplayValues.tl1) ?? 0;
      const paid2Tl = parseMoneyInput(localPaidDisplayValues.tl2) ?? 0;
      switch (field) {
        case 'usd1': return { value: Math.max(0, pfUsd - paid2Usd), currency: 'USD' };
        case 'usd2': return { value: Math.max(0, pfUsd - paid1Usd), currency: 'USD' };
        case 'tl1': return { value: Math.max(0, pfTl - paid2Tl), currency: 'TL' };
        case 'tl2': return { value: Math.max(0, pfTl - paid1Tl), currency: 'TL' };
        default: return null;
      }
    };

    // ✅ PERMISSION ENFORCEMENT: Check if specific column is editable
    const isColumnEditable = useCallback((columnKey: string) => {
      return permissionOverrides?.isColumnEditable ? permissionOverrides.isColumnEditable(columnKey) : true;
    }, [permissionOverrides]);

    // Helper to check if column is a date column
    const isDateColumn = (columnKey: string) => columnKey.endsWith('Date') && columnKey.startsWith('paid');

    const getDataBorderRight = (_sectionName: string, colIndex: number, totalCols: number) => {
      if (colIndex >= totalCols - 1) return 'none';
      return '1px solid #ccc';
    };

    const getAccountingValues = () => {
      const pfUsd = toNumber(item.pfUsd);
      const pfTl = toNumber(item.pfTl);
      const paid1Usd = parseMoneyInput(localPaidDisplayValues.usd1) ?? 0;
      const paid2Usd = parseMoneyInput(localPaidDisplayValues.usd2) ?? 0;
      const paid1Tl = parseMoneyInput(localPaidDisplayValues.tl1) ?? 0;
      const paid2Tl = parseMoneyInput(localPaidDisplayValues.tl2) ?? 0;
      const totalPaidUsd = paid1Usd + paid2Usd;
      const totalPaidTl = paid1Tl + paid2Tl;
      const isPfSigned = item.pfSignStatus === 'SIGNED';
      const isNotOrdered = item.status === 'NOT_ORDERED';
      let remainingUsd = 0, remainingTl = 0, notOrderedUsd = 0, notOrderedTl = 0;
      let showNotSignedLabel = false;
      if (!isPfSigned) { showNotSignedLabel = true; notOrderedUsd = pfUsd; notOrderedTl = pfTl; }
      else if (isNotOrdered) { notOrderedUsd = pfUsd; notOrderedTl = pfTl; }
      else {
        remainingUsd = Math.max(0, pfUsd - totalPaidUsd);
        remainingTl = Math.max(0, pfTl - totalPaidTl);
      }
      return { paidDisplay: localPaidDisplayValues, remainingUsd, remainingTl, notOrderedUsd, notOrderedTl, showNotSignedLabel };
    };

    const accounting = getAccountingValues();

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
          return accounting.showNotSignedLabel ? '' : formatReadonlyMoney(accounting.remainingTl, 'TL');
        case 'notOrderedUsd': return formatReadonlyMoney(accounting.notOrderedUsd, 'USD');
        case 'notOrderedTl': return formatReadonlyMoney(accounting.notOrderedTl, 'TL');
        default: return '';
      }
    }, [accounting, localDateValues]);

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
        alignItems: 'center', fontSize: '12px', backgroundColor: '#FFF8DC',
        borderBottom: '1px solid #ddd', padding: '0', margin: '0',
        boxSizing: 'border-box', lineHeight: 'normal'
      }}
        onMouseDown={(e) => { if ((e.target as HTMLElement).tagName !== 'INPUT') e.preventDefault(); }}>
        {/* ✅ DYNAMIC SECTIONS: Render based on visible sections */}
        {visibleSections.map((section, sectionIndex) => (
          <React.Fragment key={section.name}>
            {section.columns.map((column, columnIndex) => {
              const columnEditable = section.editable && isColumnEditable(column.key);
              const currencySymbol = getCurrencySymbol(column);
              const columnValue = getColumnValue(column);

              // ✅ EDITABLE DATE INPUT: For paid date fields
              if (section.editable && column.dataField && isDateColumn(column.key)) {
                return (
                  <div key={column.key} style={{
                    width: column.width, height: '100%',
                    borderRight: getDataBorderRight(section.name, columnIndex, section.columns.length),
                    backgroundColor: '#FFF8DC', display: 'flex', alignItems: 'center', boxSizing: 'border-box'
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
                        width: '100%', height: '100%', padding: '2px 4px', border: 'none',
                        textAlign: 'center', backgroundColor: columnEditable ? 'transparent' : '#f5f5f5',
                        fontSize: '11px', boxSizing: 'border-box', outline: 'none',
                        color: columnEditable ? 'inherit' : '#999', cursor: columnEditable ? 'pointer' : 'not-allowed'
                      }}
                    />
                  </div>
                );
              }

              // ✅ EDITABLE INPUT: For paid money fields
              if (section.editable && column.dataField) {
                return (
                  <div key={column.key} style={{
                    width: column.width, height: '100%', position: 'relative',
                    borderRight: getDataBorderRight(section.name, columnIndex, section.columns.length),
                    backgroundColor: '#FFF8DC', display: 'flex', alignItems: 'center', boxSizing: 'border-box'
                  }}>
                    <span style={{ width: '12px', fontSize: '10px', fontWeight: 'bold', color: '#666', paddingLeft: '2px', flexShrink: 0 }}>{currencySymbol}</span>
                    <input
                      id={`paid-${column.dataField}-${projectId}-${item.id}`}
                      name={`${column.key}_${item.id}`}
                      ref={(el) => { if (column.dataField) inputRefs.current[column.dataField as keyof typeof inputRefs.current] = el; }}
                      key={`${projectId}:${item.id}:${column.dataField}`}
                      type="text" inputMode="decimal"
                      value={columnValue as string}
                      disabled={!columnEditable}
                      onChange={(e) => { if (columnEditable && column.dataField) handleChange(column.dataField, e.target.value); }}
                      onBlur={(e) => { if (columnEditable && column.dataField) handleBlur(column.dataField, e.target.value); }}
                      onFocus={(e) => { if (columnEditable && column.dataField) { handleFocus(column.dataField); e.target.select(); } }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      placeholder="0.00"
                      style={{
                        flex: 1, height: '100%', padding: '2px', border: 'none',
                        textAlign: 'right', backgroundColor: columnEditable ? 'transparent' : '#f5f5f5',
                        fontSize: '11px', boxSizing: 'border-box', pointerEvents: 'auto', outline: 'none', minWidth: 0,
                        color: columnEditable ? 'inherit' : '#999', cursor: columnEditable ? 'text' : 'not-allowed'
                      }}
                    />
                    {focusedPaidField === column.dataField && columnEditable && (() => {
                      const rem = getRemainingForField(column.dataField!);
                      if (!rem || rem.value <= 0) return null;
                      const symbol = rem.currency === 'USD' ? '$' : '₺';
                      return (
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const formatted = formatMoneyDisplay(rem.value);
                            setLocalPaidDisplayValues(prev => ({ ...prev, [column.dataField!]: formatted }));
                            onPaidAmountUpdate(item.id, column.dataField!, rem.value);
                            onPaidAmountSave(item.id, column.dataField!, rem.value);
                            setFocusedPaidField(null);
                          }}
                          style={{
                            position: 'absolute', bottom: '-24px', left: '0', right: '0',
                            backgroundColor: '#1a1a2e', color: '#4ade80', fontSize: '10px',
                            padding: '3px 6px', borderRadius: '3px', cursor: 'pointer',
                            zIndex: 10, textAlign: 'center', whiteSpace: 'nowrap',
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

              return (
                <div key={column.key} style={{
                  width: column.width, height: '100%', padding: '0 8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  borderRight: getDataBorderRight(section.name, columnIndex, section.columns.length),
                  boxSizing: 'border-box'
                }}>
                  {columnValue}
                </div>
              );
            })}
            {sectionIndex < visibleSections.length - 1 && (
              <div style={{ width: `${ACCOUNTING_WIDTHS.gap}px`, backgroundColor: '#ffffff', border: 'none', height: '100%', boxSizing: 'border-box' }} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  });

  // AccountingCells Component - Cell-based accounting layout (Excel-like)
  interface AccountingCellsProps {
    items: BackendProjectItem[];
    sectionLabel: string;
    projectId: string;
    showSectionHeader: boolean;
    mode?: 'projects' | 'missingExtra' | 'directOrder';
    updateGlobalItem?: (itemId: string, patch: Partial<BackendProjectItem>) => void;
    onSupplierItemUpdated?: (updatedItem: BackendProjectItem) => void;
    permissionOverrides?: {
      isColumnVisible?: (columnKey: string) => boolean;
      isColumnEditable?: (columnKey: string) => boolean;
      isColumnReadOnly?: (columnKey: string) => boolean;
    };
  }

  const AccountingCells: React.FC<AccountingCellsProps> = ({ items, sectionLabel, projectId, showSectionHeader, mode = 'directOrder', updateGlobalItem, onSupplierItemUpdated, permissionOverrides }) => {
    // ✅ SECTION FILTERING: Get visible sections based on permissions
    const visibleSections = buildVisibleAccountingSections(permissionOverrides);

    // ✅ EARLY RETURN: Don't render grid if no visible sections
    if (visibleSections.length === 0) return null;

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
    const getUpdateEndpoint = (mode: string, itemId: string, projectId?: string) => {
      if (mode === 'missingExtra') return `/api/missing-extra/items/${itemId}`;
      if (mode === 'directOrder' && projectId) return `/api/direct-orders/${projectId}/items/${itemId}`;
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
        const endpoint = getUpdateEndpoint(mode, itemId, projectItem.projectId);

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
        const projectItem = items.find(item => item.id === itemId);
        console.error('SUPPLIER_SAVE_FAIL', {
          mode,
          endpoint: getUpdateEndpoint(mode, itemId, projectItem?.projectId),
          itemId,
          field,
          error: error instanceof Error ? error.message : String(error),
          fullError: error
        });
        // TODO: Show error toast to user
      }
    }, [items, updateGlobalItem, onSupplierItemUpdated, mode]);

    // API call to save date field to backend
    const saveDateField = useCallback(async (itemId: string, field: string, value: string | null) => {
      try {
        const projectItem = items.find(item => item.id === itemId);
        if (!projectItem) return;

        const dateValue = value ? new Date(value).toISOString() : null;
        const endpoint = getUpdateEndpoint(mode, itemId, projectItem.projectId);

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
        console.error('DATE_SAVE_FAIL:', error);
      }
    }, [items, updateGlobalItem, onSupplierItemUpdated, mode]);

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
            backgroundColor: '#b88900', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: '16px', letterSpacing: '1px',
            marginBottom: '0', padding: '0', margin: '0',
            boxSizing: 'border-box', lineHeight: '1'
          }}>
            ACCOUNTING {sectionLabel.replace('TLines ', '').toUpperCase()}
          </div>
        )}

        {/* ✅ DYNAMIC TOP GROUP ROW */}
        <div className="acct-topgroup-row" style={{
          display: 'flex',
          height: 'var(--supplier-topgroup-row, 34px)',
          minHeight: 'var(--supplier-topgroup-row, 34px)',
          maxHeight: 'var(--supplier-topgroup-row, 34px)',
          backgroundColor: '#D4AF37', color: '#000', fontSize: '12px', fontWeight: '600',
          alignItems: 'center', padding: '0', margin: '0', boxSizing: 'border-box', lineHeight: '1'
        }}>
          {visibleSections.map((section, sectionIndex) => (
            <React.Fragment key={section.name}>
              {section.columns.map((column, columnIndex) => (
                <div key={column.key} style={{
                  width: column.width, textAlign: 'center',
                  borderRight: columnIndex < section.columns.length - 1 ? '1px solid #000' : 'none',
                  height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'
                }}>
                  {section.label}
                </div>
              ))}
              {sectionIndex < visibleSections.length - 1 && (
                <div style={{ width: `${ACCOUNTING_WIDTHS.gap}px`, backgroundColor: '#ffffff', height: '100%', boxSizing: 'border-box' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ✅ DYNAMIC COLUMN HEADERS ROW */}
        <div className="acct-colhead-row" style={{
          display: 'flex',
          height: 'var(--supplier-colhead-row, 34px)',
          minHeight: 'var(--supplier-colhead-row, 34px)',
          maxHeight: 'var(--supplier-colhead-row, 34px)',
          backgroundColor: '#000', color: 'white', fontSize: '12px', fontWeight: '600',
          alignItems: 'center', padding: '0', margin: '0', boxSizing: 'border-box', lineHeight: '1'
        }}>
          {visibleSections.map((section, sectionIndex) => (
            <React.Fragment key={section.name}>
              {section.columns.map((column, columnIndex) => (
                <div key={column.key} style={{
                  width: column.width, textAlign: 'center',
                  borderRight: columnIndex < section.columns.length - 1 ? '1px solid #333' : 'none',
                  height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'
                }}>
                  {column.label}
                </div>
              ))}
              {sectionIndex < visibleSections.length - 1 && (
                <div style={{ width: `${ACCOUNTING_WIDTHS.gap}px`, backgroundColor: '#000', height: '100%', boxSizing: 'border-box' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Data Rows */}
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

        {/* ✅ DYNAMIC TOTALS ROW */}
        <div className="acct-totals-row" style={{
          display: 'flex',
          height: 'var(--supplier-totals-row, 36px)',
          minHeight: 'var(--supplier-totals-row, 36px)',
          maxHeight: 'var(--supplier-totals-row, 36px)',
          alignItems: 'center', fontSize: '14px', fontWeight: '700',
          backgroundColor: '#D4AF37', color: '#000', borderTop: '2px solid #000',
          padding: '0', margin: '0', boxSizing: 'border-box', lineHeight: '1'
        }}>
          {visibleSections.map((section, sectionIndex) => (
            <React.Fragment key={section.name}>
              {section.columns.map((column, columnIndex) => {
                const isDate = column.key.endsWith('Date') && column.key.startsWith('paid');
                const totalValue = isDate ? undefined : sectionTotals[column.key as keyof typeof sectionTotals];
                const currencySymbol = column.key.includes('Usd') && !isDate ? '$' : column.key.includes('Tl') && !isDate ? '₺' : '';
                return (
                  <div key={column.key} style={{
                    width: column.width, textAlign: 'right', padding: '0 8px',
                    borderRight: columnIndex < section.columns.length - 1 ? '1px solid #000' : 'none',
                    height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', boxSizing: 'border-box'
                  }}>
                    {isDate ? '' : currencySymbol + formatMoneyDisplay(toNumber(totalValue))}
                  </div>
                );
              })}
              {sectionIndex < visibleSections.length - 1 && (
                <div style={{ width: `${ACCOUNTING_WIDTHS.gap}px`, backgroundColor: '#ffffff', height: '100%', boxSizing: 'border-box' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Using natural browser scrolling - simple and reliable

  // Reset state when vendorCode or vendorId changes
  useEffect(() => {
    setProjects([]);
    setGlobalItemsById(new Map());
    setLoading(true);
    setError(null);
  }, [vendorCode, vendorId]);

  // Refetch function for on-demand data refresh (e.g. after type/name/address changes)
  const refetchDOData = useCallback(async () => {
    try {
      const response = await getDirectOrders();
      const transformedProjects: BackendProject[] = [];
      const sourceProjects: any[] = [];
      response.sections?.forEach((section: any) => {
        section.projects?.forEach((project: any) => {
          sourceProjects.push(project);
        });
      });
      sourceProjects.forEach((project: any) => {
        transformedProjects.push({
          id: project.id,
          projectNo: project.projectNo,
          name: project.name || '',
          address: project.address || '',
          description: project.description || '',
          bucket: project.bucket,
          types: project.types || [],
          status: project.status || 'PRE_PROJECT',
          createdByUserId: project.createdByUserId || '',
          createdAt: project.createdAt || new Date().toISOString(),
          updatedAt: project.updatedAt || new Date().toISOString(),
          items: project.items || []
        });
      });
      setProjects(transformedProjects);
      const itemsMap = new Map<string, BackendProjectItem>();
      transformedProjects.forEach((project: BackendProject) => {
        project.items?.forEach((item: BackendProjectItem) => {
          itemsMap.set(item.id, item);
        });
      });
      setGlobalItemsById(itemsMap);
    } catch (err: any) {
      console.error('Error refetching DO data:', err);
    }
  }, [vendorCode, vendorId]);

  const handleProjectUpdate = useCallback(async (_projectId: string) => {
    await refetchDOData();
  }, [refetchDOData]);

  // Socket.IO refetch counter
  const [refetchCounter, setRefetchCounter] = useState(0);

  // Load direct orders data
  useEffect(() => {
    let isMounted = true;

    const loadData = async (isPolling = false) => {
      if (!isPolling) { setLoading(true); setError(null); }
      try {
        const response = await getDirectOrders();
        if (!isMounted) return;

        const transformedProjects: BackendProject[] = [];
        const sourceProjects: any[] = [];
        response.sections?.forEach((section: any) => {
          section.projects?.forEach((project: any) => {
            sourceProjects.push(project);
          });
        });

        sourceProjects.forEach((project: any) => {
          transformedProjects.push({
            id: project.id,
            projectNo: project.projectNo,
            name: project.name || '',
            address: project.address || '',
            description: project.description || '',
            bucket: project.bucket,
            types: project.types || [],
            status: project.status || 'PRE_PROJECT',
            createdByUserId: project.createdByUserId || '',
            createdAt: project.createdAt || new Date().toISOString(),
            updatedAt: project.updatedAt || new Date().toISOString(),
            items: project.items || []
          });
        });

        setProjects(transformedProjects);
        const itemsMap = new Map<string, BackendProjectItem>();
        transformedProjects.forEach((project: BackendProject) => {
          project.items?.forEach((item: BackendProjectItem) => {
            itemsMap.set(item.id, item);
          });
        });
        setGlobalItemsById(itemsMap);
      } catch (err: any) {
        if (!isMounted) return;
        if (!isPolling) { console.error('Error loading direct orders supplier data:', err); setError(err.message); }
      } finally {
        if (isMounted && !isPolling) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [vendorCode, vendorId, refetchCounter]);

  // Socket.IO: join suppliers room and refetch on changes
  const { joinRooms, leaveRooms, isConnected, userId: myUserId } = useSocket();
  const livePatch = useLivePatchStore();
  const prevConnected = useRef(isConnected);

  useEffect(() => {
    joinRooms(['suppliers']);
    return () => { leaveRooms(['suppliers']); };
  }, [joinRooms, leaveRooms]);

  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      setRefetchCounter(c => c + 1);
    }
    prevConnected.current = isConnected;
  }, [isConnected]);

  const refetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefetch = useCallback(() => {
    if (refetchRef.current) clearTimeout(refetchRef.current);
    refetchRef.current = setTimeout(() => setRefetchCounter(c => c + 1), 300);
  }, []);

  useSocketEvent('do-item:created', debouncedRefetch);
  useSocketEvent('do-item:deleted', debouncedRefetch);
  useSocketEvent('do-project:created', debouncedRefetch);
  useSocketEvent('do-project:updated', debouncedRefetch);
  useSocketEvent('do-project:deleted', debouncedRefetch);

  // COMPANY ORDER: Fixed display order (top to bottom)
  const COMPANY_ORDER = [
    'TLines NE',
    'TLines SE',
    'TLines NW',
    'TLines CVW',
    'TLines HQ',
    'TLines TC'
  ];

  // Helper: Calculate section totals for blue totals bar
  // Report filter dropdown options from this vendor's items (before user filters),
  // so the filter bar only offers values that actually exist in the table
  useEffect(() => {
    if (!onFilterOptions) return;
    const vendorItems: BackendProjectItem[] = [];
    projects.forEach(project => {
      (project.items || []).forEach(item => {
        const itemVendorId = (item as any).vendorId ?? item.vendor?.id ?? null;
        if (!vendorId || itemVendorId === vendorId) {
          vendorItems.push(item);
        }
      });
    });
    onFilterOptions(buildSupplierFilterOptions(vendorItems));
  }, [projects, vendorId, onFilterOptions]);

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
    let payUsd = 0; // payments1 + payments2 (USD), due payment excluded
    let payTl = 0;  // payments1 + payments2 (TL), due payment excluded
    let dueUsd = 0; // Due Payment totals (same logic as PaymentsGrid)
    let dueTl = 0;
    let invoice = 0;
    let invoiceTl = 0;

    items.forEach(item => {
      // PF and Invoice are independent totals (see calculateSectionTotals)
      usd += toNumber(item.pfUsd);
      tl += toNumber(item.pfTl);

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
      payUsd: Number(payUsd),
      payTl: Number(payTl),
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
    // ✅ FIX: Use vendorId instead of vendorCode (Direct Order response only has {id, name})
    let filteredProjects = projects;
    if (vendorId) {
      filteredProjects = projects.map(project => {
        // Filter items by vendorId
        const vendorItems = (project.items || []).filter(item => {
          // Extract vendorId: item.vendorId is the FK, item.vendor?.id is from relation
          const itemVendorId = item.vendorId ?? item.vendor?.id ?? null;

          const matches = itemVendorId === vendorId;

          // Debug first few items
          if (project.items && project.items.indexOf(item) < 2) {
          }

          return matches;
        });

        return {
          ...project,
          items: vendorItems
        };
      }).filter(project => project.items.length > 0); // Only include projects with matching items

    }

    // Step 1b: Apply supplier filters
    if (filter && hasActiveSupplierFilters(filter)) {
      filteredProjects = filteredProjects.map(project => ({
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

    // ✅ PROOF LOG: Final state before render

    return { sections: result, companyTotals, grandTotal };
  }, [projects, vendorCode, vendorId, filter]);


  // Update global item (for reactive totals + cross-table sync)
  const updateGlobalItem = useCallback((itemId: string, patch: Partial<BackendProjectItem>) => {
    setGlobalItemsById(prev => {
      const newMap = new Map(prev);
      const item = newMap.get(itemId);
      if (item) {
        newMap.set(itemId, { ...item, ...patch });
      }
      return newMap;
    });
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
    if (data.entity !== 'directOrderItem') return;
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
    exportSupplierToExcel({ regionSections: regionSections.sections, vendorCode, mode: 'do', isColumnVisible: legacyPermissions.isColumnVisible });
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

  // ✅ FIX: Check total projects count, not just sections length
  const totalProjects = regionSections.sections.reduce((sum, section) => sum + section.projects.length, 0);

  if (totalProjects === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>No Projects Found</h3>
        <p>No items found{vendorCode ? ` for vendor: ${vendorCode}` : ''}</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>
          Debug: {projects.length} total projects loaded, filtered to {totalProjects} with vendor items
        </p>
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
                    // ✅ DO_PROJECTNO_PROOF: Keep projectNo as string

                    // Map backend project to frontend format
                    const frontendProject = {
                      projectId: project.id,
                      projectNumber: String(project.projectNo), // ✅ Keep as string: "DO-01", "DO-02"
                      projectName: project.name || '',
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
                    const projectRenderedItems = vendorCode
                      ? sortedProjectItems.filter(item => item.vendor?.code === vendorCode)
                      : sortedProjectItems;

                    // ✅ LAYOUT REFLOW: Build blocks array - only visible tables render
                    const doBlocks = [
                      (showProjects || showAccounting) && {
                        key: 'projects-accounting',
                        node: (
                          <div className="supplierAccountingCol">
                            {showProjects && (
                              <div className="supplierPLeftCol">
                                <ProjectBlock
                                  mode="directOrder"
                                  project={frontendProject}
                                  sectionLabel={regionSection.regionLabel}
                                  backendItems={project.items}
                                  globalItemsById={globalItemsById}
                                  updateGlobalItem={updateGlobalItem}
                                  showSectionHeader={showRegionHeader}
                                  onSupplierItemUpdated={onSupplierItemUpdated}
                                  onProjectUpdate={handleProjectUpdate}
                                  isSupplierMode={true}
                                  permissionOverrides={projectsPermissionOverrides}
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
                                  mode="directOrder"
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
                            mode="directOrder"
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
                            mode="directOrder"
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
                          gap: '24px',
                          flexWrap: 'nowrap',
                          width: 'fit-content',
                          maxWidth: 'none',
                          marginBottom: '18px',
                        }}>
                          {doBlocks.map((b) => (
                            <div key={b.key} style={{ flex: '0 0 auto' }}>
                              {b.node}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Section Total Row - flex layout */}
                {regionSection.projects.length > 0 && showProjects && (
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
                    <div style={{ flex: '0 0 auto' }}>
                      <SectionTotalRow
                        sectionLabel={regionSection.regionLabel}
                        totals={calculateSectionTotals(regionSection.projects.flatMap(p => p.items || []))}
                        isColumnVisible={(col: string) => legacyPermissions.isColumnVisible(col as import('../../lib/columns').ColumnKey)}
                        shouldShowMoneyTotals={shouldShowMoneyTotals}
                        gridWidthPx={gridWidthPx}
                      />
                    </div>
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
                  border: '1px solid #7d7d7d'
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

            {/* RIGHT TOTAL: Accounting grand total (dynamic width) */}
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

            {/* PAYMENTS TOTAL: Green payments grand total (dynamic width) */}
            {shouldShowPaymentsGrandTotals() && (() => {
              const paymentsVisibleSections = buildVisiblePaymentSections(paymentsPermissionOverrides);
              const paymentsDynamicWidth = calculatePaymentsWidth(paymentsVisibleSections);
              const paymentsWidthPx = `${paymentsDynamicWidth}px`;

              return (
                <div style={{ flex: '0 0 auto' }}>
                  <div style={{
                    position: 'relative',
                    width: paymentsWidthPx,
                    minWidth: paymentsWidthPx,
                    maxWidth: paymentsWidthPx,
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
                        {'$' + formatMoneyDisplay(toNumber(regionSections.grandTotal?.dueUsd))}
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
                        {'₺' + formatMoneyDisplay(toNumber(regionSections.grandTotal?.dueTl))}
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
                        {'$' + formatMoneyDisplay(toNumber(regionSections.grandTotal?.payUsd))}
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
                        {'₺' + formatMoneyDisplay(toNumber(regionSections.grandTotal?.payTl))}
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

export default SupplierDOSheet;
