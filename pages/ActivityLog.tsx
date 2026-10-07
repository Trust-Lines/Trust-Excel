import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../lib/auth';
import { useSocket } from '../contexts/SocketContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import './ActivityLog.css';

interface AuditLogEntry {
  id: string;
  domain: string;
  entityId: string;
  entityType: string;
  projectRef: string | null;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  action: string;
  userId: string;
  userName: string | null;
  userRole: string | null;
  createdAt: string;
}

interface UserStatus {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isOnline: boolean;
  lastActiveAt: string | null;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DOMAINS = [
  { value: '', label: 'All Domains' },
  { value: 'PROJECT', label: 'Projects' },
  { value: 'DIRECT_ORDER', label: 'Direct Orders' },
  { value: 'MISSING_EXTRA', label: 'Missing & Extra' },
  { value: 'SUPPLIER', label: 'Suppliers' },
];

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDomainBadgeClass(domain: string): string {
  switch (domain) {
    case 'PROJECT': return 'project';
    case 'DIRECT_ORDER': return 'direct-order';
    case 'MISSING_EXTRA': return 'missing-extra';
    case 'SUPPLIER': return 'supplier';
    default: return '';
  }
}

function getDomainLabel(domain: string): string {
  switch (domain) {
    case 'PROJECT': return 'Projects';
    case 'DIRECT_ORDER': return 'Direct Order';
    case 'MISSING_EXTRA': return 'Missing/Extra';
    case 'SUPPLIER': return 'Supplier';
    default: return domain;
  }
}

function formatValue(value: string | null): React.ReactNode {
  if (!value || value === 'null' || value === 'undefined') {
    return <span className="null-value">-</span>;
  }
  if (value.length > 50) {
    return <span title={value}>{value.substring(0, 47) + '...'}</span>;
  }
  return value;
}

const ActivityLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<UserStatus[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 50, totalPages: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [usersInitialLoading, setUsersInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent unnecessary re-renders on polling
  const lastLogsHash = useRef('');
  const lastUsersHash = useRef('');

  // Filters
  const [domain, setDomain] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (domain) params.set('domain', domain);
      if (selectedUserId) params.set('userId', selectedUserId);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('page', page.toString());
      params.set('limit', '50');

      const response = await apiFetch(`/api/audit-log?${params.toString()}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `HTTP ${response.status}`);
      }
      const result = await response.json();
      const newData = result.data || [];
      const newMeta = result.meta || { total: 0, page: 1, limit: 50, totalPages: 0 };

      // Only update state if data actually changed (prevent flickering)
      const newHash = newData.map((l: AuditLogEntry) => l.id).join(',');
      if (newHash !== lastLogsHash.current) {
        lastLogsHash.current = newHash;
        setLogs(newData);
        setMeta(newMeta);
      }
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
      setError(`Logs: ${err.message || 'Unknown error'}`);
    } finally {
      setInitialLoading(false);
    }
  }, [domain, selectedUserId, dateFrom, dateTo, page]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiFetch('/api/audit-log/active-users');
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `HTTP ${response.status}`);
      }
      const result = await response.json();
      const newUsers = Array.isArray(result) ? result : [];

      // Only update if data changed
      const newHash = newUsers.map((u: UserStatus) => `${u.id}:${u.isOnline}:${u.lastActiveAt}`).join(',');
      if (newHash !== lastUsersHash.current) {
        lastUsersHash.current = newHash;
        setUsers(newUsers);
      }
    } catch (err: any) {
      console.error('Failed to fetch active users:', err);
    } finally {
      setUsersInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Socket.IO: real-time updates for activity log
  const { joinRooms, leaveRooms, isConnected } = useSocket();
  const prevConnected = useRef(isConnected);

  useEffect(() => {
    joinRooms(['activity-log']);
    return () => { leaveRooms(['activity-log']); };
  }, [joinRooms, leaveRooms]);

  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      fetchLogs();
      fetchUsers();
    }
    prevConnected.current = isConnected;
  }, [isConnected, fetchLogs, fetchUsers]);

  useSocketEvent('audit-log:new-entry', fetchLogs);
  useSocketEvent('audit-log:new-entries', fetchLogs);
  useSocketEvent('active-users:updated', fetchUsers);

  const handleApplyFilters = () => {
    setPage(1);
    lastLogsHash.current = ''; // Force refresh
    setInitialLoading(true);
  };

  const handleResetFilters = () => {
    setDomain('');
    setSelectedUserId('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    lastLogsHash.current = '';
    setInitialLoading(true);
  };

  const renderPagination = () => {
    if (meta.totalPages <= 1) return null;

    const pages: number[] = [];
    const start = Math.max(1, meta.page - 2);
    const end = Math.min(meta.totalPages, meta.page + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination">
        <div className="pagination-info">
          Showing {((meta.page - 1) * meta.limit) + 1}-{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
        </div>
        <div className="pagination-controls">
          <button disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)}>Prev</button>
          {pages.map(p => (
            <button
              key={p}
              className={p === meta.page ? 'active' : ''}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)}>Next</button>
        </div>
      </div>
    );
  };

  return (
    <div className="activity-log-page">
      <h1>Activity Log</h1>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: '0.85rem' }}>
          <strong>API Error:</strong> {error}
        </div>
      )}

      {/* Active Users Panel */}
      <div className="active-users-panel">
        <h3>Users ({users.filter(u => u.isOnline).length} online)</h3>
        {usersInitialLoading ? (
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading users...</div>
        ) : (
          <div className="users-grid">
            {users.map(user => (
              <div className="user-chip" key={user.id}>
                <span className={`status-dot ${user.isOnline ? 'online' : 'offline'}`} />
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
                <span className={`user-status-text ${user.isOnline ? 'online' : ''}`}>
                  {user.isOnline
                    ? 'Online'
                    : user.lastActiveAt
                      ? formatRelativeTime(user.lastActiveAt)
                      : 'Never'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Domain</label>
          <select value={domain} onChange={e => setDomain(e.target.value)}>
            {DOMAINS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>User</label>
          <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
            <option value="">All Users</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>

        <div className="filter-group">
          <label>To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>

        <div className="filter-actions">
          <button className="btn-apply" onClick={handleApplyFilters}>Apply</button>
          <button className="btn-reset" onClick={handleResetFilters}>Reset</button>
        </div>
      </div>

      {/* Log Table */}
      <div className="log-table-container">
        {initialLoading ? (
          <div className="loading-state">
            <p>Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <p>No activity logs found</p>
          </div>
        ) : (
          <>
            <table className="log-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Domain</th>
                  <th>Reference</th>
                  <th>Field</th>
                  <th>Old Value</th>
                  <th>New Value</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td title={new Date(log.createdAt).toLocaleString()}>
                      {formatRelativeTime(log.createdAt)}
                    </td>
                    <td>{log.userName || log.userId.substring(0, 8)}</td>
                    <td>
                      <span className="role-badge">{log.userRole || '-'}</span>
                    </td>
                    <td>
                      <span className={`domain-badge ${getDomainBadgeClass(log.domain)}`}>
                        {getDomainLabel(log.domain)}
                      </span>
                    </td>
                    <td>{log.projectRef || '-'}</td>
                    <td style={{ fontWeight: 500 }}>{log.field}</td>
                    <td><span className="old-value">{formatValue(log.oldValue)}</span></td>
                    <td><span className="new-value">{formatValue(log.newValue)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
