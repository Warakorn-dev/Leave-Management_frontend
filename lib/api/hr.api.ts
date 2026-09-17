import axiosInstance from './axios';
import { ApiResponse, LeaveType } from './types';

export interface Announcement {
  id: string;
  title: string;
  subtitle?: string;
  content?: string;
  isImportant?: boolean;
  attachmentData?: string;
  attachmentName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const hrApi = {
  getAnnouncements: async (limit?: number): Promise<ApiResponse<Announcement[]>> => {
    const query = limit ? `?limit=${limit}` : '';
    const response = await axiosInstance.get(`/announcement${query}`);
    return response.data;
  },

  createAnnouncement: async (data: Partial<Announcement>): Promise<ApiResponse<Announcement>> => {
    const response = await axiosInstance.post('/announcement', data);
    return response.data;
  },

  updateAnnouncement: async (id: string, data: Partial<Announcement>): Promise<ApiResponse<Announcement>> => {
    const response = await axiosInstance.patch(`/announcement/${id}`, data);
    return response.data;
  },

  deleteAnnouncement: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.delete(`/announcement/${id}`);
    return response.data;
  },

  getEmployeeWithBalances: async (
    id: string,
  ): Promise<ApiResponse<{
    leaveBalances?: {
      id: string;
      leaveTypeId?: string;
      year?: number;
      usedDays?: number;
      remainingDays?: number;
      totalDays?: number;
    }[];
  }>> => {
    const response = await axiosInstance.get(`/hr/employees/${id}`);
    return response.data;
  },

  getLeaveTypes: async (): Promise<ApiResponse<LeaveType[]>> => {
    const response = await axiosInstance.get('/hr/leave-types');
    return response.data;
  },

  updateLeaveBalance: async (id: string, remainingDays?: number, totalDays?: number): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.put(`/hr/leave-balances/${id}`, { remainingDays, totalDays });
    return response.data;
  },

  initializeLeaveBalances: async (employeeId: string): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.post(`/hr/employees/${employeeId}/initialize-leave-balances`);
    return response.data;
  },

  resetLeaveBalances: async (employeeId: string): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.post(`/hr/employees/${employeeId}/reset-leave-balances`);
    return response.data;
  },

  updateEmployeeStatus: async (employeeId: string, isActive: boolean): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.patch(`/hr/employees/${employeeId}/status`, { isActive });
    return response.data;
  }
};
