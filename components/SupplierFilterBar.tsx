import React, { useState, useEffect, useRef } from 'react';
import { TYPE_ORDER } from '../types';
import { getContainerNames } from '../lib/containers';

export interface SupplierFilterConfig {
  types: string[];
  statuses: string[];
  containers: string[];
  quickBook: string[];
  payment: string[];
  halves: string[]; // Tokens like "2026:FIRST_HALF" or "UNASSIGNED"
}

export const EMPTY_SUPPLIER_FILTER: SupplierFilterConfig = {
  types: [],
  statuses: [],
  containers: [],
  quickBook: [],
  payment: [],
  halves: [],
};

// Dropdown options derived from the items actually present in the active sheet
export interface SupplierFilterOptions {
  types: string[];
  statuses: string[];
  containers: string[];
  halves: string[];
}

export const EMPTY_SUPPLIER_FILTER_OPTIONS: SupplierFilterOptions = {
  types: [],
  statuses: [],
  containers: [],
  halves: [],
};

const HALF_LABELS: Record<string, string> = {
  FIRST_HALF: 'First Half',
  SECOND_HALF: 'Second Half',
};

export function formatHalfToken(token: string): string {
  if (token === 'UNASSIGNED') return 'Unassigned';
  const [year, half] = token.split(':');
  return `${year} ${HALF_LABELS[half] || half}`;
}

/** Half filter is project-level: does this project's year/half token match the selection? */
export function projectMatchesHalfFilter(
  project: { halfOfYear?: string | null; halfYear?: number | null },
  halves: string[],
): boolean {
  if (!halves || halves.length === 0) return true;
  const token = (project.halfOfYear && project.halfYear)
    ? `${project.halfYear}:${project.halfOfYear}`
    : 'UNASSIGNED';
  return halves.includes(token);
}

// Status display → backend enum reverse mapping
const STATUS_DISPLAY_TO_BACKEND: Record<string, string> = {
  'HOLD / T': 'HOLD_T',
  'HOLD / PM': 'HOLD_PM',
  'HOLD BOOKS': 'HOLD_BOOKS',
  'NOT ORDERED': 'NOT_ORDERED',
  'TO ORDER': 'TO_ORDER',
  'BOOKS IN PROGRESS': 'BOOKS_IN_PROGRESS',
  'ORDERED': 'ORDERED',
  'WAITING PAYMENT': 'WAITING_PAYMENT',
  'ASSEMBLY': 'ASSEMBLY',
  'READY TO RECEIVE': 'READY_TO_RECEIVE',
  'RECEIVED': 'RECEIVED',
  'READY': 'READY',
  'SENT TO TLINES': 'SENT_TO_TLINES',
  'PARTIAL SENT': 'PARTIAL_SENT',
  'SENT': 'SENT',
};

export function hasActiveSupplierFilters(f: SupplierFilterConfig): boolean {
  return f.types.length > 0 || f.statuses.length > 0 || f.containers.length > 0 ||
    f.quickBook.length > 0 || f.payment.length > 0 || (f.halves?.length || 0) > 0;
}

/**
 * Check if a single backend item passes the supplier filters.
 * Item fields: type (e.g. 'MILLWORK'), status (e.g. 'HOLD_T'), containerNo, quickBook, pfUsd, paidUsd1, paidUsd2
 */
export function itemPassesSupplierFilter(
  item: {
    type?: string | null;
    customType?: { name: string } | null;
    status?: string | null;
    containerNo?: string | null;
    quickBook?: string | null;
    pfUsd?: number | null;
    paidUsd1?: number | null;
    paidUsd2?: number | null;
  },
  filter: SupplierFilterConfig,
): boolean {
  // Type filter: item.type is 'MILLWORK', filter uses 'Millwork'
  if (filter.types.length > 0) {
    const itemType = item.customType?.name || item.type || '';
    const itemTypeLower = itemType.toLowerCase();
    const matches = filter.types.some(t => t.toLowerCase() === itemTypeLower);
    if (!matches) return false;
  }

  // Status filter: filter uses display format ('HOLD / T'), item uses backend enum ('HOLD_T')
  if (filter.statuses.length > 0) {
    const backendStatuses = filter.statuses.map(s => STATUS_DISPLAY_TO_BACKEND[s] || s);
    if (!backendStatuses.includes(item.status || '')) return false;
  }

  // Container filter (case-insensitive: "Container 12" matches "CONTAINER 12")
  if (filter.containers.length > 0) {
    const itemContainer = (item.containerNo || '').trim().toLowerCase();
    if (!itemContainer) return false;
    if (!filter.containers.some(c => c.trim().toLowerCase() === itemContainer)) return false;
  }

  // QuickBook filter
  if (filter.quickBook.length > 0) {
    const isDone = !!item.quickBook && item.quickBook.trim() !== '';
    if (filter.quickBook.includes('done') && !filter.quickBook.includes('not_done')) {
      if (!isDone) return false;
    } else if (filter.quickBook.includes('not_done') && !filter.quickBook.includes('done')) {
      if (isDone) return false;
    }
    // If both selected, all pass — no filter needed
  }

  // Payment filter
  if (filter.payment.length > 0) {
    const pfUsd = toNum(item.pfUsd);
    const paid1 = toNum(item.paidUsd1);
    const paid2 = toNum(item.paidUsd2);
    const totalPaid = paid1 + paid2;
    const remaining = pfUsd - totalPaid;

    let paymentStatus: string;
    if (totalPaid === 0) {
      paymentStatus = 'not_paid';
    } else if (remaining <= 0) {
      paymentStatus = 'fully_paid';
    } else {
      paymentStatus = 'partially_paid';
    }

    if (!filter.payment.includes(paymentStatus)) return false;
  }

  return true;
}

function toNum(v: any): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Build dropdown options from the items actually present in the sheet,
 * so filters only offer values that exist. Deduplicated case-insensitively
 * (e.g. "Container 12" and "CONTAINER 12" become a single option).
 */
export function buildSupplierFilterOptions(
  items: Array<{
    type?: string | null;
    customType?: { name: string } | null;
    status?: string | null;
    containerNo?: string | null;
  }>,
): SupplierFilterOptions {
  const typeMap = new Map<string, string>();      // lowercase → display
  const statusSet = new Set<string>();            // backend enums present
  const containerMap = new Map<string, string>(); // lowercase → original casing

  for (const item of items) {
    const rawType = (item.customType?.name || item.type || '').trim();
    if (rawType) {
      const key = rawType.toLowerCase();
      if (!typeMap.has(key)) {
        // Prefer canonical TYPE_ORDER casing when it matches (MILLWORK → Millwork)
        const canonical = TYPE_ORDER.find(t => t.toLowerCase() === key);
        typeMap.set(key, canonical || rawType);
      }
    }
    if (item.status) statusSet.add(item.status);
    const container = (item.containerNo || '').trim();
    if (container) {
      const key = container.toLowerCase();
      if (!containerMap.has(key)) containerMap.set(key, container);
    }
  }

  const typeOrderLower = TYPE_ORDER.map(t => t.toLowerCase());
  const types = [...typeMap.values()].sort((a, b) => {
    const ai = typeOrderLower.indexOf(a.toLowerCase());
    const bi = typeOrderLower.indexOf(b.toLowerCase());
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  const statuses = STATUS_OPTIONS.filter(s => statusSet.has(STATUS_DISPLAY_TO_BACKEND[s] || s));

  const containers = [...containerMap.values()].sort((a, b) => {
    const aMatch = a.match(/^Container (\d+)$/i);
    const bMatch = b.match(/^Container (\d+)$/i);
    if (aMatch && bMatch) return parseInt(aMatch[1]) - parseInt(bMatch[1]);
    if (aMatch) return -1;
    if (bMatch) return 1;
    return a.localeCompare(b);
  });

  return { types, statuses, containers, halves: [] };
}

interface SupplierFilterBarProps {
  filterConfig: SupplierFilterConfig;
  onFilterChange: (config: SupplierFilterConfig) => void;
  /** When provided, dropdowns only show these values (built from the active sheet's items) */
  options?: SupplierFilterOptions;
}

const STATUS_OPTIONS = [
  'HOLD / T',
  'HOLD / PM',
  'HOLD BOOKS',
  'NOT ORDERED',
  'TO ORDER',
  'BOOKS IN PROGRESS',
  'ORDERED',
  'WAITING PAYMENT',
  'ASSEMBLY',
  'READY TO RECEIVE',
  'RECEIVED',
  'READY',
  'SENT TO TLINES',
  'PARTIAL SENT',
  'SENT'
];

const QUICKBOOK_OPTIONS = [
  { value: 'done', label: 'Done' },
  { value: 'not_done', label: 'Not Done' },
];

const PAYMENT_OPTIONS = [
  { value: 'fully_paid', label: 'Fully Paid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'not_paid', label: 'Not Paid' },
];

const DEFAULT_CONTAINERS = Array.from({ length: 20 }, (_, i) => `Container ${i + 1}`);

const CHIP_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  type: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
  status: { bg: '#fffbeb', border: '#fde68a', text: '#b45309' },
  container: { bg: '#fdf4ff', border: '#e9d5ff', text: '#7e22ce' },
  quickBook: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  payment: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
  half: { bg: '#ecfeff', border: '#a5f3fc', text: '#0e7490' },
};

// Dropdown component with search and multi-select
const FilterDropdown: React.FC<{
  label: string;
  icon: string;
  options: { value: string; label: string; selected: boolean }[];
  colorKey: string;
  selectedCount: number;
  onToggle: (value: string) => void;
  onClear: () => void;
}> = ({ label, icon, options, colorKey, selectedCount, onToggle, onClear }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const colors = CHIP_COLORS[colorKey];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '34px',
          padding: '0 12px',
          border: selectedCount > 0 ? `1.5px solid ${colors.border}` : '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: selectedCount > 0 ? 600 : 400,
          color: selectedCount > 0 ? colors.text : '#4b5563',
          backgroundColor: selectedCount > 0 ? colors.bg : '#fff',
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '14px' }}>{icon}</span>
        <span>{label}</span>
        {selectedCount > 0 && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: colors.text,
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
          }}>
            {selectedCount}
          </span>
        )}
        <span style={{ fontSize: '10px', marginLeft: '2px', opacity: 0.6 }}>
          {open ? '\u25B2' : '\u25BC'}
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '4px',
          width: '240px',
          maxHeight: '320px',
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Search input */}
          <div style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              style={{
                width: '100%',
                height: '30px',
                padding: '0 8px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Clear all */}
          {selectedCount > 0 && (
            <button
              onClick={() => { onClear(); setSearch(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                width: '100%',
                padding: '7px 12px',
                border: 'none',
                borderBottom: '1px solid #f3f4f6',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              Clear all ({selectedCount})
            </button>
          )}

          {/* Options list */}
          <div style={{ overflowY: 'auto', maxHeight: '240px' }}>
            {filtered.map(opt => (
              <button
                key={opt.value}
                onClick={() => onToggle(opt.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '7px 12px',
                  border: 'none',
                  backgroundColor: opt.selected ? colors.bg : 'transparent',
                  color: '#1f2937',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => {
                  if (!opt.selected) (e.target as HTMLElement).style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.backgroundColor = opt.selected ? colors.bg : 'transparent';
                }}
              >
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '16px',
                  height: '16px',
                  borderRadius: '3px',
                  border: opt.selected ? `2px solid ${colors.text}` : '2px solid #d1d5db',
                  backgroundColor: opt.selected ? colors.text : '#fff',
                  flexShrink: 0,
                  transition: 'all 0.1s',
                }}>
                  {opt.selected && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4.5 7.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {opt.label}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                No results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Compact chip tag for active filters
const ChipTag: React.FC<{
  label: string;
  colorKey: string;
  onRemove: () => void;
}> = ({ label, colorKey, onRemove }) => {
  const colors = CHIP_COLORS[colorKey];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '3px 8px 3px 10px',
      backgroundColor: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: '14px',
      fontSize: '12px',
      fontWeight: 500,
      color: colors.text,
      whiteSpace: 'nowrap',
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'transparent',
          color: colors.text,
          cursor: 'pointer',
          fontSize: '13px',
          lineHeight: 1,
          padding: 0,
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = colors.border)}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {'\u00d7'}
      </button>
    </span>
  );
};

const SupplierFilterBar: React.FC<SupplierFilterBarProps> = ({
  filterConfig,
  onFilterChange,
  options,
}) => {
  const [containerNames, setContainerNames] = useState<string[]>([]);

  // Legacy fallback: only fetch the global container list when the parent
  // does not provide options built from the actual sheet items
  useEffect(() => {
    if (options !== undefined) return;
    const loadContainers = async () => {
      try {
        const dbContainers = await getContainerNames();
        const allNames = new Set([...DEFAULT_CONTAINERS, ...dbContainers]);
        setContainerNames(
          [...allNames].sort((a, b) => {
            const aMatch = a.match(/^Container (\d+)$/i);
            const bMatch = b.match(/^Container (\d+)$/i);
            if (aMatch && bMatch) return parseInt(aMatch[1]) - parseInt(bMatch[1]);
            if (aMatch) return -1;
            if (bMatch) return 1;
            return a.localeCompare(b);
          })
        );
      } catch (error) {
        console.error('Failed to load container names:', error);
      }
    };
    loadContainers();
  }, [options !== undefined]);

  const toggle = (key: keyof SupplierFilterConfig, value: string) => {
    const current = filterConfig[key];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFilterChange({ ...filterConfig, [key]: updated });
  };

  const hasActiveFilters = filterConfig.types.length > 0 ||
    filterConfig.statuses.length > 0 ||
    filterConfig.containers.length > 0 ||
    filterConfig.quickBook.length > 0 ||
    filterConfig.payment.length > 0 ||
    (filterConfig.halves?.length || 0) > 0;

  const totalActiveCount = filterConfig.types.length +
    filterConfig.statuses.length +
    filterConfig.containers.length +
    filterConfig.quickBook.length +
    filterConfig.payment.length +
    (filterConfig.halves?.length || 0);

  // When options are provided, only offer values that exist in the sheet
  const typeOptions = (options ? options.types : [...TYPE_ORDER]).map(t => ({
    value: t,
    label: t,
    selected: filterConfig.types.includes(t),
  }));

  const statusOptions = (options ? options.statuses : STATUS_OPTIONS).map(s => ({
    value: s,
    label: s,
    selected: filterConfig.statuses.includes(s),
  }));

  const containerOptions = (options ? options.containers : containerNames).map(c => ({
    value: c,
    label: c,
    selected: filterConfig.containers.includes(c),
  }));

  const quickBookOptions = QUICKBOOK_OPTIONS.map(o => ({
    value: o.value,
    label: o.label,
    selected: filterConfig.quickBook.includes(o.value),
  }));

  const paymentOptions = PAYMENT_OPTIONS.map(o => ({
    value: o.value,
    label: o.label,
    selected: filterConfig.payment.includes(o.value),
  }));

  const halfOptions = (options?.halves || []).map(token => ({
    value: token,
    label: formatHalfToken(token),
    selected: (filterConfig.halves || []).includes(token),
  }));

  const clearAllFilters = () => {
    onFilterChange({ ...EMPTY_SUPPLIER_FILTER });
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      borderBottom: '1px solid #e5e7eb',
      padding: '10px 20px',
    }}>
      {/* Top row: dropdowns */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
      }}>
        {/* Filter icon + label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#6b7280',
          fontSize: '13px',
          fontWeight: 500,
          userSelect: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1.5 3h13M3.5 6.5h9M5.5 10h5M7 13.5h2" strokeLinecap="round"/>
          </svg>
          Filters
        </div>

        <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb' }} />

        <FilterDropdown
          label="Type"
          icon=""
          colorKey="type"
          options={typeOptions}
          selectedCount={filterConfig.types.length}
          onToggle={v => toggle('types', v)}
          onClear={() => onFilterChange({ ...filterConfig, types: [] })}
        />

        <FilterDropdown
          label="Status"
          icon=""
          colorKey="status"
          options={statusOptions}
          selectedCount={filterConfig.statuses.length}
          onToggle={v => toggle('statuses', v)}
          onClear={() => onFilterChange({ ...filterConfig, statuses: [] })}
        />

        <FilterDropdown
          label="Container"
          icon=""
          colorKey="container"
          options={containerOptions}
          selectedCount={filterConfig.containers.length}
          onToggle={v => toggle('containers', v)}
          onClear={() => onFilterChange({ ...filterConfig, containers: [] })}
        />

        <FilterDropdown
          label="QuickBook"
          icon=""
          colorKey="quickBook"
          options={quickBookOptions}
          selectedCount={filterConfig.quickBook.length}
          onToggle={v => toggle('quickBook', v)}
          onClear={() => onFilterChange({ ...filterConfig, quickBook: [] })}
        />

        <FilterDropdown
          label="Payment"
          icon=""
          colorKey="payment"
          options={paymentOptions}
          selectedCount={filterConfig.payment.length}
          onToggle={v => toggle('payment', v)}
          onClear={() => onFilterChange({ ...filterConfig, payment: [] })}
        />

        <FilterDropdown
          label="Half"
          icon=""
          colorKey="half"
          options={halfOptions}
          selectedCount={(filterConfig.halves || []).length}
          onToggle={v => toggle('halves', v)}
          onClear={() => onFilterChange({ ...filterConfig, halves: [] })}
        />

        {/* Clear all button */}
        {hasActiveFilters && (
          <>
            <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb' }} />
            <button
              onClick={clearAllFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                height: '34px',
                padding: '0 12px',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#dc2626',
                backgroundColor: '#fef2f2',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              Clear all
            </button>
          </>
        )}

        <div style={{ flex: 1 }} />

        {hasActiveFilters && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#6b7280',
            whiteSpace: 'nowrap',
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '20px',
              height: '20px',
              padding: '0 6px',
              borderRadius: '10px',
              backgroundColor: '#f3f4f6',
              fontSize: '12px',
              fontWeight: 600,
              color: '#374151',
            }}>
              {totalActiveCount}
            </span>
            active filters
          </div>
        )}
      </div>

      {/* Active filter chips row */}
      {hasActiveFilters && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid #f3f4f6',
        }}>
          {filterConfig.types.map(type => (
            <ChipTag
              key={`t-${type}`}
              label={type}
              colorKey="type"
              onRemove={() => toggle('types', type)}
            />
          ))}
          {filterConfig.statuses.map(status => (
            <ChipTag
              key={`s-${status}`}
              label={status}
              colorKey="status"
              onRemove={() => toggle('statuses', status)}
            />
          ))}
          {filterConfig.containers.map(container => (
            <ChipTag
              key={`c-${container}`}
              label={container}
              colorKey="container"
              onRemove={() => toggle('containers', container)}
            />
          ))}
          {filterConfig.quickBook.map(qb => (
            <ChipTag
              key={`qb-${qb}`}
              label={QUICKBOOK_OPTIONS.find(o => o.value === qb)?.label || qb}
              colorKey="quickBook"
              onRemove={() => toggle('quickBook', qb)}
            />
          ))}
          {filterConfig.payment.map(p => (
            <ChipTag
              key={`p-${p}`}
              label={PAYMENT_OPTIONS.find(o => o.value === p)?.label || p}
              colorKey="payment"
              onRemove={() => toggle('payment', p)}
            />
          ))}
          {(filterConfig.halves || []).map(half => (
            <ChipTag
              key={`h-${half}`}
              label={formatHalfToken(half)}
              colorKey="half"
              onRemove={() => toggle('halves', half)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SupplierFilterBar;
