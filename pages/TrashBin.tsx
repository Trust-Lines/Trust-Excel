import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchTrashBin,
  restoreTrashEntry,
  permanentDeleteTrashEntry,
  TrashEntry,
  TrashBinResponse,
  MODULE_GROUP_LABELS,
} from '../lib/trash-bin';

const REFRESH_INTERVAL = 30_000;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function daysLeft(isoDate: string) {
  const diff = new Date(isoDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface ConfirmModal {
  open: boolean;
  type: 'restore' | 'permanent';
  entry: TrashEntry | null;
}

const TrashBin: React.FC = () => {
  const [data, setData] = useState<TrashBinResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmModal>({ open: false, type: 'restore', entry: null });
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchTrashBin(filterGroup || undefined);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to load trash bin');
    } finally {
      setLoading(false);
    }
  }, [filterGroup]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRestore = (entry: TrashEntry) => {
    setConfirm({ open: true, type: 'restore', entry });
  };

  const handlePermanentDelete = (entry: TrashEntry) => {
    setConfirm({ open: true, type: 'permanent', entry });
  };

  const executeAction = async () => {
    if (!confirm.entry) return;
    const { entry, type } = confirm;
    setConfirm(c => ({ ...c, open: false }));
    setActionLoading(entry.id);
    try {
      if (type === 'restore') {
        const res = await restoreTrashEntry(entry.id);
        showToast(res.message, 'success');
      } else {
        const days = daysLeft(entry.restoreUntil);
        const force = days > 0;
        const res = await permanentDeleteTrashEntry(entry.id, force);
        showToast(res.message, 'success');
      }
      await load();
    } catch (err: any) {
      showToast(err?.message || 'Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const grouped = data?.grouped || {};
  const totalCount = data?.meta?.total || 0;
  const groups = filterGroup ? { [filterGroup]: grouped[filterGroup] || [] } : grouped;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Trash Bin
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
            {totalCount} record{totalCount !== 1 ? 's' : ''} in trash &bull; Automatically deleted after 30 days
          </p>
        </div>
        <button
          onClick={load}
          style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
        >
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '20px' }}>
        <select
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', background: '#fff', minWidth: '220px' }}
        >
          <option value="">All Categories</option>
          {Object.entries(MODULE_GROUP_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          padding: '12px 20px', borderRadius: '8px',
          background: toast.type === 'success' ? '#065f46' : '#991b1b',
          color: '#fff', fontSize: '14px', fontWeight: 500, maxWidth: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading trash bin...</div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && totalCount === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 24px', background: '#f9fafb', borderRadius: '12px', border: '2px dashed #e5e7eb' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10003;</div>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Trash is empty</p>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            Deleted records will appear here for 30 days before permanent removal.
          </p>
        </div>
      )}

      {/* Groups */}
      {!loading && Object.entries(groups).map(([group, entries]: [string, any]) => {
        if (!entries || entries.length === 0) return null;
        const collapsed = collapsedGroups.has(group);
        const label = MODULE_GROUP_LABELS[group] || group;

        return (
          <div key={group} style={{ marginBottom: '20px', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
            {/* Group Header */}
            <div
              onClick={() => toggleGroup(group)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', background: '#f9fafb', cursor: 'pointer', userSelect: 'none',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>
                {label}{' '}
                <span style={{ background: '#e5e7eb', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', marginLeft: '8px', color: '#6b7280' }}>
                  {entries.length}
                </span>
              </span>
              <span style={{ color: '#9ca3af', fontSize: '12px' }}>{collapsed ? 'Show' : 'Hide'}</span>
            </div>

            {/* Table */}
            {!collapsed && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={thStyle}>Name / Label</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Deleted By</th>
                      <th style={thStyle}>Deleted At</th>
                      <th style={thStyle}>Expires In</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(entries as TrashEntry[]).map((entry) => {
                      const days = daysLeft(entry.restoreUntil);
                      const expired = days <= 0;
                      const isActioning = actionLoading === entry.id;

                      return (
                        <tr key={entry.id} style={{ borderTop: '1px solid #f3f4f6', opacity: expired ? 0.6 : 1 }}>
                          <td style={tdStyle}>
                            <span style={{ fontWeight: 500, color: '#111827' }}>{entry.entityLabel}</span>
                            {entry.parentLabel && (
                              <span style={{ display: 'block', fontSize: '11px', color: '#9ca3af' }}>
                                &rarr; {entry.parentLabel}
                              </span>
                            )}
                          </td>
                          <td style={tdStyle}>
                            <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 500 }}>
                              {entry.entityType}
                            </span>
                          </td>
                          <td style={tdStyle}>{entry.deletedByName || '—'}</td>
                          <td style={tdStyle}>{formatDate(entry.deletedAt)}</td>
                          <td style={tdStyle}>
                            {expired ? (
                              <span style={{ color: '#dc2626', fontWeight: 600 }}>Expired</span>
                            ) : (
                              <span style={{ color: days <= 3 ? '#d97706' : '#059669', fontWeight: 500 }}>
                                {days} day{days !== 1 ? 's' : ''}
                              </span>
                            )}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {!expired && (
                              <button
                                onClick={() => handleRestore(entry)}
                                disabled={isActioning}
                                style={{
                                  marginRight: '8px', padding: '5px 12px',
                                  background: '#059669', color: '#fff',
                                  border: 'none', borderRadius: '5px', cursor: isActioning ? 'not-allowed' : 'pointer',
                                  fontSize: '12px', fontWeight: 500, opacity: isActioning ? 0.7 : 1,
                                }}
                              >
                                {isActioning ? '...' : 'Restore'}
                              </button>
                            )}
                            <button
                              onClick={() => handlePermanentDelete(entry)}
                              disabled={isActioning}
                              style={{
                                padding: '5px 12px', background: '#dc2626', color: '#fff',
                                border: 'none', borderRadius: '5px', cursor: isActioning ? 'not-allowed' : 'pointer',
                                fontSize: '12px', fontWeight: 500, opacity: isActioning ? 0.7 : 1,
                              }}
                            >
                              {isActioning ? '...' : 'Delete Forever'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Confirmation Modal */}
      {confirm.open && confirm.entry && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '28px',
            maxWidth: '440px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{
              margin: '0 0 12px', fontSize: '18px', fontWeight: 700,
              color: confirm.type === 'permanent' ? '#dc2626' : '#059669',
            }}>
              {confirm.type === 'restore' ? 'Restore Record?' : 'Delete Forever?'}
            </h3>
            <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#374151' }}>
              <strong>{confirm.entry.entityLabel}</strong>
            </p>
            {confirm.type === 'permanent' && (
              <div style={{
                padding: '12px', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: '6px', marginBottom: '16px',
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>
                  This action is irreversible. The record and all its data will be permanently removed from the database.
                </p>
              </div>
            )}
            {confirm.type === 'restore' && (
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px' }}>
                This record will be restored to its original location and become visible again.
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirm(c => ({ ...c, open: false }))}
                style={{
                  padding: '8px 16px', background: '#f3f4f6',
                  border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                style={{
                  padding: '8px 20px',
                  background: confirm.type === 'permanent' ? '#dc2626' : '#059669',
                  color: '#fff', border: 'none', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                }}
              >
                {confirm.type === 'restore' ? 'Yes, Restore' : 'Yes, Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 14px',
  color: '#374151',
  verticalAlign: 'middle',
};

export default TrashBin;
