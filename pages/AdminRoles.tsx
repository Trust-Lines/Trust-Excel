import React from 'react';
import { RolePermissionMatrix } from '../components/admin/RolePermissionMatrix';
import { useAdminRoles } from '../hooks/useAdminRoles';

const AdminRoles: React.FC = () => {
  const { roles, columns, loading, error, refetch, updateRolePolicy, updatePageAccess } = useAdminRoles();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading role permissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded mb-4">
            <h3 className="font-bold mb-2">Error Loading Admin Data</h3>
            <p>{error}</p>
          </div>
          <button
            onClick={refetch}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-600 mt-2">
            Manage role permissions and access control for Projects.
            Changes are automatically saved as you make them.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <RolePermissionMatrix
              roles={roles}
              columns={columns}
              onUpdateRolePolicy={updateRolePolicy}
              onUpdatePageAccess={updatePageAccess}
            />
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Permission Rules</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Hidden:</strong> Column is completely removed from the table (no whitespace)</li>
            <li>• <strong>Read-only:</strong> Column is visible but cannot be edited</li>
            <li>• <strong>Editable:</strong> Column can be viewed and edited normally</li>
            <li>• <strong>Money Totals:</strong> If all money columns (PF USD, PF TL) are hidden, the total row money cluster disappears</li>
            <li>• <strong>System Roles:</strong> Cannot be modified (ADMIN, etc.)</li>
            <li>• <strong>Auto-save:</strong> Changes are automatically saved after 1 second of inactivity</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminRoles;