import axiosInstance from './axios';
import { ApiResponse } from './types';

export const holidayApi = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    const response = await axiosInstance.get('/hr/holidays');
    return response.data;
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post('/hr/holidays', data);
    return response.data;
  },

  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put(`/hr/holidays/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.delete(`/hr/holidays/${id}`);
    return response.data;
  }
};
