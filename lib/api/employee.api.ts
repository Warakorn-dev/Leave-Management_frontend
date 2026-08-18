import axiosInstance from './axios';
import { ApiResponse } from './types';
import { Employee } from '@/lib/api/types';

export const employeeApi = {
  getAll: async (): Promise<ApiResponse<Employee[]>> => {
    const response = await axiosInstance.get('/hr/employees');
    return response.data;
  },

  getForCeo: async (): Promise<ApiResponse<Employee[]>> => {
    const response = await axiosInstance.get('/ceo/employees');
    return response.data;
  },

  create: async (data: Omit<Employee, 'id'>): Promise<ApiResponse<Employee>> => {
    const response = await axiosInstance.post('/hr/employees', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Employee>): Promise<ApiResponse<Employee>> => {
    const response = await axiosInstance.patch(`/hr/employees/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.delete(`/hr/employees/${id}`);
    return response.data;
  },
  
  initializeLeaveBalances: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post(`/hr/employees/${id}/initialize-leave-balances`);
    return response.data;
  },

  resetLeaveBalances: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post(`/hr/employees/${id}/reset-leave-balances`);
    return response.data;
  }
};
