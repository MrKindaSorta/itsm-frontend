/**
 * Get the API base URL based on current hostname
 * For tenant subdomains (e.g., acme.forge-itsm.com), use the same domain
 * For development, use the Worker URL
 */
export function getApiBaseUrl(): string {
  // In browser
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Production tenant subdomain (e.g., acme.forge-itsm.com)
    if (hostname.endsWith('.forge-itsm.com') && hostname !== 'forge-itsm.com') {
      return `${window.location.protocol}//${hostname}`;
    }

    // Development or Pages deployment
    if (hostname === 'localhost' || hostname.includes('pages.dev')) {
      return 'https://itsm-backend.joshua-r-klimek.workers.dev';
    }
  }

  // Default fallback
  return 'https://itsm-backend.joshua-r-klimek.workers.dev';
}

// Set global API base URL at runtime
const runtimeApiBase = getApiBaseUrl();

// Monkey-patch fetch to automatically rewrite API URLs
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === 'string' && input.includes('itsm-backend.joshua-r-klimek.workers.dev')) {
      input = input.replace('https://itsm-backend.joshua-r-klimek.workers.dev', runtimeApiBase);
    }
    return originalFetch(input, init);
  };
}

export const API_BASE = runtimeApiBase;
