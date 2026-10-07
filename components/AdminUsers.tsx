import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/auth';
import './AdminUsers.css';

interface User {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  forcePasswordChange: boolean;
  invitedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  role: {
    id: string;
    name: string;
    isSystem: boolean;
    isActive: boolean;
  };
  userAccessPolicy?: {
    columnsHidden: string[];
    columnsReadOnly: string[];
    rowScopes?: any;
  };
}

interface Role {
  id: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
}

interface InviteUserData {
  email: string;
  roleId: string;
  columnsHidden: string[];
  columnsReadOnly: string[];
  rowScopes?: any;
}

// Operational Board columns (13 total)
const BOARD_COLUMNS = [
  { key: 'projectno', label: 'Project No' },
  { key: 'type', label: 'Type' },
  { key: 'pfcode', label: 'PF Code' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'ordertype', label: 'Order Type' },
  { key: 'posignstatus', label: 'PO Sign Status' },
  { key: 'pfsignstatus', label: 'PF Sign Status' },
  { key: 'status', label: 'Status' },
  { key: 'std', label: 'STD' },
  { key: 'etd', label: 'ETD' },
  { key: 'rtd', label: 'RTD' },
  { key: 'ftd', label: 'FTD' },
  { key: 'containerno', label: 'Container No' },
];

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invite form state
  const [inviteForm, setInviteForm] = useState<InviteUserData>({
    email: '',
    roleId: '',
    columnsHidden: [],
    columnsReadOnly: [],
    rowScopes: {},
  });
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteFormErrors, setInviteFormErrors] = useState<Record<string, string>>({});

  // Component refs
  const usersContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/admin/users');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load users');
      }

      setUsers(data.users || []);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      setError(`Failed to load users: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await apiFetch('/api/admin/roles');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load roles');
      }

      setRoles(data || []);
    } catch (error: any) {
      console.error('Failed to load roles:', error);
      setError(`Failed to load roles: ${error.message}`);
    }
  };

  const handleUserClick = (clickedUser: User) => {
    setSelectedUser(clickedUser);
    setShowInviteForm(false);
  };

  const handleInviteUser = async () => {
    // Validate form
    const errors: Record<string, string> = {};

    if (!inviteForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!inviteForm.roleId) {
      errors.roleId = 'Please select a role';
    }

    setInviteFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setIsInviting(true);

      const response = await apiFetch('/api/admin/users/invite', {
        method: 'POST',
        body: JSON.stringify(inviteForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to invite user');
      }

      setSuccess(`User invited successfully: ${result.message}`);
      setError(null);

      // Reset form
      setInviteForm({
        email: '',
        roleId: '',
        columnsHidden: [],
        columnsReadOnly: [],
        rowScopes: {},
      });
      setShowInviteForm(false);

      // Reload users list
      await loadUsers();

    } catch (error: any) {
      console.error('Failed to invite user:', error);
      setError(`Failed to invite user: ${error.message}`);
      setSuccess(null);
    } finally {
      setIsInviting(false);
    }
  };

  const handleColumnPermissionChange = (columnKey: string, permissionType: 'hidden' | 'readOnly', isChecked: boolean) => {
    setInviteForm(prev => {
      const newForm = { ...prev };

      if (permissionType === 'hidden') {
        if (isChecked) {
          newForm.columnsHidden = [...prev.columnsHidden, columnKey];
          // Remove from readOnly if adding to hidden
          newForm.columnsReadOnly = prev.columnsReadOnly.filter(col => col !== columnKey);
        } else {
          newForm.columnsHidden = prev.columnsHidden.filter(col => col !== columnKey);
        }
      } else if (permissionType === 'readOnly') {
        if (isChecked) {
          newForm.columnsReadOnly = [...prev.columnsReadOnly, columnKey];
          // Remove from hidden if adding to readOnly
          newForm.columnsHidden = prev.columnsHidden.filter(col => col !== columnKey);
        } else {
          newForm.columnsReadOnly = prev.columnsReadOnly.filter(col => col !== columnKey);
        }
      }

      return newForm;
    });
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (user: User) => {
    if (!user.isActive) return 'pending';
    if (user.forcePasswordChange) return 'password-required';
    return 'active';
  };

  const getStatusText = (user: User) => {
    if (!user.isActive) return 'Pending Activation';
    if (user.forcePasswordChange) return 'Password Change Required';
    return 'Active';
  };

  return (
    <div className="admin-users">
      <div className="admin-users-header">
        <h1>User Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowInviteForm(true);
            setSelectedUser(null);
          }}
        >
          Invite User
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess(null)}>&times;</button>
        </div>
      )}

      <div className="admin-users-content">
        {/* Left Panel - Users List */}
        <div className="admin-users-left">
          <div className="admin-users-search">
            <input
              type="text"
              placeholder="Search users by email, name, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="user-count">{filteredUsers.length} users</span>
          </div>

          <div className="admin-users-list" ref={usersContainerRef}>
            {isLoading ? (
              <div className="loading">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="no-users">
                {searchTerm ? 'No users found matching your search.' : 'No users found.'}
              </div>
            ) : (
              filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                  onClick={() => handleUserClick(user)}
                >
                  <div className="user-info">
                    <div className="user-email">{user.email}</div>
                    <div className="user-details">
                      <span className="user-name">{user.name || 'No name set'}</span>
                      <span className="user-role">{user.role.name}</span>
                    </div>
                  </div>
                  <div className={`user-status ${getStatusBadge(user)}`}>
                    {getStatusText(user)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - User Details or Invite Form */}
        <div className="admin-users-right">
          {showInviteForm ? (
            <div className="invite-user-form">
              <div className="form-header">
                <h2>Invite New User</h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowInviteForm(false)}
                >
                  Cancel
                </button>
              </div>

              <div className="form-section">
                <h3>User Information</h3>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    value={inviteForm.email}
                    onChange={(e) => {
                      setInviteForm(prev => ({ ...prev, email: e.target.value }));
                      if (inviteFormErrors.email) {
                        setInviteFormErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                    className={inviteFormErrors.email ? 'error' : ''}
                    placeholder="user@example.com"
                  />
                  {inviteFormErrors.email && (
                    <span className="error-message">{inviteFormErrors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="roleId">Role *</label>
                  <select
                    id="roleId"
                    value={inviteForm.roleId}
                    onChange={(e) => {
                      setInviteForm(prev => ({ ...prev, roleId: e.target.value }));
                      if (inviteFormErrors.roleId) {
                        setInviteFormErrors(prev => ({ ...prev, roleId: '' }));
                      }
                    }}
                    className={inviteFormErrors.roleId ? 'error' : ''}
                  >
                    <option value="">Select a role...</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name} {role.isSystem ? '(System)' : ''}
                      </option>
                    ))}
                  </select>
                  {inviteFormErrors.roleId && (
                    <span className="error-message">{inviteFormErrors.roleId}</span>
                  )}
                </div>
              </div>

              <div className="form-section">
                <h3>Board Column Permissions</h3>
                <p className="section-description">
                  Configure which columns the user can see and edit in Projects.
                </p>

                <div className="columns-table">
                  <div className="columns-table-header">
                    <div className="column-name">Column</div>
                    <div className="column-permission">Hidden</div>
                    <div className="column-permission">Read Only</div>
                    <div className="column-permission">Editable</div>
                  </div>

                  {BOARD_COLUMNS.map(column => {
                    const isHidden = inviteForm.columnsHidden.includes(column.key);
                    const isReadOnly = inviteForm.columnsReadOnly.includes(column.key);
                    const isEditable = !isHidden && !isReadOnly;

                    return (
                      <div key={column.key} className="columns-table-row">
                        <div className="column-name">{column.label}</div>
                        <div className="column-permission">
                          <input
                            type="checkbox"
                            checked={isHidden}
                            onChange={(e) => handleColumnPermissionChange(column.key, 'hidden', e.target.checked)}
                          />
                        </div>
                        <div className="column-permission">
                          <input
                            type="checkbox"
                            checked={isReadOnly}
                            onChange={(e) => handleColumnPermissionChange(column.key, 'readOnly', e.target.checked)}
                          />
                        </div>
                        <div className="column-permission">
                          <span className={isEditable ? 'editable-yes' : 'editable-no'}>
                            {isEditable ? '✓' : '✗'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bulk-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setInviteForm(prev => ({ ...prev, columnsHidden: [], columnsReadOnly: [] }))}
                  >
                    All Editable
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setInviteForm(prev => ({
                      ...prev,
                      columnsHidden: [],
                      columnsReadOnly: BOARD_COLUMNS.map(col => col.key)
                    }))}
                  >
                    All Read Only
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleInviteUser}
                  disabled={isInviting}
                >
                  {isInviting ? 'Sending Invitation...' : 'Send Invitation'}
                </button>
              </div>
            </div>
          ) : selectedUser ? (
            <div className="user-details">
              <div className="user-details-header">
                <h2>User Details</h2>
                <div className={`user-status-large ${getStatusBadge(selectedUser)}`}>
                  {getStatusText(selectedUser)}
                </div>
              </div>

              <div className="user-details-content">
                <div className="detail-section">
                  <h3>Basic Information</h3>
                  <div className="detail-row">
                    <label>Email:</label>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="detail-row">
                    <label>Name:</label>
                    <span>{selectedUser.name || 'Not set'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Role:</label>
                    <span>{selectedUser.role.name}</span>
                  </div>
                  <div className="detail-row">
                    <label>Created:</label>
                    <span>{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                  {selectedUser.invitedAt && (
                    <div className="detail-row">
                      <label>Invited:</label>
                      <span>{new Date(selectedUser.invitedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedUser.lastLoginAt && (
                    <div className="detail-row">
                      <label>Last Login:</label>
                      <span>{new Date(selectedUser.lastLoginAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {selectedUser.userAccessPolicy && (
                  <div className="detail-section">
                    <h3>Access Permissions</h3>
                    {selectedUser.userAccessPolicy.columnsHidden.length > 0 && (
                      <div className="detail-row">
                        <label>Hidden Columns:</label>
                        <span>{selectedUser.userAccessPolicy.columnsHidden.join(', ')}</span>
                      </div>
                    )}
                    {selectedUser.userAccessPolicy.columnsReadOnly.length > 0 && (
                      <div className="detail-row">
                        <label>Read-Only Columns:</label>
                        <span>{selectedUser.userAccessPolicy.columnsReadOnly.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <h2>User Management</h2>
              <p>Select a user from the list to view details, or click "Invite User" to send a new invitation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;