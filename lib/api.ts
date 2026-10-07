/**
 * API Client for Trust Project
 * Handles authentication and HTTP requests to the backend
 */

interface ApiConfig {
  baseURL: string;
  timeout?: number;
}

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 10000; // Default 10 seconds
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
      };
    }
    return {};
  }

  private async makeRequest(endpoint: string, config: RequestConfig): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...(config.headers || {}),
    };

    const requestConfig: RequestInit = {
      method: config.method,
      headers,
      credentials: 'include', // Include cookies for refresh token
      signal: AbortSignal.timeout(this.timeout),
    };

    if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      requestConfig.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, requestConfig);

      // Handle non-JSON responses (like 204 No Content)
      if (response.status === 204) {
        return null;
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        data = null;
      }

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          throw new Error('Request timed out. Please try again.');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async get(endpoint: string, headers?: Record<string, string>): Promise<any> {
    return this.makeRequest(endpoint, { method: 'GET', headers });
  }

  async post(endpoint: string, body?: any, headers?: Record<string, string>): Promise<any> {
    return this.makeRequest(endpoint, { method: 'POST', body, headers });
  }

  async put(endpoint: string, body?: any, headers?: Record<string, string>): Promise<any> {
    return this.makeRequest(endpoint, { method: 'PUT', body, headers });
  }

  async patch(endpoint: string, body?: any, headers?: Record<string, string>): Promise<any> {
    return this.makeRequest(endpoint, { method: 'PATCH', body, headers });
  }

  async delete(endpoint: string, headers?: Record<string, string>): Promise<any> {
    return this.makeRequest(endpoint, { method: 'DELETE', headers });
  }
}

// Create and export a configured instance
const getBaseURL = () => {
  // All /api/* requests are proxied:
  // Dev: Vite proxy (vite.config.ts) → localhost:3001
  // Prod: Vercel rewrite (vercel.json) → Railway backend
  return "";
};

export const apiClient = new ApiClient({
  baseURL: getBaseURL(),
  timeout: 15000, // 15 seconds
});

// Export the class for custom instances if needed
export { ApiClient };