/**
 * Idle Timeout Hook
 * Tracks user activity and triggers callback after period of inactivity
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimeoutOptions {
  /**
   * Timeout duration in milliseconds
   * Default: 30 minutes (1,800,000 ms)
   */
  timeout?: number;

  /**
   * Warning duration in milliseconds before timeout
   * Default: 60 seconds (60,000 ms)
   */
  warningTime?: number;

  /**
   * Callback when warning period starts
   */
  onWarning?: () => void;

  /**
   * Callback when timeout is reached
   */
  onTimeout: () => void;

  /**
   * Whether idle tracking is enabled
   * Default: true
   */
  enabled?: boolean;
}

/**
 * Hook to detect user inactivity and trigger logout
 *
 * @example
 * ```tsx
 * const { resetTimer, timeRemaining } = useIdleTimeout({
 *   timeout: 30 * 60 * 1000, // 30 minutes
 *   warningTime: 60 * 1000,   // 60 seconds warning
 *   onWarning: () => setShowWarning(true),
 *   onTimeout: () => logout(),
 * });
 * ```
 */
export function useIdleTimeout({
  timeout = 30 * 60 * 1000, // 30 minutes default
  warningTime = 60 * 1000,  // 60 seconds default
  onWarning,
  onTimeout,
  enabled = true,
}: UseIdleTimeoutOptions) {
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  /**
   * Clear all timers
   */
  const clearTimers = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    if (warningIdRef.current) {
      clearTimeout(warningIdRef.current);
      warningIdRef.current = null;
    }
  }, []);

  /**
   * Reset idle timer (called on user activity)
   */
  const resetTimer = useCallback(() => {
    if (!enabled) return;

    lastActivityRef.current = Date.now();
    clearTimers();

    // Set warning timer
    if (onWarning && warningTime > 0) {
      warningIdRef.current = setTimeout(() => {
        onWarning();
      }, timeout - warningTime);
    }

    // Set timeout timer
    timeoutIdRef.current = setTimeout(() => {
      onTimeout();
    }, timeout);
  }, [enabled, timeout, warningTime, onWarning, onTimeout, clearTimers]);

  /**
   * Handle user activity events
   */
  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  /**
   * Setup event listeners for user activity
   */
  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle activity handler to avoid excessive resets
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    const throttledHandler = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          handleActivity();
          throttleTimeout = null;
        }, 1000); // Throttle to once per second
      }
    };

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, throttledHandler, { passive: true });
    });

    // Start timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledHandler);
      });
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      clearTimers();
    };
  }, [enabled, handleActivity, resetTimer, clearTimers]);

  /**
   * Get time remaining until timeout
   */
  const getTimeRemaining = useCallback(() => {
    const elapsed = Date.now() - lastActivityRef.current;
    return Math.max(0, timeout - elapsed);
  }, [timeout]);

  return {
    resetTimer,
    getTimeRemaining,
  };
}
