import { useState, useEffect, useCallback } from 'react';
import { LeaveType } from '@/lib/api/types';

const API_URL = '/api/hr/leave-types';

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const useLeaveTypesQuery = () => {
  const [data, setData] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaveTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_URL, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setData(json.data || json || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  return { data, isLoading, refetch: fetchLeaveTypes };
};

export const useCreateLeaveTypeMutation = () => {
  return {
    mutateAsync: async (data: Omit<LeaveType, 'id' | 'code'>) => {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create leave type');
      }
      return res.json();
    }
  };
};

export const useUpdateLeaveTypeMutation = () => {
  return {
    mutateAsync: async ({ id, data }: { id: string, data: Partial<LeaveType> }) => {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update leave type');
      }
      return res.json();
    }
  };
};

export const useDeleteLeaveTypeMutation = () => {
  return {
    mutateAsync: async (id: string) => {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete leave type');
      }
    }
  };
};

export const useLeaveType = () => {
  return {
    useLeaveTypesQuery,
    useCreateLeaveTypeMutation,
    useUpdateLeaveTypeMutation,
    useDeleteLeaveTypeMutation,
  };
};

