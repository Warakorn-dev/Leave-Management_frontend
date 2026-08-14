import { useState, useEffect, useCallback } from 'react';
import { axiosInstance } from '@/api';

export interface Role {
  id: string;
  name: string;
}

export const useRolesQuery = () => {
  const [data, setData] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/hr/roles');
      setData(res.data?.data ?? res.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return { data, isLoading, refetch: fetchRoles };
};
