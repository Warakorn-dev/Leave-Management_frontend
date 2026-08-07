import axiosInstance from './axios';
import { ApiResponse } from './types';

export const leaveApi = {
  getMyLeaves: async (year?: number): Promise<ApiResponse<any[]>> => {
    const query = year ? `?year=${year}` : '';
    const response = await axiosInstance.get(`/leave/history${query}`);
    return response.data;
  },

  getAllLeaves: async (role: 'HR' | 'CEO'): Promise<ApiResponse<any[]>> => {
    // HR and CEO can fetch all leaves
    const endpoint = role === 'HR' ? '/hr/leaves' : '/ceo/leaves'; // Note: CEO actually fetches from /hr/leaves in current code
    const response = await axiosInstance.get(endpoint);
    return response.data;
  },

  getLeaveTypes: async (): Promise<ApiResponse<any[]>> => {
    const response = await axiosInstance.get('/hr/leave-types');
    return response.data;
  },
  
  createLeave: async (data: any): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post('/leave/request', data);
    return response.data;
  },

  updateLeaveBalance: async (balanceId: string, data: any): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put(`/hr/leave-balances/${balanceId}`, data);
    return response.data;
  }
};
