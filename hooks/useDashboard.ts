import { useState, useEffect, useCallback } from 'react';
import { dashboardApi, hrApi, notificationApi, axiosInstance } from '@/lib/api';
import type { Announcement } from '@/lib/api/hr.api';

export interface DashboardStats {
  totalEmployees?: number;
  leavesToday?: number;
  remainingEmployees?: number;
  pendingApprovals?: number;
  leaveQuotaToday?: number;
  chartData?: { name?: string; month?: string; value: number }[];
  monthlyStats?: { name?: string; month?: string; value: number }[];
  chart?: number[];
  activities?: { title?: string; message?: string; time?: string; color?: string; createdAt?: string; type?: string }[];
  announcements?: Announcement[];
  employeeName?: string;
  remainingVacation?: number;
  approvedThisYear?: number;
  rejectedRequests?: number;
  personal?: {
    remainingVacation?: number;
    pendingApprovals?: number;
    approvedThisYear?: number;
    rejectedRequests?: number;
  };
  stats?: DashboardStats;
  data?: DashboardStats;
}

export const useDashboardStats = (year?: number, type: 'personal' | 'team' = 'personal') => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const role = typeof window !== 'undefined' ? sessionStorage.getItem('role')?.toUpperCase() : '';
      let endpoint = 'leave/dashboard';
      if (role === 'CEO' && type === 'team') endpoint = 'ceo/dashboard';
      else if (role === 'HR' && type === 'team') endpoint = 'hr/dashboard';
      else if (role === 'MANAGER' && type === 'team') endpoint = 'manager/dashboard';

      const res = await dashboardApi.getStats(endpoint, year);
      setData((res.data ?? res) as DashboardStats);
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [year, type]);

  useEffect(() => {
    fetchStats();

    // Poll every 5 seconds for real-time updates
    const intervalId = setInterval(() => {
      fetchStats(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchStats]);

  return { data, isLoading, refetch: fetchStats };
};

export const useAnnouncements = () => {
  const [data, setData] = useState<Awaited<ReturnType<typeof hrApi.getAnnouncements>>['data']>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await hrApi.getAnnouncements();
      setData(res.data ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return { data, isLoading, refetch: fetchAnnouncements };
};

export const useActivities = (username?: string) => {
  const [data, setData] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!username) return;
    setIsLoading(true);
    try {
      const role = sessionStorage.getItem('role') || '';
      // We will use axios directly since notificationApi might not have this exact param format yet
      const res = await axiosInstance.get(`/notifications?user=${encodeURIComponent(username)}&role=${encodeURIComponent(role)}`);
      setData(res.data?.data ?? res.data ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  const markAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      await fetchActivities();
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const markAllAsRead = async () => {
    if (!username) return;
    try {
      await axiosInstance.patch('/notifications/readAll', { user: username });
      await fetchActivities();
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { data, isLoading, refetch: fetchActivities, markAsRead, markAllAsRead };
};



