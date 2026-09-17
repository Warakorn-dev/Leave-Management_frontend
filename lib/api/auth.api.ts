import axiosInstance from './axios';
import { ApiResponse } from './types';

export interface CaptchaResponse {
  captcha_image: string;
  captcha_id: string;
}

export interface LoginRequest {
  username?: string;
  password?: string;
  captchaInput?: string;
  captchaId?: string;
}

export interface LoginUser {
  id: string;
  role: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  department?: { name?: string };
  departmentName?: string;
  position?: string;
  positionName?: string;
  employeeCode?: string;
  profilePic?: string;
}

export interface LoginResponse {
  user: LoginUser;
  accessToken: string;
  refreshToken?: string;
}

export const authApi = {
  getCaptcha: async (): Promise<ApiResponse<CaptchaResponse>> => {
    const response = await axiosInstance.get(`/auth/captcha?t=${Date.now()}`);
    return response.data;
  },

  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  forgotPassword: async (username: string): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.post('/auth/forgot-password', { username });
    return response.data;
  },

  resetPassword: async (data: { token: string; newPassword: string }): Promise<ApiResponse<unknown>> => {
    const response = await axiosInstance.post('/auth/reset-password', data);
    return response.data;
  }
};
