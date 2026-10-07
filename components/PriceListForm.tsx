import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────

export interface PriceListItem {
  id: string;
  itemCode: string;
  description: string; // may contain HTML (hl-red spans)
  quantity: number | string;
  amount: number | string;
  taking: string;
  vendor: string;
  vendorId?: string;
}

interface VendorOption { id: string; code: string; name: string; }

export interface ItemGroup {
  id: string;
  label: string;
  items: PriceListItem[];
}

export interface SubCategory {
  id: string;
  pathSegments: string[];
  groups: ItemGroup[];
}

export interface Category {
  id: string;
  name: string;
  collapsed: boolean;
  subCategories: SubCategory[];
}

export interface PriceSignature {
  id: string;
  label: string;
}

// FIX 1B: TypeBlock wraps one red banner + its categories
export interface TypeBlock {
  id: string;
  typeLabel: string;
  categories: Category[];
}

export interface PriceForm {
  header: { to: string; projectName: string; projectNumber: string; date: string };
  typeBlocks: TypeBlock[];
  signatures: PriceSignature[];
  signatureImages?: Record<string, string>;
  approvedRoles?: Record<string, string>; // role → userName, approved locally before save
}

interface LookupMap {
  category: string[];
  subcategory_part: string[];
  group_label: string[];
  item_code: string[];
  taking: string[];
  type_label: string[];
}

interface ItemCodeData {
  description: string;
  descriptionFormatted?: string;
  amount: string;
}

interface ApprovalStatus {
  id?: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  userName?: string;
  note?: string;
  signedAt?: string;
  signatureImage?: string | null;
}

interface Props {
  form: PriceForm;
  onChange: (form: PriceForm) => void;
  projectId: string;
  type: string;
  entryId: string | null;
  onSaved: (entryId: string, dropboxPath: string | null) => void;
  onBack: () => void;
  logoUrl?: string | null; // FIX 2
}

// ── Helpers ────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

export const newItem = (): PriceListItem => ({
  id: uid(), itemCode: '', description: '', quantity: '', amount: '', taking: '', vendor: '', vendorId: undefined,
});

const newGroup = (): ItemGroup => ({ id: uid(), label: '', items: [newItem()] });
const newSubCat = (): SubCategory => ({ id: uid(), pathSegments: [''], groups: [newGroup()] });
export const newCategory = (name = ''): Category => ({ id: uid(), name, collapsed: false, subCategories: [newSubCat()] });

// FIX 5: Updated signature labels (no EXECUTIVE MANAGER)
const SIG_LABELS = [
  'Production Manager',
  'Project Manager',
  'Sales & Coordination',
  'T Lines Project Manager',
  'T Lines General Manager',
];

export const buildDefaultForm = (project: any, _type: string): PriceForm => ({
  header: {
    to: bucketLabel(project?.bucket ?? ''),
    projectName: project?.address ?? '',
    projectNumber: project?.projectNo ?? '',
    date: new Date().toLocaleDateString('en-US').replace(/\//g, '.'),
  },
  typeBlocks: [{ id: uid(), typeLabel: '', categories: [newCategory('Category 1')] }],
  signatures: SIG_LABELS.map(label => ({ id: uid(), label })),
});

function bucketLabel(bucket: string): string {
  return (bucket ?? '').replace('TLINES_', 'T LINES ').replace(/_/g, ' ');
}

const calcTotal = (q: any, a: any): number =>
  (parseFloat(String(q ?? 0)) || 0) * (parseFloat(String(a ?? 0)) || 0);

const fmtMoney = (v: number) =>
  v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Design tokens ──────────────────────────────────────────────────────────

const C = {
  border: '#e2e8f0', bg: '#f8fafc', blue: '#2563eb', red: '#d32f2f',
  green: '#16a34a', gold: '#f5a623', slate: '#475569', muted: '#94a3b8',
  text: '#1e293b', white: '#ffffff', dark: '#1e293b', greyStrip: '#4a4a4a',
  subBg: '#bdbdbd',
};

const inputSm: React.CSSProperties = {
  width: '100%', padding: '4px 6px', border: `1px solid ${C.border}`,
  borderRadius: 4, fontSize: 11, background: 'white', outline: 'none',
  boxSizing: 'border-box',
};

// ── Autocomplete ───────────────────────────────────────────────────────────

interface ACProps {
  value: string;
  suggestions: string[];
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  disabled?: boolean;
}

const AC: React.FC<ACProps> = ({ value, suggestions, onChange, onBlur, placeholder, style, inputStyle, disabled }) => {
  const [open, setOpen] = useState(false);
  const filtered = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s !== value).slice(0, 12);
  return (
    <div style={{ position: 'relative', ...style }}>
      <input
        value={value}
        disabled={disabled}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => { setTimeout(() => setOpen(false), 150); onBlur?.(); }}
        placeholder={placeholder}
        style={{ ...inputSm, width: '100%', ...inputStyle }}
      />
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: `1px solid ${C.border}`, borderRadius: 5, zIndex: 200, maxHeight: 160, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,.12)' }}>
          {filtered.map(s => (
            <div key={s} onMouseDown={() => { onChange(s); setOpen(false); }}
              style={{ padding: '6px 8px', fontSize: 11, cursor: 'pointer', color: C.text }}
              onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Vendor selector ────────────────────────────────────────────────────────

const VendorSelect: React.FC<{ value: string; vendorId?: string; vendors: VendorOption[]; onSelect: (v: VendorOption | null) => void }> = ({ value, vendorId, vendors, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  const filtered = search ? vendors.filter(v => v.code.toLowerCase().includes(search.toLowerCase()) || v.name.toLowerCase().includes(search.toLowerCase())) : vendors;
  const displayText = vendorId ? (vendors.find(v => v.id === vendorId) ? `${vendors.find(v => v.id === vendorId)!.code} — ${vendors.find(v => v.id === vendorId)!.name}` : value) : value;
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        <input readOnly value={displayText} onClick={() => { setSearch(''); setOpen(o => !o); }} placeholder="Vendor"
          style={{ ...inputSm, cursor: 'pointer', paddingRight: vendorId ? 18 : 6, background: vendorId ? '#eff6ff' : 'white', color: vendorId ? '#1d4ed8' : '#1e293b' }} />
        {vendorId && (
          <button type="button" onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onSelect(null); setOpen(false); }}
            style={{ position: 'absolute', right: 2, border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 10, padding: '0 2px' }}>✕</button>
        )}
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, width: 240, background: 'white', border: `1px solid ${C.border}`, borderRadius: 5, boxShadow: '0 6px 18px rgba(0,0,0,0.12)', zIndex: 2000, maxHeight: 220, display: 'flex', flexDirection: 'column' }}>
          <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Ara..."
            style={{ width: '100%', padding: '6px 8px', border: 'none', borderBottom: `1px solid ${C.border}`, fontSize: 11, outline: 'none', boxSizing: 'border-box', flexShrink: 0 }} />
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? <div style={{ padding: '8px 10px', color: C.muted, fontSize: 11 }}>Vendor bulunamadı</div> :
              filtered.map(v => (
                <div key={v.id} onMouseDown={() => { onSelect(v); setOpen(false); setSearch(''); }}
                  style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 11, background: v.id === vendorId ? '#eff6ff' : 'white' }}
                  onMouseEnter={e => { if (v.id !== vendorId) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = v.id === vendorId ? '#eff6ff' : 'white'; }}>
                  <span style={{ fontWeight: 700, color: C.slate, marginRight: 4 }}>{v.code}</span>
                  <span style={{ color: C.text }}>{v.name}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── FIX 4: Rich Text Description Editor ───────────────────────────────────

const DescriptionEditor: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}> = ({ value, onChange, onBlur }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFocused = useRef(false);

  // Only push value to DOM when not focused (avoids cursor jump)
  useEffect(() => {
    if (editorRef.current && !isFocused.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const handleHighlight = (e: React.MouseEvent) => {
    e.preventDefault();
    const editor = editorRef.current;
    if (!editor) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    try {
      const ancestor = range.commonAncestorContainer;
      const parentEl = ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentElement : ancestor as Element;
      if (parentEl?.classList.contains('hl-red')) {
        // Unwrap: replace span with its text content
        const text = document.createTextNode(parentEl.textContent ?? '');
        parentEl.replaceWith(text);
      } else {
        const span = document.createElement('span');
        span.className = 'hl-red';
        span.style.cssText = 'color:#d32f2f;font-weight:bold;';
        range.surroundContents(span);
      }
    } catch { /* complex selection — skip */ }
    sel.removeAllRanges();
    onChange(editor.innerHTML);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
        <button
          type="button"
          title="Highlight Red"
          onMouseDown={handleHighlight}
          style={{ border: `1px solid ${C.border}`, background: 'white', borderRadius: 3, padding: '1px 5px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: C.red, lineHeight: 1 }}
        >A</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => { isFocused.current = true; }}
        onBlur={() => {
          isFocused.current = false;
          const val = editorRef.current?.innerHTML ?? '';
          onChange(val);
          onBlur?.();
        }}
        onInput={() => onChange(editorRef.current?.innerHTML ?? '')}
        style={{
          minHeight: '2.4em', border: `1px solid ${C.border}`, borderRadius: 4,
          padding: '4px 6px', fontSize: 11, outline: 'none', wordBreak: 'break-word',
          lineHeight: 1.4,
        }}
      />
      <style>{`.hl-red{color:#d32f2f;font-weight:bold;}`}</style>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────

const DROPBOX_SECTIONS = ['1-Store Maker', '2-Premium Store Fitout', '3-Design & Build', '4-T Shop'];
const DROPBOX_REGIONS = ['T Lines CVW Projects', 'T Lines NE Projects', 'T Lines NW Projects', 'T Lines SE Projects'];

// Map a raw role name to one of the 5 approval roles (frontend copy of backend normaliseRole)
const normRoleForHighlight = (r: string): string | null => {
  const s = r.toLowerCase().replace(/[^a-z0-9 &]/g, ' ').replace(/\s+/g, ' ').trim();
  if (s.includes('production')) return 'Production Manager';
  if (s.includes('project manager') || s === 'project manager') return 'Project Manager';
  if (s.includes('sales')) return 'Sales & Coordination';
  if (s.includes('tlines project') || s.includes('t lines project')) return 'T Lines Project Manager';
  if (s.includes('general')) return 'T Lines General Manager';
  return null;
};

const PriceListForm: React.FC<Props> = ({ form, onChange, projectId, type, entryId, onSaved, onBack, logoUrl }) => {
  const { user, role } = useAuth();
  const myRole = normRoleForHighlight(role?.name ?? '');
  // Users with no production-role mapping (admins, etc.) can sign any slot
  const canSignAny = !!user && myRole === null;
  const [lookups, setLookups] = useState<LookupMap>({ category: [], subcategory_part: [], group_label: [], item_code: [], taking: [], type_label: [] });
  const [itemCodeMap, setItemCodeMap] = useState<Record<string, ItemCodeData>>({});
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingMode, setSavingMode] = useState<'new_version' | 'same_version'>('new_version');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedDropboxPath, setSavedDropboxPath] = useState<string | null>(null);
  const [savedItemCount, setSavedItemCount] = useState<number>(0);
  const [approvals, setApprovals] = useState<ApprovalStatus[]>([]);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const mounted = useRef(true);

  // Dropbox setup modal
  const [showDropboxModal, setShowDropboxModal] = useState(false);
  const [dropboxFields, setDropboxFields] = useState({ dropboxSection: '', dropboxRegion: '', dropboxStatus: 'Under Working' as string, dropboxClientType: 'Clients' as string, clientName: '' });
  const [dropboxSaving, setDropboxSaving] = useState(false);
  const [dropboxError, setDropboxError] = useState<string | null>(null);

  useEffect(() => {
    mounted.current = true;

    // Load lookups
    const fields = ['category', 'subcategory_part', 'group_label', 'item_code', 'taking', 'type_label'] as const;
    fields.forEach(field => {
      apiFetch(`/api/price-list/lookups?field=${encodeURIComponent(field)}`).then(r => r.json()).then((rows: any[]) => {
        if (!mounted.current) return;
        setLookups(prev => ({ ...prev, [field]: rows.map((r: any) => r.value) }));
      }).catch(() => {});
    });

    // Load item code map (desc + desc_formatted + amount)
    apiFetch('/api/price-list/lookups').then(r => r.json()).then((rows: any[]) => {
      if (!mounted.current) return;
      const map: Record<string, ItemCodeData> = {};
      rows.forEach((r: any) => {
        if (r.field.startsWith('item_desc_fmt:')) {
          const code = r.field.slice('item_desc_fmt:'.length);
          map[code] = { ...map[code], descriptionFormatted: r.value } as ItemCodeData;
        } else if (r.field.startsWith('item_desc:')) {
          const code = r.field.slice('item_desc:'.length);
          map[code] = { ...map[code], description: r.value } as ItemCodeData;
        } else if (r.field.startsWith('item_amount:')) {
          const code = r.field.slice('item_amount:'.length);
          map[code] = { ...map[code], amount: r.value } as ItemCodeData;
        }
      });
      setItemCodeMap(map);
    }).catch(() => {});

    // Load vendors
    apiFetch('/api/vendors').then(r => r.json()).then((rows: any[]) => {
      if (!mounted.current) return;
      setVendors(rows.map((v: any) => ({ id: v.id, code: v.code, name: v.name })));
    }).catch(() => {});

    // FIX 2: Fetch logo temporary link if logoUrl is a Dropbox path
    if (logoUrl) {
      apiFetch(`/api/dropbox/temporary-link?path=${encodeURIComponent(logoUrl)}`).then(r => r.json()).then(d => {
        if (d?.link && mounted.current) setLogoSrc(d.link);
      }).catch(() => {});
    }

    return () => { mounted.current = false; };
  }, [logoUrl]);

  // Load existing approvals when editing
  useEffect(() => {
    if (!entryId) return;
    apiFetch(`/api/price-list/entries/${entryId}`).then(r => r.json()).then(d => {
      if (!mounted.current) return;
      if (d?.approvals) {
        setApprovals(d.approvals.map((a: any) => ({
          id: a.id, role: a.role, status: a.status, userName: a.userName, note: a.note, signedAt: a.signedAt,
        })));
        // Sync already-approved DB rows into form.approvedRoles so boxes show correctly
        const synced: Record<string, string> = { ...(form.approvedRoles ?? {}) };
        for (const a of d.approvals) {
          if (a.status === 'approved' && a.userName && !synced[a.role]) {
            synced[a.role] = a.userName;
          }
        }
        onChange({ ...form, approvedRoles: synced });
      }
    }).catch(() => {});
  }, [entryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveLookup = (field: string, value: string) => {
    if (!value.trim()) return;
    apiFetch('/api/price-list/lookups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ field, value: value.trim() }) })
      .then(() => { setLookups(prev => ({ ...prev, [field]: prev[field as keyof LookupMap].includes(value.trim()) ? prev[field as keyof LookupMap] : [...prev[field as keyof LookupMap], value.trim()] })); }).catch(() => {});
  };

  // ── Updaters ──────────────────────────────────────────────────────────────

  const updateHeader = (field: keyof PriceForm['header'], v: string) =>
    onChange({ ...form, header: { ...form.header, [field]: v } });

  const setBlocks = useCallback((fn: (blocks: TypeBlock[]) => TypeBlock[]) => {
    onChange({ ...form, typeBlocks: fn(form.typeBlocks) });
  }, [form, onChange]);

  const updateBlock = (blockIdx: number, patch: Partial<TypeBlock>) =>
    setBlocks(bs => bs.map((b, i) => i !== blockIdx ? b : { ...b, ...patch }));

  const addBlock = () =>
    setBlocks(bs => [...bs, { id: uid(), typeLabel: '', categories: [newCategory('Category 1')] }]);

  const removeBlock = (blockIdx: number) =>
    setBlocks(bs => bs.filter((_, i) => i !== blockIdx));

  const setCats = useCallback((blockIdx: number, fn: (cats: Category[]) => Category[]) => {
    setBlocks(bs => bs.map((b, i) => i !== blockIdx ? b : { ...b, categories: fn(b.categories) }));
  }, [setBlocks]);

  const updateCat = (bi: number, catId: string, patch: Partial<Category>) =>
    setCats(bi, cats => cats.map(c => c.id !== catId ? c : { ...c, ...patch }));

  const addCat = (bi: number) => setCats(bi, cats => [...cats, newCategory('')]);
  const removeCat = (bi: number, catId: string) => setCats(bi, cats => cats.filter(c => c.id !== catId));
  const toggleCat = (bi: number, catId: string) => updateCat(bi, catId, { collapsed: !form.typeBlocks[bi]?.categories.find(c => c.id === catId)?.collapsed });

  const updateSub = (bi: number, catId: string, subId: string, patch: Partial<SubCategory>) =>
    setCats(bi, cats => cats.map(c => c.id !== catId ? c : { ...c, subCategories: c.subCategories.map(s => s.id !== subId ? s : { ...s, ...patch }) }));

  const addSub = (bi: number, catId: string) =>
    setCats(bi, cats => cats.map(c => c.id !== catId ? c : { ...c, subCategories: [...c.subCategories, newSubCat()] }));

  const removeSub = (bi: number, catId: string, subId: string) =>
    setCats(bi, cats => cats.map(c => c.id !== catId ? c : { ...c, subCategories: c.subCategories.filter(s => s.id !== subId) }));

  const updateSegment = (bi: number, catId: string, subId: string, idx: number, v: string) => {
    const sub = form.typeBlocks[bi]?.categories.find(c => c.id === catId)?.subCategories.find(s => s.id === subId);
    if (!sub) return;
    const segs = [...sub.pathSegments]; segs[idx] = v;
    updateSub(bi, catId, subId, { pathSegments: segs });
  };

  const addSegment = (bi: number, catId: string, subId: string) => {
    const sub = form.typeBlocks[bi]?.categories.find(c => c.id === catId)?.subCategories.find(s => s.id === subId);
    if (!sub) return;
    updateSub(bi, catId, subId, { pathSegments: [...sub.pathSegments, ''] });
  };

  const removeSegment = (bi: number, catId: string, subId: string, idx: number) => {
    const sub = form.typeBlocks[bi]?.categories.find(c => c.id === catId)?.subCategories.find(s => s.id === subId);
    if (!sub || sub.pathSegments.length <= 1) return;
    updateSub(bi, catId, subId, { pathSegments: sub.pathSegments.filter((_, i) => i !== idx) });
  };

  const addGroup = (bi: number, catId: string, subId: string) =>
    setCats(bi, cats => cats.map(c => c.id !== catId ? c : { ...c, subCategories: c.subCategories.map(s => s.id !== subId ? s : { ...s, groups: [...s.groups, newGroup()] }) }));

  const removeGroup = (bi: number, catId: string, subId: string, grpId: string) =>
    setCats(bi, cats => cats.map(c => c.id !== catId ? c : { ...c, subCategories: c.subCategories.map(s => s.id !== subId ? s : { ...s, groups: s.groups.filter(g => g.id !== grpId) }) }));

  const updateGroupLabel = (bi: number, catId: string, subId: string, grpId: string, label: string) =>
    setCats(bi, cats => cats.map(c => c.id !== catId ? c : { ...c, subCategories: c.subCategories.map(s => s.id !== subId ? s : { ...s, groups: s.groups.map(g => g.id !== grpId ? g : { ...g, label }) }) }));

  const updateItem = useCallback((bi: number, catId: string, subId: string, grpId: string, itemId: string, field: keyof PriceListItem, value: any) => {
    setCats(bi, cats => cats.map(c => c.id !== catId ? c : { ...c, subCategories: c.subCategories.map(s => s.id !== subId ? s : { ...s, groups: s.groups.map(g => g.id !== grpId ? g : { ...g, items: g.items.map(item => {
      if (item.id !== itemId) return item;
      const updated = { ...item, [field]: value };
      if (field === 'itemCode' && String(value).trim()) {
        const data = itemCodeMap[String(value).trim()];
        if (data) {
          // FIX 4E: restore formatted description if available
          if (data.descriptionFormatted) updated.description = data.descriptionFormatted;
          else if (data.description) updated.description = data.description;
          if (data.amount) updated.amount = data.amount;
        }
      }
      return updated;
    }) }) }) }));
  }, [setCats, itemCodeMap]);

  const selectVendor = useCallback((bi: number, catId: string, subId: string, grpId: string, itemId: string, vendor: VendorOption | null) => {
    setCats(bi, cats => cats.map(c => c.id !== catId ? c : { ...c, subCategories: c.subCategories.map(s => s.id !== subId ? s : { ...s, groups: s.groups.map(g => g.id !== grpId ? g : { ...g, items: g.items.map(item => item.id !== itemId ? item : { ...item, vendor: vendor?.name ?? '', vendorId: vendor?.id }) }) }) }));
  }, [setCats]);

  const addItem = (bi: number, catId: string, subId: string, grpId: string) =>
    setCats(bi, cats => cats.map(c => c.id !== catId ? c : { ...c, subCategories: c.subCategories.map(s => s.id !== subId ? s : { ...s, groups: s.groups.map(g => g.id !== grpId ? g : { ...g, items: [...g.items, newItem()] }) }) }));

  const removeItem = (bi: number, catId: string, subId: string, grpId: string, itemId: string) =>
    setCats(bi, cats => cats.map(c => c.id !== catId ? c : { ...c, subCategories: c.subCategories.map(s => s.id !== subId ? s : { ...s, groups: s.groups.map(g => g.id !== grpId ? g : { ...g, items: g.items.filter(i => i.id !== itemId) }) }) }));

  // Grand totals across all blocks
  const { grandTotalQty, grandTotalAmt } = (form.typeBlocks ?? []).reduce((acc, block) => {
    for (const cat of block.categories) {
      for (const sub of cat.subCategories) {
        for (const grp of sub.groups) {
          for (const item of grp.items) {
            acc.grandTotalQty += parseFloat(String(item.quantity ?? 0)) || 0;
            acc.grandTotalAmt += calcTotal(item.quantity, item.amount);
          }
        }
      }
    }
    return acc;
  }, { grandTotalQty: 0, grandTotalAmt: 0 });

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async (mode: 'new_version' | 'same_version' = 'new_version') => {
    setSaving(true); setSavingMode(mode); setSaveError(null);
    try {
      const r = await apiFetch('/api/price-list/save-and-generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, type, formData: form, entryId: entryId ?? undefined, mode }),
      });
      const d = await r.json();
      if (!r.ok) {
        const msg: string = d?.message ?? 'Save failed';
        if (msg.includes('missing Dropbox folder info')) { setShowDropboxModal(true); return; }
        throw new Error(msg);
      }
      setSavedDropboxPath(d.dropboxPath ?? null);
      setSavedItemCount(d.projectItemsCreated ?? 0);
      // Refresh approvals
      if (d.entryId) {
        apiFetch(`/api/price-list/entries/${d.entryId}`).then(r => r.json()).then(e => {
          if (e?.approvals) setApprovals(e.approvals);
        }).catch(() => {});
      }
      onSaved(d.entryId, d.dropboxPath ?? null);
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDropboxSetup = async () => {
    const { dropboxSection, dropboxRegion, dropboxStatus, dropboxClientType, clientName } = dropboxFields;
    if (!dropboxSection || !dropboxRegion || !dropboxStatus || !dropboxClientType) { setDropboxError('Lütfen tüm zorunlu alanları doldurun.'); return; }
    if (dropboxClientType === 'Clients' && !clientName.trim()) { setDropboxError('Clients tipi için Client Name gereklidir.'); return; }
    setDropboxSaving(true); setDropboxError(null);
    try {
      const r = await apiFetch(`/api/projects/${projectId}/dropbox-setup`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dropboxSection, dropboxRegion, dropboxStatus, dropboxClientType, ...(clientName.trim() ? { clientName: clientName.trim() } : {}) }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.message ?? 'Dropbox setup failed');
      setShowDropboxModal(false);
      await handleSave();
    } catch (e: any) { setDropboxError(e.message); } finally { setDropboxSaving(false); }
  };

  // ── Style helpers ─────────────────────────────────────────────────────────

  const btnSm = (color = C.blue): React.CSSProperties => ({
    border: `1px dashed ${color}`, background: 'none', color, borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap',
  });
  const rmBtn = (disabled = false): React.CSSProperties => ({
    border: 'none', background: 'none', color: disabled ? C.border : C.red, fontSize: 12, cursor: disabled ? 'default' : 'pointer', padding: '0 2px', lineHeight: 1, flexShrink: 0,
  });

  // ── Approval badge helper ─────────────────────────────────────────────────

  const getApproval = (sigLabel: string): ApprovalStatus | undefined =>
    approvals.find(a => a.role === sigLabel);

  const handleApprove = (sigLabel: string) => {
    // Toggle: click to approve, click again to unapprove
    const current = form.approvedRoles ?? {} as Record<string, string>;
    if (current[sigLabel]) {
      const next = { ...current };
      delete next[sigLabel];
      onChange({ ...form, approvedRoles: next });
    } else {
      onChange({ ...form, approvedRoles: { ...current, [sigLabel]: user?.name ?? '' } });
    }
  };

  const renderSigBox = (sigLabel: string) => {
    const a = getApproval(sigLabel);
    const isApprovedDB = a?.status === 'approved';
    const localName = (form.approvedRoles ?? {})[sigLabel] ?? null;
    const isSigned = isApprovedDB || !!localName;
    const displayName = isApprovedDB ? (a?.userName ?? '') : (localName ?? '');
    const isMySlot = myRole === sigLabel;
    const canSign = isMySlot || canSignAny;
    return (
      <div key={sigLabel}
        onClick={canSign ? () => handleApprove(sigLabel) : undefined}
        style={{ border: `2px solid ${canSign && !isSigned ? C.blue : isSigned ? '#bbf7d0' : C.border}`, borderRadius: 6, padding: '10px 10px', background: isSigned ? '#f0fdf4' : 'white', cursor: canSign ? 'pointer' : 'default', textAlign: 'center' }}
        title={canSign ? (isSigned ? 'Click to undo approval' : 'Click to approve') : ''}>
        <div style={{ fontSize: 8, fontWeight: 700, color: isSigned ? C.green : canSign ? C.blue : C.slate, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          {sigLabel}
        </div>
        <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${C.border}`, marginBottom: 6 }}>
          {isSigned
            ? <span style={{ fontFamily: 'cursive', fontSize: 17, color: C.dark }}>{displayName}</span>
            : canSign ? <span style={{ fontSize: 10, color: '#94a3b8' }}>click to approve</span>
            : null}
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, color: isSigned ? C.green : C.muted }}>
          {isSigned ? '✓ Approved' : '⏳ Pending'}
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>

      {/* ── ROW A: Logo + ITEM PRICE LIST + grey type strip ── */}
      <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 0, background: 'white' }}>
        {/* Logo: use Dropbox temporary link if available, else fall back to static asset */}
        <div style={{ width: 160, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px' }}>
          <img
            src={logoSrc ?? '/truslines-logo.png'}
            alt="TRUSlines"
            style={{ maxWidth: 130, maxHeight: 55, objectFit: 'contain' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 3, color: C.dark, textTransform: 'uppercase' }}>ITEM PRICE LIST</span>
          </div>
          <div style={{ background: C.greyStrip, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 4, color: 'white', textTransform: 'uppercase' }}>{type}</span>
          </div>
        </div>
      </div>

      {/* ── ROW B: Project info ── */}
      <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', background: 'white', display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', marginBottom: 14 }}>
        {([['to', 'TO'], ['projectName', 'PROJECT NAME'], ['projectNumber', 'PROJECT NUMBER'], ['date', 'DATE']] as const).map(([field, label], i) => (
          <div key={field} style={{ borderLeft: i > 0 ? `1px solid ${C.border}` : 'none', padding: '8px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
            <input value={form.header[field]} onChange={e => updateHeader(field, e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: field === 'projectNumber' ? 18 : 12, fontWeight: field === 'projectNumber' ? 700 : 400, color: C.dark, width: '100%', background: 'transparent' }} />
          </div>
        ))}
      </div>

      {/* ── FIX 1B: Type Blocks ── */}
      {form.typeBlocks.map((block, bi) => (
        <div key={block.id} style={{ marginBottom: 20 }}>
          {/* FIX 1B: Red type banner (editable) */}
          <div style={{ position: 'relative', marginBottom: 10, border: `1px solid ${C.border}`, borderRadius: '10px 10px 0 0', overflow: 'visible', display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <AC
                value={block.typeLabel}
                suggestions={lookups.type_label}
                onChange={v => updateBlock(bi, { typeLabel: v })}
                onBlur={() => block.typeLabel.trim() && saveLookup('type_label', block.typeLabel.trim())}
                placeholder="Type label (e.g. STANDARD ITEMS / BASIC COLORS)"
                inputStyle={{ background: C.red, color: 'white', border: 'none', borderRadius: 0, padding: '10px 20px', fontSize: 13, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em', caretColor: 'rgba(255,255,255,.7)', width: '100%', boxSizing: 'border-box' }}
                style={{ width: '100%' }}
              />
            </div>
            {form.typeBlocks.length > 1 && (
              <button type="button" onClick={() => removeBlock(bi)} style={{ position: 'absolute', right: 6, border: 'none', background: 'rgba(0,0,0,.3)', color: 'white', fontSize: 12, cursor: 'pointer', borderRadius: 3, padding: '2px 6px' }}>✕</button>
            )}
          </div>

          {/* Categories for this block */}
          {block.categories.map(cat => (
            <div key={cat.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 12, overflow: 'visible' }}>
              {/* Category header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: C.dark, borderRadius: cat.collapsed ? 10 : '10px 10px 0 0', cursor: 'pointer' }}
                onClick={() => toggleCat(bi, cat.id)}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', userSelect: 'none', flexShrink: 0 }}>{cat.collapsed ? '▶' : '▼'}</span>
                <div style={{ flex: 1, position: 'relative' }} onClick={e => e.stopPropagation()}>
                  <AC value={cat.name} suggestions={lookups.category} onChange={v => updateCat(bi, cat.id, { name: v })}
                    onBlur={() => cat.name.trim() && saveLookup('category', cat.name.trim())} placeholder="Category name (e.g. CABINETRY)"
                    inputStyle={{ border: 'none', background: 'transparent', fontSize: 13, fontWeight: 700, color: 'white', outline: 'none', caretColor: 'rgba(255,255,255,.7)' }} />
                </div>
                {block.categories.length > 1 && (
                  <button type="button" onClick={e => { e.stopPropagation(); removeCat(bi, cat.id); }} style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: 14, cursor: 'pointer', padding: 0, flexShrink: 0 }}>✕</button>
                )}
              </div>

              {!cat.collapsed && (
                <div style={{ padding: '10px 14px 12px' }}>
                  {/* All sub-categories + ONE gold total in one container */}
                  {(() => {
                    let catQty = 0, catAmt = 0;
                    for (const sub of cat.subCategories) {
                      for (const grp of sub.groups) {
                        for (const item of grp.items) {
                          catQty += parseFloat(String(item.quantity ?? 0)) || 0;
                          catAmt += calcTotal(item.quantity, item.amount);
                        }
                      }
                    }
                    return (
                      <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'visible', marginBottom: 6 }}>
                        {cat.subCategories.map((sub) => (
                          <div key={sub.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                            {/* Grey subcategory path bar */}
                            <div style={{ background: C.subBg, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {sub.pathSegments.map((seg, idx) => (
                                <React.Fragment key={idx}>
                                  {idx > 0 && <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>/</span>}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <AC value={seg} suggestions={lookups.subcategory_part} onChange={v => updateSegment(bi, cat.id, sub.id, idx, v)}
                                      onBlur={() => seg.trim() && saveLookup('subcategory_part', seg.trim())} placeholder="Segment" style={{ width: 120 }} inputStyle={{ fontSize: 11, fontWeight: 600 }} />
                                    {sub.pathSegments.length > 1 && <button type="button" onClick={() => removeSegment(bi, cat.id, sub.id, idx)} style={rmBtn()}>✕</button>}
                                  </div>
                                </React.Fragment>
                              ))}
                              <button type="button" onClick={() => addSegment(bi, cat.id, sub.id)} style={{ ...btnSm('white'), borderColor: 'rgba(255,255,255,.5)' }}>+ Segment</button>
                              {cat.subCategories.length > 1 && (
                                <button type="button" onClick={() => removeSub(bi, cat.id, sub.id)} style={{ ...btnSm('#fff'), borderColor: 'rgba(255,255,255,.5)', marginLeft: 'auto' }}>Remove Sub</button>
                              )}
                            </div>

                            {/* Groups */}
                            {sub.groups.map(grp => (
                              <div key={grp.id} style={{ borderBottom: `1px solid ${C.border}`, overflow: 'visible' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: '#f8fafc', borderBottom: `1px solid ${C.border}` }}>
                                  <span style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Group:</span>
                                  <AC value={grp.label} suggestions={lookups.group_label} onChange={v => updateGroupLabel(bi, cat.id, sub.id, grp.id, v)}
                                    onBlur={() => grp.label.trim() && saveLookup('group_label', grp.label.trim())} placeholder="Group label (e.g. F.C)" style={{ width: 180 }} inputStyle={{ fontSize: 11, fontWeight: 600 }} />
                                  {sub.groups.length > 1 && <button type="button" onClick={() => removeGroup(bi, cat.id, sub.id, grp.id)} style={{ ...rmBtn(), marginLeft: 4 }}>✕ Remove Group</button>}
                                </div>
                                <div style={{ display: 'flex' }}>
                                  <div style={{ width: 26, flexShrink: 0, background: '#f1f5f9', borderRight: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 32 }}>
                                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 9, fontWeight: 700, color: C.slate, whiteSpace: 'nowrap', overflow: 'hidden', maxHeight: 120 }}>{grp.label || '—'}</span>
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '50px 100px 1fr 52px 76px 76px 76px 120px 20px', gap: 3, padding: '5px 6px 3px', fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>
                                      <div style={{ textAlign: 'center' }}>Photo</div>
                                      <div>Item Code</div><div>Description</div>
                                      <div style={{ textAlign: 'right' }}>Qty</div>
                                      <div style={{ textAlign: 'right' }}>Amount</div>
                                      <div style={{ textAlign: 'right' }}>Total ST</div>
                                      <div style={{ textAlign: 'right' }}>Taking</div>
                                      <div>Vendor</div><div />
                                    </div>
                                    {grp.items.map(item => {
                                      const total = calcTotal(item.quantity, item.amount);
                                      return (
                                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '50px 100px 1fr 52px 76px 76px 76px 120px 20px', gap: 3, padding: '2px 6px', alignItems: 'start' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 2 }}>
                                            <div style={{ width: 46, height: 46, background: '#f1f5f9', border: `1px dashed ${C.border}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                              <span style={{ fontSize: 18, color: '#94a3b8' }}>&#128247;</span>
                                            </div>
                                          </div>
                                          <AC value={item.itemCode} suggestions={lookups.item_code} onChange={v => updateItem(bi, cat.id, sub.id, grp.id, item.id, 'itemCode', v)} placeholder="Code" />
                                          <DescriptionEditor value={item.description} onChange={v => updateItem(bi, cat.id, sub.id, grp.id, item.id, 'description', v)}
                                            onBlur={() => { const code = item.itemCode?.trim(); if (code && item.description.trim()) saveLookup('item_code', code); }} />
                                          <input value={item.quantity} onChange={e => updateItem(bi, cat.id, sub.id, grp.id, item.id, 'quantity', e.target.value)} placeholder="0" type="number" min="0" style={{ ...inputSm, textAlign: 'right' }} />
                                          <input value={item.amount} onChange={e => updateItem(bi, cat.id, sub.id, grp.id, item.id, 'amount', e.target.value)} placeholder="0.00" type="number" min="0" step="0.01" style={{ ...inputSm, textAlign: 'right' }} />
                                          <div style={{ ...inputSm, background: '#f9fafb', color: C.slate, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: 10, userSelect: 'none' }}>{fmtMoney(total)}</div>
                                          <AC value={item.taking} suggestions={lookups.taking} onChange={v => updateItem(bi, cat.id, sub.id, grp.id, item.id, 'taking', v)} placeholder="Taking" inputStyle={{ textAlign: 'right' }} />
                                          <VendorSelect value={item.vendor} vendorId={item.vendorId} vendors={vendors} onSelect={v => selectVendor(bi, cat.id, sub.id, grp.id, item.id, v)} />
                                          <button type="button" onClick={() => removeItem(bi, cat.id, sub.id, grp.id, item.id)} disabled={grp.items.length === 1} style={rmBtn(grp.items.length === 1)}>✕</button>
                                        </div>
                                      );
                                    })}
                                    <div style={{ padding: '5px 6px' }}>
                                      <button type="button" onClick={() => addItem(bi, cat.id, sub.id, grp.id)} style={btnSm()}>+ Item</button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* + Group button */}
                            <div style={{ padding: '5px 10px' }}>
                              <button type="button" onClick={() => addGroup(bi, cat.id, sub.id)} style={btnSm(C.slate)}>+ Group</button>
                            </div>
                          </div>
                        ))}

                        {/* ONE gold total for all sub-categories */}
                        <div style={{ background: C.gold, borderRadius: '0 0 7px 7px', padding: '6px 12px', display: 'grid', gridTemplateColumns: '50px 100px 1fr 52px 76px 76px 76px 120px 20px', gap: 3, fontSize: 10, fontWeight: 700, color: 'white' }}>
                          <div /><div />
                          <div style={{ display: 'flex', alignItems: 'center' }}>TOTAL</div>
                          <div style={{ textAlign: 'right' }}>{Math.round(catQty)}</div>
                          <div />
                          <div style={{ textAlign: 'right' }}>${fmtMoney(catAmt)}</div>
                          <div /><div /><div />
                        </div>
                      </div>
                    );
                  })()}

                  <button type="button" onClick={() => addSub(bi, cat.id)} style={{ ...btnSm(C.slate), marginTop: 6 }}>+ Add Sub-Category</button>
                </div>
              )}

              {/* FIX 1A: If collapsed, still show + Add Sub-Category below header */}
              {cat.collapsed && (
                <div style={{ padding: '6px 14px', borderTop: `1px solid ${C.border}` }}>
                  <button type="button" onClick={e => { e.stopPropagation(); updateCat(bi, cat.id, { collapsed: false }); addSub(bi, cat.id); }} style={btnSm(C.slate)}>+ Add Sub-Category</button>
                </div>
              )}
            </div>
          ))}

          {/* Add category for this block */}
          <button type="button" onClick={() => addCat(bi)} style={{ width: '100%', padding: '9px', border: `2px dashed ${C.border}`, borderRadius: 10, background: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
            + Add Category
          </button>

          {/* Signatures per type block */}
          <div style={{ background: '#f8fafc', border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', marginTop: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Signatures & Approvals</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
              {SIG_LABELS.slice(0, 3).map(sigLabel => renderSigBox(sigLabel))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              {SIG_LABELS.slice(3, 5).map(sigLabel => (
                <div key={sigLabel} style={{ width: 220 }}>{renderSigBox(sigLabel)}</div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Add New Type Section */}
      <button type="button" onClick={addBlock} style={{ width: '100%', padding: '11px', border: `2px dashed ${C.red}`, borderRadius: 10, background: 'none', color: C.red, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 14, letterSpacing: 1 }}>
        + Add New Type Section
      </button>

      {/* Grand total (red bar) */}
      <div style={{ background: C.red, color: 'white', borderRadius: 8, padding: '10px 18px', display: 'grid', gridTemplateColumns: '50px 100px 1fr 52px 76px 76px 76px 120px 20px', gap: 3, marginBottom: 16, fontWeight: 700, fontSize: 11, alignItems: 'center' }}>
        <div /><div />
        <div style={{ letterSpacing: 2, fontSize: 12 }}>GRAND TOTAL</div>
        <div style={{ textAlign: 'right', fontSize: 14 }}>{Math.round(grandTotalQty)}</div>
        <div />
        <div style={{ textAlign: 'right', fontSize: 14 }}>${fmtMoney(grandTotalAmt)}</div>
        <div /><div /><div />
      </div>

      {/* Error / success */}
      {saveError && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, padding: '10px 14px', color: C.red, fontSize: 12, marginBottom: 12 }}>{saveError}</div>}
      {savedDropboxPath && !saveError && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, padding: '10px 14px', color: C.green, fontSize: 12, marginBottom: 12 }}>
          <div>PDF uploaded: <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{savedDropboxPath}</span></div>
          {savedItemCount > 0 && <div style={{ marginTop: 4, fontWeight: 600 }}>{savedItemCount} item Projects tablosuna eklendi</div>}
        </div>
      )}

      {/* Save bar */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack} style={{ padding: '10px 20px', border: `1px solid ${C.border}`, borderRadius: 7, background: 'white', fontSize: 13, cursor: 'pointer', color: C.slate }}>← Back</button>
        <button onClick={() => handleSave('new_version')} disabled={saving} style={{ flex: 1, padding: '10px 20px', border: 'none', borderRadius: 7, background: saving && savingMode === 'new_version' ? C.muted : C.blue, color: 'white', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving && savingMode === 'new_version' ? 'Saving...' : entryId ? 'Save & New Version' : 'Save & Generate PDF'}
        </button>
        {entryId && (
          <button onClick={() => handleSave('same_version')} disabled={saving} style={{ flex: 1, padding: '10px 20px', border: `2px solid ${C.blue}`, borderRadius: 7, background: saving && savingMode === 'same_version' ? C.muted : 'white', color: saving && savingMode === 'same_version' ? 'white' : C.blue, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving && savingMode === 'same_version' ? 'Saving...' : 'Add to Same Version'}
          </button>
        )}
      </div>

      {/* Dropbox setup modal */}
      {showDropboxModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: 10, padding: 28, width: 460, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>Dropbox Klasör Bilgisi</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>Bu proje için Dropbox klasörü tanımlanmamış. Aşağıdaki bilgileri doldurun.</div>
            {[['Section', 'dropboxSection', DROPBOX_SECTIONS], ['Region', 'dropboxRegion', DROPBOX_REGIONS]].map(([label, key, opts]) => (
              <div key={key as string} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label} *</label>
                <select value={(dropboxFields as any)[key as string]} onChange={e => setDropboxFields(p => ({ ...p, [key as string]: e.target.value }))} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}>
                  <option value="">Seç…</option>
                  {(opts as string[]).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.slate, textTransform: 'uppercase', marginBottom: 6 }}>Status *</label>
              <div style={{ display: 'flex', gap: 20 }}>
                {['Under Working', 'Done'].map(s => <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}><input type="radio" name="dbx-status" value={s} checked={dropboxFields.dropboxStatus === s} onChange={() => setDropboxFields(p => ({ ...p, dropboxStatus: s }))} />{s}</label>)}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.slate, textTransform: 'uppercase', marginBottom: 6 }}>Client Type *</label>
              <div style={{ display: 'flex', gap: 20 }}>
                {['Clients', 'Individuals'].map(t => <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}><input type="radio" name="dbx-clienttype" value={t} checked={dropboxFields.dropboxClientType === t} onChange={() => setDropboxFields(p => ({ ...p, dropboxClientType: t, ...(t === 'Individuals' ? { clientName: '' } : {}) }))} />{t}</label>)}
              </div>
            </div>
            {dropboxFields.dropboxClientType === 'Clients' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.slate, textTransform: 'uppercase', marginBottom: 4 }}>Client Name *</label>
                <input value={dropboxFields.clientName} onChange={e => setDropboxFields(p => ({ ...p, clientName: e.target.value }))} placeholder="e.g. ACME Corp" style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            )}
            {dropboxError && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 12px', color: C.red, fontSize: 12, marginBottom: 12 }}>{dropboxError}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => { setShowDropboxModal(false); setDropboxError(null); }} style={{ padding: '9px 20px', border: `1px solid ${C.border}`, borderRadius: 7, background: 'white', fontSize: 13, cursor: 'pointer', color: C.slate }}>İptal</button>
              <button onClick={handleDropboxSetup} disabled={dropboxSaving} style={{ flex: 1, padding: '9px 20px', border: 'none', borderRadius: 7, background: dropboxSaving ? C.muted : C.blue, color: 'white', fontSize: 13, fontWeight: 600, cursor: dropboxSaving ? 'not-allowed' : 'pointer' }}>
                {dropboxSaving ? 'Oluşturuluyor…' : 'Klasör Oluştur & PDF Üret'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceListForm;
