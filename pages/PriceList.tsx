import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/auth';
import PriceListForm, { buildDefaultForm, newCategory, type PriceForm } from '../components/PriceListForm';

const uid = () => Math.random().toString(36).slice(2, 9);

// Normalise old flat formData format to new typeBlocks format.
// Always ensures at least one category per typeBlock so the user never sees a blank form.
function normaliseFormData(raw: any): PriceForm | null {
  if (!raw || typeof raw !== 'object') return null;

  let typeBlocks: any[];
  if (Array.isArray(raw.typeBlocks)) {
    typeBlocks = raw.typeBlocks;
  } else {
    typeBlocks = [{ id: '_default', typeLabel: raw.typeBanner ?? '', categories: raw.categories ?? [] }];
  }

  // Ensure each typeBlock has at least one category
  typeBlocks = typeBlocks.map(block => ({
    ...block,
    id: block.id ?? uid(),
    categories: block.categories?.length > 0 ? block.categories : [newCategory('Category 1')],
  }));

  return { ...raw, typeBlocks } as PriceForm;
}

// ── Types ──────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  projectNo: string;
  name: string;
  address: string;
  bucket: string;
  types: string[];
  clientName: string | null;
  dropboxPath: string | null;
  logoUrl: string | null;
}

type Step = 'project' | 'type' | 'form';

const DEFAULT_TYPES = ['Millwork', 'Shelving', 'Ceiling', 'Image', '0-Missing-Extra', 'Furniture', 'Decoration'];

// ── Create-project form state ──────────────────────────────────────────────

interface NewProjectFields {
  projectNo: string;
  address: string;
  clientName: string;
  dropboxSection: string;
  dropboxRegion: string;
  dropboxStatus: 'Under Working' | 'Done';
  dropboxClientType: 'Clients' | 'Individuals';
}

const SECTIONS = ['1-Store Maker', '2-Premium Store Fitout', '3-Design & Build', '4-T Shop'];

const REGIONS = [
  'T Lines CVW Projects',
  'T Lines NE Projects',
  'T Lines NW Projects',
  'T Lines SE Projects',
];

// Map region → ProjectBucket enum
const REGION_TO_BUCKET: Record<string, string> = {
  'T Lines CVW Projects': 'CVW',
  'T Lines NE Projects': 'TLINES_NE',
  'T Lines NW Projects': 'TLINES_NW',
  'T Lines SE Projects': 'TLINES_SE',
};

const emptyNewProject = (): NewProjectFields => ({
  projectNo: '',
  address: '',
  clientName: '',
  dropboxSection: '',
  dropboxRegion: '',
  dropboxStatus: 'Under Working',
  dropboxClientType: 'Clients',
});

// ── Helpers ────────────────────────────────────────────────────────────────

function bucketLabel(bucket: string): string {
  return (bucket ?? '').replace('TLINES_', 'T-Lines ').replace(/_/g, ' ');
}

// ── Design tokens ──────────────────────────────────────────────────────────

const C = {
  border: '#e2e8f0', bg: '#f8fafc', blue: '#2563eb', green: '#16a34a',
  red: '#dc2626', slate: '#475569', muted: '#94a3b8', text: '#1e293b', white: '#ffffff',
};

const field: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`,
  borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'white',
};

const label: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: C.slate,
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
};

// ── Step badge ─────────────────────────────────────────────────────────────

const StepBadge: React.FC<{ step: Step }> = ({ step }) => {
  const steps: { key: Step; label: string }[] = [
    { key: 'project', label: '1. Select Project' },
    { key: 'type', label: '2. Select Type' },
    { key: 'form', label: '3. Fill Form' },
  ];
  const cur = steps.findIndex(s => s.key === step);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: i <= cur ? 1 : 0.4 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 11, fontWeight: 700,
              background: i < cur ? C.green : i === cur ? C.blue : C.border,
              color: i <= cur ? C.white : C.muted,
            }}>
              {i < cur ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 12, fontWeight: i === cur ? 700 : 400, color: i === cur ? C.blue : C.slate }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 1, background: i < cur ? C.green : C.border, maxWidth: 40 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ── Inline Create New Project form ─────────────────────────────────────────

interface CreateFormProps {
  existingNos: string[];
  onCreated: (p: Project) => void;
  onCancel: () => void;
}

const CreateProjectForm: React.FC<CreateFormProps> = ({ existingNos, onCreated, onCancel }) => {
  const [f, setF] = useState<NewProjectFields>(emptyNewProject());
  const [noError, setNoError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const set = (k: keyof NewProjectFields, v: string) =>
    setF(prev => ({ ...prev, [k]: v }));

  const validateNo = () => {
    if (!f.projectNo.trim()) { setNoError('Project number is required'); return; }
    if (existingNos.includes(f.projectNo.trim())) {
      setNoError('This project number already exists');
    } else {
      setNoError('');
    }
  };

  const isClients = f.dropboxClientType === 'Clients';

  const canSubmit =
    f.projectNo.trim() &&
    f.address.trim() &&
    f.dropboxSection &&
    f.dropboxRegion &&
    f.dropboxStatus &&
    f.dropboxClientType &&
    (!isClients || f.clientName.trim()) &&
    !noError &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const bucket = REGION_TO_BUCKET[f.dropboxRegion] ?? 'TLINES_NE';
      const body: any = {
        bucket,
        projectNo: f.projectNo.trim(),
        name: f.address.trim(),   // address doubles as name
        address: f.address.trim(),
        dropboxSection: f.dropboxSection,
        dropboxRegion: f.dropboxRegion,
        dropboxStatus: f.dropboxStatus,
        dropboxClientType: f.dropboxClientType,
      };
      if (isClients && f.clientName.trim()) body.clientName = f.clientName.trim();

      const r = await apiFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.message ?? 'Failed to create project');

      // Normalise response to Project shape
      const created: Project = {
        id: d.id,
        projectNo: d.projectNo,
        name: d.name,
        address: d.address,
        bucket: d.bucket,
        types: d.types ?? [],
        clientName: d.clientName ?? null,
        dropboxPath: d.dropboxPath ?? null,
        logoUrl: d.logoUrl ?? null,
      };
      onCreated(created);
    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'white', border: `2px solid ${C.blue}`, borderRadius: 10, padding: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 20 }}>
        New Project
      </div>

      {/* Project Number */}
      <div style={{ marginBottom: 14 }}>
        <label style={label}>Project Number *</label>
        <input
          value={f.projectNo}
          onChange={e => { set('projectNo', e.target.value); setNoError(''); }}
          onBlur={validateNo}
          placeholder="e.g. 330"
          style={{ ...field, borderColor: noError ? C.red : C.border }}
        />
        {noError && <div style={{ color: C.red, fontSize: 11, marginTop: 3 }}>{noError}</div>}
      </div>

      {/* Address */}
      <div style={{ marginBottom: 14 }}>
        <label style={label}>Address *</label>
        <input
          value={f.address}
          onChange={e => set('address', e.target.value)}
          placeholder="e.g. GROVE, 4787 HWY 42, Locust, GA"
          style={field}
        />
      </div>

      {/* Dropbox section header */}
      <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '18px 0 12px', paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        Dropbox Folder (required — auto-creates full structure)
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 14 }}>
        {/* Section */}
        <div>
          <label style={label}>Section *</label>
          <select value={f.dropboxSection} onChange={e => set('dropboxSection', e.target.value)} style={field}>
            <option value="">Select section…</option>
            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Region */}
        <div>
          <label style={label}>Region *</label>
          <select value={f.dropboxRegion} onChange={e => set('dropboxRegion', e.target.value)} style={field}>
            <option value="">Select region…</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Status */}
      <div style={{ marginBottom: 14 }}>
        <label style={label}>Status *</label>
        <div style={{ display: 'flex', gap: 20 }}>
          {(['Under Working', 'Done'] as const).map(s => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: C.text }}>
              <input type="radio" name="status" value={s} checked={f.dropboxStatus === s} onChange={() => set('dropboxStatus', s)} />
              {s}
            </label>
          ))}
        </div>
      </div>

      {/* Client Type */}
      <div style={{ marginBottom: 14 }}>
        <label style={label}>Client Type *</label>
        <div style={{ display: 'flex', gap: 20 }}>
          {(['Clients', 'Individuals'] as const).map(t => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: C.text }}>
              <input type="radio" name="clientType" value={t} checked={f.dropboxClientType === t}
                onChange={() => { set('dropboxClientType', t); if (t === 'Individuals') set('clientName', ''); }} />
              {t}
            </label>
          ))}
        </div>
      </div>

      {/* Client Name — only for Clients */}
      {isClients && (
        <div style={{ marginBottom: 14 }}>
          <label style={label}>Client Name *</label>
          <input
            value={f.clientName}
            onChange={e => set('clientName', e.target.value)}
            placeholder="e.g. ACME Corp"
            style={field}
          />
        </div>
      )}

      {submitError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 12px', color: C.red, fontSize: 12, marginBottom: 12 }}>
          {submitError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={onCancel}
          style={{ padding: '9px 20px', border: `1px solid ${C.border}`, borderRadius: 7, background: 'white', fontSize: 13, cursor: 'pointer', color: C.slate }}>
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={!canSubmit}
          style={{ flex: 1, padding: '9px 20px', border: 'none', borderRadius: 7, background: canSubmit ? C.blue : C.border, color: 'white', fontSize: 13, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
          {submitting ? 'Creating…' : 'Create Project & Continue →'}
        </button>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

const PriceList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get('projectId');

  const [step, setStep] = useState<Step>('project');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedType, setSelectedType] = useState('');
  const [form, setForm] = useState<PriceForm | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadProjects = () =>
    apiFetch('/api/price-list/projects')
      .then(r => r.json())
      .then((data: Project[]) => { setProjects(data); return data; });

  useEffect(() => {
    loadProjects()
      .then(data => {
        if (urlProjectId) {
          const found = data.find(p => p.id === urlProjectId);
          if (found) { setSelectedProject(found); setStep('type'); }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [urlProjectId]);

  const filteredProjects = projects.filter(p => {
    const q = projectSearch.toLowerCase();
    return !q || p.projectNo.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || (p.clientName ?? '').toLowerCase().includes(q);
  });

  const typesToShow = selectedProject && selectedProject.types.length > 0
    ? selectedProject.types
    : DEFAULT_TYPES;

  const handleSelectProject = (p: Project) => {
    setSelectedProject(p);
    setStep('type');
  };

  const handleSelectType = async (t: string) => {
    setSelectedType(t);
    setEntryId(null);
    // Try to load existing entry for this project + type
    try {
      const r = await apiFetch(`/api/price-list/entries?projectId=${selectedProject!.id}`);
      if (r.ok) {
        const entries: any[] = await r.json();
        const existing = entries.find(e => e.type?.toLowerCase() === t.toLowerCase());
        if (existing) {
          const r2 = await apiFetch(`/api/price-list/entries/${existing.id}`);
          if (r2.ok) {
            const full = await r2.json();
            const normalised = normaliseFormData(full.formData);
            if (normalised) {
              setForm(normalised);
              setEntryId(full.id);
              setStep('form');
              return;
            }
          }
        }
      }
    } catch { /* fall through to default form */ }
    setForm(buildDefaultForm(selectedProject!, t));
    setStep('form');
  };

  const handleProjectCreated = (p: Project) => {
    // Add to list + immediately select it, advance to step 2
    setProjects(prev => [p, ...prev]);
    setShowCreateForm(false);
    setSelectedProject(p);
    setStep('type');
  };

  const resetAll = () => {
    setStep('project'); setSelectedProject(null); setSelectedType('');
    setForm(null); setEntryId(null); setProjectSearch(''); setShowCreateForm(false);
  };

  const existingNos = projects.map(p => p.projectNo);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>Price List</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>Create and manage project price lists</p>
        </div>
        {step !== 'project' && (
          <button onClick={resetAll} style={{ fontSize: 12, color: C.muted, background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
            ↺ Start Over
          </button>
        )}
      </div>

      <StepBadge step={step} />

      {/* ── Step 1: Select Project ── */}
      {step === 'project' && (
        <div>
          {showCreateForm ? (
            <CreateProjectForm
              existingNos={existingNos}
              onCreated={handleProjectCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          ) : (
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              {/* CTA: Create New Project */}
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  width: '100%', padding: '12px', marginBottom: 16,
                  background: C.blue, color: 'white', border: 'none',
                  borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>+</span> Create New Project
              </button>

              <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                — or select existing —
              </div>

              <input
                type="text"
                placeholder="Search by project number, name, or client…"
                value={projectSearch}
                onChange={e => setProjectSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, marginBottom: 14, boxSizing: 'border-box', background: 'white' }}
              />
              {loading ? (
                <div style={{ color: C.muted, fontSize: 13 }}>Loading projects…</div>
              ) : filteredProjects.length === 0 ? (
                <div style={{ color: C.muted, fontSize: 13 }}>No projects found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
                  {filteredProjects.map(p => (
                    <button key={p.id} onClick={() => handleSelectProject(p)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'white', border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.projectNo} — {p.name}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                          {p.clientName ? `${p.clientName} · ` : ''}{p.address}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, flexShrink: 0, marginLeft: 12 }}>{bucketLabel(p.bucket)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Select Type ── */}
      {step === 'type' && selectedProject && (
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
          <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', fontSize: 13 }}>
              <div><span style={{ color: C.muted }}>Project No: </span><strong>{selectedProject.projectNo}</strong></div>
              <div><span style={{ color: C.muted }}>Region: </span><strong>{bucketLabel(selectedProject.bucket)}</strong></div>
              <div><span style={{ color: C.muted }}>Name: </span><strong>{selectedProject.name}</strong></div>
              <div><span style={{ color: C.muted }}>Address: </span><strong>{selectedProject.address || '—'}</strong></div>
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            Select Type
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {typesToShow.map(t => (
              <button key={t} onClick={() => handleSelectType(t)}
                style={{ padding: '16px 12px', background: 'white', border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C.text }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = C.blue)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => setStep('project')} style={{ marginTop: 16, fontSize: 12, color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Back
          </button>
        </div>
      )}

      {/* ── Step 3: Form ── */}
      {step === 'form' && selectedProject && selectedType && form && (
        <PriceListForm
          form={form}
          onChange={setForm}
          projectId={selectedProject.id}
          type={selectedType}
          entryId={entryId}
          onSaved={(id, _path) => { setEntryId(id); }}
          onBack={() => setStep('type')}
          logoUrl={selectedProject.logoUrl}
        />
      )}
    </div>
  );
};

export default PriceList;
