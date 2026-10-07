import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PfGroup, createPfGroup, addPfGroupMember } from '../lib/pf-groups';

interface AddToGroupModalProps {
  projectId: string;
  projectName: string;
  projectTypes: string[]; // types that actually exist in this project
  pfGroups: PfGroup[];
  onClose: () => void;
}

const selectStyle: React.CSSProperties = {
  width: '100%', height: '38px', padding: '0 10px', border: '1px solid #d1d5db',
  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: '#fff',
};
const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px', display: 'block' };

/**
 * One-screen "Add to Group" form — replaces the old click-through-a-nested-menu
 * flow (target → type → rank as three separate menu steps) with three dropdowns
 * shown at once. Stays open after each add (only the ✕ or backdrop closes it) so
 * several types can be added to the same group in a row without reopening it.
 */
const AddToGroupModal: React.FC<AddToGroupModalProps> = ({ projectId, projectName, projectTypes, pfGroups, onClose }) => {
  const [type, setType] = useState(projectTypes[0] || '');
  const [target, setTarget] = useState<string>('new'); // 'new' or a groupId
  const [rank, setRank] = useState<string>('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAddedFlash, setJustAddedFlash] = useState<string | null>(null);
  // Locally tracked so a type just added shows as "already in" immediately,
  // without waiting on the socket round-trip that refreshes the `pfGroups` prop.
  const [locallyAdded, setLocallyAdded] = useState<Set<string>>(new Set());
  const pressedOnBackdrop = useRef(false);

  const targetGroup = target === 'new' ? null : pfGroups.find(g => g.id === target) || null;

  const existingRanksForTarget = useMemo(() => {
    if (!targetGroup) return [];
    return [...new Set(targetGroup.members.map(m => m.rank))].sort((a, b) => a - b);
  }, [targetGroup]);

  const nextNewRank = useMemo(
    () => (existingRanksForTarget.length ? Math.max(...existingRanksForTarget) + 1 : 1),
    [existingRanksForTarget],
  );

  // Reset the rank choice and the local "just added" tracking whenever the target group changes.
  const handleTargetChange = (value: string) => {
    setTarget(value);
    setLocallyAdded(new Set());
    const grp = value === 'new' ? null : pfGroups.find(g => g.id === value) || null;
    const ranks = grp ? [...new Set(grp.members.map(m => m.rank))].sort((a, b) => a - b) : [];
    setRank(String(ranks[0] ?? 1));
  };

  const alreadyInTarget = locallyAdded.has(type) || !!targetGroup?.members.some(m => m.projectId === projectId && m.typeLabel === type);

  // Once the server confirms (pfGroups prop refreshes via socket), drop it from the
  // local set too — the real data has caught up, no need to track it ourselves anymore.
  useEffect(() => {
    if (!targetGroup) return;
    const confirmed = new Set(targetGroup.members.filter(m => m.projectId === projectId).map(m => m.typeLabel));
    setLocallyAdded(prev => {
      const next = new Set([...prev].filter(t => !confirmed.has(t)));
      return next.size === prev.size ? prev : next;
    });
  }, [targetGroup, projectId]);

  const handleAdd = async () => {
    if (busy || !type || alreadyInTarget) return;
    setBusy(true);
    setError(null);
    try {
      if (target === 'new') {
        const newGroup = await createPfGroup({ projectId, type: type.toUpperCase() });
        // Further adds in this session join the group we just started, not another new one.
        setTarget(newGroup.id);
        setRank('1');
      } else {
        await addPfGroupMember(target, { projectId, type: type.toUpperCase(), rank: Number(rank) });
      }
      setLocallyAdded(prev => new Set(prev).add(type));
      setJustAddedFlash(type);
      // Jump to the next type not yet in this group, if there is one.
      const remaining = projectTypes.filter(t => t !== type && !locallyAdded.has(t));
      if (remaining.length > 0) setType(remaining[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to group');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      onMouseDown={e => { pressedOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose(); pressedOnBackdrop.current = false; }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15,23,42,0.55)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 2100,
        padding: '20px',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: '14px', width: '420px', maxWidth: '100%',
        boxShadow: '0 24px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', background: 'linear-gradient(135deg, #f87171, #b91c1c)', color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>Add to Group</div>
            <div style={{ fontSize: '12px', opacity: 0.85 }}>{projectName}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', width: '28px', height: '28px',
              borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          {justAddedFlash && (
            <div style={{ background: '#f0fdf4', color: '#15803d', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid #bbf7d0' }}>
              ✓ {justAddedFlash} added{target !== 'new' ? '' : ' — new group created'}. Add another, or close when done.
            </div>
          )}

          {projectTypes.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>This project has no items yet.</div>
          ) : (
            <>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={type} onChange={e => { setType(e.target.value); setJustAddedFlash(null); }} style={selectStyle}>
                  {projectTypes.map(t => (
                    <option key={t} value={t}>{t}{locallyAdded.has(t) ? ' (already added)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Group</label>
                <select value={target} onChange={e => handleTargetChange(e.target.value)} style={selectStyle}>
                  <option value="new">+ Create New Group</option>
                  {pfGroups.map(g => <option key={g.id} value={g.id}>Group {g.number}</option>)}
                </select>
              </div>

              {target !== 'new' && (
                <div>
                  <label style={labelStyle}>Rank</label>
                  <select value={rank} onChange={e => setRank(e.target.value)} style={selectStyle}>
                    {existingRanksForTarget.map(r => <option key={r} value={r}>Rank {r}</option>)}
                    <option value={nextNewRank}>+ New rank ({nextNewRank})</option>
                  </select>
                </div>
              )}

              {alreadyInTarget && (
                <div style={{ fontSize: '12px', color: '#b91c1c' }}>This type is already in that group.</div>
              )}

              <button
                onClick={handleAdd}
                disabled={busy || !type || alreadyInTarget}
                style={{
                  marginTop: '4px', height: '40px', border: 'none', borderRadius: '8px',
                  background: busy || !type || alreadyInTarget ? '#fca5a5' : '#b91c1c', color: '#fff',
                  fontSize: '14px', fontWeight: 700, cursor: busy || !type || alreadyInTarget ? 'not-allowed' : 'pointer',
                }}
              >
                {busy ? 'Adding…' : 'Add'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddToGroupModal;
