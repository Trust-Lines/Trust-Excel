import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './styles.css';
import GlobalNavbar from './components/GlobalNavbar';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import ActivationPage from './components/ActivationPage';
import ChangePasswordPage from './components/ChangePasswordPage';
import PasswordChangeGuard from './components/PasswordChangeGuard';
import RoleBasedRoute from './components/RoleBasedRoute';
import ModernDashboard from './pages/DashboardModern';
import ProjectsHub from './pages/ProjectsHub';
import AdminRoles from './components/AdminRoles';
import AdminUsers from './components/AdminUsers';
import SupplierTracking from './pages/SupplierTracking';
import SupplierTotal from './pages/SupplierTotal';
import ProjectTotal from './pages/ProjectTotal';
import Reports from './pages/Reports';
import TrustExpenses from './pages/TrustExpenses';
import ExpensesP from './pages/ExpensesP';
import ExpensesDirectOrder from './pages/ExpensesDirectOrder';
import ExpensesMissingExtra from './pages/ExpensesMissingExtra';
import AccessDenied from './pages/AccessDenied';
import ActivityLog from './pages/ActivityLog';
import BackupRestore from './pages/BackupRestore';
import TrashBin from './pages/TrashBin';
import DropboxTest from './pages/DropboxTest';
import PriceList from './pages/PriceList';
import PendingApprovals from './pages/PendingApprovals';
import { useAuth } from './contexts/AuthContext';
import { NAV_PAGES } from './lib/permissionKeys';

// Kullanıcının erişebildiği ilk sayfaya yönlendirir (DB-driven)
const SmartRedirect: React.FC = () => {
  const { canAccessPage } = useAuth();

  const firstAllowed = NAV_PAGES.find(page => canAccessPage(page.key));
  if (firstAllowed) {
    return <Navigate to={firstAllowed.path} replace />;
  }

  return <Navigate to="/access-denied" replace />;
};

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8f9fa'
      }}>
        <div style={{
          padding: '20px',
          fontSize: '16px',
          color: '#666'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Allow access to public routes (login and activation) when not authenticated
    return (
      <Routes>
        <Route path="/activate" element={<ActivationPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleMenuSelect = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="App">
      <GlobalNavbar
        onMenuToggle={handleMenuToggle}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        onMenuSelect={handleMenuSelect}
      />

      <Routes>
        {/* Default redirect - goes to first allowed page */}
        <Route path="/" element={<SmartRedirect />} />
        <Route path="/login" element={<SmartRedirect />} />

        {/* Change password route (not guarded to prevent infinite loops) */}
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* All other routes wrapped with PasswordChangeGuard */}
        <Route path="/*" element={
          <PasswordChangeGuard>
            <Routes>
              {/* Dashboard - guarded like all other pages */}
              <Route path="/dashboard" element={
                <RoleBasedRoute pageKey="dashboard">
                  <ModernDashboard />
                </RoleBasedRoute>
              } />

              {/* Project routes — all tabs live inside ProjectsHub */}
              <Route
                path="/project-tracking/projects"
                element={
                  <RoleBasedRoute pageKey="operational_board">
                    <ProjectsHub />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/project-tracking/missing-extra"
                element={
                  <RoleBasedRoute pageKey="missing_extra">
                    <ProjectsHub />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/project-tracking/direct-order"
                element={
                  <RoleBasedRoute pageKey="direct_order">
                    <ProjectsHub />
                  </RoleBasedRoute>
                }
              />

              {/* Admin routes - page permission system */}
              <Route
                path="/admin/roles"
                element={
                  <RoleBasedRoute pageKey="admin_roles_permissions">
                    <AdminRoles />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <RoleBasedRoute pageKey="admin_roles_permissions">
                    <AdminUsers />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/admin/activity-log"
                element={
                  <RoleBasedRoute pageKey="admin_roles_permissions">
                    <ActivityLog />
                  </RoleBasedRoute>
                }
              />

              {/* Backup & Restore */}
              <Route
                path="/admin/backup-restore"
                element={
                  <RoleBasedRoute pageKey="admin_roles_permissions">
                    <BackupRestore />
                  </RoleBasedRoute>
                }
              />

              {/* Trash Bin */}
              <Route
                path="/admin/trash-bin"
                element={
                  <RoleBasedRoute pageKey="trash_bin">
                    <TrashBin />
                  </RoleBasedRoute>
                }
              />

              {/* Supplier routes - page permission system */}
              <Route
                path="/supplier-tracking"
                element={
                  <RoleBasedRoute pageKey="suppliers_vendors">
                    <SupplierTracking />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/suppliers"
                element={
                  <RoleBasedRoute pageKey="suppliers_vendors">
                    <SupplierTracking />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/suppliers/:vendorCode"
                element={
                  <RoleBasedRoute pageKey="suppliers_vendors">
                    <SupplierTracking />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/suppliers/:vendorCode/p"
                element={
                  <RoleBasedRoute pageKey="suppliers_vendors">
                    <SupplierTracking />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/suppliers/:vendorCode/me"
                element={
                  <RoleBasedRoute pageKey="suppliers_vendors">
                    <SupplierTracking />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/suppliers/:vendorCode/do"
                element={
                  <RoleBasedRoute pageKey="suppliers_vendors">
                    <SupplierTracking />
                  </RoleBasedRoute>
                }
              />

              {/* Supplier Total */}
              <Route
                path="/supplier-total"
                element={
                  <RoleBasedRoute pageKey="supplier_total">
                    <SupplierTotal />
                  </RoleBasedRoute>
                }
              />

              {/* Project Total */}
              <Route
                path="/project-total"
                element={
                  <RoleBasedRoute pageKey="project_total">
                    <ProjectTotal />
                  </RoleBasedRoute>
                }
              />

              {/* Reports */}
              <Route
                path="/reports"
                element={
                  <RoleBasedRoute pageKey="operational_board">
                    <Reports />
                  </RoleBasedRoute>
                }
              />

              {/* Trust Expenses */}
              <Route
                path="/trust-expenses"
                element={
                  <RoleBasedRoute pageKey="trust_expenses">
                    <TrustExpenses />
                  </RoleBasedRoute>
                }
              />

              {/* Expenses P */}
              <Route
                path="/expenses-p"
                element={
                  <RoleBasedRoute pageKey="expenses_p">
                    <ExpensesP />
                  </RoleBasedRoute>
                }
              />

              {/* Expenses Direct Order */}
              <Route
                path="/expenses-direct-order"
                element={
                  <RoleBasedRoute pageKey="expenses_direct_order">
                    <ExpensesDirectOrder />
                  </RoleBasedRoute>
                }
              />

              {/* Expenses Missing & Extra */}
              <Route
                path="/expenses-missing-extra"
                element={
                  <RoleBasedRoute pageKey="expenses_missing_extra">
                    <ExpensesMissingExtra />
                  </RoleBasedRoute>
                }
              />

              {/* Dropbox Test */}
              <Route
                path="/dropbox-test"
                element={
                  <RoleBasedRoute pageKey="admin_roles_permissions">
                    <DropboxTest />
                  </RoleBasedRoute>
                }
              />

              {/* Price List */}
              <Route
                path="/price-list"
                element={
                  <RoleBasedRoute pageKey="operational_board">
                    <PriceList />
                  </RoleBasedRoute>
                }
              />

              {/* Pending Approvals */}
              <Route
                path="/pending-approvals"
                element={
                  <RoleBasedRoute pageKey="operational_board">
                    <PendingApprovals />
                  </RoleBasedRoute>
                }
              />

              {/* Error pages */}
              <Route path="/access-denied" element={<AccessDenied />} />

              {/* Fallback - redirect to first allowed page */}
              <Route path="*" element={<SmartRedirect />} />
            </Routes>
          </PasswordChangeGuard>
        } />
      </Routes>
    </div>
  );
};

export default App;