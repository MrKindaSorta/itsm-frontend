/**
 * Dynamic color generation for reports
 * Provides consistent colors for priorities, categories, and statuses
 */

// Default color mappings for known values
const DEFAULT_PRIORITY_COLORS: { [key: string]: string } = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

const DEFAULT_STATUS_COLORS: { [key: string]: string } = {
  new: '#3b82f6',
  open: '#a855f7',
  in_progress: '#f97316',
  waiting: '#eab308',
  resolved: '#22c55e',
  closed: '#6b7280',
};

const DEFAULT_SLA_COLORS = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  blue: '#3b82f6',
};

/**
 * Generate a consistent color for a given string using a simple hash
 * This ensures the same value always gets the same color
 */
function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert hash to hue (0-360)
  const hue = Math.abs(hash % 360);

  // Use HSL for better color distribution
  // Saturation: 65-75% for vibrant but not overwhelming colors
  // Lightness: 45-55% for good contrast on both light and dark backgrounds
  const saturation = 65 + (Math.abs(hash) % 10);
  const lightness = 45 + (Math.abs(hash >> 8) % 10);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Get color for a priority value
 * Falls back to hash-based color for unknown priorities
 */
export function getPriorityColor(priority: string): string {
  const normalized = priority.toLowerCase();
  return DEFAULT_PRIORITY_COLORS[normalized] || hashStringToColor(priority);
}

/**
 * Get color for a status value
 * Falls back to hash-based color for unknown statuses
 */
export function getStatusColor(status: string): string {
  const normalized = status.toLowerCase().replace(/\s+/g, '_');
  return DEFAULT_STATUS_COLORS[normalized] || hashStringToColor(status);
}

/**
 * Get color for an SLA status
 */
export function getSLAColor(slaStatus: string): string {
  return DEFAULT_SLA_COLORS[slaStatus as keyof typeof DEFAULT_SLA_COLORS] || DEFAULT_SLA_COLORS.blue;
}

/**
 * Get color for a category value
 * Uses hash-based color generation for consistent but unique colors
 */
export function getCategoryColor(category: string): string {
  return hashStringToColor(category);
}

/**
 * Generate a color palette for an array of values
 * Ensures all values have consistent colors
 */
export function generateColorPalette(values: string[], type: 'priority' | 'status' | 'category' = 'category'): { [key: string]: string } {
  const palette: { [key: string]: string } = {};

  values.forEach(value => {
    switch (type) {
      case 'priority':
        palette[value] = getPriorityColor(value);
        break;
      case 'status':
        palette[value] = getStatusColor(value);
        break;
      case 'category':
        palette[value] = getCategoryColor(value);
        break;
    }
  });

  return palette;
}

/**
 * Get all default priority colors
 */
export function getDefaultPriorityColors(): { [key: string]: string } {
  return { ...DEFAULT_PRIORITY_COLORS };
}

/**
 * Get all default status colors
 */
export function getDefaultStatusColors(): { [key: string]: string } {
  return { ...DEFAULT_STATUS_COLORS };
}

/**
 * Get all SLA colors
 */
export function getSLAColors() {
  return { ...DEFAULT_SLA_COLORS };
}
