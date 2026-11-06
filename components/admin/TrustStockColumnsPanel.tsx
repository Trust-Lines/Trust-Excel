import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../lib/auth';

type Access = 'hidden' | 'readonly' | 'editable';
interface StockColumn { key: string; label: string; money?: boolean }

/**
 * Admin > Roles > Trust Stock Columns: which Trust Stock columns a role sees / edits.
 * Separate from the Projects column rules. The server enforces them too: hidden prices
 * are left out of its responses, and hidden / read-only columns can't be written.
 */
const TrustStockColumnsPanel: React.FC<{ roleId: string; isSystem: boolean }> = ({ roleId, isSystem }) => {
  const [columns, setColumns] = useState<StockColumn[]>([]);
  const [access, setAccess] = useState<Record<string, Access>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'saved' | 'error' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apply = (data: { columns: StockColumn[]; columnsHidden: string[]; columnsReadOnly: string[] }) => {
    setColumns(data.columns);
    const next: Record<string, Access> = {};
    for (const c of data.columns) {
      next[c.key] = data.columnsHidden.includes(c.key) ? 'hidden' : data.columnsReadOnly.includes(c.key) ? 'readonly' : 'editable';
    }
    setAccess(next);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/admin/roles/${roleId}/trust-stock-columns`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Could not load the Trust Stock columns');
      apply(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the Trust Stock columns');
    } finally {
      setLoading(false);
    }
  }, [roleId]);
  useEffect(() => { load(); }, [load]);

  const save = async (next: Record<string, Access>) => {
    const previous = access;
    setAccess(next);
    setSaving(true);
    setStatus(null);
    try {
      const res = await apiFetch(`/api/admin/roles/${roleId}/trust-stock-columns`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnsHidden: Object.keys(next).filter(k => next[k] === 'hidden'),
          columnsReadOnly: Object.keys(next).filter(k => next[k] === 'readonly'),
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Save failed');
      apply(await res.json());
      setStatus('saved');
    } catch (e) {
      setAccess(previous);
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setOne = (key: string, value: Access) => save({ ...access, [key]: value });
  const setAll = (value: Access) => save(Object.fromEntries(columns.map(c => [c.key, value])));
  const hidePrices = () => save({ ...access, ...Object.fromEntries(columns.filter(c => c.money).map(c => [c.key, 'hidden' as Access])) });

  const disabled = isSystem || saving || loading;
  // PDFs and accounting are seen or not: a read-only state means nothing for them
  const viewOnly = (key: string) => key === 'pfPdf';

  return (
    <div className="column-permissions">
      <h4 style={{ margin: '0 0 4px 0' }}>Trust Stock Column Permissions</h4>
      <p className="permissions-description">
        Which Trust Stock columns this role can see / edit. Separate from the Projects columns.
        Hidden prices are not sent to the browser at all. Hiding a PF or invoice price also hides the Accounting panel,
        since its remaining amounts would reveal the price.
      </p>

      {saving && (
        <div className="save-status saving">
          <div className="spinner small"></div>
          <span>Saving...</span>
        </div>
      )}
      {!saving && status === 'saved' && <div className="save-status saved"><span>Saved — applies at the user's next login / page refresh</span></div>}
      {!saving && status === 'error' && <div className="save-status error"><span>{error || 'Save failed'}</span></div>}
      {!saving && !status && error && <div className="save-status error"><span>{error}</span></div>}

      <div className="permissions-bulk-actions">
        <button className="btn btn-sm btn-secondary" onClick={hidePrices} disabled={disabled}>Hide all prices</button>
        <button className="btn btn-sm btn-secondary" onClick={() => setAll('editable')} disabled={disabled}>All Editable</button>
        <button className="btn btn-sm btn-secondary" onClick={() => setAll('readonly')} disabled={disabled}>All Read-only</button>
      </div>

      {loading ? <div style={{ padding: 12, color: '#6b7280' }}>Loading…</div> : (
        <div className="permissions-grid">
          {columns.map(column => (
            <div key={column.key} className="permission-row">
              <div className="column-name">
                {column.label}
                {column.money && <span style={{ marginLeft: 6, fontSize: 11, color: '#b45309', fontWeight: 600 }}>price</span>}
              </div>
              <div className="permission-controls">
                {(['hidden', 'readonly', 'editable'] as Access[]).map(value => {
                  if (value === 'readonly' && viewOnly(column.key)) return null;
                  return (
                    <label key={value} className="permission-option">
                      <input
                        type="radio"
                        name={`ts-${roleId}-${column.key}`}
                        value={value}
                        checked={access[column.key] === value || (viewOnly(column.key) && value === 'editable' && access[column.key] === 'readonly')}
                        onChange={() => setOne(column.key, value)}
                        disabled={disabled}
                      />
                      <span>{value === 'hidden' ? 'Hidden' : value === 'readonly' ? 'Read-only' : viewOnly(column.key) ? 'Visible' : 'Editable'}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrustStockColumnsPanel;
