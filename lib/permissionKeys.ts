/**
 * Permission Keys - Tek dosyada tüm sayfa/tablo/tab anahtarları
 * Mevcut Projects sistemini genişletme için
 */

// ================== NAV_PAGES: Single Source of Truth ==================
// Sidebar menüsü, Pages tab, route guard ve backend enforcement hepsi buradan beslenir
export interface NavPage {
  key: string;       // DB'de saklanan page key
  label: string;     // UI'da görünen isim
  path: string;      // Frontend route path
  icon: string;      // Sidebar icon
}

export const NAV_PAGES: NavPage[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { key: 'operational_board', label: 'Projects', path: '/project-tracking/projects', icon: 'Kanban' },
  { key: 'suppliers_vendors', label: 'Suppliers / Vendors', path: '/suppliers', icon: 'Building2' },
  { key: 'supplier_total', label: 'Supplier Total', path: '/supplier-total', icon: 'CircleDollarSign' },
  { key: 'project_total', label: 'Project Total', path: '/project-total', icon: 'BarChart3' },
  { key: 'operational_board', label: 'Reports', path: '/reports', icon: 'FileText' },
  { key: 'admin_roles_permissions', label: 'Admin > Roles & Permissions', path: '/admin/roles', icon: 'ShieldCheck' },
  { key: 'admin_activity_log', label: 'Activity Log', path: '/admin/activity-log', icon: 'ScrollText' },
  { key: 'trust_expenses', label: 'Trust Expenses', path: '/trust-expenses', icon: 'Wallet' },
  { key: 'expenses_p', label: 'Expenses P', path: '/expenses-p', icon: 'Receipt' },
  { key: 'expenses_direct_order', label: 'Expenses Direct Order', path: '/expenses-direct-order', icon: 'FileText' },
  { key: 'expenses_missing_extra', label: 'Expenses Missing & Extra', path: '/expenses-missing-extra', icon: 'PackageX' },
  { key: 'admin_roles_permissions', label: 'Backup & Restore', path: '/admin/backup-restore', icon: 'DatabaseBackup' },
  { key: 'trash_bin', label: 'Trash Bin', path: '/admin/trash-bin', icon: 'Trash2' },
  { key: 'admin_roles_permissions', label: 'Dropbox Test', path: '/dropbox-test', icon: 'HardDrive' },
  { key: 'operational_board', label: 'Price List', path: '/price-list', icon: 'ClipboardList' },
  { key: 'operational_board', label: 'Pending Approvals', path: '/pending-approvals', icon: 'ClipboardCheck' },
];

// Helper: path -> pageKey mapping (for route guard)
export const getPageKeyByPath = (pathname: string): string | null => {
  // Exact match first
  const exact = NAV_PAGES.find(p => p.path === pathname);
  if (exact) return exact.key;

  // startsWith match for nested routes
  const match = NAV_PAGES.find(p => p.path !== '/' && pathname.startsWith(p.path));
  if (match) return match.key;

  // Special cases: supplier/project total (must check before /suppliers catch-all)
  if (pathname.startsWith('/supplier-total')) {
    return 'supplier_total';
  }
  if (pathname.startsWith('/project-total')) {
    return 'project_total';
  }
  // Supplier sub-routes
  if (pathname.startsWith('/suppliers') || pathname.startsWith('/supplier-tracking')) {
    return 'suppliers_vendors';
  }
  // Trust expenses
  if (pathname.startsWith('/trust-expenses')) {
    return 'trust_expenses';
  }
  // Expenses P
  if (pathname.startsWith('/expenses-p')) {
    return 'expenses_p';
  }
  // Expenses Direct Order
  if (pathname.startsWith('/expenses-direct-order')) {
    return 'expenses_direct_order';
  }
  // Expenses Missing & Extra
  if (pathname.startsWith('/expenses-missing-extra')) {
    return 'expenses_missing_extra';
  }
  // Admin sub-routes
  if (pathname.startsWith('/admin')) {
    return 'admin_roles_permissions';
  }

  return null;
};

// ================== PAGE KEYS (legacy aliases - kept for backward compat) ==================
export const PAGE_KEYS = {
  PROJECTS_OPERATIONAL_BOARD: 'projects-operational-board',
  SUPPLIER_TRACKING: 'supplier-tracking',
  ACCOUNTING: 'accounting',
  SYSTEM_ADMINISTRATION: 'system-administration',
  // New canonical keys matching NAV_PAGES
  DASHBOARD: 'dashboard',
  OPERATIONAL_BOARD: 'operational_board',
  MISSING_EXTRA: 'missing_extra',
  DIRECT_ORDER: 'direct_order',
  SUPPLIERS_VENDORS: 'suppliers_vendors',
  SUPPLIER_TOTAL: 'supplier_total',
  PROJECT_TOTAL: 'project_total',
  TRUST_EXPENSES: 'trust_expenses',
  EXPENSES_P: 'expenses_p',
  EXPENSES_DIRECT_ORDER: 'expenses_direct_order',
  EXPENSES_MISSING_EXTRA: 'expenses_missing_extra',
  ADMIN_ROLES_PERMISSIONS: 'admin_roles_permissions',
} as const;

// ================== TAB KEYS ==================
export const TAB_KEYS = {
  // Supplier Tracking page tabs
  SUPPLIER_PROJECTS: 'supplier-p',
  SUPPLIER_MISSING_EXTRA: 'supplier-me',
  SUPPLIER_DIRECT_ORDERS: 'supplier-do',

  // Future: Accounting page tabs
  ACCOUNTING_INVOICES: 'accounting-invoices',
  ACCOUNTING_PAYMENTS: 'accounting-payments',
} as const;

// ================== TABLE KEYS ==================
export const TABLE_KEYS = {
  // Existing Projects
  OPERATIONAL_BOARD_GRID: 'operational-board-grid', // Mevcut Projects tablosu (DOKUNMA!)

  // Supplier Tracking tables
  SUPPLIER_P_SHEET: 'supplier-p-sheet',
  SUPPLIER_ME_SHEET: 'supplier-me-sheet',
  SUPPLIER_DO_SHEET: 'supplier-do-sheet',

  // Trust Expenses
  TRUST_EXPENSE_SHEET: 'trust-expense-sheet',

  // Expenses pages
  EXPENSES_P_SHEET: 'expenses-p-sheet',
  EXPENSES_DO_SHEET: 'expenses-do-sheet',
  EXPENSES_ME_SHEET: 'expenses-me-sheet',

  // Future: Accounting tables
  ACCOUNTING_INVOICES_TABLE: 'accounting-invoices-table',
  ACCOUNTING_PAYMENTS_TABLE: 'accounting-payments-table',
} as const;

// ================== ACTION KEYS ==================
export const ACTION_KEYS = {
  VIEW: 'view',
  EDIT: 'edit',
  CREATE: 'create',
  DELETE: 'delete',
  EXPORT: 'export',
  APPROVE: 'approve',
  SIGN: 'sign',
} as const;

// ================== COLUMN DEFINITIONS ==================

// Mevcut Projects columns (REFERANS - DOKUNMA!)
export const PROJECTS_COLUMNS = [
  { key: 'projectNo', label: 'Project No', group: 'project', defaultVisible: true, defaultEditable: false },
  { key: 'type', label: 'Type', group: 'project', defaultVisible: true, defaultEditable: true },
  { key: 'pfCode', label: 'PF Code', group: 'project', defaultVisible: true, defaultEditable: false },
  { key: 'vendor', label: 'Vendor', group: 'vendor', defaultVisible: true, defaultEditable: true },
  { key: 'orderType', label: 'Order Type', group: 'vendor', defaultVisible: true, defaultEditable: true },
  { key: 'poSignStatus', label: 'PO Sign Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'pfSignStatus', label: 'PF Sign Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'status', label: 'Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'std', label: 'STD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'etd', label: 'ETD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'rtd', label: 'RTD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'rtr', label: 'RTR', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'rdy', label: 'RDY', group: 'dates', defaultVisible: true, defaultEditable: false },
  { key: 'ftd', label: 'FTD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'snd', label: 'SND', group: 'dates', defaultVisible: true, defaultEditable: false },
  { key: 'pfUsd', label: 'PF USD', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'pfTl', label: 'PF TL', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'invoice', label: 'INV/USD', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'invoiceTl', label: 'INV/TL', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'expensesUsd', label: 'Expenses USD', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'expensesTl', label: 'Expenses TL', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'paymentRule', label: 'Payment Rule', group: 'logistics', defaultVisible: true, defaultEditable: true },
  { key: 'containerNo', label: 'Container No', group: 'logistics', defaultVisible: true, defaultEditable: true },
  { key: 'containerDate', label: 'Container Date', group: 'logistics', defaultVisible: true, defaultEditable: true },
];

// Supplier P Sheet columns (Projects verilerinin supplier görünümü)
export const SUPPLIER_P_COLUMNS = [
  { key: 'projectNo', label: 'Project No', group: 'project', defaultVisible: true, defaultEditable: false },
  { key: 'type', label: 'Type', group: 'project', defaultVisible: true, defaultEditable: false },
  { key: 'pfCode', label: 'PF Code', group: 'project', defaultVisible: true, defaultEditable: false },
  { key: 'orderType', label: 'Order Type', group: 'vendor', defaultVisible: true, defaultEditable: true },
  { key: 'poSignStatus', label: 'PO Sign Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'pfSignStatus', label: 'PF Sign Status', group: 'status', defaultVisible: true, defaultEditable: false },
  { key: 'status', label: 'Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'std', label: 'STD', group: 'dates', defaultVisible: true, defaultEditable: false },
  { key: 'etd', label: 'ETD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'rtd', label: 'RTD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'rtr', label: 'RTR', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'rdy', label: 'RDY', group: 'dates', defaultVisible: true, defaultEditable: false },
  { key: 'ftd', label: 'FTD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'snd', label: 'SND', group: 'dates', defaultVisible: true, defaultEditable: false },
  { key: 'pfUsd', label: 'PF USD', group: 'money', defaultVisible: true, defaultEditable: false },
  { key: 'pfTl', label: 'PF TL', group: 'money', defaultVisible: true, defaultEditable: false },
  { key: 'invoice', label: 'Invoice', group: 'money', defaultVisible: true, defaultEditable: false },
  { key: 'paymentRule', label: 'Payment Rule', group: 'logistics', defaultVisible: true, defaultEditable: true },
  { key: 'containerNo', label: 'Container No', group: 'logistics', defaultVisible: true, defaultEditable: true },
  { key: 'containerDate', label: 'Container Date', group: 'logistics', defaultVisible: true, defaultEditable: true },
];

// Supplier ME Sheet columns
export const SUPPLIER_ME_COLUMNS = [
  { key: 'caseIndex', label: 'Case #', group: 'project', defaultVisible: true, defaultEditable: false },
  { key: 'type', label: 'Type', group: 'project', defaultVisible: true, defaultEditable: true },
  { key: 'pfCode', label: 'PF Code', group: 'project', defaultVisible: true, defaultEditable: false },
  { key: 'orderType', label: 'Order Type', group: 'vendor', defaultVisible: true, defaultEditable: true },
  { key: 'poSignStatus', label: 'PO Sign Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'pfSignStatus', label: 'PF Sign Status', group: 'status', defaultVisible: true, defaultEditable: false },
  { key: 'status', label: 'Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'etd', label: 'ETD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'rtd', label: 'RTD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'ftd', label: 'FTD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'pfUsd', label: 'PF USD', group: 'money', defaultVisible: true, defaultEditable: false },
  { key: 'pfTl', label: 'PF TL', group: 'money', defaultVisible: true, defaultEditable: false },
  { key: 'containerNo', label: 'Container No', group: 'logistics', defaultVisible: true, defaultEditable: true },
];

// Supplier DO Sheet columns
export const SUPPLIER_DO_COLUMNS = [
  { key: 'doNumber', label: 'DO Number', group: 'project', defaultVisible: true, defaultEditable: false },
  { key: 'type', label: 'Type', group: 'project', defaultVisible: true, defaultEditable: true },
  { key: 'description', label: 'Description', group: 'project', defaultVisible: true, defaultEditable: true },
  { key: 'quantity', label: 'Quantity', group: 'vendor', defaultVisible: true, defaultEditable: true },
  { key: 'unitPrice', label: 'Unit Price', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'totalPrice', label: 'Total Price', group: 'money', defaultVisible: true, defaultEditable: false },
  { key: 'orderDate', label: 'Order Date', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'deliveryDate', label: 'Delivery Date', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'status', label: 'Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'notes', label: 'Notes', group: 'project', defaultVisible: true, defaultEditable: true },
  { key: 'containerNo', label: 'Container No', group: 'logistics', defaultVisible: true, defaultEditable: true },
  { key: 'containerDate', label: 'Container Date', group: 'logistics', defaultVisible: true, defaultEditable: true },
];

// Trust Expense Sheet columns
export const TRUST_EXPENSE_COLUMNS = [
  { key: 'type', label: 'Type', group: 'project', defaultVisible: true, defaultEditable: true },
  { key: 'vendor', label: 'Vendor', group: 'vendor', defaultVisible: true, defaultEditable: true },
  { key: 'orderType', label: 'Order Type', group: 'vendor', defaultVisible: true, defaultEditable: true },
  { key: 'status', label: 'Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'std', label: 'STD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'etd', label: 'ETD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'rtrd', label: 'RTRD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'ftd', label: 'FTD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'expensesUsd', label: 'Expenses/USD', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'expensesTl', label: 'Expenses/TL', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'shelvesLocation', label: 'Shelves Location', group: 'logistics', defaultVisible: true, defaultEditable: true },
  { key: 'containerNo', label: 'Container No', group: 'logistics', defaultVisible: true, defaultEditable: true },
  { key: 'invoice', label: 'Invoice', group: 'logistics', defaultVisible: true, defaultEditable: true },
];

// Expenses P columns (uses ProjectBlock - same column set as operational board)
export const EXPENSES_P_COLUMNS = [
  { key: 'projectNo', label: 'Project No', group: 'project', defaultVisible: true, defaultEditable: false },
  { key: 'type', label: 'Type', group: 'project', defaultVisible: true, defaultEditable: true },
  { key: 'pfCode', label: 'PF Code', group: 'project', defaultVisible: true, defaultEditable: false },
  { key: 'vendor', label: 'Vendor', group: 'vendor', defaultVisible: true, defaultEditable: true },
  { key: 'orderType', label: 'Order Type', group: 'vendor', defaultVisible: true, defaultEditable: true },
  { key: 'poSignStatus', label: 'PO Sign Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'pfSignStatus', label: 'PF Sign Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'status', label: 'Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'std', label: 'STD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'etd', label: 'ETD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'rtd', label: 'RTD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'rtr', label: 'RTR', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'ftd', label: 'FTD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'pfUsd', label: 'PF USD', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'pfTl', label: 'PF TL', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'invoice', label: 'INV/USD', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'invoiceTl', label: 'INV/TL', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'expensesUsd', label: 'Expenses USD', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'expensesTl', label: 'Expenses TL', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'paymentRule', label: 'Payment Rule', group: 'logistics', defaultVisible: true, defaultEditable: true },
  { key: 'containerNo', label: 'Container No', group: 'logistics', defaultVisible: true, defaultEditable: true },
  { key: 'containerDate', label: 'Container Date', group: 'logistics', defaultVisible: true, defaultEditable: true },
];

// Expenses Direct Order columns
export const EXPENSES_DO_COLUMNS = [
  { key: 'projectNo', label: 'Project No', group: 'project', defaultVisible: true, defaultEditable: false },
  { key: 'type', label: 'Type', group: 'project', defaultVisible: true, defaultEditable: true },
  { key: 'pfCode', label: 'PF Code', group: 'project', defaultVisible: true, defaultEditable: false },
  { key: 'vendor', label: 'Vendor', group: 'vendor', defaultVisible: true, defaultEditable: true },
  { key: 'orderType', label: 'Order Type', group: 'vendor', defaultVisible: true, defaultEditable: true },
  { key: 'poSignStatus', label: 'PO Sign Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'pfSignStatus', label: 'PF Sign Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'status', label: 'Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'std', label: 'STD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'etd', label: 'ETD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'rtd', label: 'RTD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'rtr', label: 'RTR', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'ftd', label: 'FTD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'pfUsd', label: 'PF USD', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'pfTl', label: 'PF TL', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'invoice', label: 'INV/USD', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'invoiceTl', label: 'INV/TL', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'expensesUsd', label: 'Expenses USD', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'expensesTl', label: 'Expenses TL', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'paymentRule', label: 'Payment Rule', group: 'logistics', defaultVisible: true, defaultEditable: true },
  { key: 'containerNo', label: 'Container No', group: 'logistics', defaultVisible: true, defaultEditable: true },
  { key: 'containerDate', label: 'Container Date', group: 'logistics', defaultVisible: true, defaultEditable: true },
];

// Expenses Missing Extra columns
export const EXPENSES_ME_COLUMNS = [
  { key: 'caseIndex', label: 'Case #', group: 'project', defaultVisible: true, defaultEditable: false },
  { key: 'type', label: 'Type', group: 'project', defaultVisible: true, defaultEditable: true },
  { key: 'pfCode', label: 'PF Code', group: 'project', defaultVisible: true, defaultEditable: false },
  { key: 'vendor', label: 'Vendor', group: 'vendor', defaultVisible: true, defaultEditable: true },
  { key: 'orderType', label: 'Order Type', group: 'vendor', defaultVisible: true, defaultEditable: true },
  { key: 'poSignStatus', label: 'PO Sign Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'status', label: 'Status', group: 'status', defaultVisible: true, defaultEditable: true },
  { key: 'etd', label: 'ETD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'rtd', label: 'RTD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'ftd', label: 'FTD', group: 'dates', defaultVisible: true, defaultEditable: true },
  { key: 'pfUsd', label: 'PF USD', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'pfTl', label: 'PF TL', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'invoice', label: 'INV/USD', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'invoiceTl', label: 'INV/TL', group: 'money', defaultVisible: true, defaultEditable: true },
  { key: 'containerNo', label: 'Container No', group: 'logistics', defaultVisible: true, defaultEditable: true },
];

// Helper function to get columns by table key
export const getColumnsByTableKey = (tableKey: string) => {
  switch (tableKey) {
    case TABLE_KEYS.OPERATIONAL_BOARD_GRID:
      return PROJECTS_COLUMNS;
    case TABLE_KEYS.SUPPLIER_P_SHEET:
      return SUPPLIER_P_COLUMNS;
    case TABLE_KEYS.SUPPLIER_ME_SHEET:
      return SUPPLIER_ME_COLUMNS;
    case TABLE_KEYS.SUPPLIER_DO_SHEET:
      return SUPPLIER_DO_COLUMNS;
    case TABLE_KEYS.TRUST_EXPENSE_SHEET:
      return TRUST_EXPENSE_COLUMNS;
    case TABLE_KEYS.EXPENSES_P_SHEET:
      return EXPENSES_P_COLUMNS;
    case TABLE_KEYS.EXPENSES_DO_SHEET:
      return EXPENSES_DO_COLUMNS;
    case TABLE_KEYS.EXPENSES_ME_SHEET:
      return EXPENSES_ME_COLUMNS;
    default:
      return [];
  }
};

// Helper function to get human-readable names
export const getPageDisplayName = (pageKey: string) => {
  // First check NAV_PAGES
  const navPage = NAV_PAGES.find(p => p.key === pageKey);
  if (navPage) return navPage.label;

  const names: Record<string, string> = {
    [PAGE_KEYS.PROJECTS_OPERATIONAL_BOARD]: 'Projects',
    [PAGE_KEYS.SUPPLIER_TRACKING]: 'Supplier Tracking',
    [PAGE_KEYS.ACCOUNTING]: 'Accounting',
    [PAGE_KEYS.SYSTEM_ADMINISTRATION]: 'System Administration',
  };
  return names[pageKey] || pageKey;
};

export const getTableDisplayName = (tableKey: string) => {
  const names: Record<string, string> = {
    [TABLE_KEYS.OPERATIONAL_BOARD_GRID]: 'Projects Grid',
    [TABLE_KEYS.SUPPLIER_P_SHEET]: 'Supplier Projects',
    [TABLE_KEYS.SUPPLIER_ME_SHEET]: 'Supplier Missing/Extra',
    [TABLE_KEYS.SUPPLIER_DO_SHEET]: 'Supplier Direct Orders',
    [TABLE_KEYS.TRUST_EXPENSE_SHEET]: 'Trust Expenses',
    [TABLE_KEYS.EXPENSES_P_SHEET]: 'Expenses P',
    [TABLE_KEYS.EXPENSES_DO_SHEET]: 'Expenses Direct Order',
    [TABLE_KEYS.EXPENSES_ME_SHEET]: 'Expenses Missing & Extra',
  };
  return names[tableKey] || tableKey;
};

export type PageKey = typeof PAGE_KEYS[keyof typeof PAGE_KEYS];
export type TabKey = typeof TAB_KEYS[keyof typeof TAB_KEYS];
export type TableKey = typeof TABLE_KEYS[keyof typeof TABLE_KEYS];
export type ActionKey = typeof ACTION_KEYS[keyof typeof ACTION_KEYS];