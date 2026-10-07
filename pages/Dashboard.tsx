import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DashboardMetrics, DashboardKPI, DashboardIssue, DashboardItem, generateDashboardMetrics } from '../lib/dashboardMetrics';
import { getStatusCellStyle } from '../utils/statusStyles';

const Dashboard: React.FC = () => {
  const { user, role, canAccessPage } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const dashboardMetrics = await generateDashboardMetrics();
        setMetrics(dashboardMetrics);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="dashboard-no-data">
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          No dashboard data available
        </div>
      </div>
    );
  }

  const canAccessSupplier = canAccessPage('suppliers_vendors');
  const canViewFinance = canAccessPage('expenses_p');

  // Filter money KPIs if user doesn't have finance access
  const displayKPIs = !canViewFinance
    ? metrics.kpis.filter(kpi => !kpi.label.includes('USD') && !kpi.label.includes('TL'))
    : metrics.kpis;

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name || 'User'} • Role: {role?.name}</p>
        </div>
        <div className="dashboard-quick-links">
          <Link to="/project-tracking/projects" className="quick-link-btn">
            📊 Go to Projects
          </Link>
          {canAccessSupplier && (
            <Link to="/supplier-tracking" className="quick-link-btn">
              🏢 Go to Supplier Tracking
            </Link>
          )}
        </div>
      </div>

      {/* KPIs Section */}
      <div className="dashboard-section">
        <h2>Key Performance Indicators</h2>
        <div className="kpi-grid">
          {displayKPIs.map((kpi, index) => (
            <KPICard key={index} kpi={kpi} />
          ))}
        </div>
      </div>

      {/* Issues Section */}
      <div className="dashboard-section">
        <h2>Issues & Alerts</h2>
        <IssuesTable issues={metrics.issues} />
      </div>

      {/* Data Tables Section */}
      <div className="dashboard-data-grid">
        {/* Overdue Items */}
        <div className="dashboard-section">
          <h3>Overdue Items</h3>
          <ItemsTable items={metrics.overdueItems} showOverdue />
        </div>

        {/* Due Soon */}
        <div className="dashboard-section">
          <h3>Due Soon (Next 7 Days)</h3>
          <ItemsTable items={metrics.dueSoonItems} showDueSoon />
        </div>

        {/* Recent Activity */}
        <div className="dashboard-section">
          <h3>Recent Activity</h3>
          <ItemsTable items={metrics.recentActivity} showRecent />
        </div>
      </div>
    </div>
  );
};

// KPI Card Component
const KPICard: React.FC<{ kpi: DashboardKPI }> = ({ kpi }) => {
  const colorClasses = {
    blue: '#2563eb',
    green: '#16a34a',
    orange: '#ea580c',
    red: '#dc2626',
    purple: '#9333ea',
    teal: '#0d9488'
  };

  return (
    <div className="kpi-card">
      <div className="kpi-value" style={{ color: colorClasses[kpi.color] }}>
        {kpi.value.toLocaleString()}
      </div>
      <div className="kpi-label">{kpi.label}</div>
    </div>
  );
};

// Issues Table Component
const IssuesTable: React.FC<{ issues: DashboardIssue[] }> = ({ issues }) => {
  if (issues.length === 0) {
    return (
      <div className="no-data">
        <span style={{ color: '#16a34a' }}>✅ No issues found</span>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Severity</th>
            <th>Issue</th>
            <th>Project</th>
            <th>Type</th>
            <th>Vendor</th>
            <th>PF Code</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {issues.slice(0, 15).map((issue, index) => (
            <tr key={index}>
              <td>
                <span className={`severity-badge ${issue.severity.toLowerCase()}`}>
                  {issue.severity}
                </span>
              </td>
              <td>{issue.message}</td>
              <td>{issue.projectNo}</td>
              <td>{issue.type}</td>
              <td>{issue.vendor}</td>
              <td>{issue.pfCode}</td>
              <td>{issue.relevantDate ? formatDate(issue.relevantDate) : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Items Table Component
const ItemsTable: React.FC<{
  items: DashboardItem[];
  showOverdue?: boolean;
  showDueSoon?: boolean;
  showRecent?: boolean;
}> = ({ items, showOverdue, showDueSoon, showRecent }) => {
  if (items.length === 0) {
    return (
      <div className="no-data">
        <span style={{ color: '#666' }}>No items to display</span>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Type</th>
            <th>Vendor</th>
            <th>Status</th>
            <th>PF Code</th>
            {showOverdue && <th>Days Overdue</th>}
            {showDueSoon && <th>Due In</th>}
            {showRecent && <th>Updated</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="project-cell">
                  <div className="project-no">{item.projectNo}</div>
                  <div className="project-name">{truncateText(item.projectName, 25)}</div>
                </div>
              </td>
              <td>{item.type}</td>
              <td>{truncateText(item.vendor, 20)}</td>
              <td>
                <span style={getStatusCellStyle(item.status)}>
                  {item.status}
                </span>
              </td>
              <td>{item.pfCode}</td>
              {showOverdue && (
                <td>
                  <span className="days-badge overdue">
                    {item.daysOverdue} days
                  </span>
                </td>
              )}
              {showDueSoon && (
                <td>
                  <span className="days-badge due-soon">
                    {item.daysDue === 0 ? 'Today' : `${item.daysDue} days`}
                  </span>
                </td>
              )}
              {showRecent && (
                <td>
                  {formatRelativeTime(item.updatedAt)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Utility functions
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default Dashboard;

// Add CSS styles for dashboard (would normally be in a separate CSS file)
const dashboardStyles = `
.dashboard-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e5e5;
}

.dashboard-header h1 {
  margin: 0 0 5px 0;
  font-size: 28px;
  color: #333;
}

.dashboard-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.dashboard-quick-links {
  display: flex;
  gap: 12px;
}

.quick-link-btn {
  padding: 8px 16px;
  background: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 14px;
  transition: background-color 0.2s;
}

.quick-link-btn:hover {
  background: #1d4ed8;
}

.dashboard-section {
  margin-bottom: 30px;
}

.dashboard-section h2 {
  margin: 0 0 15px 0;
  font-size: 20px;
  color: #333;
}

.dashboard-section h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #333;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.kpi-card {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.kpi-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.kpi-label {
  font-size: 14px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dashboard-data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 30px;
}

.table-container {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.dashboard-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.dashboard-table th {
  background: #f8f9fa;
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e5e5e5;
}

.dashboard-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: top;
}

.dashboard-table tr:hover {
  background: #f8f9fa;
}

.severity-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-badge.high {
  background: #fee2e2;
  color: #dc2626;
}

.severity-badge.med {
  background: #fef3c7;
  color: #d97706;
}

.status-badge {
  padding: 3px 8px;
  background: #f3f4f6;
  border-radius: 12px;
  font-size: 11px;
  color: #374151;
}

.days-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.days-badge.overdue {
  background: #fee2e2;
  color: #dc2626;
}

.days-badge.due-soon {
  background: #fef3c7;
  color: #d97706;
}

.project-cell {
  line-height: 1.3;
}

.project-no {
  font-weight: 600;
  color: #333;
}

.project-name {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.no-data {
  padding: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.dashboard-loading, .dashboard-error, .dashboard-no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .dashboard-quick-links {
    width: 100%;
    justify-content: center;
  }

  .kpi-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .dashboard-data-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-table {
    font-size: 12px;
  }

  .dashboard-table th,
  .dashboard-table td {
    padding: 8px 6px;
  }
}
`;

// Inject styles (in a real app, this would be in a CSS file)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = dashboardStyles;
  document.head.appendChild(styleSheet);
}