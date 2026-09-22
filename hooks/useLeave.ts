import { useState, useEffect, useCallback } from 'react';
import { Leave } from '@/lib/api/types';

interface RawLeaveItem {
  id?: string;
  status?: string;
  userId?: string;
  employeeId?: string;
  totalDays?: number;
  durationDays?: number;
  daysCount?: number;
  startDate?: string;
  endDate?: string;
  startFormat?: string;
  endFormat?: string;
  leaveMode?: string;
  leaveHours?: number;
  leaveType?: { name?: string };
  leaveTypeName?: string;
  type?: string;
  department?: string;
  position?: string;
  reason?: string;
  requestCode?: string;
  createdAt?: string;
  isViewedByHr?: boolean;
  currentHrReviewerId?: string | null;
  hrReviewStartedAt?: string | null;
  approverReason?: string;
  approvals?: { comment?: string }[];
  attachments?: unknown[];
  employee?: {
    id?: string;
    title?: string;
    firstName?: string;
    lastName?: string;
    employeeCode?: string;
    department?: { name?: string };
    position?: { name?: string };
    userId?: string;
    user?: { id?: string; role?: { name?: string }; avatarUrl?: string };
  };
  user?: {
    firstName?: string;
    lastName?: string;
    department?: { name?: string };
    position?: { name?: string };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const mapLeaveData = (leaves: unknown, actualUserId: string | null, isPersonal: boolean = false) => {
  if (!Array.isArray(leaves)) return [];
  return (leaves as RawLeaveItem[]).map((l) => ({
    ...l,
    userId: isPersonal ? actualUserId : (l.employee?.user?.id || l.employee?.userId || 'unknown'),
    totalDays: l.totalDays ?? l.durationDays ?? l.daysCount ?? 0,
    startFormat: l.startFormat || 'full',
    endFormat: l.endFormat || 'full',
    leaveType: l.leaveType,
    approverReason: l.approverReason || l.approvals?.[0]?.comment || null,
    user: l.employee ? {
      title: l.employee.title,
      firstName: l.employee.firstName,
      lastName: l.employee.lastName,
      department: l.employee.department,
      position: l.employee.position,
      role: l.employee.user?.role?.name || null,
      avatarUrl: l.employee.user?.avatarUrl || null
    } : l.user,
    attachments: l.attachments || []
  }));
};

export const useLeavesQuery = (fetchCompanyLeaves: boolean = false) => {
  const [data, setData] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : '';
      const rawRole = typeof window !== 'undefined' ? sessionStorage.getItem('role') : '';
      const role = rawRole?.toUpperCase() || '';
      const actualUserId = typeof window !== 'undefined' ? sessionStorage.getItem('userId') : '';
      
      const headers = { 'Authorization': `Bearer ${token}` };

      let allLeaves: ReturnType<typeof mapLeaveData> = [];

      // 1. Fetch personal leaves
      const resPersonal = await fetch('/api/leave/history', { headers });
      if (resPersonal.ok) {
        const json = await resPersonal.json();
        allLeaves = [...allLeaves, ...mapLeaveData(json.data ?? json, actualUserId, true)];
      }

      if (role === 'HR' || role === 'CEO' || fetchCompanyLeaves) {
        // If HR/CEO, or explicitly requested company leaves, fetch all leaves
        const endpoint = (role === 'HR' || role === 'CEO') ? '/api/hr/leaves' : '/api/leave/all-leaves';
        const resAll = await fetch(endpoint, { headers });
        if (resAll.ok) {
          const json = await resAll.json();
          const mappedAll = mapLeaveData(json.data ?? json, actualUserId, false);
          // Filter out personal leaves to prevent duplicates
          const otherLeaves = mappedAll.filter((l) => String(l.userId) !== String(actualUserId) && String(l.employeeId) !== String(actualUserId));
          allLeaves = [...allLeaves, ...otherLeaves];
        }
      } else {
        // Fetch department leaves
        if (role === 'USER' || role === 'EMPLOYEE') {
          const resDept = await fetch('/api/leave/department', { headers });
          if (resDept.ok) {
            const json = await resDept.json();
            const mappedDept = mapLeaveData(json.data ?? json, actualUserId, false);
            const otherLeaves = mappedDept.filter((l) => String(l.userId) !== String(actualUserId) && String(l.employeeId) !== String(actualUserId));
            allLeaves = [...allLeaves, ...otherLeaves];
          }
        } else if (role === 'MANAGER') {
          const resDept = await fetch('/api/manager/history', { headers });
          if (resDept.ok) {
            const json = await resDept.json();
            const mappedDept = mapLeaveData(json.data ?? json, actualUserId, false);
            const otherLeaves = mappedDept.filter((l) => String(l.userId) !== String(actualUserId) && String(l.employeeId) !== String(actualUserId));
            allLeaves = [...allLeaves, ...otherLeaves];
          }
        }
      }

      setData(allLeaves as Leave[]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchCompanyLeaves]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  return { data, isLoading, refetch: fetchLeaves };
};

export const useHolidaysQuery = () => {
  const [data, setData] = useState<{ id?: string; date: string; title?: string; name?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHolidays = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : '';
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/leave/holidays', { headers });
      if (res.ok) {
        const json = await res.json();
        setData(json.data ?? json);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  return { data, isLoading, refetch: fetchHolidays };
};

export const useApproveLeaveMutation = () => {
  return {
    mutateAsync: async ({ id, approverReason }: { id: string; approverName?: string; approverReason?: string }) => {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : '';
      const res = await fetch(`/api/manager/approve/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment: approverReason }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to approve leave: ${errorText}`);
      }
      return res.json();
    }
  };
};

export const useRejectLeaveMutation = () => {
  return {
    mutateAsync: async ({ id, approverReason }: { id: string; approverName?: string; approverReason?: string }) => {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : '';
      const res = await fetch(`/api/manager/reject/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment: approverReason }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to reject leave: ${errorText}`);
      }
      return res.json();
    }
  };
};

export interface CreateLeavePayload {
  leaveTypeId: string;
  startDate?: string;
  endDate?: string;
  startFormat?: string;
  endFormat?: string;
  reason: string;
  totalDays?: number;
  leaveHours?: number;
  leaveMode?: string;
  leaveDate?: string;
  startTime?: string;
  endTime?: string;
  hours?: number;
  period?: string;
}

export const useCreateLeaveMutation = () => {
  return {
    mutateAsync: async (data: CreateLeavePayload) => {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : '';
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to create leave');
      }
      return res.json();
    }
  };
};

export const useUpdateLeaveMutation = () => {
  return {
    mutateAsync: async ({ id, data }: { id: string, data: Partial<Leave> }) => {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : '';
      const res = await fetch(`/api/leave/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to update leave');
      }
    }
  };
};

export const useDeleteLeaveMutation = () => {
  return {
    mutateAsync: async (id: string) => {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : '';
      const res = await fetch(`/api/leave/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete leave');
    }
  };
};

export const useVerifyLeaveMutation = () => {
  return {
    mutateAsync: async ({ id, action, comment }: { id: string; action: 'Approve' | 'Reject'; comment?: string }) => {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : '';
      const res = await fetch(`/api/hr/leaves/${id}/verify`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, comment }),
      });
      if (!res.ok) {
        let errorMsg = 'Failed to verify leave';
        try {
          const errJson = await res.json();
          errorMsg = errJson.message || errorMsg;
        } catch {
          errorMsg = await res.text();
        }
        throw new Error(errorMsg);
      }
      return res.json();
    }
  };
};

export const useMarkLeaveViewedMutation = () => {
  return {
    mutateAsync: async ({ id, lock = true }: { id: string, lock?: boolean }) => {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : '';
      const res = await fetch(`/api/hr/leaves/${id}/view?lock=${lock}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
      });
      if (!res.ok) {
        let errorMsg = 'Failed to mark leave as viewed';
        try {
          const errJson = await res.json();
          errorMsg = errJson.message || errorMsg;
        } catch {
          errorMsg = await res.text();
        }
        throw new Error(errorMsg);
      }
      return res.json();
    }
  };
};


export const useHrPendingVerifyQuery = () => {
  const [data, setData] = useState<ReturnType<typeof mapLeaveData>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : '';
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/hr/leaves/pending-verify', {
        headers,
        cache: 'no-store'
      });
      if (res.ok) {
        const json = await res.json();
        const all = (json.data ?? json) as RawLeaveItem[];
        const pendingVerify = all.filter((l) => l.status !== 'PENDING_CANCELLATION');
        setData(mapLeaveData(pendingVerify, null, false));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  return { data, isLoading, refetch: fetchLeaves };
};

export const usePendingCancellationQuery = () => {
  const [data, setData] = useState<ReturnType<typeof mapLeaveData>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : '';
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/hr/leaves/pending-verify', { headers });
      if (res.ok) {
        const json = await res.json();
        const all = (json.data ?? json) as RawLeaveItem[];
        const cancellations = all.filter((l) => l.status === 'PENDING_CANCELLATION');
        setData(mapLeaveData(cancellations, null, false));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  return { data, isLoading, refetch: fetchLeaves };
};

export const useLeave = () => {
  return {
    useLeavesQuery,
    useCreateLeaveMutation,
    useUpdateLeaveMutation,
    useDeleteLeaveMutation,
    useHolidaysQuery,
    useApproveLeaveMutation,
    useRejectLeaveMutation,
    useVerifyLeaveMutation,
    useMarkLeaveViewedMutation,
    useHrPendingVerifyQuery,
    usePendingCancellationQuery,
  };
};



