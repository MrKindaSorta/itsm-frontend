/**
 * Timezone utilities for ITSM platform
 * Implements industry-standard "Store UTC, Display Local" pattern
 *
 * Key principle: Users never configure timezone settings.
 * Browser automatically detects timezone and all timestamps display in user's local time.
 */

/**
 * Get user's IANA timezone identifier from browser
 * @returns {string} IANA timezone (e.g., "America/New_York", "Europe/London")
 * @example
 * const tz = getUserTimezone(); // "America/New_York"
 */
export function getUserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) return tz;
  } catch (e) {
    console.warn('Failed to detect timezone:', e);
  }

  // Fallback: Calculate UTC offset (less accurate, doesn't handle DST)
  const offset = -new Date().getTimezoneOffset() / 60;
  return `UTC${offset >= 0 ? '+' : ''}${offset}`;
}

/**
 * Parse ISO 8601 string or Date object to Date
 * Handles both strings and Date objects safely
 *
 * @param date - Date object, ISO 8601 string, or null/undefined
 * @returns {Date | null} Parsed Date object or null if invalid
 *
 * @example
 * parseDate("2025-11-12T14:30:00Z") // Date object
 * parseDate(new Date()) // Returns same Date object
 * parseDate(null) // null
 * parseDate("invalid") // null
 */
export function parseDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  if (date instanceof Date) return date;

  try {
    const parsed = new Date(date);
    // Check if valid date (invalid dates return NaN from getTime())
    if (isNaN(parsed.getTime())) return null;
    return parsed;
  } catch (e) {
    console.error('Failed to parse date:', date, e);
    return null;
  }
}

/**
 * Format date in user's local timezone with automatic locale detection
 *
 * @param date - Date object or ISO 8601 string
 * @param options - Intl.DateTimeFormatOptions (optional overrides)
 * @returns {string} Formatted date string with timezone indicator
 *
 * @example
 * // User in New York (EST)
 * formatInUserTimezone("2025-11-12T14:30:00Z")
 * // Returns: "Nov 12, 2025, 9:30 AM EST"
 *
 * // User in London (GMT)
 * formatInUserTimezone("2025-11-12T14:30:00Z")
 * // Returns: "Nov 12, 2025, 2:30 PM GMT"
 */
export function formatInUserTimezone(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const parsed = parseDate(date);
  if (!parsed) return 'Invalid date';

  // Automatically use user's browser locale
  const locale = navigator.language || 'en-US';

  // Default options: Show date, time, and timezone abbreviation
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short', // Shows "EST", "PST", "GMT", etc.
  };

  return parsed.toLocaleString(locale, {
    ...defaultOptions,
    ...options,
  });
}

/**
 * Get user's current UTC offset in hours
 * Useful for debugging timezone issues
 *
 * @returns {number} Offset in hours (e.g., -5 for EST, +1 for CET)
 * @example
 * getUserTimezoneOffset() // -5 (if user in New York during winter)
 */
export function getUserTimezoneOffset(): number {
  return -new Date().getTimezoneOffset() / 60;
}

/**
 * Check if a date string is ISO 8601 format
 * Used for automatic date parsing in API responses
 *
 * @param str - String to check
 * @returns {boolean} True if matches ISO 8601 pattern
 * @example
 * isISO8601("2025-11-12T14:30:00Z") // true
 * isISO8601("2025-11-12T14:30:00.123Z") // true
 * isISO8601("2025-11-12") // true (date-only)
 * isISO8601("Nov 12, 2025") // false
 */
export function isISO8601(str: string): boolean {
  // Matches: YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(str);
}
