/**
 * API Client with automatic JWT token injection
 * Handles all API requests with proper authentication headers
 */

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class APIClient {
  private baseURL: string;

  constructor() {
    // Get base URL from api.ts logic
    this.baseURL = this.getApiBaseUrl();
  }

  private getApiBaseUrl(): string {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;

      // Production tenant subdomain (e.g., acme.forge-itsm.com)
      if (hostname.endsWith('.forge-itsm.com') && hostname !== 'forge-itsm.com') {
        // Call API on same domain - Worker handles routing
        return `${window.location.protocol}//${hostname}`;
      }

      // Development or direct Pages access
      if (hostname === 'localhost' || hostname.includes('pages.dev')) {
        return 'https://itsm-backend.joshua-r-klimek.workers.dev';
      }
    }

    return 'https://itsm-backend.joshua-r-klimek.workers.dev';
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private buildURL(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(endpoint, this.baseURL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return url.toString();
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      console.log('Authentication failed - logging out');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpires');

      // Redirect to login page
      window.location.href = '/auth/login';
      throw new Error('Authentication required');
    }

    // Try to parse JSON response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }

      return data;
    }

    // For non-JSON responses
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response as unknown as T;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = this.buildURL(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildURL(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildURL(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = this.buildURL(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Upload file with multipart/form-data (no JSON content-type)
   */
  async upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = this.buildURL(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        ...options?.headers,
      },
      body: formData,
    });

    return this.handleResponse<T>(response);
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export class for testing/mocking
export default APIClient;
