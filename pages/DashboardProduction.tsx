import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePagePermissions } from '../hooks/usePagePermissions';
import {
  ProductionDashboardMetrics,
  ProductionKPI,
  ActionCenterItem,
  DataIssue,
  generateProductionDashboardMetrics
} from '../lib/dashboardMetricsProduction';
import { getStatusCellStyle } from '../utils/statusStyles';

const ProductionDashboard: React.FC = () => {
  const { user, role, userAccessPolicy, canAccessPage, isAdmin } = useAuth();
  const { canCreateProject } = usePagePermissions();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<ProductionDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (!role?.name) return;

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);


      const dashboardMetrics = await generateProductionDashboardMetrics(
        userAccessPolicy
      );

      setMetrics(dashboardMetrics);
      setLastRefresh(new Date());


    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [role?.name, userAccessPolicy]);

  // Load data on mount and when role changes
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const handleOpenInBoard = (projectId: string, itemId: string) => {
    // Navigate to Operational Board with query parameters for highlighting
    navigate(`/project-tracking/projects?projectId=${projectId}&itemId=${itemId}`);
  };

  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return 'Never';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;

    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="production-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="production-dashboard">
        <div className="dashboard-error">
          <div className="error-icon">⚠️</div>
          <div className="error-text">
            <strong>Error loading dashboard</strong>
            <p>{error}</p>
          </div>
          <button onClick={handleRefresh} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="production-dashboard">
        <div className="dashboard-no-data">
          <div className="no-data-icon">📊</div>
          <div className="no-data-text">No dashboard data available</div>
          <button onClick={handleRefresh} className="retry-button">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const canAccessSupplier = canAccessPage('suppliers_vendors');

  return (
    <div className="production-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-main">
          <h1>Operations Dashboard</h1>
          <div className="header-info">
            <span>Welcome back, <strong>{user?.displayName || user?.name || 'User'}</strong></span>
            <span className="role-badge" data-role={(role?.name || '').toLowerCase()}>
              {role?.name}
            </span>
          </div>
        </div>

        <div className="header-controls">
          <div className="last-updated">
            <span>Last updated: {formatLastUpdated(lastRefresh)}</span>
          </div>

          <div className="header-actions">
            <button
              onClick={handleRefresh}
              className="refresh-button"
              disabled={isRefreshing}
            >
              {isRefreshing ? '⟳' : '🔄'}
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <Link to="/project-tracking/projects" className="primary-action-button">
              📊 Open Projects
            </Link>

            {canCreateProject && (
              <Link to="/project-tracking/projects?action=create" className="secondary-action-button">
                ➕ Add Project
              </Link>
            )}

            {canAccessSupplier && (
              <Link to="/supplier-tracking" className="secondary-action-button">
                🏢 Supplier Tracking
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* KPIs Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Key Performance Indicators</h2>
          <div className="section-subtitle">
            Total {metrics.totalItemsCount} items •
            {metrics.showMoneyMetrics && ' Financial metrics visible • '}
            Role: {role?.name}
          </div>
        </div>

        <KPIGrid kpis={metrics.kpis} isAdmin={isAdmin} roleName={role?.name} />
      </div>

      {/* Action Center */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Action Center</h2>
          <div className="section-subtitle">
            Items requiring immediate attention
          </div>
        </div>

        <div className="action-center-grid">
          {/* Overdue Items */}
          <ActionCenterTable
            title="Overdue Items"
            subtitle={`${metrics.overdueItems.length} items past due date`}
            items={metrics.overdueItems}
            type="overdue"
            onOpenInBoard={handleOpenInBoard}
          />

          {/* Due Soon Items */}
          <ActionCenterTable
            title="Due in Next 7 Days"
            subtitle={`${metrics.dueSoonItems.length} items due soon`}
            items={metrics.dueSoonItems}
            type="dueSoon"
            onOpenInBoard={handleOpenInBoard}
          />

          {/* Data Issues */}
          <DataIssuesTable
            issues={metrics.dataIssues}
            onOpenInBoard={handleOpenInBoard}
          />
        </div>
      </div>
    </div>
  );
};

// KPI Grid Component
const KPIGrid: React.FC<{ kpis: ProductionKPI[]; isAdmin: boolean; roleName?: string }> = ({ kpis, isAdmin, roleName }) => {
  const statusKPIs = kpis.filter(kpi => kpi.category === 'status');
  const overdueKPIs = kpis.filter(kpi => kpi.category === 'overdue');
  const financeKPIs = kpis.filter(kpi => kpi.category === 'finance');

  return (
    <div className="kpi-container">
      {/* Status KPIs */}
      <div className="kpi-section">
        <h3>Project Status</h3>
        <div className="kpi-grid">
          {statusKPIs.map((kpi, index) => (
            <KPICard key={`status-${index}`} kpi={kpi} />
          ))}
        </div>
      </div>

      {/* Overdue KPIs */}
      {overdueKPIs.length > 0 && (
        <div className="kpi-section">
          <h3>Timeline Status</h3>
          <div className="kpi-grid">
            {overdueKPIs.map((kpi, index) => (
              <KPICard key={`overdue-${index}`} kpi={kpi} />
            ))}
          </div>
        </div>
      )}

      {/* Finance KPIs - Only visible to ADMIN */}
      {(isAdmin || roleName === 'CEO') && financeKPIs.length > 0 && (
        <div className="kpi-section">
          <h3>Financial Summary</h3>
          <div className="kpi-grid">
            {financeKPIs.map((kpi, index) => (
              <KPICard key={`finance-${index}`} kpi={kpi} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// KPI Card Component
const KPICard: React.FC<{ kpi: ProductionKPI }> = ({ kpi }) => {
  return (
    <div className={`kpi-card kpi-${kpi.color} kpi-${kpi.category}`}>
      <div className="kpi-value">
        {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
      </div>
      <div className="kpi-label">{kpi.label}</div>
    </div>
  );
};

// Action Center Table Component
const ActionCenterTable: React.FC<{
  title: string;
  subtitle: string;
  items: ActionCenterItem[];
  type: 'overdue' | 'dueSoon';
  onOpenInBoard: (projectId: string, itemId: string) => void;
}> = ({ title, subtitle, items, type, onOpenInBoard }) => {
  if (items.length === 0) {
    return (
      <div className="action-center-card">
        <div className="card-header">
          <h3>{title}</h3>
          <div className="card-subtitle">{subtitle}</div>
        </div>
        <div className="empty-state">
          <div className="empty-icon">
            {type === 'overdue' ? '✅' : '📅'}
          </div>
          <div className="empty-text">
            {type === 'overdue' ? 'No overdue items' : 'Nothing due soon'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="action-center-card">
      <div className="card-header">
        <h3>{title}</h3>
        <div className="card-subtitle">{subtitle}</div>
      </div>

      <div className="action-table-container">
        <table className="action-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Type</th>
              <th>Vendor</th>
              <th>Status</th>
              <th>Date</th>
              <th className="days-column">
                {type === 'overdue' ? 'Overdue' : 'Due In'}
              </th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="project-info">
                    <div className="project-no">{item.projectNo}</div>
                    <div className="project-name">{truncateText(item.projectName, 20)}</div>
                  </div>
                </td>
                <td>{item.type}</td>
                <td className="vendor-cell">{truncateText(item.vendor, 15)}</td>
                <td>
                  <span style={getStatusCellStyle(item.status)}>{item.status}</span>
                </td>
                <td>
                  <div className="date-info">
                    <div className="date-value">
                      {item.relevantDate ? formatDate(item.relevantDate) : '-'}
                    </div>
                    <div className="date-type">{item.relevantDateType}</div>
                  </div>
                </td>
                <td>
                  <span className={`days-badge ${type}`}>
                    {type === 'overdue'
                      ? `${item.daysOverdue} days`
                      : item.daysUntilDue === 0
                        ? 'Today'
                        : `${item.daysUntilDue} days`
                    }
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => onOpenInBoard(item.projectId, item.id)}
                    className="open-board-button"
                    title="Open in Projects"
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Data Issues Table Component
const DataIssuesTable: React.FC<{
  issues: DataIssue[];
  onOpenInBoard: (projectId: string, itemId: string) => void;
}> = ({ issues, onOpenInBoard }) => {
  const highIssues = issues.filter(issue => issue.severity === 'HIGH');
  const mediumIssues = issues.filter(issue => issue.severity === 'MEDIUM');
  const lowIssues = issues.filter(issue => issue.severity === 'LOW');

  return (
    <div className="action-center-card data-issues-card">
      <div className="card-header">
        <h3>Data Issues</h3>
        <div className="card-subtitle">
          {issues.length} issues found •
          {highIssues.length} high •
          {mediumIssues.length} medium •
          {lowIssues.length} low
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div className="empty-text">No data issues found</div>
        </div>
      ) : (
        <div className="action-table-container">
          <table className="action-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Issue</th>
                <th>Project</th>
                <th>Type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={`${issue.id}-${issue.issueType}`}>
                  <td>
                    <span className={`severity-badge ${issue.severity.toLowerCase()}`}>
                      {issue.severity}
                    </span>
                  </td>
                  <td className="issue-description">
                    {issue.description}
                  </td>
                  <td>
                    <div className="project-no">{issue.projectNo}</div>
                  </td>
                  <td>{issue.type}</td>
                  <td>
                    <span style={getStatusCellStyle(issue.status)}>{issue.status}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => onOpenInBoard(issue.projectId, issue.id)}
                      className="open-board-button"
                      title="Open in Projects"
                    >
                      Fix
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Utility functions
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default ProductionDashboard;

// Add styles (in a real app, this would be in a separate CSS file)
const productionStyles = `
.production-dashboard {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.dashboard-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;
}

.header-main h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #64748b;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-badge[data-role="admin"] { background: #ddd6fe; color: #7c3aed; }
.role-badge[data-role="finance"] { background: #dcfce7; color: #16a34a; }
.role-badge[data-role="pm"] { background: #fef3c7; color: #d97706; }
.role-badge[data-role="millwork"] { background: #dbeafe; color: #2563eb; }
.role-badge[data-role="image"] { background: #fce7f3; color: #db2777; }
.role-badge[data-role="ceiling"] { background: #f0fdfa; color: #0d9488; }

.header-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.last-updated {
  font-size: 12px;
  color: #94a3b8;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.refresh-button, .primary-action-button, .secondary-action-button {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.refresh-button {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.refresh-button:hover:not(:disabled) {
  background: #e2e8f0;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primary-action-button {
  background: #2563eb;
  color: white;
}

.primary-action-button:hover {
  background: #1d4ed8;
  color: white;
}

.secondary-action-button {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.secondary-action-button:hover {
  background: #f8fafc;
  color: #475569;
}

/* Dashboard Sections */
.dashboard-section {
  margin-bottom: 32px;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.section-subtitle {
  font-size: 14px;
  color: #64748b;
}

/* KPI Grid */
.kpi-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.kpi-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid currentColor;
}

.kpi-card.kpi-blue { color: #2563eb; }
.kpi-card.kpi-green { color: #16a34a; }
.kpi-card.kpi-orange { color: #ea580c; }
.kpi-card.kpi-red { color: #dc2626; }
.kpi-card.kpi-purple { color: #9333ea; }
.kpi-card.kpi-teal { color: #0d9488; }
.kpi-card.kpi-indigo { color: #4f46e5; }

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  color: currentColor;
}

.kpi-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

/* Action Center */
.action-center-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 24px;
}

.action-center-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.card-subtitle {
  font-size: 14px;
  color: #64748b;
}

.action-table-container {
  max-height: 400px;
  overflow-y: auto;
}

.action-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.action-table th {
  background: #f8fafc;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.action-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.action-table tr:hover {
  background: #f8fafc;
}

.project-info .project-no {
  font-weight: 600;
  color: #0f172a;
}

.project-info .project-name {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.vendor-cell {
  max-width: 120px;
}

.date-info .date-value {
  font-weight: 500;
  color: #0f172a;
}

.date-info .date-type {
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge, .severity-badge, .days-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.status-badge {
  background: #f1f5f9;
  color: #475569;
}

.severity-badge.high {
  background: #fef2f2;
  color: #dc2626;
}

.severity-badge.medium {
  background: #fffbeb;
  color: #d97706;
}

.severity-badge.low {
  background: #f0fdf4;
  color: #16a34a;
}

.days-badge.overdue {
  background: #fef2f2;
  color: #dc2626;
}

.days-badge.duesoon {
  background: #fffbeb;
  color: #d97706;
}

.open-board-button {
  padding: 6px 12px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.open-board-button:hover {
  background: #1d4ed8;
}

.issue-description {
  max-width: 200px;
  line-height: 1.4;
}

.data-issues-card {
  grid-column: 1 / -1;
}

/* Empty States */
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 14px;
  font-weight: 500;
}

/* Loading States */
.dashboard-loading, .dashboard-error, .dashboard-no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f1f5f9;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text, .no-data-text {
  font-size: 16px;
  color: #64748b;
  font-weight: 500;
}

.error-icon, .no-data-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-text {
  text-align: center;
  margin-bottom: 20px;
}

.error-text strong {
  color: #dc2626;
  font-size: 18px;
}

.error-text p {
  color: #64748b;
  margin: 8px 0 0 0;
}

.retry-button {
  padding: 10px 20px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background: #1d4ed8;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .production-dashboard {
    padding: 12px;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .header-controls {
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .kpi-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .action-center-grid {
    grid-template-columns: 1fr;
  }

  .action-table {
    font-size: 12px;
  }

  .action-table th,
  .action-table td {
    padding: 8px 12px;
  }

  .vendor-cell {
    display: none;
  }

  .days-column {
    display: none;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'production-dashboard-styles';
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }

  styleElement.textContent = productionStyles;
}