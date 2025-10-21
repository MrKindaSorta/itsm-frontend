import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { TicketStatus, TicketPriority, SLAStatusType, ColumnConfig } from '@/types';

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
import type { Ticket, User, UserRole } from '@/types';

export type SortColumn = 'id' | 'title' | 'status' | 'priority' | 'assignee' | 'requester' | 'sla' | 'updated';
export type UserSortColumn = 'name' | 'email' | 'role' | 'department' | 'team' | 'status' | 'lastLogin';
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

// User sorting utility
export function sortUsers(
  users: User[],
  column: UserSortColumn | null,
  direction: SortDirection
): User[] {
  if (!column || !direction) return users;

  const sorted = [...users].sort((a, b) => {
    let comparison = 0;

    switch (column) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;

      case 'email':
        comparison = a.email.localeCompare(b.email);
        break;

      case 'role':
        const roleOrder: Record<UserRole, number> = {
          admin: 4,
          manager: 3,
          agent: 2,
          user: 1,
        };
        comparison = roleOrder[a.role] - roleOrder[b.role];
        break;

      case 'department':
        // Handle null/undefined departments - put them last when ascending
        if (!a.department && !b.department) comparison = 0;
        else if (!a.department) comparison = 1;
        else if (!b.department) comparison = -1;
        else comparison = a.department.localeCompare(b.department);
        break;

      case 'team':
        // Handle null/undefined teams - put them last when ascending
        if (!a.team && !b.team) comparison = 0;
        else if (!a.team) comparison = 1;
        else if (!b.team) comparison = -1;
        else comparison = a.team.localeCompare(b.team);
        break;

      case 'status':
        // Active users first (1), inactive last (0)
        comparison = (a.active ? 1 : 0) - (b.active ? 1 : 0);
        break;

      case 'lastLogin':
        // Handle null/undefined lastLogin - never logged in go last when ascending
        if (!a.lastLogin && !b.lastLogin) comparison = 0;
        else if (!a.lastLogin) comparison = 1;
        else if (!b.lastLogin) comparison = -1;
        else {
          const dateA = new Date(a.lastLogin).getTime();
          const dateB = new Date(b.lastLogin).getTime();
          comparison = dateA - dateB;
        }
        break;

      default:
        comparison = 0;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

// Default column configuration for ticket table
export const DEFAULT_TICKET_COLUMNS: ColumnConfig[] = [
  {
    id: 'id',
    label: 'ID',
    visible: true,
    order: 0,
    width: 120,
    sortable: true,
    resizable: true,
  },
  {
    id: 'title',
    label: 'Title',
    visible: true,
    order: 1,
    width: 300,
    sortable: true,
    resizable: true,
  },
  {
    id: 'status',
    label: 'Status',
    visible: true,
    order: 2,
    width: 140,
    sortable: true,
    resizable: true,
  },
  {
    id: 'priority',
    label: 'Priority',
    visible: true,
    order: 3,
    width: 120,
    sortable: true,
    resizable: true,
  },
  {
    id: 'category',
    label: 'Category',
    visible: false,
    order: 4,
    width: 150,
    sortable: true,
    resizable: true,
  },
  {
    id: 'assignee',
    label: 'Assignee',
    visible: true,
    order: 5,
    width: 180,
    sortable: true,
    resizable: true,
  },
  {
    id: 'requester',
    label: 'Requester',
    visible: true,
    order: 6,
    width: 180,
    sortable: true,
    resizable: true,
  },
  {
    id: 'department',
    label: 'Department',
    visible: false,
    order: 7,
    width: 150,
    sortable: true,
    resizable: true,
  },
  {
    id: 'sla',
    label: 'SLA',
    visible: true,
    order: 8,
    width: 100,
    sortable: true,
    resizable: false,
  },
  {
    id: 'created',
    label: 'Created',
    visible: false,
    order: 9,
    width: 150,
    sortable: true,
    resizable: true,
  },
  {
    id: 'updated',
    label: 'Updated',
    visible: true,
    order: 10,
    width: 150,
    sortable: true,
    resizable: true,
  },
  {
    id: 'dueDate',
    label: 'Due Date',
    visible: false,
    order: 11,
    width: 150,
    sortable: true,
    resizable: true,
  },
  {
    id: 'tags',
    label: 'Tags',
    visible: false,
    order: 12,
    width: 200,
    sortable: false,
    resizable: true,
  },
];
