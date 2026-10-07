import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getProjects, mapBackendTypeToFrontend, BackendProject } from '../lib/projects';
import { TodayPfFlag, TodayPfKind, createTodayPfFlag, deleteTodayPfFlag } from '../lib/today-pf';

const NOT_ORDERED_STATUSES = ['HOLD_T', 'HOLD_PM', 'HOLD_BOOKS', 'NOT_ORDERED', 'TO_ORDER', 'BOOKS_IN_PROGRESS'];

// The "to order" list is now driven by the TO_ORDER item status directly (see the status filter
// chip), not by a manually-managed flag — so this modal only offers the PF and Follow Up tabs.
type ManagedKind = Extract<TodayPfKind, 'PF' | 'FOLLOWUP'>;

const TABS: Record<ManagedKind, { title: string; short: string; accent: string; soft: string; gradient: string; empty: string; doneLabel: string }> = {
  PF: { title: 'ToDo', short: 'PFs to complete', accent: '#ea580c', soft: '#fff7ed', gradient: 'linear-gradient(135deg, #f97316, #c2410c)', empty: 'No PFs flagged yet.', doneLabel: 'PF codes' },
  FOLLOWUP: { title: 'Receive Follow Up', short: 'Receive follow up', accent: '#16a34a', soft: '#f0fdf4', gradient: 'linear-gradient(135deg, #22c55e, #15803d)', empty: 'Nothing being followed up yet.', doneLabel: 'followed' },
};

interface TodayPfManageModalProps {
  flags: TodayPfFlag[];
  onClose: () => void;
  onChanged: () => void;
}

const TodayPfManageModal: React.FC<TodayPfManageModalProps> = ({ flags, onClose, onChanged }) => {
  const [projects, setProjects] = useState<BackendProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tab, setTab] = useState<ManagedKind>('PF');
  const [busy, setBusy] = useState<string | null>(null); // key of the button currently in flight
  const [error, setError] = useState<string | null>(null);
  const pressedOnBackdrop = useRef(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    getProjects()
      .then(res => setProjects(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load projects'))
      .finally(() => setLoadingProjects(false));
  }, []);

  // Position the dropdown against the search input's real screen coordinates —
  // a single direct measurement, no multi-phase reflow dance.
  useEffect(() => {
    if (!dropdownOpen) return;
    const updatePosition = () => {
      if (!pickerRef.current) return;
      const rect = pickerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [dropdownOpen]);

  // Close on outside click — but a click inside the portaled dropdown itself
  // (which is a DOM sibling of the modal, not a descendant) must not count as
  // "outside," otherwise picking a project closes the whole modal.
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (pickerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const projectLabel = (p: BackendProject) => `${p.projectNo} — ${p.name}`;

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(p => projectLabel(p).toLowerCase().includes(q));
  }, [projects, projectSearch]);

  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const handlePickProject = (p: BackendProject) => {
    setSelectedProjectId(p.id);
    setProjectSearch(projectLabel(p));
    setDropdownOpen(false);
  };

  // Every distinct PF type present in the selected project, with fill progress.
  const availableTypes = useMemo(() => {
    if (!selectedProject) return [];
    const seen = new Map<string, { label: string; type?: string; customTypeId?: string; total: number; filled: number }>();
    (selectedProject.items || []).forEach(item => {
      const label = mapBackendTypeToFrontend(item.type, (item as any).customType);
      if (!seen.has(label)) {
        seen.set(label, {
          label,
          type: (item as any).customTypeId ? undefined : (item.type || undefined),
          customTypeId: (item as any).customTypeId || undefined,
          total: 0,
          filled: 0,
        });
      }
      const entry = seen.get(label)!;
      entry.total += 1;
      const done = tab === 'PF' ? !!item.pfCode?.trim() : !NOT_ORDERED_STATUSES.includes(String((item as any).status || 'NOT_ORDERED'));
      if (done) entry.filled += 1;
    });
    return [...seen.values()];
  }, [selectedProject, tab]);

  // To Order tab: every individual PF (item) of the selected project, one by one.
  const orderItems = useMemo(() => {
    if (!selectedProject) return [];
    return (selectedProject.items || [])
      .map(item => ({
        id: item.id,
        label: mapBackendTypeToFrontend(item.type, (item as any).customType),
        pfCode: item.pfCode?.trim() || '',
        vendor: ((item as any).vendor?.name as string) || '',
        status: String((item as any).status || 'NOT_ORDERED'),
      }))
      .sort((a, b) => a.label.localeCompare(b.label) || a.pfCode.localeCompare(b.pfCode, undefined, { numeric: true }));
  }, [selectedProject]);

  const flaggedItemIds = useMemo(() => new Set(flags.filter(f => f.kind === tab && f.itemId).map(f => f.itemId as string)), [flags, tab]);

  const handleAddItem = async (itemId: string, key: string) => {
    if (!selectedProjectId || busy) return;
    setBusy(key);
    setError(null);
    try {
      await createTodayPfFlag({ projectId: selectedProjectId, kind: tab, itemId });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add flag');
    } finally {
      setBusy(null);
    }
  };

  const pill = (st: string) => {
    const ordered = !NOT_ORDERED_STATUSES.includes(st);
    return { background: ordered ? '#dcfce7' : '#fef3c7', color: ordered ? '#166534' : '#92400e' };
  };
  const typePill = { background: '#f1f5f9', color: '#475569', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' as const };
  const statusText = (st: string) => st.replace(/_/g, ' ').toLowerCase().replace(/^./, c => c.toUpperCase());

  const tabFlags = useMemo(() => flags.filter(f => f.kind === tab), [flags, tab]);
  const theme = TABS[tab];

  const flaggedLabelsForProject = useMemo(() => {
    if (!selectedProjectId) return new Set<string>();
    return new Set(tabFlags.filter(f => f.projectId === selectedProjectId).map(f => f.typeLabel));
  }, [tabFlags, selectedProjectId]);

  const handleAddType = async (t: { label: string; type?: string; customTypeId?: string }) => {
    if (!selectedProjectId || busy) return;
    setBusy(t.label);
    setError(null);
    try {
      await createTodayPfFlag({ projectId: selectedProjectId, type: t.type, customTypeId: t.customTypeId, kind: tab });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add flag');
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (busy) return;
    setBusy(id);
    setError(null);
    try {
      await deleteTodayPfFlag(id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove flag');
    } finally {
      setBusy(null);
    }
  };

  const progressColor = (filled: number, total: number) => {
    if (total === 0) return '#9ca3af';
    if (filled >= total) return '#16a34a';
    if (filled > 0) return '#d97706';
    return '#9ca3af';
  };

  return createPortal(
    <div
      onMouseDown={e => { pressedOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose(); pressedOnBackdrop.current = false; }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15,23,42,0.55)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 2000,
        padding: '20px',
      }}
    >
      <div
                style={{
          background: 'white', borderRadius: '14px', width: '520px',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.28)', overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: theme.gradient, color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5-6.5-4.5L5.5 21.5 8 14 2 9.5h7.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>{theme.title}</h3>
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

        <div style={{ display: 'flex', gap: '6px', padding: '10px 22px 0', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
          {(['PF', 'FOLLOWUP'] as ManagedKind[]).map(k => {
            const t = TABS[k];
            const active = tab === k;
            const count = flags.filter(f => f.kind === k).length;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px',
                  border: 'none', borderBottom: active ? `2px solid ${t.accent}` : '2px solid transparent',
                  background: 'transparent', cursor: 'pointer', fontSize: '13px',
                  fontWeight: active ? 700 : 500, color: active ? t.accent : '#6b7280', marginBottom: '-1px',
                }}
              >
                {t.short}
                <span style={{
                  minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '9px', fontSize: '11px', fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? t.accent : '#d1d5db', color: '#fff',
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: '18px 22px', overflowY: 'auto' }}>
          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Currently flagged {tabFlags.length > 0 && `(${tabFlags.length})`}
          </div>
          {tabFlags.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px' }}>
              {theme.empty}
            </div>
          ) : (
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tabFlags.map(f => {
                const pct = f.totalItems > 0 ? Math.round((f.filledItems / f.totalItems) * 100) : 0;
                return (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', border: `1px solid ${f.completedAt ? '#bbf7d0' : '#e5e7eb'}`, borderLeft: `3px solid ${f.completedAt ? '#22c55e' : theme.accent}`, borderRadius: '10px', fontSize: '13px',
                    background: f.completedAt ? '#f0fdf4' : '#fff', boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                  }}>
                    {f.itemId ? (
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <strong style={{ color: '#0f172a' }}>{f.projectNo}</strong>
                          <span style={typePill}>{f.typeLabel}</span>
                          {f.completedAt && <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '12px' }}>✓ done</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600, fontSize: '12px', color: f.pfCode ? '#1d4ed8' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.pfCode || 'no PF code yet'}
                          </span>
                          <span style={{ ...pill(f.itemStatus || 'NOT_ORDERED'), borderRadius: '999px', padding: '2px 9px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {statusText(f.itemStatus || 'NOT_ORDERED')}
                          </span>
                        </div>
                      </div>
                    ) : (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <strong>{f.projectNo}</strong>
                        <span style={{ color: '#6b7280' }}>— {f.typeLabel}</span>
                        {f.completedAt && <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ done</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                        <div style={{ flex: 1, height: '5px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: progressColor(f.filledItems, f.totalItems), borderRadius: '3px', transition: 'width 0.2s' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{f.filledItems}/{f.totalItems}</span>
                      </div>
                    </div>
                    )}
                    <button
                      onClick={() => handleRemove(f.id)}
                      disabled={!!busy}
                      title="Remove"
                      style={{
                        border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer',
                        width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {busy === f.id ? '…' : '×'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Add new
          </div>

          <div ref={pickerRef} style={{ position: 'relative', marginBottom: '10px' }}>
            <input
              value={projectSearch}
              onChange={e => {
                setProjectSearch(e.target.value);
                setSelectedProjectId('');
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              disabled={loadingProjects}
              placeholder={loadingProjects ? 'Loading projects...' : 'Search project by number or name...'}
              style={{
                width: '100%', height: '38px', padding: '0 12px 0 34px', border: '1px solid #d1d5db',
                borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none',
              }}
            />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
              style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
            </svg>
          </div>

          {dropdownOpen && !loadingProjects && dropdownPos && createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width,
                maxHeight: '240px', overflowY: 'auto',
                background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb',
                boxShadow: '0 10px 25px rgba(0,0,0,0.12)', zIndex: 2100,
              }}
            >
              {filteredProjects.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                  No projects match "{projectSearch}"
                </div>
              ) : (
                filteredProjects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePickProject(p)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '9px 12px', border: 'none',
                      background: p.id === selectedProjectId ? theme.soft : 'transparent',
                      color: p.id === selectedProjectId ? theme.accent : '#374151',
                      fontSize: '13px', cursor: 'pointer',
                    }}
                    onMouseEnter={e => { if (p.id !== selectedProjectId) e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={e => { if (p.id !== selectedProjectId) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <strong>{p.projectNo}</strong>
                    <span style={{ color: '#9ca3af' }}> — {p.name}</span>
                  </button>
                ))
              )}
            </div>,
            document.body
          )}

          {selectedProject && tab === 'FOLLOWUP' && (
            orderItems.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#9ca3af', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px' }}>
                This project has no PFs yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Only ORDERED PFs can be followed up — the others are greyed out:</div>
                {orderItems.map(it => {
                  const flagged = flaggedItemIds.has(it.id);
                  const blocked = tab === 'FOLLOWUP' && it.status !== 'ORDERED';
                  return (
                    <button
                      key={it.id}
                      onClick={() => handleAddItem(it.id, it.id)}
                      disabled={!!busy || flagged || blocked}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left',
                        opacity: blocked ? 0.55 : 1, filter: blocked ? 'grayscale(1)' : 'none',
                        padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
                        border: flagged ? `1px solid ${theme.accent}` : '1px solid #e5e7eb',
                        background: flagged ? theme.soft : blocked ? '#f3f4f6' : '#fff',
                        cursor: flagged || blocked ? 'not-allowed' : 'pointer',
                      }}
                      onMouseEnter={e => { if (!flagged && !blocked) e.currentTarget.style.borderColor = theme.accent; }}
                      onMouseLeave={e => { if (!flagged && !blocked) e.currentTarget.style.borderColor = '#e5e7eb'; }}
                    >
                      <span style={{ ...typePill, width: '74px', textAlign: 'center', flexShrink: 0 }}>{it.label}</span>
                      <span style={{ flex: 1, minWidth: 0, fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: it.pfCode ? '#111827' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {busy === it.id ? '…' : (it.pfCode || 'no PF code yet')}
                        {it.vendor && <span style={{ fontFamily: 'inherit', fontWeight: 400, color: '#9ca3af' }}> · {it.vendor}</span>}
                      </span>
                      <span style={{ ...pill(it.status), borderRadius: '999px', padding: '2px 9px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {statusText(it.status)}
                      </span>
                      {flagged && <span style={{ color: theme.accent, fontWeight: 700 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )
          )}

          {selectedProject && tab === 'PF' && (
            availableTypes.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#9ca3af', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px' }}>
                This project has no items yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {availableTypes.map(t => {
                  const alreadyFlagged = flaggedLabelsForProject.has(t.label);
                  const fullyFilled = t.total > 0 && t.filled >= t.total;
                  const isBusy = busy === t.label;
                  return (
                    <button
                      key={t.label}
                      onClick={() => handleAddType(t)}
                      disabled={!!busy || alreadyFlagged}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: alreadyFlagged ? '1px solid #16a34a' : '1px solid #d1d5db',
                        background: alreadyFlagged ? '#f0fdf4' : '#fff',
                        color: alreadyFlagged ? '#16a34a' : '#374151',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: alreadyFlagged ? 'default' : 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (!alreadyFlagged) e.currentTarget.style.borderColor = theme.accent; }}
                      onMouseLeave={e => { if (!alreadyFlagged) e.currentTarget.style.borderColor = '#d1d5db'; }}
                    >
                      {alreadyFlagged && '✓ '}
                      {isBusy ? '…' : t.label}
                      <span style={{
                        fontSize: '11px',
                        color: alreadyFlagged ? '#16a34a' : progressColor(t.filled, t.total),
                        fontWeight: 700,
                      }}>
                        {t.filled}/{t.total}{fullyFilled ? ' ✓' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TodayPfManageModal;
