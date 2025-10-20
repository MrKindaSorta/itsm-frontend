// User roles
export const UserRole = {
  USER: 'user',
  AGENT: 'agent',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// Ticket status and priority enums
export type TicketStatus = 'new' | 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed' | 'reopened';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SLAStatusType = 'green' | 'yellow' | 'red';

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  team?: string;
  avatar?: string;
  active: boolean;
  notificationPreferences: NotificationSettings;
  createdAt?: Date;
  lastLogin?: Date;
  phone?: string;
  mobile_phone?: string;
  location?: string;
  job_title?: string;
  manager?: string;
  deleted_at?: string | null;
  permanently_deleted?: number;
  isDeleted?: boolean;
  requirePasswordChange?: boolean;
}

// Notification settings
export interface NotificationSettings {
  emailNotifications?: boolean;
  newTicketAssigned?: boolean;
  ticketUpdated?: boolean;
  slaWarning?: boolean;
  ticketResolved?: boolean;
  mentions?: boolean;
  emailEnabled?: boolean;
  emailFrequency?: 'immediate' | 'hourly' | 'daily';
  browserEnabled?: boolean;
  notificationTypes?: string[];
}

// Team interface
export interface Team {
  id: string;
  name: string;
  members: User[];
  department?: string;
}

// SLA Rule and Status
export interface SLARule {
  id: string;
  name: string;
  conditions: {
    priority?: TicketPriority[];
    category?: string[];
    department?: string[];
  };
  targets: {
    firstResponseMinutes: number;
    resolutionMinutes: number;
  };
  escalation?: {
    enabled: boolean;
    afterMinutes: number;
    newPriority: TicketPriority;
  };
}

export interface SLAStatus {
  firstResponseDue: Date;
  resolutionDue: Date;
  firstResponseBreached: boolean;
  resolutionBreached: boolean;
  status: SLAStatusType;
  timeRemaining?: number;
}

// Attachment interface
export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// Time tracking
export interface TimeEntry {
  id: string;
  ticketId: string;
  userId: string;
  minutes: number;
  description?: string;
  createdAt: Date;
}

// Ticket interface
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  requester: User;
  assignee?: User | Team;
  openedBy?: User;
  openedAt?: string | null;
  department?: string;
  tags: string[];
  customFields: Record<string, any>;
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  sla: SLAStatus;
  ccUsers: User[];
  timeTracking: TimeEntry[];
}

// Activity/Comment types
export type ActivityType = 'comment' | 'internal_note' | 'status_change' | 'assignment' | 'priority_change' | 'cc_change' | 'system';

export interface Activity {
  id: string;
  ticketId: string;
  type: ActivityType;
  content: string;
  author: User;
  createdAt: Date;
  isInternal: boolean;
  attachments?: Attachment[];
  metadata?: Record<string, any>;
  parentActivityId?: string | null;
  parentActivity?: {
    id: string;
    author: {
      name: string;
    };
    contentPreview: string;
    isInternal: boolean;
  } | null;
  isFlagged?: boolean;
  flaggedBy?: {
    id: number;
    name: string;
  } | null;
  flaggedAt?: string | null;
}

// Knowledge Base
export interface KBCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  children?: KBCategory[];
  articleCount: number;
}

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  category?: KBCategory;
  author: User;
  published: boolean;
  views: number;
  helpful: number;
  notHelpful: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

// Custom Fields
export type CustomFieldType = 'text' | 'textarea' | 'number' | 'date' | 'dropdown' | 'multiselect' | 'checkbox' | 'file';

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  options?: string[];
  defaultValue?: any;
  placeholder?: string;
  helpText?: string;
  visible: boolean;
  order: number;
}

// Dashboard metrics
export interface DashboardMetrics {
  newTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  highPriorityTickets: number;
  slaBreachWarnings: number;
  avgFirstResponseTime: number;
  avgResolutionTime: number;
  slaComplianceRate: number;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  type: 'ticket_assigned' | 'ticket_updated' | 'sla_warning' | 'ticket_resolved' | 'mention';
  title: string;
  message: string;
  read: boolean;
  ticketId?: string;
  createdAt: Date;
  actionUrl?: string;
}

// Permissions
export interface Permission {
  action: string;
  resource: string;
  allowed: boolean;
}

// Settings
export interface SystemSettings {
  allowPublicSignup: boolean;
  defaultAssignment: 'round-robin' | 'manual' | 'team-based';
  enableTimeTracking: boolean;
  enableAttachments: boolean;
  enableEmailToTicket: boolean;
  enableEmailNotifications: boolean;
  enableEmailReplies: boolean;
  smtpConfig?: SMTPConfig;
  branding: BrandingConfig;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface BrandingConfig {
  companyName: string;
  logo?: string;
  primaryColor: string;
  welcomeMessage?: string;
}

// Filter and search
export interface TicketFilter {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: string[];
  assignee?: string[];
  department?: string[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

// Saved views
export interface SavedView {
  id: string;
  name: string;
  userId: string;
  filters: TicketFilter;
  isDefault: boolean;
  createdAt: Date;
}

// Column customization
export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  width?: number;
  sortable: boolean;
  resizable: boolean;
}

export interface ViewPreferences {
  ticketList: {
    columns: ColumnConfig[];
  };
}
