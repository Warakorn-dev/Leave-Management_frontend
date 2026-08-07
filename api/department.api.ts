import axiosInstance from './axios';
import { ApiResponse } from './types';

export const departmentApi = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    const response = await axiosInstance.get('/hr/departments');
    return response.data;
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post('/hr/departments', data);
    return response.data;
  },

  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put(`/hr/departments/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.delete(`/hr/departments/${id}`);
    return response.data;
  }
};
