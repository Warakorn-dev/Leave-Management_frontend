import { useState, useEffect, useCallback } from 'react';
import { Employee } from '@/types';
import { employeeApi, authApi, hrApi } from '@/api';

export const useEmployeesQuery = () => {
  const [data, setData] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await employeeApi.getAll();
      setData(res.data ?? (res as any));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return { data, isLoading, refetch: fetchEmployees };
};

export const useCeoEmployeesQuery = () => {
  const [data, setData] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await employeeApi.getForCeo();
      setData(res.data ?? (res as any));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return { data, isLoading, refetch: fetchEmployees };
};

export const useCreateEmployeeMutation = () => {
  return {
    mutate: (data: Omit<Employee, 'id'>, options?: { onSuccess?: (data: any) => void, onError?: (error: any) => void }) => {
      employeeApi.create(data)
        .then((res) => options?.onSuccess?.(res))
        .catch((err) => options?.onError?.(err));
    },
    mutateAsync: async (data: Omit<Employee, 'id'>) => {
      return await employeeApi.create(data);
    }
  };
};

export const useUpdateEmployeeMutation = () => {
  return {
    mutate: ({ id, data }: { id: string, data: Partial<Employee> }, options?: { onSuccess?: (data: any) => void, onError?: (error: any) => void }) => {
      employeeApi.update(id, data)
        .then((res) => options?.onSuccess?.(res))
        .catch((err) => options?.onError?.(err));
    },
    mutateAsync: async ({ id, data }: { id: string, data: Partial<Employee> }) => {
      return await employeeApi.update(id, data);
    }
  };
};

export const useUpdateEmployeeStatusMutation = () => {
  return {
    mutate: ({ id, isActive }: { id: string, isActive: boolean }, options?: { onSuccess?: (data: any) => void, onError?: (error: any) => void }) => {
      hrApi.updateEmployeeStatus(id, isActive)
        .then((res) => options?.onSuccess?.(res))
        .catch((err) => options?.onError?.(err));
    },
    mutateAsync: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      return await hrApi.updateEmployeeStatus(id, isActive);
    }
  };
};

export const useDeleteEmployeeMutation = () => {
  return {
    mutate: (id: string, options?: { onSuccess?: () => void, onError?: (error: any) => void }) => {
      employeeApi.delete(id)
        .then(() => options?.onSuccess?.())
        .catch((err) => options?.onError?.(err));
    },
    mutateAsync: async (id: string) => {
      await employeeApi.delete(id);
    }
  };
};

export const useLoginMutation = () => {
  return {
    mutateAsync: async (credentials: any) => {
      try {
        const res = await authApi.login(credentials);
        return res.data ?? res;
      } catch (err: any) {
        const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to login';
        if (msg.includes('ระงับ') || msg.includes('มึงอย่าเที่ยวเข้าถิ้')) {
          throw new Error(msg);
        }
        if (err.response?.status === 401 || msg.toLowerCase().includes('invalid')) {
          throw new Error('Invalid credentials');
        }
        throw new Error(msg);
      }
    }
  };
};

export const useForgotPasswordMutation = () => {
  return {
    mutateAsync: async (username: string) => {
      try {
        return await authApi.forgotPassword(username);
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Failed to request reset');
      }
    }
  };
};

export const useResetPasswordMutation = () => {
  return {
    mutateAsync: async (data: any) => {
      try {
        return await authApi.resetPassword(data);
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Failed to reset password');
      }
    }
  };
};

export const useEmployee = () => {
  return {
    useEmployeesQuery,
    useCreateEmployeeMutation,
    useUpdateEmployeeMutation,
    useUpdateEmployeeStatusMutation,
    useDeleteEmployeeMutation,
    useLoginMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
  };
};

