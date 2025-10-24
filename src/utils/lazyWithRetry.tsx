import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
}

/**
 * Enhanced lazy loading with automatic retry and reload on chunk loading failure
 *
 * This solves the problem where users get errors after a deployment because:
 * 1. Old JavaScript chunks are deleted
 * 2. Browser tries to load a chunk that no longer exists
 * 3. Results in "ChunkLoadError" or "Failed to fetch dynamically imported module"
 *
 * Solution:
 * - Retry failed imports a few times (network glitch)
 * - If still failing, it's likely a deployment issue → reload the page
 * - Page reload fetches fresh index.html with correct chunk names
 */
function lazyWithRetry<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  options: RetryOptions = {}
): LazyExoticComponent<T> {
  const { maxRetries = 3, delay = 1000 } = options;

  return lazy(async () => {
    const pageHasBeenReloaded = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      // Try to import the component
      const component = await importFunction();

      // Success! Clear the reload flag
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');

      return component;
    } catch (error) {
      // Check if this is a chunk loading error
      const isChunkLoadError =
        error instanceof Error &&
        (error.name === 'ChunkLoadError' ||
          error.message.includes('Failed to fetch dynamically imported module') ||
          error.message.includes('Importing a module script failed') ||
          error.message.includes('Failed to load'));

      if (isChunkLoadError) {
        console.error('Chunk load error detected:', error);

        // If we haven't reloaded yet, do it now
        if (!pageHasBeenReloaded) {
          console.log('Reloading page to fetch new chunks...');
          window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');

          // Preserve the current URL
          window.location.reload();

          // Return a never-resolving promise to prevent further execution
          return new Promise<never>(() => {});
        }

        // If we've already reloaded once, try retrying with delay
        console.log('Already reloaded once, attempting retry...');

        for (let i = 0; i < maxRetries; i++) {
          try {
            console.log(`Retry attempt ${i + 1}/${maxRetries}...`);
            await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
            return await importFunction();
          } catch (retryError) {
            console.error(`Retry ${i + 1} failed:`, retryError);

            // If this is the last retry, give up and show error
            if (i === maxRetries - 1) {
              throw new Error(
                'Failed to load application resources after multiple attempts. Please check your internet connection and try again.'
              );
            }
          }
        }
      }

      // If it's not a chunk load error, just throw it
      throw error;
    }

    // This should never be reached, but TypeScript needs a return
    return { default: (() => null) as unknown as T };
  });
}

export default lazyWithRetry;
