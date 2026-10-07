import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePagePermissions } from '../hooks/usePagePermissions';
import { useSocket } from '../contexts/SocketContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import {
  ProductionDashboardMetrics,
  ActionCenterItem,
  DataIssue,
  TypeBreakdown,
  ProjectHealth,
  StatusDistribution,
  generateProductionDashboardMetrics
} from '../lib/dashboardMetricsProduction';
import { getStatusStyle } from '../utils/statusStyles';

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
const ModernDashboard: React.FC = () => {
  const { user, role, userAccessPolicy, canAccessPage, isAdmin } = useAuth();
  const { canCreateProject } = usePagePermissions();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<ProductionDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'overdue' | 'dueSoon' | 'issues'>('overdue');

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setIsRefreshing(true) : setIsLoading(true);
      setError(null);
      const data = await generateProductionDashboardMetrics(userAccessPolicy);
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [role?.name, userAccessPolicy]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // Socket.IO: refresh dashboard on any data changes
  const { joinRooms, leaveRooms, isConnected } = useSocket();
  const prevConnected = useRef(isConnected);

  useEffect(() => {
    joinRooms(['dashboard']);
    return () => { leaveRooms(['dashboard']); };
  }, [joinRooms, leaveRooms]);

  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      fetchDashboardData(true);
    }
    prevConnected.current = isConnected;
  }, [isConnected, fetchDashboardData]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchDashboardData(true), 1000);
  }, [fetchDashboardData]);

  // Listen for structural changes (create/delete) that affect the dashboard
  // Note: item updates use entity:patched which is handled on editing pages;
  // dashboard only needs to refresh on creates/deletes
  useSocketEvent('project-item:created', debouncedRefresh);
  useSocketEvent('project-item:deleted', debouncedRefresh);
  useSocketEvent('project:created', debouncedRefresh);
  useSocketEvent('project:deleted', debouncedRefresh);

  const handleOpenInBoard = (projectId: string, itemId: string, issueType?: string) => {
    const params = new URLSearchParams({ projectId, itemId });
    if (issueType) params.set('issueType', issueType);
    navigate(`/project-tracking/projects?${params.toString()}`);
  };

  const timeAgo = (d: Date | null) => {
    if (!d) return '';
    const m = Math.floor((Date.now() - d.getTime()) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ago` : d.toLocaleDateString();
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="d">
        <div className="d-center">
          <div className="d-skeleton-grid">
            <div className="d-skel d-skel--header" />
            <div className="d-skel d-skel--card" />
            <div className="d-skel d-skel--card" />
            <div className="d-skel d-skel--card" />
            <div className="d-skel d-skel--wide" />
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="d"><div className="d-center">
        <div className="d-err-ico">!</div>
        <h3 className="d-err-title">Unable to load dashboard</h3>
        <p className="d-muted">{error}</p>
        <button onClick={() => fetchDashboardData()} className="d-btn d-btn--fill">Retry</button>
      </div></div>
    );
  }
  if (!metrics) return null;

  const canAccessSupplier = canAccessPage('suppliers_vendors');
  const overdueKPI = metrics.kpis.find(k => k.label === 'Overdue');
  const dueKPI = metrics.kpis.find(k => k.label === 'Due Next 7 Days');
  const financeKPIs = metrics.kpis.filter(k => k.category === 'finance');
  const overdueVal = typeof overdueKPI?.value === 'number' ? overdueKPI.value : 0;
  const dueVal = typeof dueKPI?.value === 'number' ? dueKPI.value : 0;
  const totalCompletion = metrics.pipelineStages.reduce((s, st) => {
    if (st.status === 'Sent') return s + st.count;
    return s;
  }, 0);
  const completionPct = metrics.totalItemsCount > 0
    ? Math.round((totalCompletion / metrics.totalItemsCount) * 100) : 0;

  return (
    <div className="d">
      {/* ══════ Section 1: Header ══════ */}
      <div className="d-header">
        <div className="d-header__left">
          <h1 className="d-header__greeting">
            {greeting}, <span className="d-header__name">{user?.displayName || user?.name || 'User'}</span>
          </h1>
          <div className="d-header__meta">
            <span className="d-role">{role?.name}</span>
            {lastRefresh && <span className="d-header__time">{timeAgo(lastRefresh)}</span>}
            {(overdueVal > 0 || dueVal > 0) && (
              <span className="d-header__summary">
                {overdueVal > 0 && <span className="d-header__alert">{overdueVal} overdue</span>}
                {overdueVal > 0 && dueVal > 0 && ', '}
                {dueVal > 0 && <span className="d-header__warn">{dueVal} due this week</span>}
              </span>
            )}
          </div>
        </div>
        <div className="d-header__actions">
          <button onClick={() => fetchDashboardData(true)} className={`d-btn d-btn--ghost ${isRefreshing ? 'd-btn--spinning' : ''}`} disabled={isRefreshing}>
            <Ico d="M13.65 2.35A7.96 7.96 0 008 0a8 8 0 108 8h-2a6 6 0 11-1.76-4.24" />
            Refresh
          </button>
          <Link to="/project-tracking/projects" className="d-btn d-btn--fill">
            <Ico d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z" />
            Projects
          </Link>
          {canCreateProject && (
            <Link to="/project-tracking/projects?action=create" className="d-btn d-btn--ghost">
              <Ico d="M8 2v12M2 8h12" />
              New
            </Link>
          )}
          {canAccessSupplier && (
            <Link to="/supplier-tracking" className="d-btn d-btn--ghost">
              <Ico d="M2 13V5l6-3 6 3v8l-6 3-6-3zM2 5l6 3 6-3M8 8v8" />
              Suppliers
            </Link>
          )}
        </div>
      </div>

      <div className="d-content">
        {/* ══════ Section 2: Pipeline Visualization ══════ */}
        <div className="d-pipeline-section">
          <div className="d-pipeline-ring-wrap">
            <ProgressRing percent={completionPct} size={160} stroke={12} />
            <div className="d-pipeline-ring-label">
              <span className="d-pipeline-ring-pct">{completionPct}%</span>
              <span className="d-pipeline-ring-sub">Complete</span>
            </div>
          </div>
          <div className="d-pipeline-flow">
            {metrics.pipelineStages.map((stage, i) => (
              <React.Fragment key={stage.status}>
                {i > 0 && <div className="d-pipeline-arrow" />}
                <PipelineCard stage={stage} isLargest={stage.count === Math.max(...metrics.pipelineStages.map(s => s.count))} />
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ══════ Section 3: Project Summary + KPI Cards ══════ */}
        <div className="d-kpi-row">
          {/* Project Counts */}
          <div className="d-kpi-card d-kpi-card--indigo">
            <div className="d-kpi-card__icon"><Ico d="M2 3h12v10H2zM2 6h12" /></div>
            <div className="d-kpi-card__num">{metrics.projectSummary.totalProjects}</div>
            <div className="d-kpi-card__label">Total Projects</div>
            <div className="d-kpi-card__breakdown">
              <span>{metrics.projectSummary.projectsCount} Projects</span>
              <span>{metrics.projectSummary.directOrdersCount} Direct Orders</span>
              <span>{metrics.projectSummary.missingExtraCount} Missing/Extra</span>
            </div>
          </div>
          <div className="d-kpi-card d-kpi-card--blue">
            <div className="d-kpi-card__icon"><Ico d="M8 1a7 7 0 100 14A7 7 0 008 1zM5 8h6" /></div>
            <div className="d-kpi-card__num">{metrics.projectSummary.openProjects}</div>
            <div className="d-kpi-card__label">Open Projects</div>
            <div className="d-kpi-card__breakdown">
              <span>{metrics.projectSummary.openProjectsCount} Projects</span>
              <span>{metrics.projectSummary.openDirectOrdersCount} Direct Orders</span>
              <span>{metrics.projectSummary.openMissingExtraCount} Missing/Extra</span>
            </div>
          </div>
          {/* Overdue / Due */}
          <div className={`d-kpi-card d-kpi-card--red ${overdueVal > 0 ? 'd-kpi-card--pulse' : ''}`}>
            <div className="d-kpi-card__icon"><Ico d="M8 1v6l3 3" /></div>
            <div className="d-kpi-card__num">{overdueVal}</div>
            <div className="d-kpi-card__label">Overdue Items</div>
          </div>
          <div className="d-kpi-card d-kpi-card--orange">
            <div className="d-kpi-card__icon"><Ico d="M8 1a7 7 0 100 14A7 7 0 008 1zM8 4v4l2.5 2.5" /></div>
            <div className="d-kpi-card__num">{dueVal}</div>
            <div className="d-kpi-card__label">Due This Week</div>
          </div>
          {(isAdmin || role?.name === 'CEO') && financeKPIs.map(kpi => (
            <div key={kpi.label} className="d-kpi-card d-kpi-card--green">
              <div className="d-kpi-card__icon"><Ico d="M2 12l3-7h6l3 7M5 5V3a3 3 0 016 0v2" /></div>
              <div className="d-kpi-card__num d-kpi-card__num--sm">{kpi.value}</div>
              <div className="d-kpi-card__label">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* ══════ Section 4: Breakdown Grid ══════ */}
        <div className="d-breakdown-grid">
          {/* Donut Chart - Items by Type */}
          <div className="d-breakdown-card">
            <h3 className="d-breakdown-title">Items by Type</h3>
            <DonutChart data={metrics.typeBreakdown} total={metrics.totalItemsCount} />
          </div>

          {/* Horizontal Bars - Items by Project */}
          <div className="d-breakdown-card">
            <h3 className="d-breakdown-title">Items by Project</h3>
            <div className="d-hbar-list">
              {metrics.projectHealthList.slice(0, 8).map(p => {
                const barColor = p.overdueCount > 0 ? '#ef4444' : p.dueSoonCount > 0 ? '#f59e0b' : '#22c55e';
                const maxItems = Math.max(...metrics.projectHealthList.slice(0, 8).map(x => x.totalItems), 1);
                return (
                  <HorizontalBar key={p.projectId} label={p.projectNo} value={p.totalItems} max={maxItems} color={barColor} />
                );
              })}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="d-breakdown-card">
            <h3 className="d-breakdown-title">Status Distribution</h3>
            <div className="d-status-dist">
              <div className="d-stacked-bar">
                {metrics.statusDistribution.map(s => (
                  <div key={s.status} className="d-stacked-seg" style={{ width: `${s.percentage}%`, background: s.color }} title={`${s.status}: ${s.count}`} />
                ))}
              </div>
              <div className="d-status-legend">
                {metrics.statusDistribution.map(s => (
                  <div key={s.status} className="d-legend-item">
                    <span className="d-legend-dot" style={{ background: s.color }} />
                    <span className="d-legend-label">{s.status}</span>
                    <span className="d-legend-count">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════ Section 5: Project Health Cards ══════ */}
        <div className="d-section-head">
          <h3 className="d-section-title">Project Health</h3>
          <Link to="/project-tracking/projects" className="d-section-link">View all projects</Link>
        </div>
        <div className="d-project-grid">
          {metrics.projectHealthList.slice(0, 6).map(p => (
            <ProjectCard key={p.projectId} project={p} onClick={() => navigate(`/project-tracking/projects?projectId=${p.projectId}`)} />
          ))}
        </div>

        {/* ══════ Section 6: Action Center (Tabbed) ══════ */}
        <div className="d-action-center">
          <div className="d-tabs">
            <button className={`d-tab ${activeTab === 'overdue' ? 'd-tab--active' : ''}`} onClick={() => setActiveTab('overdue')}>
              Overdue
              {metrics.overdueItems.length > 0 && <span className="d-tab-badge d-tab-badge--red">{metrics.overdueItems.length}</span>}
            </button>
            <button className={`d-tab ${activeTab === 'dueSoon' ? 'd-tab--active' : ''}`} onClick={() => setActiveTab('dueSoon')}>
              Due Soon
              {metrics.dueSoonItems.length > 0 && <span className="d-tab-badge d-tab-badge--orange">{metrics.dueSoonItems.length}</span>}
            </button>
            <button className={`d-tab ${activeTab === 'issues' ? 'd-tab--active' : ''}`} onClick={() => setActiveTab('issues')}>
              Data Issues
              {metrics.dataIssues.length > 0 && <span className="d-tab-badge d-tab-badge--blue">{metrics.dataIssues.length}</span>}
            </button>
          </div>
          <div className="d-tab-content">
            {activeTab === 'overdue' && <ActionTable items={metrics.overdueItems} type="overdue" onAction={handleOpenInBoard} />}
            {activeTab === 'dueSoon' && <ActionTable items={metrics.dueSoonItems} type="dueSoon" onAction={handleOpenInBoard} />}
            {activeTab === 'issues' && <IssuesTable issues={metrics.dataIssues} onFix={handleOpenInBoard} />}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════ */

/* ── SVG Icon helper ── */
const Ico: React.FC<{ d: string }> = ({ d }) => (
  <svg className="d-ico" viewBox="0 0 16 16" fill="none">
    <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Progress Ring (SVG) ── */
const ProgressRing: React.FC<{ percent: number; size: number; stroke: number }> = ({ percent, size, stroke }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg className="d-progress-ring" width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="url(#ring-grad)" strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
    </svg>
  );
};

/* ── Donut Chart (conic-gradient) ── */
const DonutChart: React.FC<{ data: TypeBreakdown[]; total: number }> = ({ data, total }) => {
  const segments = useMemo(() => {
    let cumulative = 0;
    return data.map(d => {
      const start = cumulative;
      cumulative += d.percentage;
      return { ...d, start, end: cumulative };
    });
  }, [data]);

  const gradient = useMemo(() => {
    if (segments.length === 0) return '#e2e8f0';
    const stops = segments.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ');
    return `conic-gradient(${stops})`;
  }, [segments]);

  return (
    <div className="d-donut-wrap">
      <div className="d-donut" style={{ background: gradient }}>
        <div className="d-donut-center">
          <span className="d-donut-total">{total}</span>
          <span className="d-donut-label">Total</span>
        </div>
      </div>
      <div className="d-donut-legend">
        {data.map(d => (
          <div key={d.type} className="d-legend-item">
            <span className="d-legend-dot" style={{ background: d.color }} />
            <span className="d-legend-label">{d.type}</span>
            <span className="d-legend-count">{d.count} ({d.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Horizontal Bar ── */
const HorizontalBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="d-hbar">
      <span className="d-hbar__label">{label}</span>
      <div className="d-hbar__track">
        <div className="d-hbar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="d-hbar__val">{value}</span>
    </div>
  );
};

/* ── Pipeline Card ── */
const PipelineCard: React.FC<{ stage: StatusDistribution; isLargest: boolean }> = ({ stage, isLargest }) => (
  <div className={`d-pipe-card ${isLargest ? 'd-pipe-card--active' : ''}`} style={{ borderTopColor: stage.color }}>
    <div className="d-pipe-card__num" style={{ color: stage.color }}>{stage.count}</div>
    <div className="d-pipe-card__label">{stage.status}</div>
    <div className="d-pipe-card__pct">{stage.percentage}%</div>
  </div>
);

/* ── Project Health Card ── */
const ProjectCard: React.FC<{ project: ProjectHealth; onClick: () => void }> = ({ project, onClick }) => {
  const borderColor = project.overdueCount > 0 ? '#ef4444' : project.dueSoonCount > 0 ? '#f59e0b' : '#22c55e';
  return (
    <div className="d-proj-card" style={{ borderLeftColor: borderColor }} onClick={onClick}>
      <div className="d-proj-card__head">
        <span className="d-proj-card__no">{project.projectNo}</span>
        {project.isUrgent && <span className="d-proj-card__urgent">URGENT</span>}
      </div>
      <div className="d-proj-card__name">{project.projectName}</div>
      <div className="d-proj-card__progress">
        <div className="d-proj-card__bar">
          <div className="d-proj-card__fill" style={{ width: `${project.completionPercent}%`, background: borderColor }} />
        </div>
        <span className="d-proj-card__pct">{project.completionPercent}%</span>
      </div>
      <div className="d-proj-card__stats">
        <span>{project.totalItems} items</span>
        {project.overdueCount > 0 && <span className="d-proj-card__badge d-proj-card__badge--red">{project.overdueCount} overdue</span>}
        {project.dueSoonCount > 0 && <span className="d-proj-card__badge d-proj-card__badge--orange">{project.dueSoonCount} due soon</span>}
        {project.issueCount > 0 && <span className="d-proj-card__badge d-proj-card__badge--blue">{project.issueCount} issues</span>}
      </div>
    </div>
  );
};

/* ── Action Table (Overdue / Due Soon) ── */
const ActionTable: React.FC<{
  items: ActionCenterItem[];
  type: 'overdue' | 'dueSoon';
  onAction: (pid: string, iid: string) => void;
}> = ({ items, type, onAction }) => {
  const [showAll, setShowAll] = useState(false);
  const isOD = type === 'overdue';
  const accent = isOD ? '#ef4444' : '#f97316';
  const visible = showAll ? items : items.slice(0, 8);

  if (items.length === 0) return <div className="d-tab-empty">No items - all clear!</div>;

  return (
    <div>
      <div className="d-act-table">
        <div className="d-act-hrow">
          <span className="d-act-hc" style={{ width: 70 }}>Project</span>
          <span className="d-act-hc" style={{ flex: 1 }}>Type / Vendor</span>
          <span className="d-act-hc" style={{ width: 90 }}>Status</span>
          <span className="d-act-hc" style={{ width: 60, textAlign: 'right' }}>{isOD ? 'Days' : 'Due In'}</span>
          <span className="d-act-hc" style={{ width: 50 }}></span>
        </div>
        {visible.map(item => {
          const ss = getStatusStyle(item.status);
          return (
            <div key={item.id} className="d-act-row">
              <span className="d-act-c d-act-c--proj" style={{ width: 70 }}>{item.projectNo}</span>
              <span className="d-act-c" style={{ flex: 1 }}>
                <span className="d-act-type">{item.type}</span>
                <span className="d-act-vendor">{item.vendor?.substring(0, 25)}</span>
              </span>
              <span className="d-act-c" style={{ width: 90 }}>
                <span className="d-st" style={{ background: ss.backgroundColor, color: ss.color }}>{item.status}</span>
              </span>
              <span className="d-act-c d-act-c--days" style={{ width: 60, textAlign: 'right', color: accent }}>
                {isOD ? `${item.daysOverdue}d` : item.daysUntilDue === 0 ? 'Today' : `${item.daysUntilDue}d`}
              </span>
              <span className="d-act-c" style={{ width: 50 }}>
                <button className="d-fix" onClick={() => onAction(item.projectId, item.id)}>View</button>
              </span>
            </div>
          );
        })}
      </div>
      {items.length > 8 && (
        <button className="d-act-toggle" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show less' : `Show all ${items.length}`}
        </button>
      )}
    </div>
  );
};

/* ── Issues Table ── */
const SEV: Record<string, { label: string; color: string; bg: string }> = {
  HIGH: { label: 'High', color: '#dc2626', bg: '#fef2f2' },
  MEDIUM: { label: 'Med', color: '#ea580c', bg: '#fff7ed' },
  LOW: { label: 'Low', color: '#2563eb', bg: '#eff6ff' },
};

const IssuesTable: React.FC<{
  issues: DataIssue[];
  onFix: (pid: string, iid: string, it?: string) => void;
}> = ({ issues, onFix }) => {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const filtered = useMemo(() => {
    return filter === 'ALL' ? issues : issues.filter(i => i.severity === filter);
  }, [issues, filter]);

  const visible = showAll ? filtered : filtered.slice(0, 8);
  const hc = issues.filter(i => i.severity === 'HIGH').length;
  const mc = issues.filter(i => i.severity === 'MEDIUM').length;
  const lc = issues.filter(i => i.severity === 'LOW').length;

  if (issues.length === 0) return <div className="d-tab-empty">All project data looks complete</div>;

  return (
    <div>
      <div className="d-issues-filters">
        <button className={`d-ftag ${filter === 'ALL' ? 'd-ftag--on' : ''}`} onClick={() => setFilter('ALL')}>All ({issues.length})</button>
        {hc > 0 && <button className={`d-ftag d-ftag--high ${filter === 'HIGH' ? 'd-ftag--on' : ''}`} onClick={() => setFilter('HIGH')}>{hc} High</button>}
        {mc > 0 && <button className={`d-ftag d-ftag--med ${filter === 'MEDIUM' ? 'd-ftag--on' : ''}`} onClick={() => setFilter('MEDIUM')}>{mc} Med</button>}
        {lc > 0 && <button className={`d-ftag d-ftag--low ${filter === 'LOW' ? 'd-ftag--on' : ''}`} onClick={() => setFilter('LOW')}>{lc} Low</button>}
      </div>
      <div className="d-act-table">
        <div className="d-act-hrow">
          <span className="d-act-hc" style={{ width: 44 }}>Sev</span>
          <span className="d-act-hc" style={{ flex: 1 }}>Issue</span>
          <span className="d-act-hc" style={{ width: 70 }}>Project</span>
          <span className="d-act-hc" style={{ width: 80 }}>Type</span>
          <span className="d-act-hc d-act-hc--hide-m" style={{ width: 90 }}>Status</span>
          <span className="d-act-hc" style={{ width: 50 }}></span>
        </div>
        {visible.map((issue, idx) => {
          const sev = SEV[issue.severity];
          const ss = getStatusStyle(issue.status);
          return (
            <div key={`${issue.id}-${issue.issueType}-${idx}`} className="d-act-row">
              <span className="d-act-c" style={{ width: 44 }}>
                <span className="d-sev" style={{ color: sev.color, background: sev.bg }}>{sev.label}</span>
              </span>
              <span className="d-act-c d-act-c--desc" style={{ flex: 1 }}>{issue.description}</span>
              <span className="d-act-c d-act-c--proj" style={{ width: 70 }}>{issue.projectNo}</span>
              <span className="d-act-c" style={{ width: 80, color: '#64748b' }}>{issue.type}</span>
              <span className="d-act-c d-act-c--hide-m" style={{ width: 90 }}>
                <span className="d-st" style={{ background: ss.backgroundColor, color: ss.color }}>{issue.status}</span>
              </span>
              <span className="d-act-c" style={{ width: 50 }}>
                <button className="d-fix" onClick={() => onFix(issue.projectId, issue.id, issue.issueType)}>Fix</button>
              </span>
            </div>
          );
        })}
      </div>
      {filtered.length > 8 && (
        <button className="d-act-toggle" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show less' : `Show all ${filtered.length} issues`}
        </button>
      )}
    </div>
  );
};

export default ModernDashboard;

/* ═══════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════ */
const S = `
/* ── Base ── */
.d {
  min-height: 100vh;
  background: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
  color: #1e293b;
  -webkit-font-smoothing: antialiased;
}

/* ── Header ── */
.d-header {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%);
  padding: 28px 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.d-header__greeting { margin: 0; font-size: 24px; font-weight: 700; color: #fff; }
.d-header__name { color: #a5b4fc; }
.d-header__meta { display: flex; align-items: center; gap: 10px; margin-top: 6px; flex-wrap: wrap; }
.d-role { background: rgba(165,180,252,.15); color: #c7d2fe; padding: 2px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
.d-header__time { color: #94a3b8; font-size: 12px; }
.d-header__summary { font-size: 12px; color: #cbd5e1; }
.d-header__alert { color: #fca5a5; font-weight: 600; }
.d-header__warn { color: #fdba74; font-weight: 600; }
.d-header__actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

/* ── Buttons ── */
.d-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; border: none; cursor: pointer; text-decoration: none; transition: all .15s; white-space: nowrap; }
.d-btn--fill { background: #4f46e5; color: #fff; }
.d-btn--fill:hover { background: #4338ca; box-shadow: 0 2px 8px rgba(79,70,229,.3); }
.d-btn--ghost { background: rgba(255,255,255,.1); color: #e0e7ff; border: 1px solid rgba(255,255,255,.15); }
.d-btn--ghost:hover { background: rgba(255,255,255,.18); }
.d-btn--spinning .d-ico { animation: dspin .7s linear infinite; }
.d-ico { width: 14px; height: 14px; flex-shrink: 0; }
@keyframes dspin { to { transform: rotate(360deg); } }

/* ── Content ── */
.d-content { max-width: 1400px; margin: 0 auto; padding: 24px 32px 48px; display: flex; flex-direction: column; gap: 24px; }

/* ══════ Pipeline Section ══════ */
.d-pipeline-section {
  display: flex;
  align-items: center;
  gap: 32px;
  background: #fff;
  border-radius: 16px;
  padding: 28px 32px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.d-pipeline-ring-wrap { position: relative; flex-shrink: 0; width: 160px; height: 160px; }
.d-pipeline-ring-label {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center;
}
.d-pipeline-ring-pct { font-size: 32px; font-weight: 800; color: #1e293b; line-height: 1; }
.d-pipeline-ring-sub { font-size: 11px; color: #94a3b8; font-weight: 500; margin-top: 2px; }
.d-pipeline-flow { display: flex; align-items: center; gap: 0; flex: 1; overflow-x: auto; }

/* Pipeline Arrow */
.d-pipeline-arrow {
  width: 24px; height: 2px; background: #cbd5e1; position: relative; flex-shrink: 0;
}
.d-pipeline-arrow::after {
  content: ''; position: absolute; right: -1px; top: -4px;
  border: 5px solid transparent; border-left: 6px solid #cbd5e1;
}

/* Pipeline Card */
.d-pipe-card {
  background: #f8fafc; border-radius: 10px; padding: 14px 18px;
  border-top: 3px solid #e2e8f0; text-align: center;
  min-width: 110px; flex: 1; transition: all .15s;
}
.d-pipe-card--active { background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.08); transform: translateY(-2px); }
.d-pipe-card__num { font-size: 26px; font-weight: 800; line-height: 1; }
.d-pipe-card__label { font-size: 11px; color: #64748b; font-weight: 500; margin-top: 4px; white-space: nowrap; }
.d-pipe-card__pct { font-size: 11px; color: #94a3b8; margin-top: 2px; }

/* ══════ KPI Cards ══════ */
.d-kpi-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
.d-kpi-card {
  border-radius: 14px; padding: 22px 24px; position: relative; overflow: hidden;
  transition: transform .15s, box-shadow .15s;
}
.d-kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.08); }
.d-kpi-card::after {
  content: ''; position: absolute; top: -20px; right: -20px;
  width: 80px; height: 80px; border-radius: 50%; opacity: .1;
}
.d-kpi-card--red { background: linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%); }
.d-kpi-card--red::after { background: #ef4444; }
.d-kpi-card--red .d-kpi-card__num { color: #dc2626; }
.d-kpi-card--red .d-kpi-card__icon { color: #f87171; }
.d-kpi-card--orange { background: linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%); }
.d-kpi-card--orange::after { background: #f97316; }
.d-kpi-card--orange .d-kpi-card__num { color: #ea580c; }
.d-kpi-card--orange .d-kpi-card__icon { color: #fb923c; }
.d-kpi-card--green { background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); }
.d-kpi-card--green::after { background: #22c55e; }
.d-kpi-card--green .d-kpi-card__num { color: #15803d; }
.d-kpi-card--green .d-kpi-card__icon { color: #4ade80; }
.d-kpi-card--indigo { background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); }
.d-kpi-card--indigo::after { background: #6366f1; }
.d-kpi-card--indigo .d-kpi-card__num { color: #4338ca; }
.d-kpi-card--indigo .d-kpi-card__icon { color: #818cf8; }
.d-kpi-card--blue { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); }
.d-kpi-card--blue::after { background: #3b82f6; }
.d-kpi-card--blue .d-kpi-card__num { color: #1d4ed8; }
.d-kpi-card--blue .d-kpi-card__icon { color: #60a5fa; }
.d-kpi-card__icon { margin-bottom: 8px; }
.d-kpi-card__icon .d-ico { width: 20px; height: 20px; }
.d-kpi-card__num { font-size: 36px; font-weight: 800; line-height: 1; }
.d-kpi-card__num--sm { font-size: 22px; }
.d-kpi-card__label { font-size: 12px; color: #64748b; font-weight: 500; margin-top: 6px; }
.d-kpi-card__breakdown { display: flex; flex-direction: column; gap: 2px; margin-top: 8px; font-size: 11px; color: #94a3b8; font-weight: 500; }

/* Pulse animation for overdue */
@keyframes kpi-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.2); } 50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); } }
.d-kpi-card--pulse { animation: kpi-pulse 2s ease-in-out infinite; }

/* ══════ Breakdown Grid ══════ */
.d-breakdown-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
.d-breakdown-card {
  background: #fff; border-radius: 14px; padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.d-breakdown-title { margin: 0 0 18px; font-size: 15px; font-weight: 600; color: #0f172a; }

/* Donut */
.d-donut-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.d-donut {
  width: 160px; height: 160px; border-radius: 50%; position: relative;
  display: flex; align-items: center; justify-content: center;
}
.d-donut-center {
  width: 90px; height: 90px; border-radius: 50%; background: #fff;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-shadow: 0 0 0 4px rgba(255,255,255,.8);
}
.d-donut-total { font-size: 28px; font-weight: 800; color: #1e293b; line-height: 1; }
.d-donut-label { font-size: 11px; color: #94a3b8; }
.d-donut-legend { width: 100%; }

/* Legend */
.d-legend-item { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 12px; }
.d-legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.d-legend-label { flex: 1; color: #475569; }
.d-legend-count { color: #94a3b8; font-weight: 600; font-variant-numeric: tabular-nums; }

/* Horizontal Bars */
.d-hbar-list { display: flex; flex-direction: column; gap: 10px; }
.d-hbar { display: flex; align-items: center; gap: 10px; }
.d-hbar__label { width: 60px; font-size: 12px; font-weight: 600; color: #475569; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.d-hbar__track { flex: 1; height: 20px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
.d-hbar__fill { height: 100%; border-radius: 4px; transition: width .4s ease; min-width: 4px; }
.d-hbar__val { width: 28px; font-size: 12px; font-weight: 700; color: #1e293b; text-align: right; }

/* Status Distribution */
.d-status-dist { display: flex; flex-direction: column; gap: 16px; }
.d-stacked-bar { display: flex; height: 24px; border-radius: 6px; overflow: hidden; gap: 2px; }
.d-stacked-seg { min-width: 4px; transition: width .3s ease; }
.d-status-legend { display: flex; flex-direction: column; gap: 4px; }

/* ══════ Project Health Grid ══════ */
.d-section-head { display: flex; align-items: center; justify-content: space-between; }
.d-section-title { margin: 0; font-size: 17px; font-weight: 600; color: #0f172a; }
.d-section-link { font-size: 13px; color: #4f46e5; text-decoration: none; font-weight: 500; }
.d-section-link:hover { text-decoration: underline; }

.d-project-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.d-proj-card {
  background: #fff; border-radius: 12px; padding: 20px; cursor: pointer;
  border-left: 4px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,.06);
  transition: transform .15s, box-shadow .15s;
}
.d-proj-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,.08); }
.d-proj-card__head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.d-proj-card__no { font-size: 14px; font-weight: 700; color: #4f46e5; }
.d-proj-card__urgent { font-size: 9px; font-weight: 700; color: #dc2626; background: #fef2f2; padding: 2px 6px; border-radius: 3px; text-transform: uppercase; letter-spacing: .03em; }
.d-proj-card__name { font-size: 13px; color: #475569; margin-bottom: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.d-proj-card__progress { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.d-proj-card__bar { flex: 1; height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
.d-proj-card__fill { height: 100%; border-radius: 3px; transition: width .4s ease; }
.d-proj-card__pct { font-size: 12px; font-weight: 700; color: #475569; min-width: 32px; text-align: right; }
.d-proj-card__stats { display: flex; gap: 8px; flex-wrap: wrap; font-size: 11px; color: #94a3b8; }
.d-proj-card__badge { padding: 1px 6px; border-radius: 3px; font-weight: 600; font-size: 10px; }
.d-proj-card__badge--red { background: #fef2f2; color: #dc2626; }
.d-proj-card__badge--orange { background: #fff7ed; color: #ea580c; }
.d-proj-card__badge--blue { background: #eff6ff; color: #2563eb; }

/* ══════ Action Center (Tabs) ══════ */
.d-action-center {
  background: #fff; border-radius: 14px; overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.d-tabs { display: flex; border-bottom: 2px solid #f1f5f9; padding: 0 24px; }
.d-tab {
  padding: 14px 20px; background: none; border: none; cursor: pointer;
  font-size: 14px; font-weight: 500; color: #64748b; position: relative;
  display: flex; align-items: center; gap: 8px; transition: color .15s;
}
.d-tab:hover { color: #1e293b; }
.d-tab--active { color: #4f46e5; font-weight: 600; }
.d-tab--active::after {
  content: ''; position: absolute; bottom: -2px; left: 0; right: 0;
  height: 2px; background: #4f46e5; border-radius: 1px;
}
.d-tab-badge { padding: 1px 7px; border-radius: 10px; font-size: 11px; font-weight: 700; color: #fff; }
.d-tab-badge--red { background: #ef4444; }
.d-tab-badge--orange { background: #f97316; }
.d-tab-badge--blue { background: #3b82f6; }
.d-tab-content { padding: 20px 24px; }
.d-tab-empty { padding: 32px 0; text-align: center; color: #94a3b8; font-size: 14px; }

/* ══════ Compact Table (shared) ══════ */
.d-act-table { width: 100%; }
.d-act-hrow {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 0; border-bottom: 1px solid #f1f5f9;
}
.d-act-hc { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .04em; }
.d-act-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0; border-bottom: 1px solid #fafafa; transition: background .1s;
}
.d-act-row:hover { background: #fafbfc; }
.d-act-row:last-child { border-bottom: none; }
.d-act-c { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.d-act-c--proj { font-weight: 600; color: #4f46e5; }
.d-act-c--desc { font-weight: 500; color: #1e293b; }
.d-act-c--days { font-weight: 700; }
.d-act-type { display: block; font-size: 13px; font-weight: 500; color: #1e293b; }
.d-act-vendor { display: block; font-size: 11px; color: #94a3b8; }
.d-act-toggle { width: 100%; padding: 12px; background: none; border: none; border-top: 1px solid #f1f5f9; color: #4f46e5; font-size: 13px; font-weight: 500; cursor: pointer; }
.d-act-toggle:hover { background: #f8fafc; }
.d-issues-filters { display: flex; gap: 6px; margin-bottom: 12px; }

/* Reused tag/badge styles */
.d-ftag { padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; font-size: 12px; font-weight: 500; cursor: pointer; transition: all .15s; }
.d-ftag--on { background: #4f46e5; color: #fff; border-color: #4f46e5; }
.d-ftag--high.d-ftag--on { background: #ef4444; border-color: #ef4444; }
.d-ftag--med.d-ftag--on { background: #f97316; border-color: #f97316; }
.d-ftag--low.d-ftag--on { background: #3b82f6; border-color: #3b82f6; }
.d-ftag:hover:not(.d-ftag--on) { border-color: #cbd5e1; background: #f8fafc; }

.d-sev { padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; }
.d-st { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; display: inline-block; white-space: nowrap; }
.d-fix { padding: 5px 12px; background: #4f46e5; color: #fff; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all .15s; }
.d-fix:hover { background: #4338ca; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(79,70,229,.25); }

/* ── Skeleton Loading ── */
.d-skeleton-grid {
  display: flex; flex-direction: column; gap: 16px; width: 100%; max-width: 800px; padding: 48px 32px;
}
.d-skel {
  border-radius: 12px; background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%; animation: d-shimmer 1.5s infinite;
}
.d-skel--header { height: 80px; }
.d-skel--card { height: 100px; }
.d-skel--wide { height: 200px; }
@keyframes d-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── Loading ── */
.d-center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 12px; }
.d-spin { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: dspin .7s linear infinite; }
.d-muted { color: #94a3b8; font-size: 14px; margin: 0; }
.d-err-ico { width: 44px; height: 44px; border-radius: 50%; background: #fef2f2; color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; }
.d-err-title { margin: 0; font-size: 16px; font-weight: 600; }

/* ══════ Responsive ══════ */
@media (max-width: 1200px) {
  .d-breakdown-grid { grid-template-columns: 1fr 1fr; }
  .d-breakdown-grid > :last-child { grid-column: span 2; }
  .d-project-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .d-header { padding: 20px 16px; flex-direction: column; align-items: stretch; }
  .d-header__actions { justify-content: flex-start; }
  .d-content { padding: 16px 16px 32px; gap: 16px; }
  .d-pipeline-section { flex-direction: column; padding: 20px; }
  .d-pipeline-flow { flex-wrap: wrap; gap: 8px; justify-content: center; }
  .d-pipeline-arrow { display: none; }
  .d-kpi-row { grid-template-columns: 1fr 1fr; }
  .d-breakdown-grid { grid-template-columns: 1fr; }
  .d-breakdown-grid > :last-child { grid-column: span 1; }
  .d-project-grid { grid-template-columns: 1fr; }
  .d-act-hc--hide-m, .d-act-c--hide-m { display: none; }
}
`;

if (typeof document !== 'undefined') {
  const id = 'modern-dashboard-styles';
  let el = document.getElementById(id) as HTMLStyleElement;
  if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
  el.textContent = S;
}
