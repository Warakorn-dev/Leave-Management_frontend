import axiosInstance from './axios';
import { ApiResponse, Leave, LeaveType } from './types';

export const leaveApi = {
  getMyLeaves: async (year?: number): Promise<ApiResponse<Leave[]>> => {
    const query = year ? `?year=${year}` : '';
    const response = await axiosInstance.get(`/leave/history${query}`);
    return response.data;
  },

  /** Every leave in the company. HR and CEO both read it from /hr/leaves (there is no /ceo/leaves — D-09). */
  getAllLeaves: async (role: 'HR' | 'CEO' = 'HR'): Promise<ApiResponse<Leave[]>> => {
    void role; // kept so existing callers stay unchanged; both roles use the same endpoint
    const response = await axiosInstance.get('/hr/leaves');
    return response.data;
  },

  getLeaveTypes: async (): Promise<ApiResponse<LeaveType[]>> => {
    const response = await axiosInstance.get('/hr/leave-types');
    return response.data;
  },

  // Filing a leave: useCreateLeaveMutation in hooks/useLeave.ts (POST /leave).
  // D-09: the old createLeave here posted to /leave/request, which does not exist.

  updateLeaveBalance: async (balanceId: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.put(`/hr/leave-balances/${balanceId}`, data);
    return response.data;
  }
};
