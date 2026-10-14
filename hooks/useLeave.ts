import { useState, useEffect, useCallback } from 'react';
import type { Method } from 'axios';
import axiosInstance from '@/lib/api/axios';
import { Leave } from '@/lib/api/types';
import { getErrorMessage } from '@/lib/api/utils';

/*
 * Every call here goes through axiosInstance so an expired access token is
 * refreshed automatically (D-06). `skipErrorAlert` keeps the interceptor from
 * showing its generic error popup: these hooks report errors to their callers,
 * which show their own messages, exactly as before.
 */

/** GET `/api{url}`; returns the unwrapped `data` (or the body), or null on any error — like the old `if (res.ok)` checks. */
async function getData<T = unknown>(url: string): Promise<T | null> {
  try {
    const res = await axiosInstance.get(url, { skipErrorAlert: true });
    const body = res.data as { data?: T } | T;
    return ((body as { data?: T })?.data ?? body) as T;
  } catch (error) {
    console.error(error);
    return null;
  }
}

/** Write call to `/api{url}`; throws an Error with the server's message (or `fallback`) on failure. */
async function send<T = unknown>(method: Method, url: string, fallback: string, data?: unknown): Promise<T> {
  try {
    const res = await axiosInstance.request({ method, url, data, skipErrorAlert: true });
    return res.data as T;
  } catch (error) {
    throw new Error(getErrorMessage(error, fallback));
  }
}

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
      const rawRole = typeof window !== 'undefined' ? sessionStorage.getItem('role') : '';
      const role = rawRole?.toUpperCase() || '';
      const actualUserId = typeof window !== 'undefined' ? sessionStorage.getItem('userId') : '';

      let allLeaves: ReturnType<typeof mapLeaveData> = [];

      // 1. Fetch personal leaves
      const personal = await getData<RawLeaveItem[]>('/leave/history');
      if (personal) {
        allLeaves = [...allLeaves, ...mapLeaveData(personal, actualUserId, true)];
      }

      if (role === 'HR' || role === 'CEO' || fetchCompanyLeaves) {
        // If HR/CEO, or explicitly requested company leaves, fetch all leaves
        const endpoint = (role === 'HR' || role === 'CEO') ? '/hr/leaves' : '/leave/all-leaves';
        const all = await getData<RawLeaveItem[]>(endpoint);
        if (all) {
          const mappedAll = mapLeaveData(all, actualUserId, false);
          // Filter out personal leaves to prevent duplicates
          const otherLeaves = mappedAll.filter((l) => String(l.userId) !== String(actualUserId) && String(l.employeeId) !== String(actualUserId));
          allLeaves = [...allLeaves, ...otherLeaves];
        }
      } else {
        // Fetch department leaves
        if (role === 'USER' || role === 'EMPLOYEE') {
          const dept = await getData<RawLeaveItem[]>('/leave/department');
          if (dept) {
            const mappedDept = mapLeaveData(dept, actualUserId, false);
            const otherLeaves = mappedDept.filter((l) => String(l.userId) !== String(actualUserId) && String(l.employeeId) !== String(actualUserId));
            allLeaves = [...allLeaves, ...otherLeaves];
          }
        } else if (role === 'MANAGER') {
          const dept = await getData<RawLeaveItem[]>('/manager/history');
          if (dept) {
            const mappedDept = mapLeaveData(dept, actualUserId, false);
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
      const holidays = await getData<{ id?: string; date: string; title?: string; name?: string }[]>('/leave/holidays');
      if (holidays) {
        setData(holidays);
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
      return send('PUT', `/manager/approve/${id}`, 'Failed to approve leave', { comment: approverReason });
    }
  };
};

export const useRejectLeaveMutation = () => {
  return {
    mutateAsync: async ({ id, approverReason }: { id: string; approverName?: string; approverReason?: string }) => {
      return send('PUT', `/manager/reject/${id}`, 'Failed to reject leave', { comment: approverReason });
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
      // Response is { success, message, data: <the created leave> }.
      return send<{ data?: { id?: string }; id?: string }>('POST', '/leave', 'Failed to create leave', data);
    }
  };
};

export const useUpdateLeaveMutation = () => {
  return {
    mutateAsync: async ({ id, data }: { id: string, data: Partial<Leave> }) => {
      await send('PUT', `/leave/${id}`, 'Failed to update leave', data);
    }
  };
};

export const useDeleteLeaveMutation = () => {
  return {
    mutateAsync: async (id: string) => {
      await send('DELETE', `/leave/${id}`, 'Failed to delete leave');
    }
  };
};

export const useVerifyLeaveMutation = () => {
  return {
    mutateAsync: async ({ id, action, comment }: { id: string; action: 'Approve' | 'Reject'; comment?: string }) => {
      return send('PUT', `/hr/leaves/${id}/verify`, 'Failed to verify leave', { action, comment });
    }
  };
};

export const useMarkLeaveViewedMutation = () => {
  return {
    mutateAsync: async ({ id, lock = true }: { id: string, lock?: boolean }) => {
      return send('PATCH', `/hr/leaves/${id}/view?lock=${lock}`, 'Failed to mark leave as viewed');
    }
  };
};


export const useHrPendingVerifyQuery = () => {
  const [data, setData] = useState<ReturnType<typeof mapLeaveData>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await getData<RawLeaveItem[]>('/hr/leaves/pending-verify');
      if (all) {
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
      const all = await getData<RawLeaveItem[]>('/hr/leaves/pending-verify');
      if (all) {
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



