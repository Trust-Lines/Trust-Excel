import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPageKeyByPath } from '../lib/permissionKeys';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  pageKey?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  pageKey
}) => {
  const { isAuthenticated, isLoading, canAccessPage, refreshPermissions } = useAuth();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshAttempts = useRef(0);

  // Reset refresh attempts when route changes
  useEffect(() => {
    refreshAttempts.current = 0;
  }, [location.pathname]);

  if (isLoading || isRefreshing) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8f9fa'
      }}>
        <div style={{ padding: '20px', fontSize: '16px', color: '#666' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // DB-driven page access check (no role-name bypass)
  const effectivePageKey = pageKey || getPageKeyByPath(location.pathname);

  if (effectivePageKey) {
    const hasAccess = canAccessPage(effectivePageKey);

    if (!hasAccess) {
      // If userAccessPolicy is not loaded yet (just logged in), wait for it
      // Try refreshing permissions up to 2 times before denying
      if (refreshAttempts.current < 2) {
        refreshAttempts.current += 1;
        if (!isRefreshing) {
          setIsRefreshing(true);
          refreshPermissions().finally(() => setIsRefreshing(false));
        }
        return null;
      }

      return <Navigate to="/access-denied" replace />;
    }
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
