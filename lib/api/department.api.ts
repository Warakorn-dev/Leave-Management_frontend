import axiosInstance from './axios';
import { ApiResponse, Department } from './types';

export const departmentApi = {
  getAll: async (): Promise<ApiResponse<Department[]>> => {
    const response = await axiosInstance.get('/hr/departments');
    return response.data;
  },

  create: async (data: Partial<Department>): Promise<ApiResponse<Department>> => {
    const response = await axiosInstance.post('/hr/departments', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Department>): Promise<ApiResponse<Department>> => {
    const response = await axiosInstance.put(`/hr/departments/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.delete(`/hr/departments/${id}`);
    return response.data;
  }
};
