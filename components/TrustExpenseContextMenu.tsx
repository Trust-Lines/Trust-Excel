import React, { useEffect, useRef } from 'react';

// 20 predefined palette colors
const COLOR_PALETTE = [
  '#FF6B6B', '#FF8E53', '#FFA726', '#FFCA28', '#FFD54F',
  '#AED581', '#81C784', '#4DB6AC', '#4DD0E1', '#4FC3F7',
  '#64B5F6', '#7986CB', '#9575CD', '#BA68C8', '#F06292',
  '#A1887F', '#90A4AE', '#78909C', '#E0E0E0', '#BCAAA4',
];

interface TrustExpenseContextMenuProps {
  x: number;
  y: number;
  itemId: string;
  itemColorHex: string | null;
  usedColors: string[];
  onClose: () => void;
  onAddRowSameColor: (itemId: string) => void;
  onAddRowNewColor: (itemId: string) => void;
  onDeleteRow: (itemId: string) => void;
}

const TrustExpenseContextMenu: React.FC<TrustExpenseContextMenuProps> = ({
  x,
  y,
  itemId,
  itemColorHex,
  usedColors: _usedColors,
  onClose,
  onAddRowSameColor,
  onAddRowNewColor,
  onDeleteRow,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 260);
  const adjustedY = Math.min(y, window.innerHeight - 150);

  return (
    <div
      ref={menuRef}
      className="te-context-menu"
      style={{
        position: 'fixed',
        top: adjustedY,
        left: adjustedX,
        zIndex: 9999,
        backgroundColor: 'white',
        borderRadius: 6,
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        border: '1px solid #e0e0e0',
        minWidth: 240,
        overflow: 'hidden',
      }}
    >
      <div
        className="te-context-menu-item"
        onClick={() => { onAddRowSameColor(itemId); onClose(); }}
        style={{
          padding: '10px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          borderBottom: '1px solid #f0f0f0',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
      >
        {itemColorHex && (
          <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: itemColorHex, border: '1px solid rgba(0,0,0,0.15)' }} />
        )}
        <span>Add row with same color</span>
      </div>

      <div
        className="te-context-menu-item"
        onClick={() => { onAddRowNewColor(itemId); onClose(); }}
        style={{
          padding: '10px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          borderBottom: '1px solid #f0f0f0',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
      >
        <div style={{
          width: 14, height: 14, borderRadius: 3,
          background: 'linear-gradient(135deg, #FF6B6B, #4FC3F7, #AED581)',
          border: '1px solid rgba(0,0,0,0.15)',
        }} />
        <span>Add row with new color</span>
      </div>

      <div
        className="te-context-menu-item"
        onClick={() => { onDeleteRow(itemId); onClose(); }}
        style={{
          padding: '10px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          color: '#c41e3a',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
      >
        <span style={{ fontSize: 15 }}>x</span>
        <span>Delete Row</span>
      </div>
    </div>
  );
};

export { COLOR_PALETTE };
export default TrustExpenseContextMenu;
