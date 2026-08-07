import axiosInstance from './axios';
import { ApiResponse } from './types';

export const notificationApi = {
  getNotifications: async (): Promise<ApiResponse<any[]>> => {
    const response = await axiosInstance.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post('/notifications/read-all');
    return response.data;
  }
};
