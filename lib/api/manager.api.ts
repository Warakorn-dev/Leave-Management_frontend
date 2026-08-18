import axiosInstance from './axios';
import { ApiResponse } from './types';

export const managerApi = {
  approveLeave: async (leaveId: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put(`/manager/approve/${leaveId}`);
    return response.data;
  },

  rejectLeave: async (leaveId: string, reason: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put(`/manager/reject/${leaveId}`, { reason });
    return response.data;
  },

  getTeamLeaveSummary: async (): Promise<ApiResponse<any>> => {
    // If there is a specific endpoint for manager stats
    const response = await axiosInstance.get('/manager/team-stats');
    return response.data;
  }
};
