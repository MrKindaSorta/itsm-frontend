import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from './useWebSocket';
import type { Notification } from '@/types';

const REFRESH_INTERVAL = 30000; // 30 seconds

export function useNotifications() {
  const { user } = useAuth();
  const { subscribeToUser, unsubscribeFromUser, on } = useWebSocket();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notifications?userId=${user.id}&limit=50`);
      const data = await response.json();

      if (data.success) {
        const transformedNotifications = data.notifications.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));
        setNotifications(transformedNotifications);
        setUnreadCount(data.unreadCount);
      } else {
        setError(data.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Fetch unread count only
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/notifications/unread-count?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [user]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      const data = await response.json();

      if (data.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json();

      if (data.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true, readAt: new Date() }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [user]);

  /**
   * Add notification from WebSocket
   */
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Subscribe to user-specific WebSocket notifications
  useEffect(() => {
    if (!user) return;

    subscribeToUser(String(user.id));

    return () => {
      unsubscribeFromUser(String(user.id));
    };
  }, [user, subscribeToUser, unsubscribeFromUser]);

  // Listen for real-time notification events
  useEffect(() => {
    const unsubNotificationCreated = on('notification:created', (message) => {
      const newNotification: Notification = {
        id: String(message.data.id),
        userId: String(message.data.userId),
        type: message.data.type,
        title: message.data.title,
        message: message.data.message,
        read: message.data.read,
        ticketId: message.data.ticketId,
        actionUrl: message.data.actionUrl,
        createdAt: new Date(message.data.createdAt),
      };
      addNotification(newNotification);
    });

    return () => {
      unsubNotificationCreated();
    };
  }, [on, addNotification]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Set up periodic refresh of unread count
    refreshIntervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [user, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
  };
}
