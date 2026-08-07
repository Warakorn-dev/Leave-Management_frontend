import axiosInstance from './axios';
import { ApiResponse } from './types';

export const hrApi = {
  getAnnouncements: async (limit?: number): Promise<ApiResponse<any[]>> => {
    const query = limit ? `?limit=${limit}` : '';
    const response = await axiosInstance.get(`/announcement${query}`);
    return response.data;
  },

  createAnnouncement: async (data: any): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post('/announcement', data);
    return response.data;
  },

  updateAnnouncement: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.patch(`/announcement/${id}`, data);
    return response.data;
  },

  deleteAnnouncement: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.delete(`/announcement/${id}`);
    return response.data;
  },

  getEmployeeWithBalances: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(`/hr/employees/${id}`);
    return response.data;
  },

  getLeaveTypes: async (): Promise<ApiResponse<any[]>> => {
    const response = await axiosInstance.get('/hr/leave-types');
    return response.data;
  },

  updateLeaveBalance: async (id: string, remainingDays: number): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put(`/hr/leave-balances/${id}`, { remainingDays });
    return response.data;
  },

  initializeLeaveBalances: async (employeeId: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post(`/hr/employees/${employeeId}/initialize-leave-balances`);
    return response.data;
  },

  resetLeaveBalances: async (employeeId: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post(`/hr/employees/${employeeId}/reset-leave-balances`);
    return response.data;
  },

  updateEmployeeStatus: async (employeeId: string, isActive: boolean): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.patch(`/hr/employees/${employeeId}/status`, { isActive });
    return response.data;
  }
};
