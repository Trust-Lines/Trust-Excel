import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { removeToken, restoreSession, getCurrentUser, logout as apiLogout } from '../lib/auth';

interface User {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  forcePasswordChange?: boolean;
  displayName?: string; // Computed stable display name
}

interface Role {
  id: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
}

interface Permission {
  key: string;
  module: string;
  action: string;
}

interface ColumnVisibility {
  columnKey: string;
  isHidden: boolean;
  isReadOnly: boolean;
}

interface UserAccessPolicy {
  columnsHidden: string[];
  columnsReadOnly: string[];
  rowScopes: Record<string, any>;
  modulePermissions: Record<string, any>;
  pagePermissions?: Record<string, boolean>; // DB-driven: { dashboard: true, suppliers_vendors: false, ... }
  allowedTypes?: { enumTypes: string[] | null; customTypeIds: string[] | null } | null;
  projectScope?: { enabled: boolean; projectIds: string[] } | null;
}

interface AuthContextType {
  user: User | null;
  role: Role | null;
  permissions: Permission[];
  columnVisibility: ColumnVisibility[];
  userAccessPolicy: UserAccessPolicy | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresPasswordChange: boolean;
  isAdmin: boolean; // DB-driven: true if role has admin_roles_permissions page access
  login: (user: User, role: Role, permissions: Permission[], columnVisibility?: ColumnVisibility[], userAccessPolicy?: UserAccessPolicy, isAdminFlag?: boolean) => void;
  logout: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  canAccessPage: (pageKey: string) => boolean;
  getPagePermissions: () => Record<string, boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility[]>([]);
  const [userAccessPolicy, setUserAccessPolicy] = useState<UserAccessPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const isAuthenticated = !!user;

  // Helper to compute stable displayName
  const computeDisplayName = (userData: Partial<User>): string => {
    if (userData.name) {
      return userData.name;
    }
    if (userData.email) {
      return userData.email.split('@')[0];
    }
    return 'User';
  };

  // Safe merge helper to preserve displayName
  const safeUserMerge = (prevUser: User | null, newUserData: any): User => {
    const displayName = prevUser?.displayName || computeDisplayName(newUserData);
    return {
      ...newUserData,
      displayName,
    };
  };

  const login = (userData: User, roleData: Role, permissionsData: Permission[], columnVisibilityData?: ColumnVisibility[], userAccessPolicyData?: UserAccessPolicy, isAdminFlag?: boolean) => {
    // Compute stable display name
    const userWithDisplayName: User = {
      ...userData,
      displayName: computeDisplayName(userData)
    };

    setUser(userWithDisplayName);
    setRole(roleData);
    setPermissions(permissionsData);
    setColumnVisibility(columnVisibilityData || []);
    setUserAccessPolicy(userAccessPolicyData || null);
    // isAdmin comes purely from backend (DB-driven)
    setIsAdmin(!!isAdminFlag);
    lastPermissionsRef.current = JSON.stringify(userAccessPolicyData?.pagePermissions || {});

  };

  const logout = async () => {
    try {
      // Call backend logout to clear refresh token cookie
      await apiLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    }

    // Clear local state regardless of API success
    setUser(null);
    setRole(null);
    setPermissions([]);
    setColumnVisibility([]);
    setUserAccessPolicy(null);
    setIsAdmin(false);
  };

  // Track last known permissions for change detection
  const lastPermissionsRef = useRef<string>('');

  // Apply fetched auth data to state
  const applyAuthData = useCallback((data: any) => {
    const userWithDisplayName = safeUserMerge(user, data.user);
    setUser(userWithDisplayName);
    setRole(data.role);
    setPermissions(data.permissions);
    setColumnVisibility(data.columnVisibility || []);
    setUserAccessPolicy(data.userAccessPolicy || null);
    // isAdmin from backend is DB-driven (based on admin_roles_permissions page access)
    setIsAdmin(!!data.isAdmin);
    // Update ref
    lastPermissionsRef.current = JSON.stringify(data.userAccessPolicy?.pagePermissions || {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch permissions from backend (used when access is denied to pick up newly granted permissions)
  const refreshPermissions = useCallback(async () => {
    try {
      const data = await getCurrentUser();
      applyAuthData(data);
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
    }
  }, [applyAuthData]);

  // Check if user is logged in on app start with refresh token support
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Attempt to restore session (will try refresh token if access token missing/expired)
        const userData = await restoreSession();
        applyAuthData(userData);

      } catch (error) {
        // No valid session found, user will need to login
        removeToken();
      }

      setIsLoading(false);
    };

    initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Permission sync - listens for socket events, falls back to 60s poll
  useEffect(() => {
    if (!user) return;

    const poll = async () => {
      try {
        const data = await getCurrentUser();
        const newPerms = JSON.stringify((data.userAccessPolicy as any)?.pagePermissions || {});
        if (newPerms !== lastPermissionsRef.current) {
          applyAuthData(data);
        }
      } catch {
        // Silently ignore
      }
    };

    // Fallback poll at 60s (socket events handle near-real-time)
    const intervalId = setInterval(poll, 60000);
    return () => clearInterval(intervalId);
  }, [user?.id, applyAuthData]); // eslint-disable-line react-hooks/exhaustive-deps

  const requiresPasswordChange = !!user?.forcePasswordChange;

  // PURE DB-DRIVEN: canAccessPage checks pagePermissions from backend
  const canAccessPage = (pageKey: string): boolean => {
    return userAccessPolicy?.pagePermissions?.[pageKey] || false;
  };

  // PURE DB-DRIVEN: getPagePermissions returns what backend sent
  const getPagePermissions = (): Record<string, boolean> => {
    return userAccessPolicy?.pagePermissions || {};
  };

  const value: AuthContextType = {
    user,
    role,
    permissions,
    columnVisibility,
    userAccessPolicy,
    isAuthenticated,
    isLoading,
    requiresPasswordChange,
    isAdmin,
    login,
    logout,
    refreshPermissions,
    canAccessPage,
    getPagePermissions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
