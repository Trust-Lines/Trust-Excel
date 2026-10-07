export interface Permission {
  module: string;
  actions: {
    [action: string]: boolean;
  };
}

export interface BoardColumnAccess {
  visible: boolean;
  readOnly: boolean;
  editable: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  active: boolean;
  userCount: number;
  isAdmin: boolean;
  assignedUsers: string[];
  permissions: Permission[];
  boardColumns: {
    [column: string]: BoardColumnAccess;
  };
}

// Define board columns (must match operational board exactly)
export const BOARD_COLUMNS = [
  { id: 'projectno', name: 'Project No' },
  { id: 'type', name: 'Type' },
  { id: 'pfcode', name: 'PF Code' },
  { id: 'vendor', name: 'Vendor' },
  { id: 'ordertype', name: 'Order Type' },
  { id: 'posignstatus', name: 'PO Sign Status' },
  { id: 'pfsignstatus', name: 'PF Sign Status' },
  { id: 'status', name: 'Status' },
  { id: 'std', name: 'STD' },
  { id: 'etd', name: 'ETD' },
  { id: 'rtd', name: 'RTD' },
  { id: 'ftd', name: 'FTD' },
  { id: 'containerno', name: 'Container No' }
];

// Define available modules and their actions
export const PERMISSION_MODULES = [
  {
    id: 'projects',
    name: 'Projects',
    actions: [
      { id: 'view', name: 'View' },
      { id: 'create', name: 'Create' },
      { id: 'edit', name: 'Edit' },
      { id: 'delete', name: 'Delete' },
      { id: 'upload_files', name: 'Upload Files' },
      { id: 'download_files', name: 'Download Files' },
      { id: 'assign_vendor', name: 'Assign Vendor' },
      { id: 'assign_employee', name: 'Assign Employee' },
      { id: 'change_status', name: 'Change Status' },
      { id: 'finance_view', name: 'Finance View' },
      { id: 'finance_edit', name: 'Finance Edit' }
    ]
  },
  {
    id: 'purchase_pf',
    name: 'Purchase/PF',
    actions: [
      { id: 'view', name: 'View' },
      { id: 'create', name: 'Create' },
      { id: 'edit', name: 'Edit' },
      { id: 'delete', name: 'Delete' },
      { id: 'create_po', name: 'Create PO' },
      { id: 'update_po', name: 'Update PO' },
      { id: 'approve_po', name: 'Approve PO' },
      { id: 'pf_sign', name: 'PF Sign' },
      { id: 'po_sign', name: 'PO Sign' },
      { id: 'export_pf', name: 'Export PF' }
    ]
  },
  {
    id: 'vendors',
    name: 'Vendors',
    actions: [
      { id: 'view', name: 'View' },
      { id: 'create', name: 'Create' },
      { id: 'edit', name: 'Edit' },
      { id: 'delete', name: 'Delete' }
    ]
  },
  {
    id: 'inventory',
    name: 'Inventory/Warehouse',
    actions: [
      { id: 'view', name: 'View' },
      { id: 'create', name: 'Create' },
      { id: 'edit', name: 'Edit' },
      { id: 'delete', name: 'Delete' },
      { id: 'scan_qr', name: 'Scan QR' },
      { id: 'adjust_stock', name: 'Adjust Stock' },
      { id: 'report_damage', name: 'Report Damage' },
      { id: 'transfer_item', name: 'Transfer Item' }
    ]
  },
  {
    id: 'users',
    name: 'Users',
    actions: [
      { id: 'view', name: 'View' },
      { id: 'create', name: 'Create' },
      { id: 'edit', name: 'Edit' },
      { id: 'delete', name: 'Delete' },
      { id: 'reset_password', name: 'Reset Password' },
      { id: 'invite_user', name: 'Invite User' }
    ]
  },
  {
    id: 'settings',
    name: 'Settings',
    actions: [
      { id: 'view', name: 'View' },
      { id: 'edit', name: 'Edit' },
      { id: 'roles_management', name: 'Roles Management' },
      { id: 'audit_logs_view', name: 'Audit Logs View' }
    ]
  }
];

// Helper function to create permissions for a role
const createPermissions = (config: { [module: string]: string[] }): Permission[] => {
  return PERMISSION_MODULES.map(module => ({
    module: module.id,
    actions: module.actions.reduce((acc, action) => {
      acc[action.id] = config[module.id]?.includes(action.id) || false;
      return acc;
    }, {} as { [action: string]: boolean })
  }));
};

// Helper function to create board column permissions
const createBoardColumns = (config?: { [column: string]: { visible?: boolean; readOnly?: boolean; editable?: boolean } }): { [column: string]: BoardColumnAccess } => {
  const result: { [column: string]: BoardColumnAccess } = {};

  BOARD_COLUMNS.forEach(column => {
    const columnConfig = config?.[column.id] || {};
    result[column.id] = {
      visible: columnConfig.visible ?? true,
      readOnly: columnConfig.readOnly ?? true,
      editable: columnConfig.editable ?? false
    };
  });

  return result;
};

// Helper function to create admin board columns (all visible and editable)
const createAdminBoardColumns = (): { [column: string]: BoardColumnAccess } => {
  const result: { [column: string]: BoardColumnAccess } = {};

  BOARD_COLUMNS.forEach(column => {
    result[column.id] = {
      visible: true,
      readOnly: false,
      editable: true
    };
  });

  return result;
};

// Mock roles data - Only Admin role by default
export const mockRoles: Role[] = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full system access with all permissions',
    active: true,
    userCount: 2, // Updated to match assignedUsers length
    isAdmin: true,
    assignedUsers: ['admin@company.com', 'manager@company.com'],
    permissions: createPermissions({
      projects: ['view', 'create', 'edit', 'delete', 'upload_files', 'download_files', 'assign_vendor', 'assign_employee', 'change_status', 'finance_view', 'finance_edit'],
      purchase_pf: ['view', 'create', 'edit', 'delete', 'create_po', 'update_po', 'approve_po', 'pf_sign', 'po_sign', 'export_pf'],
      vendors: ['view', 'create', 'edit', 'delete'],
      inventory: ['view', 'create', 'edit', 'delete', 'scan_qr', 'adjust_stock', 'report_damage', 'transfer_item'],
      users: ['view', 'create', 'edit', 'delete', 'reset_password', 'invite_user'],
      settings: ['view', 'edit', 'roles_management', 'audit_logs_view']
    }),
    boardColumns: createAdminBoardColumns()
  }
];

// Helper functions
export const getAllActionsForModule = (moduleId: string): string[] => {
  const module = PERMISSION_MODULES.find(m => m.id === moduleId);
  return module ? module.actions.map(a => a.id) : [];
};

export const getModuleName = (moduleId: string): string => {
  const module = PERMISSION_MODULES.find(m => m.id === moduleId);
  return module ? module.name : moduleId;
};

export const getActionName = (moduleId: string, actionId: string): string => {
  const module = PERMISSION_MODULES.find(m => m.id === moduleId);
  const action = module?.actions.find(a => a.id === actionId);
  return action ? action.name : actionId;
};

export const getColumnName = (columnId: string): string => {
  const column = BOARD_COLUMNS.find(c => c.id === columnId);
  return column ? column.name : columnId;
};

// Export helper functions for creating new roles
export { createPermissions, createBoardColumns };