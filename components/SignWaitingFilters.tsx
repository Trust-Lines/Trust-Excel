import React from 'react';

export type SignWaitingToken = 'PO_TLINES' | 'PO_T' | 'PF_T' | 'TO_ORDER' | 'BOOKS_IN_PROGRESS';

export const SIGN_WAITING_OPTIONS: { token: SignWaitingToken; label: string; title: string; bg: string; border: string; text: string }[] = [
  { token: 'PO_TLINES', label: 'PO Waiting TLines', title: 'PO status: WAITING TLINES TO SIGN', bg: '#fff7ed', border: '#fdba74', text: '#c2410c' },
  { token: 'PO_T', label: 'PO Waiting T', title: 'PO status: WAITING T TO SIGN', bg: '#f5f3ff', border: '#c4b5fd', text: '#6d28d9' },
  { token: 'PF_T', label: 'PF Waiting T', title: 'PF status: WAITING T TO SIGN', bg: '#f5f3ff', border: '#c4b5fd', text: '#6d28d9' },
  { token: 'TO_ORDER', label: 'To Order', title: 'Status: TO ORDER', bg: '#fff1f2', border: '#fda4af', text: '#be123c' },
  { token: 'BOOKS_IN_PROGRESS', label: 'Books in Progress', title: 'Status: BOOKS IN PROGRESS', bg: '#f0f9ff', border: '#7dd3fc', text: '#0369a1' },
];

interface SignWaitingFiltersProps {
  value: SignWaitingToken[];
  onChange: (next: SignWaitingToken[]) => void;
}

/** Three independent toggle chips; any combination can be active at once (rows matching ANY active chip are kept). */
const SignWaitingFilters: React.FC<SignWaitingFiltersProps> = ({ value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    {SIGN_WAITING_OPTIONS.map(o => {
      const active = value.includes(o.token);
      return (
        <button
          key={o.token}
          title={o.title}
          onClick={() => onChange(active ? value.filter(t => t !== o.token) : [...value, o.token])}
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '34px',
            padding: '0 12px',
            border: active ? `1.5px solid ${o.border}` : '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: active ? 600 : 400,
            color: active ? o.text : '#4b5563',
            backgroundColor: active ? o.bg : '#fff',
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

export default SignWaitingFilters;
