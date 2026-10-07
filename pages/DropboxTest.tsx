import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/auth';

// ── Types ──────────────────────────────────────────────────────────────────

type Phase =
  | 'connecting'
  | 'region'
  | 'status'
  | 'clientType'
  | 'client'
  | 'project'
  | 'creatingProject'
  | 'productionType'
  | 'save';

interface FolderItem { name: string; path: string; }

// ── Constants ──────────────────────────────────────────────────────────────

const BASE = '/D-Projects/T LINES/1-Store Maker';

const REGIONS = [
  'T Lines CVW Projects',
  'T Lines NE Projects',
  'T Lines NW Projects',
  'T Lines SE Projects',
] as const;

const PRODUCTION_TYPES = ['Millwork', 'Ceiling', 'Shelving', 'Image', '0-Missing-Extra'] as const;

// ── API helpers ────────────────────────────────────────────────────────────

const dbx = {
  connect: async (): Promise<{ name: string; email: string }> => {
    const r = await apiFetch('/api/dropbox/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.message ?? 'Bağlantı hatası');
    return d;
  },
  folders: async (path: string): Promise<FolderItem[]> => {
    const r = await apiFetch(`/api/dropbox/folders?path=${encodeURIComponent(path)}`);
    const d = await r.json();
    if (!r.ok) throw new Error(d?.message ?? 'Klasörler alınamadı');
    return d.folders ?? [];
  },
  createFolder: async (path: string): Promise<void> => {
    const r = await apiFetch('/api/dropbox/create-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.message ?? 'Klasör oluşturulamadı');
  },
  createProjectV2: async (projectPath: string): Promise<{ success: boolean; created: string[] }> => {
    const r = await apiFetch('/api/dropbox/create-project-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectPath }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.message ?? 'Proje yapısı oluşturulamadı');
    return d;
  },
  saveEnvPath: async (path: string): Promise<{ success: boolean; uploadedTo: string }> => {
    const r = await apiFetch('/api/dropbox/save-env-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.message ?? 'Yol kaydedilemedi');
    return d;
  },
};

// ── useFolders hook ────────────────────────────────────────────────────────

function useFolders(path: string) {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!path) { setFolders([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try { setFolders(await dbx.folders(path)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [path]);

  useEffect(() => { load(); }, [load]);
  return { folders, loading, error, reload: load };
}

// ── Design tokens ──────────────────────────────────────────────────────────

const C = {
  border: '#e2e8f0',
  bg: '#f8fafc',
  blue: '#0061ff',
  green: '#16a34a',
  slate: '#475569',
  muted: '#94a3b8',
  text: '#1e293b',
  danger: '#dc2626',
};

// ── Primitives ─────────────────────────────────────────────────────────────

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px' }}>
    {children}
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
    {children}
  </div>
);

const Err: React.FC<{ msg: string }> = ({ msg }) => (
  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, padding: '10px 14px', color: C.danger, fontSize: 13, marginBottom: 14 }}>
    {msg}
  </div>
);

const PathBadge: React.FC<{ path: string }> = ({ path }) => (
  <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace', marginBottom: 12, wordBreak: 'break-all' }}>{path}</div>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    style={{
      width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 7,
      fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'white',
      ...props.style,
    }}
  />
);

const Btn: React.FC<{
  onClick: () => void; disabled?: boolean;
  color?: string; children: React.ReactNode; style?: React.CSSProperties;
}> = ({ onClick, disabled, color = C.blue, children, style }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '9px 20px', background: disabled ? C.muted : color,
      color: 'white', border: 'none', borderRadius: 7,
      fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      ...style,
    }}
  >
    {children}
  </button>
);

// ── Choice button (with hover state) ──────────────────────────────────────

const ChoiceButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '14px 16px',
        background: hovered ? '#eff6ff' : 'white',
        color: C.text,
        border: `1px solid ${hovered ? '#93c5fd' : C.border}`,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.12s',
      }}
    >
      {label}
    </button>
  );
};

const ChoiceGrid: React.FC<{
  choices: readonly string[];
  onSelect: (c: string) => void;
  columns?: number;
}> = ({ choices, onSelect, columns = 2 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 10 }}>
    {choices.map(c => <ChoiceButton key={c} label={c} onClick={() => onSelect(c)} />)}
  </div>
);

// ── Folder list ────────────────────────────────────────────────────────────

const FolderList: React.FC<{
  folders: FolderItem[];
  loading: boolean;
  error: string | null;
  onSelect: (f: FolderItem) => void;
}> = ({ folders, loading, error, onSelect }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  if (loading) return <div style={{ fontSize: 13, color: C.muted, padding: '8px 0' }}>Yükleniyor...</div>;
  if (error) return <Err msg={error} />;
  if (folders.length === 0) return <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>Henüz klasör yok.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
      {folders.map((f) => (
        <div
          key={f.path}
          onClick={() => onSelect(f)}
          onMouseEnter={() => setHovered(f.path)}
          onMouseLeave={() => setHovered(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 13px', borderRadius: 7,
            border: `1px solid ${hovered === f.path ? '#93c5fd' : C.border}`,
            background: hovered === f.path ? '#eff6ff' : 'white',
            cursor: 'pointer', transition: 'all 0.12s',
          }}
        >
          <span style={{ fontSize: 14 }}>📁</span>
          <span style={{ fontSize: 13, color: C.text }}>{f.name}</span>
        </div>
      ))}
    </div>
  );
};

// ── Progress stepper ───────────────────────────────────────────────────────

const STEPS = [
  { label: 'Bölge' },
  { label: 'Durum' },
  { label: 'Tip' },
  { label: 'Müşteri' },
  { label: 'Proje' },
  { label: 'Üretim' },
  { label: 'Kaydet' },
];

const PHASE_STEP: Record<Phase, number> = {
  connecting: -1,
  region: 0,
  status: 1,
  clientType: 2,
  client: 3,
  project: 4,
  creatingProject: 4,
  productionType: 5,
  save: 6,
};

const Stepper: React.FC<{ phase: Phase }> = ({ phase }) => {
  const cur = PHASE_STEP[phase];
  if (cur < 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
      {STEPS.map((s, i) => {
        const done = i < cur;
        const active = i === cur;
        return (
          <React.Fragment key={s.label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                background: done ? '#22c55e' : active ? C.blue : C.border,
                color: done || active ? 'white' : C.muted,
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 10, whiteSpace: 'nowrap', fontWeight: active ? 700 : 400,
                color: active ? C.blue : done ? '#22c55e' : C.muted,
              }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, minWidth: 12, marginBottom: 18, background: done ? '#22c55e' : C.border }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── Selection trail ────────────────────────────────────────────────────────

const Trail: React.FC<{ parts: Array<{ label: string; value: string }> }> = ({ parts }) => {
  if (parts.length === 0) return null;
  return (
    <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', marginBottom: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        Seçimler
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px 0' }}>
        {parts.map((p, i) => (
          <React.Fragment key={p.label}>
            {i > 0 && <span style={{ fontSize: 11, color: C.muted, margin: '0 5px' }}>›</span>}
            <span style={{ fontSize: 12 }}>
              <span style={{ color: C.muted }}>{p.label}: </span>
              <span style={{ fontWeight: 600, color: C.text }}>{p.value}</span>
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ── Step sub-components ────────────────────────────────────────────────────

const ClientStep: React.FC<{
  path: string;
  busy: boolean;
  onSelect: (f: FolderItem) => void;
  onCreate: (name: string) => void;
}> = ({ path, busy, onSelect, onCreate }) => {
  const { folders, loading, error } = useFolders(path);
  const [newName, setNewName] = useState('');
  return (
    <>
      <SectionLabel>Mevcut Müşteriler</SectionLabel>
      <PathBadge path={path} />
      <FolderList folders={folders} loading={loading} error={error} onSelect={onSelect} />
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Yeni müşteri klasörü oluştur:</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <TextInput
            placeholder="Müşteri adı"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && newName.trim() && onCreate(newName.trim())}
          />
          <Btn
            onClick={() => onCreate(newName.trim())}
            disabled={busy || !newName.trim()}
            color={C.slate}
            style={{ whiteSpace: 'nowrap' }}
          >
            {busy ? '...' : '+ Yeni Klasör Oluştur'}
          </Btn>
        </div>
      </div>
    </>
  );
};

const ProjectStep: React.FC<{
  clientPath: string;
  busy: boolean;
  onSelect: (f: FolderItem) => void;
  onCreate: (num: string, name: string, address: string) => void;
}> = ({ clientPath, busy, onSelect, onCreate }) => {
  const { folders, loading, error } = useFolders(clientPath);
  const [num, setNum] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const preview = num && name && address ? `${num}- ${name}, ${address}` : '';

  return (
    <>
      <SectionLabel>Mevcut Projeler</SectionLabel>
      <PathBadge path={clientPath} />
      <FolderList folders={folders} loading={loading} error={error} onSelect={onSelect} />
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
          Yeni proje oluştur — klasör yapısı otomatik kurulur:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <TextInput placeholder="Proje Numarası (örn: 2024-001)" value={num} onChange={e => setNum(e.target.value)} />
          <TextInput placeholder="Proje Adı" value={name} onChange={e => setName(e.target.value)} />
          <TextInput placeholder="Adres" value={address} onChange={e => setAddress(e.target.value)} />
          {preview && (
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '8px 12px', fontSize: 12, fontFamily: 'monospace', color: '#0369a1' }}>
              📁 {preview}
            </div>
          )}
          <Btn
            onClick={() => onCreate(num.trim(), name.trim(), address.trim())}
            disabled={busy || !num.trim() || !name.trim() || !address.trim()}
            color={C.blue}
          >
            {busy ? 'Oluşturuluyor...' : '📁 Proje Oluştur + Klasör Yapısı Kur'}
          </Btn>
        </div>
      </div>
    </>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

const DropboxTest: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('connecting');
  const [connectError, setConnectError] = useState<string | null>(null);
  const [account, setAccount] = useState<{ name: string; email: string } | null>(null);

  const [region, setRegion] = useState('');
  const [statusChoice, setStatusChoice] = useState('');
  const [clientType, setClientType] = useState('');
  const [clientPath, setClientPath] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [productionType, setProductionType] = useState('');
  const [structureStats, setStructureStats] = useState<{ created: string[] } | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = () => {
    setConnectError(null);
    dbx.connect()
      .then(info => { setAccount(info); setPhase('region'); })
      .catch(e => setConnectError(e.message));
  };

  useEffect(() => { connect(); }, []);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null);
    try { await fn(); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  const resetFlow = () => {
    setRegion(''); setStatusChoice(''); setClientType('');
    setClientPath(''); setClientName(''); setProjectPath('');
    setProductionType(''); setStructureStats(null);
    setUploadedPath(null); setError(null);
    setPhase('region');
  };

  // Computed
  const clientListPath = region && statusChoice && clientType
    ? `${BASE}/${region}/${statusChoice}/${clientType}`
    : '';
  const finalPath = projectPath && productionType
    ? `${projectPath}/3-Production & Delivery/${productionType}`
    : '';

  // Trail breadcrumb
  const trailParts: Array<{ label: string; value: string }> = [];
  if (region) trailParts.push({ label: 'Bölge', value: region });
  if (statusChoice) trailParts.push({ label: 'Durum', value: statusChoice });
  if (clientType) trailParts.push({ label: 'Tip', value: clientType });
  if (clientName) trailParts.push({ label: 'Müşteri', value: clientName });
  if (projectPath) trailParts.push({ label: 'Proje', value: projectPath.split('/').pop() ?? '' });
  if (productionType) trailParts.push({ label: 'Üretim', value: productionType });

  // Handlers
  const handleRegion = (r: string) => { setRegion(r); setPhase('status'); };
  const handleStatus = (s: string) => { setStatusChoice(s); setPhase('clientType'); };
  const handleClientType = (ct: string) => { setClientType(ct); setPhase('client'); };

  const handleClientSelect = (f: FolderItem) => {
    setClientPath(f.path); setClientName(f.name); setPhase('project');
  };

  const handleCreateClient = (name: string) => run(async () => {
    const newPath = `${clientListPath}/${name}`;
    await dbx.createFolder(newPath);
    setClientPath(newPath); setClientName(name); setPhase('project');
  });

  const handleProjectSelect = (f: FolderItem) => {
    setProjectPath(f.path); setStructureStats(null); setPhase('productionType');
  };

  const handleCreateProject = async (num: string, name: string, address: string) => {
    const folderName = `${num}- ${name}, ${address}`;
    const newProjectPath = `${clientPath}/${folderName}`;
    setBusy(true); setError(null);
    setPhase('creatingProject');
    try {
      await dbx.createFolder(newProjectPath);
      const stats = await dbx.createProjectV2(newProjectPath);
      setProjectPath(newProjectPath); setStructureStats(stats); setPhase('productionType');
    } catch (e: any) {
      setError(e.message); setPhase('project');
    } finally {
      setBusy(false);
    }
  };

  const handleProductionType = (pt: string) => { setProductionType(pt); setPhase('save'); };

  const handleSave = () => run(async () => {
    const result = await dbx.saveEnvPath(finalPath);
    setUploadedPath(result.uploadedTo);
  });

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '28px 32px', maxWidth: 820, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Dropbox Klasör Yönetimi</h2>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 26 }}>
        Bölge → Durum → Tip → Müşteri → Proje → Üretim Tipi → Varsayılan Yol
      </p>

      {/* Account badge */}
      {account && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>👤</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>{account.name}</span>
          <span style={{ fontSize: 12, color: '#3b82f6' }}>{account.email}</span>
          {phase !== 'connecting' && (
            <button
              onClick={resetFlow}
              style={{ marginLeft: 'auto', fontSize: 12, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px' }}
            >
              ↺ Başa dön
            </button>
          )}
        </div>
      )}

      <Stepper phase={phase} />
      <Trail parts={trailParts} />
      {error && <Err msg={error} />}

      {/* ── Connecting ── */}
      {phase === 'connecting' && (
        <Card>
          {connectError ? (
            <>
              <Err msg={`Dropbox bağlantısı kurulamadı: ${connectError}`} />
              <Btn onClick={connect}>Tekrar Dene</Btn>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>🔗</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Dropbox'a bağlanılıyor...</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>OAuth2 token alınıyor</div>
            </div>
          )}
        </Card>
      )}

      {/* ── Step 1: Region ── */}
      {phase === 'region' && (
        <Card>
          <SectionLabel>Adım 1 — Bölge Seçimi</SectionLabel>
          <ChoiceGrid choices={REGIONS} onSelect={handleRegion} columns={2} />
        </Card>
      )}

      {/* ── Step 2: Status ── */}
      {phase === 'status' && (
        <Card>
          <SectionLabel>Adım 2 — Proje Durumu</SectionLabel>
          <ChoiceGrid choices={['Under Working', 'Done']} onSelect={handleStatus} columns={2} />
        </Card>
      )}

      {/* ── Step 3: Client Type ── */}
      {phase === 'clientType' && (
        <Card>
          <SectionLabel>Adım 3 — Müşteri Tipi</SectionLabel>
          <ChoiceGrid choices={['Clients', 'Individuals']} onSelect={handleClientType} columns={2} />
        </Card>
      )}

      {/* ── Step 4: Client ── */}
      {phase === 'client' && (
        <Card>
          <SectionLabel>Adım 4 — Müşteri Seçimi</SectionLabel>
          <ClientStep
            path={clientListPath}
            busy={busy}
            onSelect={handleClientSelect}
            onCreate={handleCreateClient}
          />
        </Card>
      )}

      {/* ── Step 5: Project ── */}
      {phase === 'project' && (
        <Card>
          <SectionLabel>Adım 5 — Proje Seçimi</SectionLabel>
          <ProjectStep
            clientPath={clientPath}
            busy={busy}
            onSelect={handleProjectSelect}
            onCreate={handleCreateProject}
          />
        </Card>
      )}

      {/* ── Creating project ── */}
      {phase === 'creatingProject' && (
        <Card>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 14 }}>⏳</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Klasör yapısı oluşturuluyor...</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>
              1-Finalization · 2-Construction Document · 3-Production &amp; Delivery
            </div>
          </div>
        </Card>
      )}

      {/* ── Step 6: Production Type ── */}
      {phase === 'productionType' && (
        <Card>
          <SectionLabel>Adım 6 — Üretim Tipi Seçimi</SectionLabel>
          {structureStats && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, padding: '8px 14px', marginBottom: 14, fontSize: 13, color: '#15803d' }}>
              ✅ Yeni proje kuruldu: {structureStats.created.length} klasör oluşturuldu.
            </div>
          )}
          <ChoiceGrid choices={PRODUCTION_TYPES} onSelect={handleProductionType} columns={3} />
        </Card>
      )}

      {/* ── Step 7: Save ── */}
      {phase === 'save' && (
        <Card>
          <SectionLabel>Adım 7 — Kaydet &amp; Onayla</SectionLabel>
          <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 6 }}>Oluşturulan Yükleme Yolu:</div>
            <div style={{ fontSize: 13, fontFamily: 'monospace', color: C.text, wordBreak: 'break-all', lineHeight: 1.6 }}>
              {finalPath}
            </div>
          </div>
          {uploadedPath ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, padding: '12px 16px', color: C.green, fontWeight: 700, fontSize: 14 }}>
                ✅ Yol kaydedildi ve test dosyası yüklendi.
              </div>
              <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 7, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4 }}>Yüklenen Dosya (Dropbox):</div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: C.text, wordBreak: 'break-all' }}>{uploadedPath}</div>
              </div>
            </div>
          ) : (
            <Btn onClick={handleSave} disabled={busy} color={C.green}>
              {busy ? 'Kaydediliyor & Yükleniyor...' : '💾 Varsayılan Yol Olarak Kaydet'}
            </Btn>
          )}
        </Card>
      )}
    </div>
  );
};

export default DropboxTest;
