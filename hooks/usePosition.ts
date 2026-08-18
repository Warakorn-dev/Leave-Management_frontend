import { useState, useEffect, useCallback } from 'react';
import { Position } from '@/lib/api/types';

import { axiosInstance } from '@/lib/api';

export const usePositionsQuery = () => {
  const [data, setData] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPositions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/hr/positions');
      setData(res.data?.data ?? res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return { data, isLoading, refetch: fetchPositions };
};

export const useCreatePositionMutation = () => {
  return {
    mutateAsync: async (data: Omit<Position, 'id'>) => {
      const res = await axiosInstance.post('/hr/positions', data);
      return res.data;
    }
  };
};

export const useUpdatePositionMutation = () => {
  return {
    mutateAsync: async ({ id, data }: { id: string, data: Partial<Position> }) => {
      const res = await axiosInstance.put(`/hr/positions/${id}`, data);
      return res.data;
    }
  };
};

export const useDeletePositionMutation = () => {
  return {
    mutateAsync: async (id: string) => {
      const res = await axiosInstance.delete(`/hr/positions/${id}`);
      return res.data;
    }
  };
};

export const usePosition = () => {
  return {
    usePositionsQuery,
    useCreatePositionMutation,
    useUpdatePositionMutation,
    useDeletePositionMutation,
  };
};


