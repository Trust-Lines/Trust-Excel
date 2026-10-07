// Auth API helper
// Force relative URLs in production to use Vercel proxy
const API_URL = import.meta.env.PROD
  ? "" // Use same-origin via Vercel rewrite in production
  : (import.meta.env.VITE_API_URL || "http://localhost:3001/api");

// Production API URL logging
if (import.meta.env.PROD) {
}

// Helper function to construct API URLs
const buildApiUrl = (path: string): string => {
  if (API_URL) {
    return `${API_URL}${path}`;
  }
  return `/api${path}`;
};

export interface LoginCredentials {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface ColumnVisibility {
  columnKey: string;
  isHidden: boolean;
  isReadOnly: boolean;
}

export interface UserAccessPolicy {
  columnsHidden: string[];
  columnsReadOnly: string[];
  rowScopes: Record<string, any>;
  modulePermissions: Record<string, any>;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
  };
  role: {
    id: string;
    name: string;
    isSystem: boolean;
    isActive: boolean;
  };
  permissions: Array<{
    key: string;
    module: string;
    action: string;
  }>;
  columnVisibility?: ColumnVisibility[];
  userAccessPolicy?: UserAccessPolicy;
  isAdmin?: boolean; // 🚨 CRITICAL: Admin flag from backend
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    isActive: boolean;
    forcePasswordChange?: boolean;
    createdAt: string;
  };
  role: {
    id: string;
    name: string;
    isSystem: boolean;
    isActive: boolean;
  };
  permissions: Array<{
    key: string;
    module: string;
    action: string;
  }>;
  columnVisibility: ColumnVisibility[];
  userAccessPolicy: UserAccessPolicy;
  isAdmin: boolean; // 🚨 CRITICAL: Admin flag from backend
}

export interface AuthError {
  message: string;
  statusCode: number;
  error: string;
}

// Token storage helpers
export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('auth_token');
};

// Refresh token helper
export const refreshToken = async (): Promise<{ accessToken: string }> => {
  const response = await fetch(buildApiUrl('/auth/refresh'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include httpOnly cookies
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Token refresh failed');
  }

  return data;
};

// Central API client with auto-refresh
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const makeRequest = (token?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Construct full URL - handle same-origin proxy in production
    const fullUrl = url.startsWith('/api') ?
      (API_URL ? `${API_URL}${url.substring(4)}` : url) :
      url;

    return fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include', // Always include cookies for refresh token
    });
  };

  // First attempt with current token
  const token = getToken();
  let response = await makeRequest(token || undefined);
  
  // If 401, try to refresh token and retry once
  if (response.status === 401 && token) {

    try {
      const refreshData = await refreshToken();
      setToken(refreshData.accessToken);


      // Retry original request with new token
      response = await makeRequest(refreshData.accessToken);
    } catch (refreshError) {
      console.error('❌ Token refresh failed:', refreshError);

      // Clear token and let the app handle redirect to login
      removeToken();
      throw new Error('Session expired, please log in again');
    }
  }
  
  return response;
};

// API calls
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await fetch(buildApiUrl('/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include for refresh token cookie
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  // Store token
  setToken(data.accessToken);


  return data;
};

export const logout = async (): Promise<void> => {
  // Always clear local token first to prevent race conditions
  removeToken();

  try {
    // Call backend to revoke refresh token and clear httpOnly cookie
    const fullUrl = API_URL ? `${API_URL}/auth/logout` : '/api/auth/logout';
    await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Send httpOnly cookie so backend can clear it
    });
  } catch (error) {
    console.error('Logout API call failed:', error);
  }
};

export const getCurrentUser = async (): Promise<MeResponse> => {
  // Try to get user info, apiFetch will handle token refresh if needed
  try {
    const response = await apiFetch('/api/auth/me');

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user info');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Create authenticated request helper (DEPRECATED - use apiFetch instead)
export const createAuthenticatedRequest = (url: string, options: RequestInit = {}) => {
  console.warn('⚠️  createAuthenticatedRequest is deprecated, use apiFetch instead');
  return apiFetch(url, options);
};

// Session restoration from refresh token
export const restoreSession = async (): Promise<MeResponse> => {

  const token = getToken();

  // If no access token, try refresh token first
  if (!token) {

    try {
      const refreshData = await refreshToken();
      setToken(refreshData.accessToken);
    } catch (error) {
      throw new Error('No valid session found');
    }
  }

  // Now get current user (this will also handle any additional token refresh if needed)
  return getCurrentUser();
};