import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { TicketStatus, TicketPriority, SLAStatusType } from '@/types';

// Utility for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return formatDate(d);
}

// Status color mapping
export function getStatusColor(status: TicketStatus): string {
  const colors: Record<TicketStatus, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    open: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    in_progress: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    waiting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };
  return colors[status] || colors.new;
}

// Priority color mapping
export function getPriorityColor(priority: TicketPriority): string {
  const colors: Record<TicketPriority, string> = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[priority] || colors.medium;
}

// SLA status color
export function getSLAStatusColor(status: SLAStatusType): string {
  const colors: Record<SLAStatusType, string> = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[status];
}

// Priority sorting
export function sortByPriority(a: TicketPriority, b: TicketPriority): number {
  const priorityOrder: Record<TicketPriority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return priorityOrder[b] - priorityOrder[a];
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Generate ticket ID
export function generateTicketId(): string {
  return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}

// Calculate SLA time remaining
export function calculateTimeRemaining(dueDate: Date): number {
  const now = new Date();
  const diff = dueDate.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60))); // in minutes
}

// Format duration
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate random color for avatars
export function generateAvatarColor(seed: string): string {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Ticket sorting utilities
import type { Ticket } from '@/types';

export type SortColumn = 'id' | 'title' | 'status' | 'priority' | 'assignee' | 'requester' | 'sla' | 'updated';
export type SortDirection = 'asc' | 'desc' | null;

export function sortTickets(
  tickets: Ticket[],
  column: SortColumn | null,
  direction: SortDirection
): Ticket[] {
  if (!column || !direction) return tickets;

  const sorted = [...tickets].sort((a, b) => {
    let comparison = 0;

    switch (column) {
      case 'id':
        // Sort by ticket number (TCK-1001 -> 1001)
        const numA = parseInt(a.id.split('-')[1] || '0');
        const numB = parseInt(b.id.split('-')[1] || '0');
        comparison = numA - numB;
        break;

      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;

      case 'status':
        const statusOrder: Record<TicketStatus, number> = {
          new: 1,
          open: 2,
          in_progress: 3,
          waiting: 4,
          resolved: 5,
          closed: 6,
        };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;

      case 'priority':
        const priorityOrder: Record<TicketPriority, number> = {
          urgent: 4,
          high: 3,
          medium: 2,
          low: 1,
        };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;

      case 'assignee':
        // Unassigned tickets go last when ascending, first when descending
        if (!a.assignee && !b.assignee) comparison = 0;
        else if (!a.assignee) comparison = 1;
        else if (!b.assignee) comparison = -1;
        else comparison = a.assignee.name.localeCompare(b.assignee.name);
        break;

      case 'requester':
        comparison = a.requester.name.localeCompare(b.requester.name);
        break;

      case 'sla':
        const slaOrder: Record<SLAStatusType, number> = {
          red: 3,
          yellow: 2,
          green: 1,
        };
        comparison = slaOrder[a.sla.status] - slaOrder[b.sla.status];
        break;

      case 'updated':
        comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
        break;

      default:
        comparison = 0;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
