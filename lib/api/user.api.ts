import axiosInstance from './axios';
import { ApiResponse } from './types';

export interface UserProfile {
  id?: string;
  username?: string;
  email?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  firstNameEN?: string;
  lastNameEN?: string;
  idCardNumber?: string;
  idCardAddress?: string;
  currentAddress?: string;
  dateOfBirth?: string;
  hireDate?: string;
  gender?: string;
  employeeCode?: string;
  avatarUrl?: string;
  profilePic?: string;
  department?: { name?: string };
  departmentName?: string;
  position?: { name?: string; title?: string };
  positionName?: string;
  user?: { firstName?: string; lastName?: string; email?: string; avatarUrl?: string };
}

export const userApi = {
  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    const response = await axiosInstance.get('/leave/me');
    return response.data;
  },

  updateAvatar: async (avatarUrl: string | null): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.patch('/leave/me/avatar', { avatarUrl });
    return response.data;
  }
};
