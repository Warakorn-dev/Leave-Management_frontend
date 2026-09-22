import axiosInstance from './axios';
import { ApiResponse } from './types';

export const ceoApi = {
  getReportStats: async (year?: string): Promise<ApiResponse<{
    workStatusData?: { name: string; value: number; color: string }[];
    leaveTypesData?: { name: string; percent: number; color: string }[];
    trendData?: { day: string; value: number }[];
  }>> => {
    const query = year ? `?year=${year}` : '';
    const response = await axiosInstance.get(`/ceo/report/stats${query}`);
    return response.data;
  },

  approveLeave: async (leaveId: string): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.put(`/ceo/approve/${leaveId}`);
    return response.data;
  },

  rejectLeave: async (leaveId: string, reason?: string): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.put(`/ceo/reject/${leaveId}`, { reason });
    return response.data;
  }
};
