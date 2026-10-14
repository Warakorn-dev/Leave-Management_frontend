import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/lib/api/axios';

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
      // Through axiosInstance so an expired access token is refreshed (D-06);
      // on failure the list stays as it was, like before.
      const res = await axiosInstance.get('/leave/balance', { skipErrorAlert: true });
      setData(res.data?.data ?? res.data);
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


