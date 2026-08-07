import { useState, useEffect, useCallback } from 'react';
import { Department } from '@/types';

import { axiosInstance } from '@/api';

// Export individual hooks for better React Hook compliance if needed
export const useDepartmentsQuery = () => {
  const [data, setData] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/hr/departments');
      setData(res.data?.data ?? res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return { data, isLoading, refetch: fetchDepartments };
};

export const useCreateDepartmentMutation = () => {
  return {
    mutateAsync: async (data: Omit<Department, 'id'>) => {
      const res = await axiosInstance.post('/hr/departments', data);
      return res.data;
    }
  };
};

export const useUpdateDepartmentMutation = () => {
  return {
    mutateAsync: async ({ id, data }: { id: string, data: Partial<Department> }) => {
      const res = await axiosInstance.put(`/hr/departments/${id}`, data);
      return res.data;
    }
  };
};

export const useDeleteDepartmentMutation = () => {
  return {
    mutateAsync: async (id: string) => {
      const res = await axiosInstance.delete(`/hr/departments/${id}`);
      return res.data;
    }
  };
};

// Export the wrapper function to match the usage in page.tsx
export const useDepartment = () => {
  return {
    useDepartmentsQuery,
    useCreateDepartmentMutation,
    useUpdateDepartmentMutation,
    useDeleteDepartmentMutation,
  };
};


