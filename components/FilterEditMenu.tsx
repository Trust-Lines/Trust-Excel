import React, { useState, useRef, useEffect } from 'react';

interface EditMenuItem {
  key: string;
  label: string;
  onClick: () => void;
}

interface FilterEditMenuProps {
  items: EditMenuItem[];
}

/**
 * One combined "Edit" entry point for the filter bar, instead of a separate
 * bare pencil icon next to every manageable chip cluster (Today's PFs / Follow
 * Up, Groups, ...). Clicking it opens a small menu listing whichever of those
 * the current user can manage; each item opens that feature's own modal.
 */
const FilterEditMenu: React.FC<FilterEditMenuProps> = ({ items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Edit"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '34px',
          padding: '0 12px',
          border: open ? '1.5px solid #93c5fd' : '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          color: open ? '#1d4ed8' : '#374151',
          backgroundColor: open ? '#eff6ff' : '#fff',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Edit</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '4px',
          minWidth: '220px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.12)', zIndex: 1000, overflow: 'hidden',
        }}>
          {items.map(item => (
            <button
              key={item.key}
              onClick={() => { setOpen(false); item.onClick(); }}
              style={{
                display: 'block', width: '100%', padding: '10px 14px', border: 'none', background: 'none',
                textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: '#374151',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterEditMenu;
