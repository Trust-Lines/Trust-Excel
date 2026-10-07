import React, { useState, useEffect, useRef } from 'react';
import { ProjectType, TYPE_ORDER } from '../types';
import { getVendors } from '../lib/projects';
import TodayPfControl from './TodayPfControl';
import SignWaitingFilters, { SignWaitingToken, SIGN_WAITING_OPTIONS } from './SignWaitingFilters';
import PfGroupFilterControl from './PfGroupFilterControl';
import FilterEditMenu from './FilterEditMenu';
import { TodayPfFlag } from '../lib/today-pf';
import { PfGroup } from '../lib/pf-groups';
import { useAuth } from '../contexts/AuthContext';

export interface FilterConfig {
  vendors: string[];
  vendorCodes?: string[];
  types: ProjectType[];
  statuses: string[];
  containers: string[];
  halves?: string[]; // Tokens like "2026:FIRST_HALF" or "UNASSIGNED"
  todayPfOnly?: boolean; // Only show projects/types flagged in "Today's PFs"
  followUpOnly?: boolean; // Only show PFs flagged in "Follow Up" (combines with the other flag lists)
  signWaiting?: SignWaitingToken[]; // PO/PF "waiting to sign" quick filters (any-of)
  groupViewOnly?: boolean; // Only show projects/types that belong to a group (same table, group/rank badges added)
}

interface FilterBarProps {
  filterConfig: FilterConfig;
  onFilterChange: (config: FilterConfig) => void;
  totalItems: number;
  filteredItems: number;
  availableContainers?: string[]; // When provided, use these instead of fetching from DB
  availableHalves?: string[]; // Distinct "year:half" tokens present in the data
  matchingProjectCount?: number; // Projects passing all active filters (drives the Half badge count)
  showTodayPf?: boolean; // Projects tab only
  onTodayPfFlagsChange?: (flags: TodayPfFlag[]) => void;
  pfGroups?: PfGroup[];
}

const HALF_LABELS: Record<string, string> = {
  FIRST_HALF: 'First Half',
  SECOND_HALF: 'Second Half',
};

export const formatHalfToken = (token: string): string => {
  if (token === 'UNASSIGNED') return 'Unassigned';
  const [year, half] = token.split(':');
  return `${year} ${HALF_LABELS[half] || half}`;
};

interface Vendor {
  id: string;
  name: string;
  code: string;
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


// Color schemes for each filter category
const CHIP_COLORS: Record<string, { bg: string; border: string; text: string; hoverBg: string }> = {
  vendor: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', hoverBg: '#dbeafe' },
  type: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', hoverBg: '#dcfce7' },
  status: { bg: '#fffbeb', border: '#fde68a', text: '#b45309', hoverBg: '#fef3c7' },
  container: { bg: '#fdf4ff', border: '#e9d5ff', text: '#7e22ce', hoverBg: '#f3e8ff' },
  half: { bg: '#ecfeff', border: '#a5f3fc', text: '#0e7490', hoverBg: '#cffafe' },
  todayPf: { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', hoverBg: '#ffedd5' },
  followUp: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', hoverBg: '#dcfce7' },
  signWait: { bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9', hoverBg: '#ede9fe' },
  pfGroup: { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', hoverBg: '#fee2e2' },
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

const FilterBar: React.FC<FilterBarProps> = ({
  filterConfig,
  onFilterChange,
  availableContainers,
  availableHalves,
  matchingProjectCount,
  showTodayPf,
  onTodayPfFlagsChange,
  pfGroups = [],
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [containerNames, setContainerNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Single combined "Edit" entry point for Today's PFs/Follow Up and Groups —
  // each modal's open state lives here now instead of inside its own chip control.
  const { canAccessPage } = useAuth();
  const canManageTodayPf = canAccessPage('todays_pf_manage');
  const [todayManageOpen, setTodayManageOpen] = useState(false);
  const [groupManageOpen, setGroupManageOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const vendorList = await getVendors();
        setVendors(vendorList);
      } catch (error) {
        console.error('Failed to load filter data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Build container list: use availableContainers from table rows (case-insensitive deduplicated)
  useEffect(() => {
    if (availableContainers !== undefined) {
      // Deduplicate case-insensitively, keep the first occurrence's original casing
      const seen = new Map<string, string>(); // lowercase → original
      for (const c of availableContainers) {
        if (!c || !c.trim()) continue;
        const key = c.trim().toLowerCase();
        if (!seen.has(key)) seen.set(key, c.trim());
      }
      const sorted = [...seen.values()].sort((a, b) => {
        const aMatch = a.match(/^Container (\d+)$/i);
        const bMatch = b.match(/^Container (\d+)$/i);
        if (aMatch && bMatch) return parseInt(aMatch[1]) - parseInt(bMatch[1]);
        if (aMatch) return -1;
        if (bMatch) return 1;
        return a.localeCompare(b);
      });
      setContainerNames(sorted);
    }
  }, [availableContainers]);

  // Vendor toggle
  const handleVendorToggle = (vendorId: string) => {
    const newVendors = filterConfig.vendors.includes(vendorId)
      ? filterConfig.vendors.filter(id => id !== vendorId)
      : [...filterConfig.vendors, vendorId];
    const selectedVendorCodes = newVendors
      .map(id => vendors.find(v => v.id === id)?.code)
      .filter(Boolean) as string[];
    onFilterChange({ ...filterConfig, vendors: newVendors, vendorCodes: selectedVendorCodes });
  };

  // Type toggle
  const handleTypeToggle = (type: string) => {
    const t = type as ProjectType;
    const newTypes = filterConfig.types.includes(t)
      ? filterConfig.types.filter(x => x !== t)
      : [...filterConfig.types, t];
    onFilterChange({ ...filterConfig, types: newTypes });
  };

  // Status toggle
  const handleStatusToggle = (status: string) => {
    const newStatuses = filterConfig.statuses.includes(status)
      ? filterConfig.statuses.filter(s => s !== status)
      : [...filterConfig.statuses, status];
    onFilterChange({ ...filterConfig, statuses: newStatuses });
  };

  // Container toggle
  const handleContainerToggle = (container: string) => {
    const containers = filterConfig.containers || [];
    const newContainers = containers.includes(container)
      ? containers.filter(c => c !== container)
      : [...containers, container];
    onFilterChange({ ...filterConfig, containers: newContainers });
  };

  // Half toggle
  const handleHalfToggle = (half: string) => {
    const halves = filterConfig.halves || [];
    const newHalves = halves.includes(half)
      ? halves.filter(h => h !== half)
      : [...halves, half];
    onFilterChange({ ...filterConfig, halves: newHalves });
  };

  const hasActiveFilters = filterConfig.vendors.length > 0 ||
    filterConfig.types.length > 0 ||
    filterConfig.statuses.length > 0 ||
    (filterConfig.containers?.length || 0) > 0 ||
    (filterConfig.halves?.length || 0) > 0 ||
    !!filterConfig.todayPfOnly ||
    !!filterConfig.followUpOnly ||
    !!filterConfig.groupViewOnly ||
    (filterConfig.signWaiting?.length || 0) > 0;

  const totalActiveCount = filterConfig.vendors.length +
    filterConfig.types.length +
    filterConfig.statuses.length +
    (filterConfig.containers?.length || 0) +
    (filterConfig.halves?.length || 0) +
    (filterConfig.todayPfOnly ? 1 : 0) +
    (filterConfig.followUpOnly ? 1 : 0) +
    (filterConfig.groupViewOnly ? 1 : 0) +
    (filterConfig.signWaiting?.length || 0);

  // Build vendor options
  const vendorOptions = vendors.map(v => ({
    value: v.id,
    label: `${v.code} - ${v.name}`,
    selected: filterConfig.vendors.includes(v.id),
  }));

  // Build type options
  const typeOptions = TYPE_ORDER.map(t => ({
    value: t,
    label: t,
    selected: filterConfig.types.includes(t),
  }));

  // Build status options
  const statusOptions = STATUS_OPTIONS.map(s => ({
    value: s,
    label: s,
    selected: filterConfig.statuses.includes(s),
  }));

  // Build container options (defaults + renamed ones from backend)
  const containerOptions = containerNames.map(c => ({
    value: c,
    label: c,
    selected: (filterConfig.containers || []).includes(c),
  }));

  // Build half options from distinct year/half tokens present in the data
  const halfOptions = (availableHalves || []).map(token => ({
    value: token,
    label: formatHalfToken(token),
    selected: (filterConfig.halves || []).includes(token),
  }));

  // Badge shows how many projects match the active Half filter (not how many
  // half values are selected) — e.g. "14" projects, not "1" selected option.
  const halfSelectedCount = (filterConfig.halves || []).length > 0
    ? (matchingProjectCount ?? (filterConfig.halves || []).length)
    : 0;

  // Remove single chip helpers
  const removeVendorChip = (vendorId: string) => {
    const newVendors = filterConfig.vendors.filter(id => id !== vendorId);
    const selectedVendorCodes = newVendors
      .map(id => vendors.find(v => v.id === id)?.code)
      .filter(Boolean) as string[];
    onFilterChange({ ...filterConfig, vendors: newVendors, vendorCodes: selectedVendorCodes });
  };

  const removeTypeChip = (type: ProjectType) => {
    onFilterChange({ ...filterConfig, types: filterConfig.types.filter(t => t !== type) });
  };

  const removeStatusChip = (status: string) => {
    onFilterChange({ ...filterConfig, statuses: filterConfig.statuses.filter(s => s !== status) });
  };

  const removeContainerChip = (container: string) => {
    onFilterChange({ ...filterConfig, containers: (filterConfig.containers || []).filter(c => c !== container) });
  };

  const removeHalfChip = (half: string) => {
    onFilterChange({ ...filterConfig, halves: (filterConfig.halves || []).filter(h => h !== half) });
  };

  const clearAllFilters = () => {
    onFilterChange({ vendors: [], vendorCodes: [], types: [], statuses: [], containers: [], halves: [], todayPfOnly: false, followUpOnly: false, signWaiting: [], groupViewOnly: false });
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 'var(--filterbar-top)',
      zIndex: 'var(--z-filterbar)' as any,
      padding: '10px 20px',
    }}>
      {/* Top row: dropdowns + count */}
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

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb' }} />

        {/* Filter dropdowns */}
        <FilterDropdown
          label={isLoading ? 'Loading...' : 'Vendor'}
          icon=""
          colorKey="vendor"
          options={vendorOptions}
          selectedCount={filterConfig.vendors.length}
          onToggle={handleVendorToggle}
          onClear={() => onFilterChange({ ...filterConfig, vendors: [], vendorCodes: [] })}
        />

        <FilterDropdown
          label="Type"
          icon=""
          colorKey="type"
          options={typeOptions}
          selectedCount={filterConfig.types.length}
          onToggle={handleTypeToggle}
          onClear={() => onFilterChange({ ...filterConfig, types: [] })}
        />

        <FilterDropdown
          label="Status"
          icon=""
          colorKey="status"
          options={statusOptions}
          selectedCount={filterConfig.statuses.length}
          onToggle={handleStatusToggle}
          onClear={() => onFilterChange({ ...filterConfig, statuses: [] })}
        />

        <FilterDropdown
          label="Container"
          icon=""
          colorKey="container"
          options={containerOptions}
          selectedCount={(filterConfig.containers || []).length}
          onToggle={handleContainerToggle}
          onClear={() => onFilterChange({ ...filterConfig, containers: [] })}
        />

        <FilterDropdown
          label="Half"
          icon=""
          colorKey="half"
          options={halfOptions}
          selectedCount={halfSelectedCount}
          onToggle={handleHalfToggle}
          onClear={() => onFilterChange({ ...filterConfig, halves: [] })}
        />

        {showTodayPf && (
          <FilterEditMenu
            items={[
              ...(canManageTodayPf ? [{ key: 'todayPf', label: "Today's PFs & Follow Up", onClick: () => setTodayManageOpen(true) }] : []),
              { key: 'groups', label: 'Groups', onClick: () => setGroupManageOpen(true) },
            ]}
          />
        )}

        {showTodayPf && (
          <TodayPfControl
            pfActive={!!filterConfig.todayPfOnly}
            onTogglePf={() => onFilterChange({ ...filterConfig, todayPfOnly: !filterConfig.todayPfOnly })}
            followActive={!!filterConfig.followUpOnly}
            onToggleFollow={() => onFilterChange({ ...filterConfig, followUpOnly: !filterConfig.followUpOnly })}
            onFlagsChange={onTodayPfFlagsChange}
            manageOpen={todayManageOpen}
            onManageOpenChange={setTodayManageOpen}
          />
        )}

        <SignWaitingFilters
          value={filterConfig.signWaiting || []}
          onChange={next => onFilterChange({ ...filterConfig, signWaiting: next })}
        />

        {showTodayPf && (
          <PfGroupFilterControl
            active={!!filterConfig.groupViewOnly}
            onToggle={() => onFilterChange({ ...filterConfig, groupViewOnly: !filterConfig.groupViewOnly })}
            groups={pfGroups}
            manageOpen={groupManageOpen}
            onManageOpenChange={setGroupManageOpen}
          />
        )}

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

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Result count */}
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
          {/* Vendor chips */}
          {filterConfig.vendors.map(vendorId => {
            const vendor = vendors.find(v => v.id === vendorId);
            if (!vendor) return null;
            return (
              <ChipTag
                key={`v-${vendorId}`}
                label={vendor.code}
                colorKey="vendor"
                onRemove={() => removeVendorChip(vendorId)}
              />
            );
          })}

          {/* Type chips */}
          {filterConfig.types.map(type => (
            <ChipTag
              key={`t-${type}`}
              label={type}
              colorKey="type"
              onRemove={() => removeTypeChip(type)}
            />
          ))}

          {/* Status chips */}
          {filterConfig.statuses.map(status => (
            <ChipTag
              key={`s-${status}`}
              label={status}
              colorKey="status"
              onRemove={() => removeStatusChip(status)}
            />
          ))}

          {/* Container chips */}
          {(filterConfig.containers || []).map(container => (
            <ChipTag
              key={`c-${container}`}
              label={container}
              colorKey="container"
              onRemove={() => removeContainerChip(container)}
            />
          ))}

          {/* Half chips */}
          {(filterConfig.halves || []).map(half => (
            <ChipTag
              key={`h-${half}`}
              label={formatHalfToken(half)}
              colorKey="half"
              onRemove={() => removeHalfChip(half)}
            />
          ))}

          {/* Today's PFs chip */}
          {filterConfig.todayPfOnly && (
            <ChipTag
              label="ToDo"
              colorKey="todayPf"
              onRemove={() => onFilterChange({ ...filterConfig, todayPfOnly: false })}
            />
          )}
          {filterConfig.followUpOnly && (
            <ChipTag
              label="Receive Follow Up"
              colorKey="followUp"
              onRemove={() => onFilterChange({ ...filterConfig, followUpOnly: false })}
            />
          )}
          {(filterConfig.signWaiting || []).map(tok => (
            <ChipTag
              key={tok}
              label={SIGN_WAITING_OPTIONS.find(o => o.token === tok)?.label || tok}
              colorKey="signWait"
              onRemove={() => onFilterChange({ ...filterConfig, signWaiting: (filterConfig.signWaiting || []).filter(t => t !== tok) })}
            />
          ))}
          {filterConfig.groupViewOnly && (
            <ChipTag
              label="Groups"
              colorKey="pfGroup"
              onRemove={() => onFilterChange({ ...filterConfig, groupViewOnly: false })}
            />
          )}
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

export default FilterBar;
