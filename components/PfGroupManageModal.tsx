import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PfGroup, PfGroupMember, reorderPfGroupMember, removePfGroupMember, deletePfGroup, tiersOfGroup } from '../lib/pf-groups';

/** Within one tier, members from the SAME project are shown as one merged card
 * (no need to repeat the project number) — each type still keeps its own rank
 * tag and its own controls, since it can be moved/removed independently. */
const byProject = (members: PfGroupMember[]): [string, PfGroupMember[]][] => {
  const map = new Map<string, PfGroupMember[]>();
  members.forEach(m => {
    const arr = map.get(m.projectId) || [];
    arr.push(m);
    map.set(m.projectId, arr);
  });
  return [...map.entries()];
};

interface PfGroupManageModalProps {
  groups: PfGroup[];
  onClose: () => void;
}

const PfGroupManageModal: React.FC<PfGroupManageModalProps> = ({ groups, onClose }) => {
  const [busy, setBusy] = useState<string | null>(null); // key of the button currently in flight
  const [error, setError] = useState<string | null>(null);
  const pressedOnBackdrop = useRef(false);

  const guard = async (key: string, fn: () => Promise<any>) => {
    if (busy) return;
    setBusy(key);
    setError(null);
    try {
      await fn();
      // The backend's socket event refreshes `groups` from the parent; nothing else to do here.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  return createPortal(
    <div
      onMouseDown={e => { pressedOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose(); pressedOnBackdrop.current = false; }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15,23,42,0.6)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 2000,
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#f9fafb', borderRadius: '16px', width: '96vw', maxWidth: '1300px',
          maxHeight: '94vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 30px 80px rgba(0,0,0,0.35)', overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #f87171, #b91c1c)', color: '#fff', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Manage Groups</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', width: '34px', height: '34px',
              borderRadius: '50%', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', marginBottom: '18px', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          {groups.length === 0 ? (
            <div style={{ fontSize: '14px', color: '#9ca3af', padding: '16px', background: '#fff', borderRadius: '10px', border: '1px dashed #e5e7eb' }}>
              No groups yet. Right-click a project number in the Projects grid to create one.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {groups.map(group => (
                <div key={group.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #f87171, #b91c1c)', color: '#fff',
                  }}>
                    <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '0.3px' }}>
                      Group {group.number}
                    </div>
                    <button
                      onClick={() => guard(`del-group-${group.id}`, () => deletePfGroup(group.id))}
                      disabled={!!busy}
                      title="Delete this entire group"
                      style={{ border: 'none', background: 'rgba(255,255,255,0.18)', color: '#fff', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px' }}
                    >
                      {busy === `del-group-${group.id}` ? '…' : '🗑️ Delete group'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 20px' }}>
                    {tiersOfGroup(group).map(([rank, members], tierIdx) => (
                      <div key={rank} style={{ display: 'flex', gap: '14px', alignItems: 'stretch' }}>
                        <div style={{
                          width: '38px', flexShrink: 0, borderRadius: '10px', background: '#fef2f2', color: '#b91c1c',
                          fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {rank}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '8px' }}>
                          {byProject(members).map(([projectId, projectMembers]) => (
                            <div key={projectId} style={{
                              padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fafafa',
                            }}>
                              <strong style={{ fontSize: '14px' }}>{projectMembers[0].projectNo}</strong>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                                {projectMembers.map(m => (
                                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                      width: '16px', height: '16px', borderRadius: '4px', background: '#fef2f2', color: '#b91c1c',
                                      fontSize: '10px', fontWeight: 800, flexShrink: 0,
                                    }}>
                                      {rank}
                                    </span>
                                    <span style={{ flex: 1, minWidth: 0, fontSize: '13px', color: '#374151' }}>{m.typeLabel}</span>
                                    <button
                                      onClick={() => guard(`up-${m.id}`, () => reorderPfGroupMember(m.id, 'up'))}
                                      disabled={!!busy || tierIdx === 0}
                                      title="Move up a tier (joins whatever is already there)"
                                      style={{ border: 'none', background: 'transparent', cursor: tierIdx === 0 ? 'default' : 'pointer', color: tierIdx === 0 ? '#d1d5db' : '#374151', fontSize: '14px', width: '20px' }}
                                    >
                                      ▲
                                    </button>
                                    <button
                                      onClick={() => guard(`down-${m.id}`, () => reorderPfGroupMember(m.id, 'down'))}
                                      disabled={!!busy}
                                      title="Move down a tier (joins the next one, or starts a new one)"
                                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#374151', fontSize: '14px', width: '20px' }}
                                    >
                                      ▼
                                    </button>
                                    <button
                                      onClick={() => guard(`rm-${m.id}`, () => removePfGroupMember(m.id))}
                                      disabled={!!busy}
                                      title="Remove from group"
                                      style={{
                                        border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer',
                                        width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                                      }}
                                    >
                                      {busy === `rm-${m.id}` ? '…' : '×'}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '20px' }}>
            To add a new group or a new member, right-click a project number in the Projects grid.
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PfGroupManageModal;
