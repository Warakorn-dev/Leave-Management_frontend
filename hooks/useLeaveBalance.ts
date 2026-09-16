import { useState, useEffect, useCallback } from 'react';

export interface LeaveBalance {
  id?: string;
  leaveTypeId?: string;
  leaveType?: { id?: string; name?: string; minTenureDays?: number; [key: string]: unknown };
  remainingDays?: number;
  totalDays?: number;
  usedDays?: number;
  effectiveRemainingDays?: number;
  pendingDays?: number;
  employeeHireDate?: string;
  createdAt?: string;
  startDate?: string;
  year?: number;
  [key: string]: unknown;
}

export const useLeaveBalancesQuery = () => {
  const [data, setData] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalances = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : '';

      const res = await fetch(`/api/leave/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });
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
    fetchBalances();
  }, [fetchBalances]);

  return { data, isLoading, refetch: fetchBalances };
};

export const useLeaveBalance = () => {
  return {
    useLeaveBalancesQuery,
  };
};


