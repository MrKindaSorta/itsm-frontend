/**
 * Authenticated fetch wrapper
 * Automatically injects JWT token from localStorage and handles 401 responses
 *
 * Usage:
 *   import { fetchWithAuth, authFetch } from '@/lib/fetchWithAuth';
 *
 *   // Standard usage:
 *   const response = await fetchWithAuth('/api/tickets');
 *
 *   // Convenience methods:
 *   const response = await authFetch.get('/api/tickets');
 *   const response = await authFetch.post('/api/tickets', { title: 'New ticket' });
 *   const response = await authFetch.put('/api/tickets/123', { status: 'closed' });
 *   const response = await authFetch.delete('/api/tickets/123');
 */

export async function fetchWithAuth(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options?.headers || {});

  // Add Authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Make request with authentication
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    console.log('[fetchWithAuth] 401 Unauthorized - token expired, logging out');

    // Clear authentication state
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpires');

    // Only redirect if NOT already on auth page (prevent infinite loop)
    if (!window.location.pathname.startsWith('/auth/')) {
      window.location.href = '/auth/login';
    }

    throw new Error('Authentication required');
  }

  return response;
}

/**
 * Convenience methods for common HTTP verbs
 */
export const authFetch = {
  /**
   * GET request with authentication
   */
  get: async (url: string, options?: RequestInit) =>
    fetchWithAuth(url, { ...options, method: 'GET' }),

  /**
   * POST request with authentication and JSON body
   */
  post: async (url: string, body?: unknown, options?: RequestInit) =>
    fetchWithAuth(url, {
      ...options,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: body ? JSON.stringify(body) : undefined,
    }),

  /**
   * PUT request with authentication and JSON body
   */
  put: async (url: string, body?: unknown, options?: RequestInit) =>
    fetchWithAuth(url, {
      ...options,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: body ? JSON.stringify(body) : undefined,
    }),

  /**
   * DELETE request with authentication
   */
  delete: async (url: string, options?: RequestInit) =>
    fetchWithAuth(url, { ...options, method: 'DELETE' }),
};
