import axiosInstance from './axios';
import { ApiResponse } from './types';

export const userApi = {
  getProfile: async (): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get('/leave/me');
    return response.data;
  },

  updateAvatar: async (avatarUrl: string | null): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.patch('/leave/me/avatar', { avatarUrl });
    return response.data;
  }
};
