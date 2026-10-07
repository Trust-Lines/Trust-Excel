import React from 'react';
import { PfGroup } from '../lib/pf-groups';
import PfGroupManageModal from './PfGroupManageModal';

interface PfGroupFilterControlProps {
  active: boolean;
  onToggle: () => void;
  groups: PfGroup[];
  // The manage modal's open state is owned by FilterBar, which puts a single
  // combined "Edit" button in front of every chip cluster instead of each one
  // having its own pencil icon.
  manageOpen: boolean;
  onManageOpenChange: (open: boolean) => void;
}

const colors = { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' };

/** "Groups" filter chip — open to everyone, no permission gate (grouping is a
 * general Projects-tab tool, like the right-click project menu it's driven from). */
const PfGroupFilterControl: React.FC<PfGroupFilterControlProps> = ({ active, onToggle, groups, manageOpen, onManageOpenChange }) => {
  const count = groups.length;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <button
        onClick={onToggle}
        title="Show the grouped-view table"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '34px',
          padding: '0 12px',
          border: active ? `1.5px solid ${colors.border}` : '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: active ? 600 : 400,
          color: active ? colors.text : '#4b5563',
          backgroundColor: active ? colors.bg : '#fff',
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        <span>Groups</span>
        {count > 0 && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '18px',
            height: '18px',
            padding: '0 4px',
            borderRadius: '9px',
            backgroundColor: active ? colors.text : '#9ca3af',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
          }}>
            {count}
          </span>
        )}
      </button>

      {manageOpen && (
        <PfGroupManageModal groups={groups} onClose={() => onManageOpenChange(false)} />
      )}
    </div>
  );
};

export default PfGroupFilterControl;
