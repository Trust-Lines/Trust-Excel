import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface ColumnDefinition {
  key: string;
  label: string;
  group: string;
  width: string;
  isMoney: boolean;
  isEditableByDefault: boolean;
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
}

interface RoleWithPolicy extends Role {
  policy: RolePolicy;
}

interface UseAdminRolesReturn {
  roles: RoleWithPolicy[];
  columns: ColumnDefinition[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateRolePolicy: (roleId: string, policy: Partial<Omit<RolePolicy, 'pageAccess'>>) => Promise<void>;
  updatePageAccess: (roleId: string, pageKey: string, hasAccess: boolean) => Promise<void>;
}

export const useAdminRoles = (): UseAdminRolesReturn => {
  const [roles, setRoles] = useState<RoleWithPolicy[]>([]);
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async (): Promise<RoleWithPolicy[]> => {
    const response = await apiClient.get('/api/admin/roles');
    const rolesData = response.data;

    const rolesWithPolicies = await Promise.all(
      rolesData.map(async (role: Role) => {
        const [policyResult, pageAccessResult] = await Promise.allSettled([
          apiClient.get(`/api/admin/roles/${role.id}/policy`),
          apiClient.get(`/api/admin/permissions/${role.id}/pages`),
        ]);

        const columnsHidden: string[] = policyResult.status === 'fulfilled'
          ? (policyResult.value.data.columnsHidden || [])
          : [];
        const columnsReadOnly: string[] = policyResult.status === 'fulfilled'
          ? (policyResult.value.data.columnsReadOnly || [])
          : [];
        const pageAccess: Record<string, boolean> = pageAccessResult.status === 'fulfilled'
          ? (pageAccessResult.value.data.data || {})
          : {};

        return {
          ...role,
          policy: { columnsHidden, columnsReadOnly, pageAccess },
        };
      })
    );

    return rolesWithPolicies;
  };

  const fetchColumns = async (): Promise<ColumnDefinition[]> => {
    try {
      const response = await apiClient.get('/api/admin/columns');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch columns:', error);
      return [];
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [rolesData, columnsData] = await Promise.all([
        fetchRoles(),
        fetchColumns(),
      ]);

      setRoles(rolesData);
      setColumns(columnsData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const updateRolePolicy = async (roleId: string, policy: Partial<Omit<RolePolicy, 'pageAccess'>>) => {
    try {
      await apiClient.patch(`/api/admin/roles/${roleId}/policy`, policy);
    } catch (error) {
      console.error('Failed to update role policy:', error);
      throw error;
    }
  };

  const updatePageAccess = async (roleId: string, pageKey: string, hasAccess: boolean) => {
    try {
      await apiClient.patch('/api/admin/permissions/pages', { roleId, pageKey, hasAccess });
    } catch (error) {
      console.error('Failed to update page access:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    roles,
    columns,
    loading,
    error,
    refetch: fetchData,
    updateRolePolicy,
    updatePageAccess,
  };
};
