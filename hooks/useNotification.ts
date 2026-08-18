import { useState, useEffect, useCallback } from 'react';
import { notificationApi } from '@/lib/api/notification.api';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
  redirectUrl?: string;
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await notificationApi.getNotifications();
      const rawData = res.data ?? (res as any);
      if (Array.isArray(rawData)) {
        setNotifications(rawData);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    try {
      await notificationApi.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    try {
      await notificationApi.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};
