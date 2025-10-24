interface VersionInfo {
  version: string;
  buildTime: string;
}

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const VERSION_STORAGE_KEY = 'app_version';

let currentVersion: VersionInfo | null = null;
let checkInterval: ReturnType<typeof setInterval> | null = null;
let updateCallback: (() => void) | null = null;

/**
 * Fetch the current version from the server
 */
async function fetchServerVersion(): Promise<VersionInfo | null> {
  try {
    // Add cache-busting query parameter
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch version.json');
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('Error fetching version:', error);
    return null;
  }
}

/**
 * Get the cached version from localStorage
 */
function getCachedVersion(): VersionInfo | null {
  try {
    const cached = localStorage.getItem(VERSION_STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

/**
 * Save version to localStorage
 */
function setCachedVersion(version: VersionInfo): void {
  try {
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(version));
  } catch (error) {
    console.warn('Failed to cache version:', error);
  }
}

/**
 * Check if a new version is available
 */
export async function checkForUpdates(): Promise<boolean> {
  const serverVersion = await fetchServerVersion();

  if (!serverVersion) {
    return false;
  }

  // If this is the first time checking, save the version and return false
  if (!currentVersion) {
    const cached = getCachedVersion();
    currentVersion = cached || serverVersion;

    // If no cached version, this is first load - save it
    if (!cached) {
      setCachedVersion(serverVersion);
      return false;
    }
  }

  // Compare build times to detect updates
  const hasUpdate = serverVersion.buildTime !== currentVersion.buildTime;

  if (hasUpdate) {
    console.log('New version detected:', serverVersion);
  }

  return hasUpdate;
}

/**
 * Start periodic version checking
 */
export function startVersionCheck(onUpdateAvailable: () => void): void {
  updateCallback = onUpdateAvailable;

  // Initial check
  checkForUpdates().then((hasUpdate) => {
    if (hasUpdate && updateCallback) {
      updateCallback();
    }
  });

  // Set up periodic checks
  if (checkInterval) {
    clearInterval(checkInterval);
  }

  checkInterval = setInterval(async () => {
    const hasUpdate = await checkForUpdates();
    if (hasUpdate && updateCallback) {
      updateCallback();
    }
  }, VERSION_CHECK_INTERVAL);
}

/**
 * Stop version checking
 */
export function stopVersionCheck(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  updateCallback = null;
}

/**
 * Reload the page and update the cached version
 */
export async function reloadApp(): Promise<void> {
  const serverVersion = await fetchServerVersion();
  if (serverVersion) {
    setCachedVersion(serverVersion);
  }

  // Reload the page
  window.location.reload();
}

/**
 * Check for updates when navigating (useful for catching issues early)
 */
export async function checkOnNavigate(): Promise<boolean> {
  return checkForUpdates();
}
