import axiosInstance from './axios';
import { ApiResponse } from './types';

export const ceoApi = {
  getReportStats: async (year?: string): Promise<ApiResponse<any>> => {
    const query = year ? `?year=${year}` : '';
    const response = await axiosInstance.get(`/ceo/report/stats${query}`);
    return response.data;
  },

  approveLeave: async (leaveId: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put(`/ceo/approve/${leaveId}`);
    return response.data;
  },

  rejectLeave: async (leaveId: string, reason?: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put(`/ceo/reject/${leaveId}`, { reason });
    return response.data;
  }
};
