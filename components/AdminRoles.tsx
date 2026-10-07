import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/auth';
import './AdminRoles.css';
import { SUPPLIER_REGISTRY, getTabTables, getTableColumns, getSupplierTableKey } from '../src/permissions/supplierRegistry';
import {
  getTableDisplayName,
  NAV_PAGES,
} from '../lib/permissionKeys';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  forcePasswordChange: boolean;
  invitedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  role: Role;
}

interface Role {
  id: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
  _count?: { users: number };
}

interface InviteUserData {
  email: string;
  roleId: string;
  columnsHidden: string[];
  columnsReadOnly: string[];
  rowScopes: Record<string, any>;
}

// Column definitions will be loaded from backend to ensure single source of truth
interface ColumnDefinition {
  key: string;
  label: string;
  module: string;
  defaultVisible: boolean;
  defaultEditable: boolean;
}

type ColumnPermission = 'hidden' | 'readonly' | 'editable';

const AdminRoles: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Roles state
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleSubTab, setRoleSubTab] = useState<'pages' | 'columns' | 'suppliers' | 'types' | 'projects'>('pages');

  // ✅ GATE 2: Supplier Permissions State (3-Level Structure)
  const [selectedSupplierMainTab, setSelectedSupplierMainTab] = useState<string>('P'); // P, ME, DO
  const [selectedSupplierTable, setSelectedSupplierTable] = useState<string>('projects'); // projects, accounting, payments, invoice
  
  // ✅ GATE 2: Local policy state - keyed by tableKey (supplier:SHEET:TABLE)
  const [tableActionsByKey, setTableActionsByKey] = useState<Record<string, { view: boolean; edit: boolean; export: boolean }>>({});
  const [columnRulesByKey, setColumnRulesByKey] = useState<Record<string, Record<string, 'hidden' | 'readonly' | 'editable'>>>({});
  
  // OLD state (deprecated, keeping for transition)
  const [_supplierTablePolicy, setSupplierTablePolicy] = useState<Record<string, { columnsHidden: string[]; columnsReadOnly: string[] }>>({});
  const [_supplierTableActions, _setSupplierTableActions] = useState<Record<string, Record<string, boolean>>>({});
  
  const [savingSupplierPolicy] = useState<boolean>(false);
  const [supplierSaveStatus, setSupplierSaveStatus] = useState<string>('');

  // ✅ FIX: Table registry state (with column objects)
  const [_tableRegistry, setTableRegistry] = useState<Record<string, { columns: Array<{key: string; label: string}>; actions: string[] }>>({});
  const [_tableRegistryLoading, setTableRegistryLoading] = useState(false);
  const [_tableRegistryError, setTableRegistryError] = useState<string>('');

  // ✅ PAGE ACCESS: Page permission state
  const [pagePermissions, setPagePermissions] = useState<Record<string, boolean>>({});
  const [pagePermissionsLoading, setPagePermissionsLoading] = useState(false);

  // ✅ EXPORT PERMISSION: Projects table export
  const [projectsCanExport, setProjectsCanExport] = useState<boolean>(true);

  // ✅ TYPE VISIBILITY: Type visibility state
  const [typeVisibility, setTypeVisibility] = useState<Array<{ key: string; label: string; isEnum: boolean; customTypeId?: string; isAllowed: boolean }>>([]);
  const [typeVisibilityHasConfig, setTypeVisibilityHasConfig] = useState(false);
  const [typeVisibilityLoading, setTypeVisibilityLoading] = useState(false);
  const [typeVisibilitySaveStatus, setTypeVisibilitySaveStatus] = useState<string>('');

  // PROJECT SCOPE: Project assignment state
  const [projectScopeEnabled, setProjectScopeEnabled] = useState(false);
  const [projectScopeAssignedBySource, setProjectScopeAssignedBySource] = useState<Record<string, Set<string>>>({});
  const [projectScopeBySource, setProjectScopeBySource] = useState<Record<string, Array<{ id: string; projectNo: string; name: string; bucket: string; baseProjectId?: string; baseProjectNo?: string }>>>({});
  const [projectScopeLoading, setProjectScopeLoading] = useState(false);
  const [projectScopeSaveStatus, setProjectScopeSaveStatus] = useState<string>('');
  const [projectScopeSearch, setProjectScopeSearch] = useState('');
  const [projectScopeSourceTab, setProjectScopeSourceTab] = useState<string>('projects');

  // Supplier registry from dynamic import
  const supplierRegistry = SUPPLIER_REGISTRY;

  // ================== GATE 2: NEW HELPER FUNCTIONS ==================

  // ✅ GATE 2: Build canonical tableKey from main tab + sub table
  const getCurrentTableKey = (): string => {
    return `supplier:${selectedSupplierMainTab}:${selectedSupplierTable}`;
  };

  // ✅ GATE 2: Get table action permission
  const getTableAction = (tableKey: string, action: 'view' | 'edit' | 'export'): boolean => {
    return tableActionsByKey[tableKey]?.[action] ?? true; // Default to allowed
  };

  // ✅ GATE 2: Set table action permission
  const setTableAction = (tableKey: string, action: 'view' | 'edit' | 'export', value: boolean) => {
    setTableActionsByKey(prev => ({
      ...prev,
      [tableKey]: {
        ...prev[tableKey],
        [action]: value
      }
    }));
  };

  // ✅ GATE 2: Get column rule
  const getColumnRule = (tableKey: string, columnKey: string): 'hidden' | 'readonly' | 'editable' => {
    return columnRulesByKey[tableKey]?.[columnKey] ?? 'editable'; // Default to editable
  };

  // ✅ GATE 2: Set column rule
  const setColumnRule = (tableKey: string, columnKey: string, rule: 'hidden' | 'readonly' | 'editable') => {
    setColumnRulesByKey(prev => ({
      ...prev,
      [tableKey]: {
        ...prev[tableKey],
        [columnKey]: rule
      }
    }));
  };

  // ✅ GATE 3: Load supplier permissions from backend
  const loadSupplierPermissions = useCallback(async (roleId: string) => {
    if (!roleId) return;

    try {
      const response = await apiFetch(`/api/admin/permissions/supplier/${roleId}`);

      if (!response.ok) {
        throw new Error(`Failed to load supplier permissions: ${response.status}`);
      }

      const data = await response.json();

      // Update state with loaded permissions
      if (data.success && data.data) {
        setTableActionsByKey(data.data.tableActionsByKey || {});
        setColumnRulesByKey(data.data.columnRulesByKey || {});
      }

    } catch (error) {
      console.error('❌ Failed to load supplier permissions:', error);
    }
  }, []);

  // ✅ PAGE ACCESS: Load page permissions for role
  const loadPagePermissions = useCallback(async (roleId: string) => {
    if (!roleId) return;

    try {
      setPagePermissionsLoading(true);

      const response = await apiFetch(`/api/admin/permissions/${roleId}/pages`);

      if (!response.ok) {
        throw new Error(`Failed to load page permissions: ${response.status}`);
      }

      const data = await response.json();

      // Update state with loaded permissions
      if (data.success && data.data) {
        setPagePermissions(data.data);
      }

    } catch (error) {
      console.error('❌ Failed to load page permissions:', error);
      // Set safe defaults on error (all false - fail-closed)
      setPagePermissions({
        projects: false,
        suppliers: false,
        admin: false
      });
    } finally {
      setPagePermissionsLoading(false);
    }
  }, [selectedRole?.name]);

  // ✅ TYPE VISIBILITY: Load type visibility for role
  const loadTypeVisibility = useCallback(async (roleId: string) => {
    if (!roleId) return;

    try {
      setTypeVisibilityLoading(true);
      const response = await apiFetch(`/api/admin/permissions/role/${roleId}/types`);

      if (!response.ok) {
        throw new Error(`Failed to load type visibility: ${response.status}`);
      }

      const data = await response.json();

      setTypeVisibility(data.allTypes || []);
      setTypeVisibilityHasConfig(data.hasConfig || false);
    } catch (error) {
      console.error('Failed to load type visibility:', error);
      setTypeVisibility([]);
      setTypeVisibilityHasConfig(false);
    } finally {
      setTypeVisibilityLoading(false);
    }
  }, []);

  // ✅ TYPE VISIBILITY: Save type visibility
  const saveTypeVisibility = useCallback(async (types: typeof typeVisibility) => {
    if (!selectedRole) return;

    const allowedEnumTypes = types.filter(t => t.isEnum && t.isAllowed).map(t => t.key);
    const allowedCustomTypeIds = types.filter(t => !t.isEnum && t.isAllowed).map(t => t.customTypeId!);

    try {
      setTypeVisibilitySaveStatus('saving');
      const response = await apiFetch(`/api/admin/permissions/role/${selectedRole.id}/types`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowedEnumTypes, allowedCustomTypeIds }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save type visibility: ${response.status}`);
      }

      setTypeVisibilitySaveStatus('saved');

      // Check if all types are allowed (= no config)
      const allAllowed = types.every(t => t.isAllowed);
      setTypeVisibilityHasConfig(!allAllowed);

      setTimeout(() => setTypeVisibilitySaveStatus(''), 2000);
    } catch (error) {
      console.error('Failed to save type visibility:', error);
      setTypeVisibilitySaveStatus('error');
      setTimeout(() => setTypeVisibilitySaveStatus(''), 3000);
    }
  }, [selectedRole]);

  // ✅ TYPE VISIBILITY: Handle type toggle
  const handleTypeToggle = useCallback((key: string, isAllowed: boolean) => {
    setTypeVisibility(prev => {
      const updated = prev.map(t => t.key === key ? { ...t, isAllowed } : t);
      saveTypeVisibility(updated);
      return updated;
    });
  }, [saveTypeVisibility]);

  // PROJECT SCOPE: Load project scope for role
  const loadProjectScope = useCallback(async (roleId: string) => {
    if (!roleId) return;

    try {
      setProjectScopeLoading(true);
      const response = await apiFetch(`/api/admin/permissions/role/${roleId}/project-scope`);

      if (!response.ok) {
        throw new Error(`Failed to load project scope: ${response.status}`);
      }

      const data = await response.json();

      setProjectScopeEnabled(data.enabled || false);
      // Load per-source assignments
      const bySource: Record<string, Set<string>> = {};
      if (data.assignedBySource) {
        for (const [src, ids] of Object.entries(data.assignedBySource)) {
          bySource[src] = new Set(ids as string[]);
        }
      }
      setProjectScopeAssignedBySource(bySource);

      // Map missingExtra to have consistent shape (include baseProjectId + baseProjectNo for assignment mapping)
      const sources = data.projectsBySource || {};
      const missingExtra = (sources.missingExtra || []).map((c: any) => ({
        id: c.id,
        projectNo: c.derivedProjectCode,
        name: c.baseProjectName,
        bucket: c.section,
        baseProjectId: c.baseProjectId,
        baseProjectNo: c.baseProjectNo,
      }));

      setProjectScopeBySource({
        projects: sources.projects || [],
        directOrders: sources.directOrders || [],
        missingExtra,
        expensesP: sources.expensesP || [],
        expensesDirectOrder: sources.expensesDirectOrder || [],
        expensesMissingExtra: sources.expensesMissingExtra || [],
      });
    } catch (error) {
      console.error('Failed to load project scope:', error);
      setProjectScopeEnabled(false);
      setProjectScopeBySource({});
    } finally {
      setProjectScopeLoading(false);
    }
  }, []);

  // PROJECT SCOPE: Save project scope (debounced) - sends per-source assignments
  const projectScopeSaveRef = React.useRef<NodeJS.Timeout | null>(null);
  const saveProjectScope = useCallback(async (enabled: boolean, bySource: Record<string, Set<string>>) => {
    if (!selectedRole) return;

    if (projectScopeSaveRef.current) clearTimeout(projectScopeSaveRef.current);

    projectScopeSaveRef.current = setTimeout(async () => {
      try {
        setProjectScopeSaveStatus('saving');
        // Convert Sets to arrays for JSON
        const assignedBySource: Record<string, string[]> = {};
        for (const [src, ids] of Object.entries(bySource)) {
          assignedBySource[src] = Array.from(ids);
        }
        const response = await apiFetch(`/api/admin/permissions/role/${selectedRole.id}/project-scope`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled, assignedBySource }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`Failed to save project scope: ${response.status} ${errBody}`);
        }

        setProjectScopeSaveStatus('saved');
        setTimeout(() => setProjectScopeSaveStatus(''), 2000);
      } catch (error) {
        console.error('Failed to save project scope:', error);
        setProjectScopeSaveStatus('error');
        setTimeout(() => setProjectScopeSaveStatus(''), 3000);
      }
    }, 500);
  }, [selectedRole]);

  // PROJECT SCOPE: Toggle project assignment per source tab
  const handleProjectToggle = useCallback((projectId: string, sourceKey: string, isAssigned: boolean) => {
    setProjectScopeAssignedBySource(prev => {
      const updated = { ...prev };
      const sourceSet = new Set(prev[sourceKey] || []);
      if (isAssigned) sourceSet.add(projectId);
      else sourceSet.delete(projectId);
      updated[sourceKey] = sourceSet;
      setTimeout(() => saveProjectScope(projectScopeEnabled, updated), 0);
      return updated;
    });
  }, [saveProjectScope, projectScopeEnabled]);

  // PROJECT SCOPE: Toggle enabled/disabled
  const handleProjectScopeToggle = useCallback((enabled: boolean) => {
    setProjectScopeEnabled(enabled);
    saveProjectScope(enabled, projectScopeAssignedBySource);
  }, [saveProjectScope, projectScopeAssignedBySource]);

  // ✅ PAGE ACCESS: Handle page access toggle
  const handlePageAccessToggle = async (pageKey: string, hasAccess: boolean) => {
    if (!selectedRole) return;

    try {

      // Optimistic update
      setPagePermissions(prev => ({
        ...prev,
        [pageKey]: hasAccess
      }));

      const response = await apiFetch('/api/admin/permissions/pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedRole.id,
          pageKey,
          hasAccess
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update page access');
      }

      await response.json();

      // Show success message temporarily
      setSupplierSaveStatus('✅ Page access updated');
      setTimeout(() => setSupplierSaveStatus(''), 2000);

    } catch (error) {
      console.error('❌ Failed to update page access:', error);

      // Revert optimistic update
      setPagePermissions(prev => ({
        ...prev,
        [pageKey]: !hasAccess
      }));

      setSupplierSaveStatus('❌ Failed to update page access');
      setTimeout(() => setSupplierSaveStatus(''), 3000);
    }
  };

  // ✅ EXPORT: Load projects export permission
  const loadProjectsExportPermission = useCallback(async (roleId: string) => {
    try {
      const response = await apiFetch('/api/admin/permissions/projects/roles');
      if (response.ok) {
        const data = await response.json();
        const roleData = data?.find?.((r: any) => r.roleId === roleId || r.id === roleId);
        if (roleData) {
          setProjectsCanExport(roleData.canExport ?? true);
        }
      }
    } catch (error) {
      console.error('Failed to load projects export permission:', error);
    }
  }, []);

  // ✅ EXPORT: Toggle projects export permission
  const handleProjectsExportToggle = async (canExport: boolean) => {
    if (!selectedRole) return;
    setProjectsCanExport(canExport);
    try {
      await apiFetch(`/api/admin/permissions/projects/roles/${selectedRole.id}/actions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canExport })
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Failed to save export permission:', error);
      setProjectsCanExport(!canExport);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ GATE 3: Debounced save for table actions
  const saveTableActionsDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const handleToggleAction = (action: 'view' | 'edit' | 'export', checked: boolean) => {
    if (!selectedRole) return;
    
    const currentTableKey = getCurrentTableKey();
    
    // Update local state immediately (optimistic update)
    setTableAction(currentTableKey, action, checked);
    
    // Debounce save to backend
    if (saveTableActionsDebounceRef.current) {
      clearTimeout(saveTableActionsDebounceRef.current);
    }
    
    saveTableActionsDebounceRef.current = setTimeout(async () => {
      try {
        
        // Get current state for this table
        const actions = {
          view: getTableAction(currentTableKey, 'view'),
          edit: getTableAction(currentTableKey, 'edit'),
          export: getTableAction(currentTableKey, 'export'),
          [action]: checked // Update the changed action
        };
        
        const response = await apiFetch('/api/admin/permissions/supplier/table-actions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roleId: selectedRole.id,
            tableKey: currentTableKey,
            actions
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to save table actions');
        }
        
        await response.json();
        setSupplierSaveStatus('✅ Saved');
        setTimeout(() => setSupplierSaveStatus(''), 2000);

      } catch (error) {
        console.error('❌ Failed to save table actions:', error);
        setSupplierSaveStatus('❌ Save failed');
        // Rollback on error
        loadSupplierPermissions(selectedRole.id);
      }
    }, 500);
  };

  // ✅ GATE 3: Debounced save for column rules
  const saveColumnRulesDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const handleSetColumnRule = (columnKey: string, rule: 'hidden' | 'readonly' | 'editable') => {
    if (!selectedRole) return;
    
    const currentTableKey = getCurrentTableKey();
    
    // Update local state immediately (optimistic update)
    setColumnRule(currentTableKey, columnKey, rule);
    
    // Debounce save to backend
    if (saveColumnRulesDebounceRef.current) {
      clearTimeout(saveColumnRulesDebounceRef.current);
    }
    
    saveColumnRulesDebounceRef.current = setTimeout(async () => {
      try {
        
        // Get all column rules for this table
        const allColumns = getTableColumns(selectedSupplierMainTab, selectedSupplierTable);
        const columnRules: Record<string, 'hidden' | 'readonly' | 'editable'> = {};
        
        allColumns.forEach(col => {
          columnRules[col.key] = col.key === columnKey ? rule : getColumnRule(currentTableKey, col.key);
        });
        
        const response = await apiFetch('/api/admin/permissions/supplier/column-rules', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roleId: selectedRole.id,
            tableKey: currentTableKey,
            columnRules
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to save column rules');
        }
        
        await response.json();
        setSupplierSaveStatus('✅ Saved');
        setTimeout(() => setSupplierSaveStatus(''), 2000);

      } catch (error) {
        console.error('❌ Failed to save column rules:', error);
        setSupplierSaveStatus('❌ Save failed');
        // Rollback on error
        loadSupplierPermissions(selectedRole.id);
      }
    }, 500);
  };

  // ✅ GATE 3: Bulk supplier column permissions
  const handleBulkColumnPermission = (permission: 'hidden' | 'readonly' | 'editable') => {
    if (!selectedRole) return;

    const currentTableKey = getCurrentTableKey();
    const columns = getTableColumns(selectedSupplierMainTab, selectedSupplierTable);
    

    // Update all columns to the same permission
    columns.forEach(col => {
      setColumnRule(currentTableKey, col.key, permission);
    });

    // Build column rules object for backend
    const columnRules: Record<string, 'hidden' | 'readonly' | 'editable'> = {};
    columns.forEach(col => {
      columnRules[col.key] = permission;
    });

    // Save to backend immediately (no debounce for bulk actions)
    apiFetch('/api/admin/permissions/supplier/column-rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roleId: selectedRole.id,
        tableKey: currentTableKey,
        columnRules
      })
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to save bulk column rules');
        }
        await response.json();
        setSupplierSaveStatus('✅ Saved');
        setTimeout(() => setSupplierSaveStatus(''), 2000);
      })
      .catch((error) => {
        console.error('❌ Failed to save bulk column rules:', error);
        setSupplierSaveStatus('❌ Save failed');
        // Rollback on error
        loadSupplierPermissions(selectedRole.id);
      });
  };

  // OLD: Deprecated bulk function
  const setSupplierBulkColumnPermission = (permission: ColumnPermission) => {
    handleBulkColumnPermission(permission as 'hidden' | 'readonly' | 'editable');
  };

  // Columns state
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);

  // Role column policy state
  const [roleColumnPolicy, setRoleColumnPolicy] = useState<Record<string, { columnsHidden: string[]; columnsReadOnly: string[] }>>({});
  const [savingPolicy, setSavingPolicy] = useState<string | null>(null); // roleId being saved
  const [saveStatus, setSaveStatus] = useState<string>(''); // 'saving', 'saved', 'error'

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{ type: 'user' | 'role'; item: User | Role } | null>(null);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);

  // Form states
  const [inviteForm, setInviteForm] = useState<InviteUserData>({
    email: '',
    roleId: '',
    columnsHidden: [],
    columnsReadOnly: [],
    rowScopes: {}
  });
  const [newRoleName, setNewRoleName] = useState('');

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Load data on mount
  useEffect(() => {
    loadUsers();
    loadRoles();
    loadColumns();
    loadTableRegistry();
  }, []);

  // Load role column policy when selected role changes
  useEffect(() => {
    if (selectedRole) {
      loadRoleColumnPolicy(selectedRole.id);
      loadSupplierPermissions(selectedRole.id);
      loadPagePermissions(selectedRole.id);
      loadProjectsExportPermission(selectedRole.id);
      loadTypeVisibility(selectedRole.id);
      loadProjectScope(selectedRole.id);
    }
  }, [selectedRole, loadSupplierPermissions, loadPagePermissions, loadProjectsExportPermission, loadTypeVisibility, loadProjectScope]);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await apiFetch('/api/admin/users');
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      } else {
        setError(data.message || 'Failed to load users');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await apiFetch('/api/admin/roles');
      const data = await response.json();

      if (response.ok) {
        setRoles(data);
        if (!selectedRole && data.length > 0) {
          setSelectedRole(data[0]);
        }
      } else {
        setError(data.message || 'Failed to load roles');
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
      setError('Failed to load roles');
    } finally {
      setRolesLoading(false);
    }
  };

  const loadColumns = async () => {
    // Use static column definitions that match the Operational Board (CANONICAL camelCase keys)
    const staticColumns: ColumnDefinition[] = [
      { key: 'projectNo', label: 'Project No', module: 'operational', defaultVisible: true, defaultEditable: false },
      { key: 'type', label: 'Type', module: 'operational', defaultVisible: true, defaultEditable: false },
      { key: 'pfCode', label: 'PF Code', module: 'operational', defaultVisible: true, defaultEditable: false },
      { key: 'vendor', label: 'Vendor', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'orderType', label: 'Order Type', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'poSignStatus', label: 'PO Sign Status', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'pfSignStatus', label: 'PF Sign Status', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'status', label: 'Status', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'std', label: 'STD', module: 'operational', defaultVisible: true, defaultEditable: false },
      { key: 'etd', label: 'ETD', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'rtd', label: 'RTD', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'rtr', label: 'RTR', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'rdy', label: 'RDY', module: 'operational', defaultVisible: true, defaultEditable: false },
      { key: 'ftd', label: 'FTD', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'snd', label: 'SND', module: 'operational', defaultVisible: true, defaultEditable: false },
      { key: 'pfUsd', label: 'PF / USD', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'pfTl', label: 'PF / TL', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'invoice', label: 'Invoice / USD', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'invoiceTl', label: 'Invoice / TL', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'expensesUsd', label: 'Expenses / USD', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'expensesTl', label: 'Expenses / TL', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'paymentRule', label: 'Payment Rule', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'containerNo', label: 'Container No', module: 'operational', defaultVisible: true, defaultEditable: true },
      { key: 'containerDate', label: 'Container Date', module: 'operational', defaultVisible: true, defaultEditable: true },
    ];

    setColumns(staticColumns);
  };

  const loadTableRegistry = async () => {
    // ✅ FIX: Load supplier registry from backend (new endpoint)
    try {
      setTableRegistryLoading(true);
      setTableRegistryError('');
      
      const response = await apiFetch('/api/admin/permissions/registry/suppliers');
      
      if (!response.ok) {
        throw new Error(`Failed to load supplier registry: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform to tableRegistry format for compatibility
      const registry: Record<string, { columns: Array<{key: string; label: string}>; actions: string[] }> = {};
      
      if (data.tables) {
        data.tables.forEach((table: any) => {
          registry[table.key] = {
            columns: table.columns,
            actions: table.actions
          };
        });
      }
      
      setTableRegistry(registry);
      
    } catch (error) {
      console.error('❌ Failed to load supplier registry:', error);
      setTableRegistryError(error instanceof Error ? error.message : 'Unknown error');
      
      // Fallback: Use static registry
      const fallbackRegistry: Record<string, { columns: Array<{key: string; label: string}>; actions: string[] }> = {};
      
      // Build fallback for all 12 supplier tables
      const sheets = ['P', 'ME', 'DO'];
      const tableNames = ['projects', 'accounting', 'payments', 'invoice'];
      
      sheets.forEach(sheet => {
        tableNames.forEach(tableName => {
          const tableKey = `supplier:${sheet}:${tableName}`;
          const cols = getTableColumns(sheet, tableName) || [];
          fallbackRegistry[tableKey] = {
            columns: cols.map(c => ({ key: c.key, label: c.label })),
            actions: ['view', 'edit', 'export']
          };
        });
      });
      
      setTableRegistry(fallbackRegistry);
    } finally {
      setTableRegistryLoading(false);
    }
  };

  // Helper to normalize column keys to camelCase (canonical format)
  const normalizeToCamelCase = (keys: string[]): string[] => {
    const keyMap: Record<string, string> = {
      'projectno': 'projectNo',
      'pfcode': 'pfCode',
      'ordertype': 'orderType',
      'posignstatus': 'poSignStatus',
      'pfsignstatus': 'pfSignStatus',
      'containerno': 'containerNo',
      'pfusd': 'pfUsd',
      'pftl': 'pfTl'
    };

    return keys.map(key => keyMap[key.toLowerCase()] || key);
  };

  const loadRoleColumnPolicy = async (roleId: string) => {
    try {
      const response = await apiFetch(`/api/admin/roles/${roleId}/policy`);
      const data = await response.json();

      if (response.ok) {
        // Normalize all keys to camelCase to ensure consistency
        const normalizedHidden = normalizeToCamelCase(data.columnsHidden || []);
        const normalizedReadOnly = normalizeToCamelCase(data.columnsReadOnly || []);


        setRoleColumnPolicy(prev => ({
          ...prev,
          [roleId]: {
            columnsHidden: normalizedHidden,
            columnsReadOnly: normalizedReadOnly
          }
        }));
      } else {
        console.error('Failed to load role column policy:', data.message);
        // Initialize with empty policy if not found
        setRoleColumnPolicy(prev => ({
          ...prev,
          [roleId]: {
            columnsHidden: [],
            columnsReadOnly: []
          }
        }));
      }
    } catch (error) {
      console.error('Failed to load role column policy:', error);
      // Initialize with empty policy on error
      setRoleColumnPolicy(prev => ({
        ...prev,
        [roleId]: {
          columnsHidden: [],
          columnsReadOnly: []
        }
      }));
    }
  };

  // Debounced save function
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (roleId: string, policy: { columnsHidden: string[]; columnsReadOnly: string[] }) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          try {
            setSavingPolicy(roleId);
            setSaveStatus('saving');

            const response = await apiFetch(`/api/admin/roles/${roleId}/policy`, {
              method: 'PATCH',
              body: JSON.stringify(policy),
            });

            const data = await response.json();

            if (response.ok) {
              setSaveStatus('saved');
              setTimeout(() => setSaveStatus(''), 2000); // Clear "saved" after 2s
            } else {
              console.error('❌ Save failed:', data);
              setSaveStatus('error');
              setError(data.message || `Failed to save: ${response.status} ${response.statusText}`);
              setTimeout(() => setSaveStatus(''), 3000); // Clear error after 3s
            }
          } catch (error) {
            console.error('Failed to save role column policy:', error);
            setSaveStatus('error');
            setError('Failed to save column permissions');
            setTimeout(() => setSaveStatus(''), 3000);
          } finally {
            setSavingPolicy(null);
          }
        }, 500); // 500ms debounce
      };
    })(),
    []
  );

  const handleUpdateUser = async (userId: string, updates: { roleId?: string; isActive?: boolean }) => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('User updated successfully');
        await loadUsers();
      } else {
        setError(data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      setError('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('User deleted successfully');
        await loadUsers();
        setShowDeleteModal(null);
      } else {
        setError(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      setError('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvite = async (userId: string) => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/admin/users/${userId}/resend-invite`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Invitation resent successfully');
      } else {
        setError(data.message || 'Failed to resend invite');
      }
    } catch (error) {
      console.error('Failed to resend invite:', error);
      setError('Failed to resend invite');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await apiFetch('/api/admin/users/invite', {
        method: 'POST',
        body: JSON.stringify(inviteForm),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Invitation sent to ${inviteForm.email}`);
        setShowInviteModal(false);
        setInviteForm({
          email: '',
          roleId: '',
          columnsHidden: [],
          columnsReadOnly: [],
          rowScopes: {}
        });
        await loadUsers();
      } else {
        setError(data.message || 'Failed to send invite');
      }
    } catch (error) {
      console.error('Failed to invite user:', error);
      setError('Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await apiFetch('/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify({ name: newRoleName }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Role "${newRoleName}" created successfully`);
        setShowCreateRoleModal(false);
        setNewRoleName('');
        await loadRoles();
      } else {
        setError(data.message || 'Failed to create role');
      }
    } catch (error) {
      console.error('Failed to create role:', error);
      setError('Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (roleId: string, updates: { name?: string; isActive?: boolean }) => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/admin/roles/${roleId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Role updated successfully');
        await loadRoles();
      } else {
        setError(data.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Failed to update role:', error);
      setError('Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Role deleted successfully');
        await loadRoles();
        setShowDeleteModal(null);
      } else {
        setError(data.message || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Failed to delete role:', error);
      setError('Failed to delete role');
    } finally {
      setLoading(false);
    }
  };


  // Get column permission for selected role
  const getRoleColumnPermission = (columnKey: string): ColumnPermission => {
    if (!selectedRole || !roleColumnPolicy[selectedRole.id]) return 'editable';

    const policy = roleColumnPolicy[selectedRole.id];
    if (policy.columnsHidden.includes(columnKey)) return 'hidden';
    if (policy.columnsReadOnly.includes(columnKey)) return 'readonly';
    return 'editable';
  };

  // Set column permission for selected role with auto-save
  const setRoleColumnPermission = (columnKey: string, permission: ColumnPermission) => {
    if (!selectedRole) return;

    const currentPolicy = roleColumnPolicy[selectedRole.id] || { columnsHidden: [], columnsReadOnly: [] };
    const newHidden = currentPolicy.columnsHidden.filter(key => key !== columnKey);
    const newReadOnly = currentPolicy.columnsReadOnly.filter(key => key !== columnKey);

    if (permission === 'hidden') {
      newHidden.push(columnKey);
    } else if (permission === 'readonly') {
      newReadOnly.push(columnKey);
    }

    const newPolicy = {
      columnsHidden: newHidden,
      columnsReadOnly: newReadOnly
    };

    // Update local state immediately
    setRoleColumnPolicy(prev => ({
      ...prev,
      [selectedRole.id]: newPolicy
    }));

    // Auto-save to backend with debouncing
    debouncedSave(selectedRole.id, newPolicy);
  };


  // Bulk permissions for role
  const setBulkRolePermission = (permission: ColumnPermission) => {
    if (!selectedRole) return;

    let newPolicy;
    if (permission === 'hidden') {
      newPolicy = {
        columnsHidden: columns.map(col => col.key),
        columnsReadOnly: []
      };
    } else if (permission === 'readonly') {
      newPolicy = {
        columnsHidden: [],
        columnsReadOnly: columns.map(col => col.key)
      };
    } else {
      newPolicy = {
        columnsHidden: [],
        columnsReadOnly: []
      };
    }

    // Update local state immediately
    setRoleColumnPolicy(prev => ({
      ...prev,
      [selectedRole.id]: newPolicy
    }));

    // Auto-save to backend with debouncing
    debouncedSave(selectedRole.id, newPolicy);
  };

  // ================== SUPPLIER PERMISSIONS FUNCTIONS ==================

  // Load supplier column policy when selected role or table changes
  useEffect(() => {
    if (selectedRole && selectedSupplierMainTab && selectedSupplierTable) {
      const fullTableKey = getSupplierTableKey(selectedSupplierMainTab, selectedSupplierTable);
      loadSupplierColumnPolicy(selectedRole.id, fullTableKey);
    }
  }, [selectedRole, selectedSupplierMainTab, selectedSupplierTable]);

  const loadSupplierColumnPolicy = async (roleId: string, fullTableKey: string) => {
    try {

      const response = await apiFetch(`/api/admin/permissions/suppliers/roles/${roleId}`);
      const data = await response.json();

      if (response.ok) {
        // API'den gelen supplier permissions'ı parse et
        const supplierPermissions = data.supplierPermissions || {};
        const tablePolicy = supplierPermissions[fullTableKey] || {
          columnsHidden: [],
          columnsReadOnly: []
        };


        setSupplierTablePolicy(prev => ({
          ...prev,
          [roleId]: {
            ...prev[roleId],
            [fullTableKey]: tablePolicy
          }
        }));
      } else {
        console.error('Failed to load supplier column policy:', data.message);
        // Initialize with empty policy if API fails
        const defaultPolicy = {
          columnsHidden: [],
          columnsReadOnly: []
        };

        setSupplierTablePolicy(prev => ({
          ...prev,
          [roleId]: {
            ...prev[roleId],
            [fullTableKey]: defaultPolicy
          }
        }));
      }

    } catch (error) {
      console.error('Failed to load supplier column policy:', error);
      // Initialize with empty policy on error
      const fullTableKey = getSupplierTableKey(selectedSupplierMainTab, selectedSupplierTable);
      setSupplierTablePolicy(prev => ({
        ...prev,
        [roleId]: {
          ...prev[roleId],
          [fullTableKey]: {
            columnsHidden: [],
            columnsReadOnly: []
          }
        }
      }));
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getUserStatus = (user: User) => {
    if (!user.isActive) return 'Pending';
    return 'Active';
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="admin-roles">
      <div className="admin-header">
        <h1 className="admin-title">System Administration</h1>
        <p className="admin-subtitle">Manage users, roles, and permissions</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Users
        </button>
        <button
          className={`tab-button ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Roles & Column Permissions
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'users' && (
          <div className="users-tab">
            <div className="users-header">
              <h2 className="section-title">User Management</h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowInviteModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Invite User
              </button>
            </div>

            {usersLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading users...</p>
              </div>
            ) : (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Invited</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-name">{user.name}</div>
                            <div className="user-email">{user.email}</div>
                          </div>
                        </td>
                        <td>
                          <select
                            value={user.role.id}
                            onChange={(e) => handleUpdateUser(user.id, { roleId: e.target.value })}
                            className="role-select"
                            disabled={loading || user.id === currentUser?.id}
                          >
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <span className={`status-badge ${getUserStatus(user).toLowerCase()}`}>
                            {getUserStatus(user)}
                          </span>
                        </td>
                        <td>{formatDate(user.invitedAt)}</td>
                        <td>{formatDate(user.lastLoginAt)}</td>
                        <td>
                          <div className="actions">
                            <button
                              className={`btn-icon ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                              onClick={() => handleUpdateUser(user.id, { isActive: !user.isActive })}
                              disabled={loading || user.id === currentUser?.id}
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {user.isActive ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                            {!user.isActive && (
                              <button
                                className="btn-icon btn-info"
                                onClick={() => handleResendInvite(user.id)}
                                disabled={loading}
                                title="Resend Invite"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                  <path d="M3 8l4-4m0 0l4 4m-4-4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            )}
                            <button
                              className="btn-icon btn-danger"
                              onClick={() => setShowDeleteModal({ type: 'user', item: user })}
                              disabled={loading || user.id === currentUser?.id}
                              title="Delete User"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="roles-tab">
            <div className="roles-layout">
              <div className="roles-sidebar">
                <div className="roles-sidebar-header">
                  <h3>Roles</h3>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowCreateRoleModal(true)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Add Role
                  </button>
                </div>

                {rolesLoading ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <div className="roles-list">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className={`role-item ${selectedRole?.id === role.id ? 'active' : ''}`}
                        onClick={() => setSelectedRole(role)}
                      >
                        <div className="role-info">
                          <div className="role-name">
                            {role.isSystem && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="system-icon">
                                <path d="M12 1v6l4-4-4-4zM21 8l-6 0 4-4 4 4zM23 12v6l-4-4 4-4zM14 21l0-6 4 4-4 4zM7 23h-6l4-4 4 4zM1 14l6 0-4 4-4-4zM3 7v-6l4 4-4 4zM10 1l0 6-4-4 4-4z" fill="currentColor"/>
                              </svg>
                            )}
                            {role.name}
                          </div>
                          <div className="role-count">{role._count?.users || 0} users</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="roles-content">
                {selectedRole ? (
                  <div className="role-details">
                    <div className="role-details-header">
                      <div className="role-details-info">
                        <h3>{selectedRole.name}</h3>
                        {selectedRole.isSystem && (
                          <span className="system-badge">System Role</span>
                        )}
                      </div>
                      {!selectedRole.isSystem && (
                        <div className="role-actions">
                          <button
                            className="btn btn-danger"
                            onClick={() => setShowDeleteModal({ type: 'role', item: selectedRole })}
                            disabled={loading}
                          >
                            Delete Role
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Permission Subtabs */}
                    <div className="permission-subtabs">
                      <button
                        className={`subtab-button ${roleSubTab === 'pages' ? 'active' : ''}`}
                        onClick={() => setRoleSubTab('pages')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Pages
                      </button>
                      <button
                        className={`subtab-button ${roleSubTab === 'columns' ? 'active' : ''}`}
                        onClick={() => setRoleSubTab('columns')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Projects Columns
                      </button>
                      <button
                        className={`subtab-button ${roleSubTab === 'suppliers' ? 'active' : ''}`}
                        onClick={() => setRoleSubTab('suppliers')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 1v6m6-6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Supplier Tracking
                      </button>
                      <button
                        className={`subtab-button ${roleSubTab === 'types' ? 'active' : ''}`}
                        onClick={() => setRoleSubTab('types')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Types
                      </button>
                      <button
                        className={`subtab-button ${roleSubTab === 'projects' ? 'active' : ''}`}
                        onClick={() => setRoleSubTab('projects')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Projects
                      </button>
                    </div>

                    <div className="role-form">
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', color: '#6b7280' }}>Role Name</label>
                        <input
                          type="text"
                          value={selectedRole.name}
                          onChange={(e) => {
                            setSelectedRole({ ...selectedRole, name: e.target.value });
                          }}
                          onBlur={() => {
                            if (selectedRole.name !== roles.find(r => r.id === selectedRole.id)?.name) {
                              handleUpdateRole(selectedRole.id, { name: selectedRole.name });
                            }
                          }}
                          className="form-input"
                          disabled={selectedRole.isSystem || loading}
                          placeholder="Enter role name"
                        />
                      </div>

                      {/* Subtab Content */}
                      {roleSubTab === 'pages' && (
                        <div className="pages-permissions">
                          <h4>Page Access Control</h4>
                          <p className="permissions-description">
                            Configure which pages this role can access in the system.
                          </p>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => {
                                const uniqueKeys = [...new Set(NAV_PAGES.map(p => p.key))];
                                uniqueKeys.forEach(key => {
                                  if (!pagePermissions[key]) {
                                    handlePageAccessToggle(key, true);
                                  }
                                });
                              }}
                              disabled={selectedRole.isSystem || pagePermissionsLoading}
                              style={{ padding: '4px 12px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', background: '#fff' }}
                            >
                              Select All
                            </button>
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => {
                                const uniqueKeys = [...new Set(NAV_PAGES.map(p => p.key))];
                                uniqueKeys.forEach(key => {
                                  if (pagePermissions[key]) {
                                    handlePageAccessToggle(key, false);
                                  }
                                });
                              }}
                              disabled={selectedRole.isSystem || pagePermissionsLoading}
                              style={{ padding: '4px 12px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', background: '#fff' }}
                            >
                              Deselect All
                            </button>
                          </div>
                          <div className="pages-grid">
                            {(() => {
                              // Deduplicate NAV_PAGES by key — group labels for pages sharing the same permission key
                              const seen = new Map<string, string>();
                              NAV_PAGES.forEach(page => {
                                if (!seen.has(page.key)) {
                                  seen.set(page.key, page.label);
                                } else {
                                  seen.set(page.key, seen.get(page.key) + ', ' + page.label);
                                }
                              });
                              return Array.from(seen.entries()).map(([key, label]) => (
                                <div className="permission-row" key={key}>
                                  <div className="column-name">{label}</div>
                                  <div className="permission-controls">
                                    <label className="permission-option">
                                      <input
                                        type="checkbox"
                                        checked={pagePermissions[key] || false}
                                        onChange={(e) => handlePageAccessToggle(key, e.target.checked)}
                                        disabled={selectedRole.isSystem || pagePermissionsLoading}
                                      />
                                      <span>Can Access</span>
                                      {pagePermissionsLoading && (
                                        <div className="spinner small inline"></div>
                                      )}
                                    </label>
                                  </div>
                                </div>
                              ));
                            })()}
                            {/* Not a NAV_PAGES entry — a capability toggle, not a real navigable page.
                                Controls who can flag projects in "Today's PFs" and receives the
                                completion email, reusing the same page-access mechanism. */}
                            <div className="permission-row" key="todays_pf_manage">
                              <div className="column-name">Today's PFs — Select &amp; Manage</div>
                              <div className="permission-controls">
                                <label className="permission-option">
                                  <input
                                    type="checkbox"
                                    checked={pagePermissions['todays_pf_manage'] || false}
                                    onChange={(e) => handlePageAccessToggle('todays_pf_manage', e.target.checked)}
                                    disabled={selectedRole.isSystem || pagePermissionsLoading}
                                  />
                                  <span>Can Access</span>
                                  {pagePermissionsLoading && (
                                    <div className="spinner small inline"></div>
                                  )}
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {roleSubTab === 'columns' && (
                        <div className="column-permissions">
                        <h4 style={{ margin: '0 0 4px 0' }}>Projects Column Permissions</h4>
                        <p className="permissions-description">
                          Configure which columns this role can see/edit and whether they can export data from Projects.
                        </p>

                        {/* Export permission */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '14px 18px', marginBottom: '16px',
                          background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px'
                        }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                            <input
                              type="checkbox"
                              checked={projectsCanExport}
                              onChange={(e) => handleProjectsExportToggle(e.target.checked)}
                              disabled={selectedRole.isSystem}
                              style={{ width: '18px', height: '18px', accentColor: '#B03A2E' }}
                            />
                            <span>Can Export (Excel/CSV)</span>
                          </label>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            Allow this role to export Projects data
                          </span>
                        </div>

                        {/* Save status indicator */}
                        {selectedRole && savingPolicy === selectedRole.id && (
                          <div className="save-status saving">
                            <div className="spinner small"></div>
                            <span>Saving...</span>
                          </div>
                        )}
                        {selectedRole && saveStatus === 'saved' && (
                          <div className="save-status saved">
                            <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Saved</span>
                          </div>
                        )}
                        {selectedRole && saveStatus === 'error' && (
                          <div className="save-status error">
                            <svg className="error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Save failed</span>
                          </div>
                        )}

                        <div className="permissions-bulk-actions">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setBulkRolePermission('editable')}
                            disabled={!selectedRole || selectedRole.isSystem || savingPolicy === selectedRole.id}
                          >
                            All Editable
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setBulkRolePermission('readonly')}
                            disabled={!selectedRole || selectedRole.isSystem || savingPolicy === selectedRole.id}
                          >
                            All Read-only
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setBulkRolePermission('hidden')}
                            disabled={!selectedRole || selectedRole.isSystem || savingPolicy === selectedRole.id}
                          >
                            All Hidden
                          </button>
                        </div>

                        <div className="permissions-grid">
                          {columns.map((column) => (
                            <div key={column.key} className="permission-row">
                              <div className="column-name">{column.label}</div>
                              <div className="permission-controls">
                                <label className="permission-option">
                                  <input
                                    type="radio"
                                    name={`${selectedRole.id}-${column.key}`}
                                    value="hidden"
                                    checked={getRoleColumnPermission(column.key) === 'hidden'}
                                    onChange={() => setRoleColumnPermission(column.key, 'hidden')}
                                    disabled={selectedRole.isSystem || savingPolicy === selectedRole.id}
                                  />
                                  <span>Hidden</span>
                                </label>
                                <label className="permission-option">
                                  <input
                                    type="radio"
                                    name={`${selectedRole.id}-${column.key}`}
                                    value="readonly"
                                    checked={getRoleColumnPermission(column.key) === 'readonly'}
                                    onChange={() => setRoleColumnPermission(column.key, 'readonly')}
                                    disabled={selectedRole.isSystem || savingPolicy === selectedRole.id}
                                  />
                                  <span>Read-only</span>
                                </label>
                                <label className="permission-option">
                                  <input
                                    type="radio"
                                    name={`${selectedRole.id}-${column.key}`}
                                    value="editable"
                                    checked={getRoleColumnPermission(column.key) === 'editable'}
                                    onChange={() => setRoleColumnPermission(column.key, 'editable')}
                                    disabled={selectedRole.isSystem || savingPolicy === selectedRole.id}
                                  />
                                  <span>Editable</span>
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                        </div>
                      )}

                      {roleSubTab === 'types' && (
                        <div className="types-permissions">
                          <h4>Type Visibility</h4>
                          <p className="permissions-description">
                            Configure which item types this role can see across all pages. No restrictions configured means all types are visible.
                          </p>

                          {typeVisibilityLoading ? (
                            <div style={{ padding: '20px', textAlign: 'center' }}>
                              <div className="spinner small" style={{ margin: '0 auto' }}></div>
                              <span style={{ marginTop: '8px', display: 'block', color: '#6b7280' }}>Loading types...</span>
                            </div>
                          ) : (
                            <>
                              {!typeVisibilityHasConfig && (
                                <div style={{ padding: '12px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#1e40af' }}>
                                  No type restrictions configured. All types are visible for this role. Toggle types below to restrict visibility.
                                </div>
                              )}

                              {/* Base Types */}
                              <div style={{ marginBottom: '16px' }}>
                                <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Base Types</h5>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                  {typeVisibility.filter(t => t.isEnum).map(t => (
                                    <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '13px', backgroundColor: t.isAllowed ? '#f0fdf4' : '#fef2f2' }}>
                                      <input
                                        type="checkbox"
                                        checked={t.isAllowed}
                                        onChange={(e) => handleTypeToggle(t.key, e.target.checked)}
                                        disabled={selectedRole?.isSystem}
                                      />
                                      <span>{t.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* Custom Types */}
                              {typeVisibility.filter(t => !t.isEnum).length > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                  <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Custom Types</h5>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                    {typeVisibility.filter(t => !t.isEnum).map(t => (
                                      <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '13px', backgroundColor: t.isAllowed ? '#f0fdf4' : '#fef2f2' }}>
                                        <input
                                          type="checkbox"
                                          checked={t.isAllowed}
                                          onChange={(e) => handleTypeToggle(t.key, e.target.checked)}
                                          disabled={selectedRole?.isSystem}
                                        />
                                        <span>{t.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Bulk actions */}
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => {
                                    const updated = typeVisibility.map(t => ({ ...t, isAllowed: true }));
                                    setTypeVisibility(updated);
                                    saveTypeVisibility(updated);
                                  }}
                                  disabled={selectedRole?.isSystem}
                                  style={{ padding: '4px 12px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', background: '#fff' }}
                                >
                                  Select All
                                </button>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => {
                                    const updated = typeVisibility.map(t => ({ ...t, isAllowed: false }));
                                    setTypeVisibility(updated);
                                    saveTypeVisibility(updated);
                                  }}
                                  disabled={selectedRole?.isSystem}
                                  style={{ padding: '4px 12px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', background: '#fff' }}
                                >
                                  Deselect All
                                </button>
                              </div>

                              {/* Warning when no types selected */}
                              {typeVisibilityHasConfig && typeVisibility.every(t => !t.isAllowed) && (
                                <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', color: '#991b1b' }}>
                                  Warning: No types are allowed. Users with this role will not see any items.
                                </div>
                              )}

                              {/* Save status */}
                              {typeVisibilitySaveStatus === 'saving' && (
                                <div className="save-status saving">
                                  <div className="spinner small"></div>
                                  <span>Saving...</span>
                                </div>
                              )}
                              {typeVisibilitySaveStatus === 'saved' && (
                                <div className="save-status saved">
                                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  <span>Saved</span>
                                </div>
                              )}
                              {typeVisibilitySaveStatus === 'error' && (
                                <div className="save-status error">
                                  <svg className="error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  <span>Save failed</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {roleSubTab === 'projects' && (() => {
                        // key = frontend display key, sourceType = DB storage key
                        const SOURCE_TABS: { key: string; sourceType: string; label: string }[] = [
                          { key: 'projects', sourceType: 'project', label: 'Projects' },
                          { key: 'missingExtra', sourceType: 'missingExtra', label: 'Missing & Extra' },
                          { key: 'directOrders', sourceType: 'directOrder', label: 'Direct Orders' },
                          { key: 'expensesP', sourceType: 'expensesP', label: 'Expenses P' },
                          { key: 'expensesMissingExtra', sourceType: 'expensesMissingExtra', label: 'Expenses M&E' },
                          { key: 'expensesDirectOrder', sourceType: 'expensesDirectOrder', label: 'Expenses DO' },
                        ];
                        const currentSourceTab = SOURCE_TABS.find(t => t.key === projectScopeSourceTab) || SOURCE_TABS[0];
                        const currentProjects = projectScopeBySource[currentSourceTab.key] || [];
                        const filteredProjects = currentProjects.filter(p => {
                          if (!projectScopeSearch) return true;
                          const q = projectScopeSearch.toLowerCase();
                          return p.projectNo?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q) || p.bucket?.toLowerCase().includes(q);
                        });
                        const currentAssigned = projectScopeAssignedBySource[currentSourceTab.sourceType] || new Set<string>();
                        // Total assigned count across all sources
                        const totalAssigned = Object.values(projectScopeAssignedBySource).reduce((sum, s) => sum + s.size, 0);

                        return (
                        <div className="types-permissions">
                          <h4>Project Assignment</h4>
                          <p className="permissions-description">
                            Restrict this role to only see specific projects. Assign from the "Projects" tab — other pages are filtered automatically by project number.
                          </p>

                          {projectScopeLoading ? (
                            <div style={{ padding: '20px', textAlign: 'center' }}>
                              <div className="spinner small" style={{ margin: '0 auto' }}></div>
                              <span style={{ marginTop: '8px', display: 'block', color: '#6b7280' }}>Loading projects...</span>
                            </div>
                          ) : (
                            <>
                              {/* Enable/Disable toggle */}
                              <div style={{ padding: '12px 16px', backgroundColor: projectScopeEnabled ? '#fef3c7' : '#eff6ff', border: `1px solid ${projectScopeEnabled ? '#fcd34d' : '#bfdbfe'}`, borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: 600, color: projectScopeEnabled ? '#92400e' : '#1e40af' }}>
                                    {projectScopeEnabled ? 'Project restriction is ACTIVE' : 'No project restrictions'}
                                  </div>
                                  <div style={{ fontSize: '12px', color: projectScopeEnabled ? '#a16207' : '#3b82f6', marginTop: '2px' }}>
                                    {projectScopeEnabled
                                      ? `${totalAssigned} project(s) assigned. Only these are visible.`
                                      : 'This role can see all projects. Enable to restrict.'}
                                  </div>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 500 }}>{projectScopeEnabled ? 'Enabled' : 'Disabled'}</span>
                                  <div
                                    onClick={() => !selectedRole?.isSystem && handleProjectScopeToggle(!projectScopeEnabled)}
                                    style={{
                                      width: '44px', height: '24px', borderRadius: '12px',
                                      backgroundColor: projectScopeEnabled ? '#059669' : '#d1d5db',
                                      position: 'relative', cursor: selectedRole?.isSystem ? 'not-allowed' : 'pointer',
                                      transition: 'background-color 0.2s',
                                    }}
                                  >
                                    <div style={{
                                      width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff',
                                      position: 'absolute', top: '2px',
                                      left: projectScopeEnabled ? '22px' : '2px',
                                      transition: 'left 0.2s',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    }} />
                                  </div>
                                </label>
                              </div>

                              {projectScopeEnabled && (
                                <>
                                  {/* Source tabs */}
                                  <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                    {SOURCE_TABS.map(tab => (
                                      <button
                                        key={tab.key}
                                        onClick={() => { setProjectScopeSourceTab(tab.key); setProjectScopeSearch(''); }}
                                        style={{
                                          padding: '6px 12px', fontSize: '12px', fontWeight: 500,
                                          borderRadius: '6px', cursor: 'pointer',
                                          border: projectScopeSourceTab === tab.key ? '1px solid #3b82f6' : '1px solid #d1d5db',
                                          backgroundColor: projectScopeSourceTab === tab.key ? '#eff6ff' : '#fff',
                                          color: projectScopeSourceTab === tab.key ? '#1d4ed8' : '#4b5563',
                                        }}
                                      >
                                        {tab.label}
                                        <span style={{ marginLeft: '4px', fontSize: '11px', color: '#9ca3af' }}>
                                          ({(projectScopeBySource[tab.key] || []).length})
                                        </span>
                                      </button>
                                    ))}
                                  </div>

                                  {/* Info banner for non-main sources */}
                                  {currentSourceTab.key !== 'projects' && (
                                    <div style={{ padding: '8px 12px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '12px', fontSize: '12px', color: '#6b7280' }}>
                                      Select projects from this tab independently. Each tab has its own assignment list.
                                    </div>
                                  )}

                                  {/* Search */}
                                  <div style={{ marginBottom: '12px' }}>
                                    <input
                                      type="text"
                                      placeholder="Search projects by name or number..."
                                      value={projectScopeSearch}
                                      onChange={(e) => setProjectScopeSearch(e.target.value)}
                                      className="form-input"
                                      style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                                    />
                                  </div>

                                  {/* Bulk actions */}
                                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                                    <button
                                      className="btn btn-sm btn-outline"
                                      onClick={() => {
                                        const allIds = currentProjects.map(p => p.id);
                                        setProjectScopeAssignedBySource(prev => {
                                          const updated = { ...prev, [currentSourceTab.sourceType]: new Set(allIds) };
                                          setTimeout(() => saveProjectScope(true, updated), 0);
                                          return updated;
                                        });
                                      }}
                                      disabled={selectedRole?.isSystem}
                                      style={{ padding: '4px 12px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', background: '#fff' }}
                                    >
                                      Select All
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline"
                                      onClick={() => {
                                        setProjectScopeAssignedBySource(prev => {
                                          const updated = { ...prev, [currentSourceTab.sourceType]: new Set<string>() };
                                          setTimeout(() => saveProjectScope(true, updated), 0);
                                          return updated;
                                        });
                                      }}
                                      disabled={selectedRole?.isSystem}
                                      style={{ padding: '4px 12px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', background: '#fff' }}
                                    >
                                      Deselect All
                                    </button>
                                    <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                                      {currentAssigned.size} / {currentProjects.length} assigned
                                    </span>
                                  </div>

                                  {/* Project list */}
                                  <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                                    {filteredProjects.map((p, idx) => {
                                      const isAssigned = currentAssigned.has(p.id);

                                      return (
                                        <label
                                          key={p.id}
                                          style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '10px 14px',
                                            borderBottom: idx < filteredProjects.length - 1 ? '1px solid #f3f4f6' : 'none',
                                            cursor: 'pointer',
                                            backgroundColor: isAssigned ? '#f0fdf4' : '#fff',
                                            fontSize: '13px',
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isAssigned}
                                            onChange={(e) => handleProjectToggle(p.id, currentSourceTab.sourceType, e.target.checked)}
                                            disabled={selectedRole?.isSystem}
                                          />
                                          <span style={{ fontWeight: 600, minWidth: '80px', color: '#1f2937' }}>{p.projectNo}</span>
                                          <span style={{ color: '#4b5563', flex: 1 }}>{p.name}</span>
                                          <span style={{ fontSize: '11px', color: '#9ca3af', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>{p.bucket}</span>
                                        </label>
                                      );
                                    })}
                                    {filteredProjects.length === 0 && (
                                      <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                                        No projects found.
                                      </div>
                                    )}
                                  </div>

                                  {/* Warning when enabled but none assigned */}
                                  {totalAssigned === 0 && (
                                    <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginTop: '12px', fontSize: '13px', color: '#991b1b' }}>
                                      Warning: No projects are assigned. Users with this role will not see any projects.
                                    </div>
                                  )}
                                </>
                              )}

                              {/* Save status */}
                              {projectScopeSaveStatus === 'saving' && (
                                <div className="save-status saving" style={{ marginTop: '12px' }}>
                                  <div className="spinner small"></div>
                                  <span>Saving...</span>
                                </div>
                              )}
                              {projectScopeSaveStatus === 'saved' && (
                                <div className="save-status saved" style={{ marginTop: '12px' }}>
                                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  <span>Saved</span>
                                </div>
                              )}
                              {projectScopeSaveStatus === 'error' && (
                                <div className="save-status error" style={{ marginTop: '12px' }}>
                                  <svg className="error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  <span>Save failed</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        );
                      })()}

                      {roleSubTab === 'suppliers' && (
                        <div className="suppliers-permissions">
                          <h4>Supplier Permissions</h4>
                          <p className="permissions-description">
                            Configure permissions for Supplier page with 3-level structure: Main Tab → Table → Columns
                          </p>

                          {/* LEVEL 1: Main Tab Selector (P / ME / DO) */}
                          <div className="supplier-main-tabs">
                            <h5>1. Select Main Tab:</h5>
                            <div className="supplier-main-tab-buttons">
                              <button
                                className={`main-tab-btn ${selectedSupplierMainTab === 'P' ? 'active' : ''}`}
                                onClick={() => setSelectedSupplierMainTab('P')}
                                disabled={selectedRole?.isSystem}
                              >
                                📋 P (Projects)
                              </button>
                              <button
                                className={`main-tab-btn ${selectedSupplierMainTab === 'ME' ? 'active' : ''}`}
                                onClick={() => setSelectedSupplierMainTab('ME')}
                                disabled={selectedRole?.isSystem}
                              >
                                📦 ME (Missing/Extra)
                              </button>
                              <button
                                className={`main-tab-btn ${selectedSupplierMainTab === 'DO' ? 'active' : ''}`}
                                onClick={() => setSelectedSupplierMainTab('DO')}
                                disabled={selectedRole?.isSystem}
                              >
                                🟨 DO (Direct Orders)
                              </button>
                            </div>
                            <p className="tab-description">
                              {supplierRegistry[selectedSupplierMainTab]?.description}
                            </p>
                          </div>

                          {/* LEVEL 2: Table Selector within Main Tab */}
                          <div className="supplier-table-selector">
                            <h5>2. Select Table within {supplierRegistry[selectedSupplierMainTab]?.label}:</h5>
                            <div className="supplier-table-buttons">
                              {getTabTables(selectedSupplierMainTab).map((table) => (
                                <button
                                  key={table.key}
                                  className={`table-btn ${selectedSupplierTable === table.key ? 'active' : ''}`}
                                  onClick={() => setSelectedSupplierTable(table.key)}
                                  disabled={selectedRole?.isSystem}
                                >
                                  {table.label}
                                </button>
                              ))}
                            </div>
                            <p className="table-description">
                              {supplierRegistry[selectedSupplierMainTab]?.tables[selectedSupplierTable]?.description}
                            </p>
                          </div>

                          {/* LEVEL 3: Table Actions */}
                          <div className="supplier-table-actions">
                            <h5>3. Table Actions for {getSupplierTableKey(selectedSupplierMainTab, selectedSupplierTable)}</h5>
                            <div className="table-actions-grid">
                              {['view', 'edit', 'export'].map((action) => (
                                <label key={action} className="action-option">
                                  <input
                                    type="checkbox"
                                    checked={getTableAction(getCurrentTableKey(), action as 'view' | 'edit' | 'export')}
                                    onChange={(e) => handleToggleAction(action as 'view' | 'edit' | 'export', e.target.checked)}
                                    disabled={selectedRole?.isSystem}
                                  />
                                  <span>{action.charAt(0).toUpperCase() + action.slice(1)}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Column Permissions (Alt kısım - Projects pattern'ini AYNEN kopyala) */}
                          <div className="supplier-column-permissions">
                            <h5>Column Permissions for {getTableDisplayName(selectedSupplierTable)}</h5>

                            {/* Save status indicator */}
                            {selectedRole && savingSupplierPolicy && (
                              <div className="save-status saving">
                                <div className="spinner small"></div>
                                <span>Saving...</span>
                              </div>
                            )}
                            {selectedRole && supplierSaveStatus.includes('✅') && (
                              <div className="save-status saved">
                                <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>Saved</span>
                              </div>
                            )}
                            {selectedRole && supplierSaveStatus.includes('❌') && (
                              <div className="save-status error">
                                <svg className="error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>Save failed</span>
                              </div>
                            )}

                            {/* Bulk actions (aynı Projects pattern) */}
                            <div className="permissions-bulk-actions">
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setSupplierBulkColumnPermission('editable')}
                                disabled={!selectedRole || selectedRole.isSystem || savingSupplierPolicy}
                              >
                                All Editable
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setSupplierBulkColumnPermission('readonly')}
                                disabled={!selectedRole || selectedRole.isSystem || savingSupplierPolicy}
                              >
                                All Read-only
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setSupplierBulkColumnPermission('hidden')}
                                disabled={!selectedRole || selectedRole.isSystem || savingSupplierPolicy}
                              >
                                All Hidden
                              </button>
                            </div>

                            {/* 🔥 DYNAMIC Permissions grid (registry'den gelir) */}
                            <div className="permissions-grid">
                              {getTableColumns(selectedSupplierMainTab, selectedSupplierTable).map((column) => (
                                <div key={column.key} className="permission-row">
                                  <div className="column-name">{column.label}</div>
                                  <div className="permission-controls">
                                    <label className="permission-option">
                                      <input
                                        type="radio"
                                        name={`${selectedRole?.id}-${selectedSupplierMainTab}-${selectedSupplierTable}-${column.key}`}
                                        value="hidden"
                                        checked={getColumnRule(getCurrentTableKey(), column.key) === 'hidden'}
                                        onChange={() => handleSetColumnRule(column.key, 'hidden')}
                                        disabled={selectedRole?.isSystem || savingSupplierPolicy}
                                      />
                                      <span>Hidden</span>
                                    </label>
                                    <label className="permission-option">
                                      <input
                                        type="radio"
                                        name={`${selectedRole?.id}-${selectedSupplierMainTab}-${selectedSupplierTable}-${column.key}`}
                                        value="readonly"
                                        checked={getColumnRule(getCurrentTableKey(), column.key) === 'readonly'}
                                        onChange={() => handleSetColumnRule(column.key, 'readonly')}
                                        disabled={selectedRole?.isSystem || savingSupplierPolicy}
                                      />
                                      <span>Read-only</span>
                                    </label>
                                    <label className="permission-option">
                                      <input
                                        type="radio"
                                        name={`${selectedRole?.id}-${selectedSupplierMainTab}-${selectedSupplierTable}-${column.key}`}
                                        value="editable"
                                        checked={getColumnRule(getCurrentTableKey(), column.key) === 'editable'}
                                        onChange={() => handleSetColumnRule(column.key, 'editable')}
                                        disabled={selectedRole?.isSystem || savingSupplierPolicy}
                                      />
                                      <span>Editable</span>
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                ) : (
                  <div className="no-role-selected">
                    <p>Select a role to view and edit permissions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invite New User</h3>
              <button
                className="modal-close"
                onClick={() => setShowInviteModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="modal-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="form-input"
                  required
                  placeholder="user@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  value={inviteForm.roleId}
                  onChange={(e) => setInviteForm({ ...inviteForm, roleId: e.target.value })}
                  className="form-input"
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateRoleModal && (
        <div className="modal-overlay" onClick={() => setShowCreateRoleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Role</h3>
              <button
                className="modal-close"
                onClick={() => setShowCreateRoleModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="modal-form">
              <div className="form-group">
                <label className="form-label">Role Name</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="form-input"
                  required
                  placeholder="Enter role name"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateRoleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
          <div className="modal modal-small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(null)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="modal-content">
              <p>
                Are you sure you want to delete {showDeleteModal.type} "
                {showDeleteModal.type === 'user'
                  ? (showDeleteModal.item as User).email
                  : (showDeleteModal.item as Role).name
                }"? This action cannot be undone.
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (showDeleteModal.type === 'user') {
                    handleDeleteUser((showDeleteModal.item as User).id);
                  } else {
                    handleDeleteRole((showDeleteModal.item as Role).id);
                  }
                }}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoles;