import axiosInstance from './axios';
import { ApiResponse } from './types';

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
  redirectUrl?: string;
}

export const notificationApi = {
  getNotifications: async (): Promise<ApiResponse<NotificationDto[]>> => {
    const response = await axiosInstance.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.post('/notifications/read-all');
    return response.data;
  }
};
