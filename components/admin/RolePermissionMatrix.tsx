import React, { useState, useCallback } from 'react';
import { debounce } from 'lodash';
import {
  NAV_PAGES,
  TABLE_KEYS,
  PROJECTS_COLUMNS,
  EXPENSES_P_COLUMNS,
  EXPENSES_DO_COLUMNS,
  EXPENSES_ME_COLUMNS,
} from '../../lib/permissionKeys';

interface ColumnDefinition {
  key: string;
  label: string;
  group: string;
  width?: string;
  isMoney?: boolean;
  isEditableByDefault?: boolean;
  description?: string;
}

interface RolePolicy {
  columnsHidden: string[];
  columnsReadOnly: string[];
  pageAccess: Record<string, boolean>;
}

interface Role {
  id: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
  policy: RolePolicy;
}

type ColumnMode = 'hidden' | 'readonly' | 'editable';

interface RolePermissionMatrixProps {
  roles: Role[];
  columns?: ColumnDefinition[];
  onUpdateRolePolicy: (roleId: string, policy: Partial<Omit<RolePolicy, 'pageAccess'>>) => Promise<void>;
  onUpdatePageAccess: (roleId: string, pageKey: string, hasAccess: boolean) => Promise<void>;
}

// Unique NAV_PAGES deduplicated by key (keep first occurrence)
const UNIQUE_NAV_PAGES = NAV_PAGES.filter(
  (page, index, arr) => arr.findIndex(p => p.key === page.key) === index
);

// Tables shown in column permissions section
const COLUMN_TABLES = [
  { key: TABLE_KEYS.OPERATIONAL_BOARD_GRID, label: 'Projects Grid', columns: PROJECTS_COLUMNS },
  { key: TABLE_KEYS.EXPENSES_P_SHEET, label: 'Expenses P', columns: EXPENSES_P_COLUMNS },
  { key: TABLE_KEYS.EXPENSES_DO_SHEET, label: 'Expenses Direct Order', columns: EXPENSES_DO_COLUMNS },
  { key: TABLE_KEYS.EXPENSES_ME_SHEET, label: 'Expenses Missing & Extra', columns: EXPENSES_ME_COLUMNS },
];

export const RolePermissionMatrix: React.FC<RolePermissionMatrixProps> = ({
  roles,
  onUpdateRolePolicy,
  onUpdatePageAccess,
}) => {
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});
  const [expandedTables, setExpandedTables] = useState<Record<string, string | null>>({});

  const showSavingState = (roleId: string) => {
    setSavingStates(prev => ({ ...prev, [roleId]: true }));
    setSavedStates(prev => ({ ...prev, [roleId]: false }));
  };

  const showSavedState = (roleId: string) => {
    setSavingStates(prev => ({ ...prev, [roleId]: false }));
    setSavedStates(prev => ({ ...prev, [roleId]: true }));
    setTimeout(() => {
      setSavedStates(prev => ({ ...prev, [roleId]: false }));
    }, 2000);
  };

  const debouncedUpdate = useCallback(
    debounce(async (roleId: string, policy: Partial<Omit<RolePolicy, 'pageAccess'>>) => {
      try {
        await onUpdateRolePolicy(roleId, policy);
        showSavedState(roleId);
      } catch (error) {
        console.error('Failed to update role policy:', error);
        setSavingStates(prev => ({ ...prev, [roleId]: false }));
      }
    }, 1000),
    [onUpdateRolePolicy]
  );

  const getColumnMode = (role: Role, columnKey: string): ColumnMode => {
    if (role.policy.columnsHidden.includes(columnKey)) return 'hidden';
    if (role.policy.columnsReadOnly.includes(columnKey)) return 'readonly';
    return 'editable';
  };

  const updateColumnMode = (role: Role, columnKey: string, mode: ColumnMode) => {
    if (role.isSystem) return;

    showSavingState(role.id);

    const newColumnsHidden = role.policy.columnsHidden.filter(k => k !== columnKey);
    const newColumnsReadOnly = role.policy.columnsReadOnly.filter(k => k !== columnKey);

    if (mode === 'hidden') {
      newColumnsHidden.push(columnKey);
    } else if (mode === 'readonly') {
      newColumnsReadOnly.push(columnKey);
    }

    const updatedPolicy = {
      columnsHidden: newColumnsHidden,
      columnsReadOnly: newColumnsReadOnly,
    };

    role.policy.columnsHidden = newColumnsHidden;
    role.policy.columnsReadOnly = newColumnsReadOnly;

    debouncedUpdate(role.id, updatedPolicy);
  };

  const updatePageAccess = async (role: Role, pageKey: string, hasAccess: boolean) => {
    if (role.isSystem) return;

    showSavingState(role.id);

    role.policy.pageAccess = { ...role.policy.pageAccess, [pageKey]: hasAccess };

    try {
      await onUpdatePageAccess(role.id, pageKey, hasAccess);
      showSavedState(role.id);
    } catch (error) {
      console.error('Failed to update page access:', error);
      setSavingStates(prev => ({ ...prev, [role.id]: false }));
    }
  };

  const getModeButtonClass = (currentMode: ColumnMode, buttonMode: ColumnMode, disabled: boolean): string => {
    const base = 'px-3 py-1 text-xs rounded transition-colors ';
    if (disabled) return base + 'bg-gray-100 text-gray-400 cursor-not-allowed';
    if (currentMode === buttonMode) {
      switch (buttonMode) {
        case 'hidden': return base + 'bg-red-500 text-white';
        case 'readonly': return base + 'bg-yellow-500 text-white';
        case 'editable': return base + 'bg-green-500 text-white';
      }
    }
    return base + 'bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer';
  };

  const toggleTable = (roleId: string, tableKey: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [roleId]: prev[roleId] === tableKey ? null : tableKey,
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Role Permissions</h2>

      {roles.map((role) => {
        const expandedTable = expandedTables[role.id] ?? null;

        return (
          <div key={role.id} className="border rounded-lg p-6 bg-white shadow-sm">
            {/* Role header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                {role.isSystem && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">System Role</span>
                )}
                {!role.isActive && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">Inactive</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {savingStates[role.id] && (
                  <span className="text-sm text-blue-600 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Saving...
                  </span>
                )}
                {savedStates[role.id] && (
                  <span className="text-sm text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Saved
                  </span>
                )}
              </div>
            </div>

            {/* Page Access */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-700 mb-3">Page Access</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
                {UNIQUE_NAV_PAGES.map(page => (
                  <label key={page.key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={role.policy.pageAccess[page.key] ?? false}
                      onChange={(e) => updatePageAccess(role, page.key, e.target.checked)}
                      disabled={role.isSystem}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{page.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Column Permissions — table selector */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Column Permissions</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {COLUMN_TABLES.map(table => (
                  <button
                    key={table.key}
                    onClick={() => toggleTable(role.id, table.key)}
                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      expandedTable === table.key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {table.label}
                  </button>
                ))}
              </div>

              {expandedTable && (() => {
                const tableConfig = COLUMN_TABLES.find(t => t.key === expandedTable);
                if (!tableConfig) return null;

                const groupedColumns = tableConfig.columns.reduce((groups, col) => {
                  if (!groups[col.group]) groups[col.group] = [];
                  groups[col.group].push(col);
                  return groups;
                }, {} as Record<string, typeof tableConfig.columns>);

                return (
                  <div className="space-y-4 border rounded p-4 bg-gray-50">
                    {Object.entries(groupedColumns).map(([group, cols]) => (
                      <div key={group} className="border rounded p-4 bg-white">
                        <h5 className="font-medium text-gray-600 mb-3 capitalize">{group}</h5>
                        <div className="space-y-2">
                          {cols.map((column) => {
                            const currentMode = getColumnMode(role, column.key);
                            const isDisabled = role.isSystem;

                            return (
                              <div key={column.key} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 min-w-[120px]">
                                  {column.label}
                                </span>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => updateColumnMode(role, column.key, 'hidden')}
                                    disabled={isDisabled}
                                    className={getModeButtonClass(currentMode, 'hidden', isDisabled)}
                                    title="Column is completely hidden"
                                  >
                                    Hidden
                                  </button>
                                  <button
                                    onClick={() => updateColumnMode(role, column.key, 'readonly')}
                                    disabled={isDisabled}
                                    className={getModeButtonClass(currentMode, 'readonly', isDisabled)}
                                    title="Column is visible but cannot be edited"
                                  >
                                    Read-only
                                  </button>
                                  <button
                                    onClick={() => updateColumnMode(role, column.key, 'editable')}
                                    disabled={isDisabled}
                                    className={getModeButtonClass(currentMode, 'editable', isDisabled)}
                                    title="Column can be viewed and edited"
                                  >
                                    Editable
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
};
