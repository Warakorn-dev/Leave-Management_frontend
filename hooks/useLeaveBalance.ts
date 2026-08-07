import { useState, useEffect, useCallback } from 'react';

const API_URL = '/api/leave-balances';

export const useLeaveBalancesQuery = (userId?: string) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalances = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : '';
      const actualUserId = userId || (typeof window !== 'undefined' ? sessionStorage.getItem('userId') : null);
      
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
  }, [userId]);

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


