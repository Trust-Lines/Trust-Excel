import React, { useState } from 'react';
import { ProjectHalf } from '../lib/projects';

interface HalfAssignmentToolbarProps {
  selectedCount: number;
  allVisibleSelected: boolean;
  visibleCount: number;
  onToggleSelectAll: () => void;
  selectedIds: string[];
  onAssign: (ids: string[], halfOfYear: ProjectHalf | null, halfYear: number | null) => Promise<any>;
  onAssigned: () => void;
}

const HalfAssignmentToolbar: React.FC<HalfAssignmentToolbarProps> = ({
  selectedCount,
  allVisibleSelected,
  visibleCount,
  onToggleSelectAll,
  selectedIds,
  onAssign,
  onAssigned,
}) => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSelection = selectedCount > 0;

  const handleAssign = async (half: ProjectHalf | null) => {
    if (!hasSelection || isAssigning) return;
    setIsAssigning(true);
    setError(null);
    try {
      await onAssign(selectedIds, half, half ? year : null);
      onAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign half');
    } finally {
      setIsAssigning(false);
    }
  };

  const buttonBaseStyle: React.CSSProperties = {
    height: '34px',
    padding: '0 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: hasSelection && !isAssigning ? 'pointer' : 'not-allowed',
    opacity: hasSelection && !isAssigning ? 1 : 0.5,
    whiteSpace: 'nowrap',
    border: 'none',
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      borderBottom: '1px solid #e5e7eb',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'wrap',
    }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={allVisibleSelected && visibleCount > 0}
          onChange={onToggleSelectAll}
          style={{ width: '15px', height: '15px', cursor: 'pointer' }}
        />
        Select All ({visibleCount})
      </label>

      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '20px',
        height: '20px',
        padding: '0 6px',
        borderRadius: '10px',
        backgroundColor: hasSelection ? '#eff6ff' : '#f3f4f6',
        color: hasSelection ? '#1d4ed8' : '#6b7280',
        fontSize: '12px',
        fontWeight: 600,
      }}>
        {selectedCount} selected
      </span>

      <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb' }} />

      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280' }}>
        Year
        <input
          type="number"
          value={year}
          onChange={e => setYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
          style={{
            width: '70px',
            height: '30px',
            padding: '0 8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        />
      </label>

      <button
        onClick={() => handleAssign('FIRST_HALF')}
        disabled={!hasSelection || isAssigning}
        style={{ ...buttonBaseStyle, backgroundColor: '#dbeafe', color: '#1d4ed8' }}
      >
        Assign to First Half
      </button>

      <button
        onClick={() => handleAssign('SECOND_HALF')}
        disabled={!hasSelection || isAssigning}
        style={{ ...buttonBaseStyle, backgroundColor: '#dcfce7', color: '#15803d' }}
      >
        Assign to Second Half
      </button>

      <button
        onClick={() => handleAssign(null)}
        disabled={!hasSelection || isAssigning}
        style={{ ...buttonBaseStyle, backgroundColor: '#fef2f2', color: '#dc2626' }}
      >
        Clear Half
      </button>

      {error && (
        <span style={{ fontSize: '12px', color: '#dc2626' }}>{error}</span>
      )}
    </div>
  );
};

export default HalfAssignmentToolbar;
