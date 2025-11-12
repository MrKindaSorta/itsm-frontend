import { Bell, Info, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';

export interface NotificationIconConfig {
  icon: React.ReactNode;
  colorClass: string;
}

/**
 * Get the appropriate icon and color for a notification type
 * Used by both NotificationTray and toast notifications
 */
export function getNotificationIcon(type: string): NotificationIconConfig {
  switch (type) {
    case 'ticket_assigned':
    case 'ticket_updated':
      return {
        icon: <Info className="h-4 w-4" />,
        colorClass: 'text-blue-500',
      };
    case 'ticket_commented':
      return {
        icon: <MessageSquare className="h-4 w-4" />,
        colorClass: 'text-purple-500',
      };
    case 'status_changed':
    case 'priority_changed':
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        colorClass: 'text-orange-500',
      };
    case 'ticket_resolved':
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        colorClass: 'text-green-500',
      };
    case 'sla_warning':
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        colorClass: 'text-red-500',
      };
    case 'mention':
      return {
        icon: <Bell className="h-4 w-4" />,
        colorClass: 'text-gray-500',
      };
    default:
      return {
        icon: <Bell className="h-4 w-4" />,
        colorClass: 'text-gray-500',
      };
  }
}
