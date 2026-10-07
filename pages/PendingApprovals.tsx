import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/auth';

// Shape returned by GET /api/price-list/approvals/pending
interface PendingApproval {
  approvalId: string;
  priceListEntryId: string;
  type: string;
  typeLabel: string;
  projectId: string;
  projectNo: string;
  address: string;
  clientName: string | null;
  createdByName: string | null;
  entryCreatedAt: string;
  version: number;
}

const C = {
  border: '#e2e8f0', bg: '#f8fafc', blue: '#2563eb', green: '#16a34a',
  red: '#dc2626', slate: '#475569', muted: '#94a3b8', text: '#1e293b', white: '#ffffff',
  gold: '#b45309',
};

const PendingApprovals: React.FC = () => {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [showRejectFor, setShowRejectFor] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await apiFetch('/api/price-list/approvals/pending');
      if (!r.ok) throw new Error('Failed to load');
      setApprovals(await r.json());
    } catch (e: any) {
      setError(e.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (approvalId: string) => {
    setActing(approvalId);
    try {
      const r = await apiFetch(`/api/price-list/approvals/${approvalId}/approve`, { method: 'POST' });
      if (!r.ok) throw new Error('Failed to approve');
      await load();
    } catch (e: any) {
      alert(e.message ?? 'Error');
    } finally {
      setActing(null);
    }
  };

  const reject = async (approvalId: string) => {
    setActing(approvalId);
    try {
      const r = await apiFetch(`/api/price-list/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: rejectNote[approvalId] ?? '' }),
      });
      if (!r.ok) throw new Error('Failed to reject');
      setShowRejectFor(null);
      setRejectNote(prev => { const n = { ...prev }; delete n[approvalId]; return n; });
      await load();
    } catch (e: any) {
      alert(e.message ?? 'Error');
    } finally {
      setActing(null);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>Pending Approvals</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>Price lists awaiting your signature</p>
      </div>

      {loading && <div style={{ color: C.muted, fontSize: 13 }}>Loading…</div>}
      {error && <div style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {!loading && approvals.length === 0 && !error && (
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 40, textAlign: 'center', color: C.muted, fontSize: 14 }}>
          No pending approvals at this time.
        </div>
      )}

      {approvals.map(a => (
        <div key={a.approvalId} style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                #{a.projectNo} — {a.clientName ?? a.address}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                Type: <strong style={{ color: C.slate }}>{a.type}</strong>
                {a.typeLabel && <> · <span style={{ color: C.slate }}>{a.typeLabel}</span></>}
                <span style={{ margin: '0 8px' }}>·</span>
                Created: {new Date(a.entryCreatedAt).toLocaleDateString('en-US')}
                {a.createdByName && <><span style={{ margin: '0 8px' }}>·</span>By: {a.createdByName}</>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
              <button
                onClick={() => approve(a.approvalId)}
                disabled={acting === a.approvalId}
                style={{
                  padding: '7px 18px', background: C.green, color: 'white', border: 'none',
                  borderRadius: 7, fontSize: 13, fontWeight: 600,
                  cursor: acting === a.approvalId ? 'not-allowed' : 'pointer',
                  opacity: acting === a.approvalId ? 0.7 : 1,
                }}>
                {acting === a.approvalId ? '…' : '✓ Approve'}
              </button>

              {showRejectFor === a.approvalId ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    autoFocus
                    value={rejectNote[a.approvalId] ?? ''}
                    onChange={e => setRejectNote(prev => ({ ...prev, [a.approvalId]: e.target.value }))}
                    placeholder="Rejection note (optional)"
                    style={{ padding: '6px 8px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, width: 200, outline: 'none' }}
                    onKeyDown={e => { if (e.key === 'Enter') reject(a.approvalId); if (e.key === 'Escape') setShowRejectFor(null); }}
                  />
                  <button onClick={() => reject(a.approvalId)} disabled={acting === a.approvalId}
                    style={{ padding: '6px 12px', background: C.red, color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                    Confirm
                  </button>
                  <button onClick={() => setShowRejectFor(null)}
                    style={{ padding: '6px 10px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer', color: C.slate }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowRejectFor(a.approvalId)}
                  disabled={acting === a.approvalId}
                  style={{ padding: '7px 18px', background: 'white', color: C.red, border: `1px solid ${C.red}`, borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  ✗ Reject
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PendingApprovals;
