import React, { useState, useEffect, useCallback } from 'react';
import { TodayPfFlag, getTodayPfFlags } from '../lib/today-pf';
import { useSocketEvent } from '../hooks/useSocketEvent';
import TodayPfManageModal from './TodayPfManageModal';

interface TodayPfControlProps {
  pfActive: boolean;
  onTogglePf: () => void;
  followActive: boolean;
  onToggleFollow: () => void;
  onFlagsChange?: (flags: TodayPfFlag[]) => void;
  // The manage modal's open state is owned by FilterBar, which puts a single
  // combined "Edit" button in front of every chip cluster instead of each one
  // having its own pencil icon.
  manageOpen: boolean;
  onManageOpenChange: (open: boolean) => void;
}

const CHIP = {
  PF: { label: 'ToDo', title: "Show only today's flagged PFs", bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
  FOLLOWUP: { label: 'Receive Follow Up', title: 'Show only PFs being followed up', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
} as const;

const TodayPfControl: React.FC<TodayPfControlProps> = ({ pfActive, onTogglePf, followActive, onToggleFollow, onFlagsChange, manageOpen, onManageOpenChange }) => {
  const [flags, setFlags] = useState<TodayPfFlag[]>([]);

  const refresh = useCallback(() => {
    getTodayPfFlags()
      .then(data => {
        setFlags(data);
        onFlagsChange?.(data);
      })
      .catch(() => { /* non-critical: leave last-known flags in place */ });
  }, [onFlagsChange]);

  useEffect(() => { refresh(); }, [refresh]);
  useSocketEvent('today-pf:updated', refresh);

  const renderChip = (kind: 'PF' | 'FOLLOWUP', active: boolean, onToggle: () => void) => {
    const c = CHIP[kind];
    const count = flags.filter(f => f.kind === kind).length;
    return (
      <button
        onClick={onToggle}
        title={c.title}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '34px',
          padding: '0 12px',
          border: active ? `1.5px solid ${c.border}` : '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: active ? 600 : 400,
          color: active ? c.text : '#4b5563',
          backgroundColor: active ? c.bg : '#fff',
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        <span>{c.label}</span>
        {count > 0 && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '18px',
            height: '18px',
            padding: '0 4px',
            borderRadius: '9px',
            backgroundColor: active ? c.text : '#9ca3af',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
          }}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {renderChip('PF', pfActive, onTogglePf)}
      {renderChip('FOLLOWUP', followActive, onToggleFollow)}

      {manageOpen && (
        <TodayPfManageModal
          flags={flags}
          onClose={() => onManageOpenChange(false)}
          onChanged={refresh}
        />
      )}
    </div>
  );
};

export default TodayPfControl;
