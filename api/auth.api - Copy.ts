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

export interface LoginResponse {
  user: any;
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

  forgotPassword: async (username: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post('/auth/forgot-password', { username });
    return response.data;
  },

  resetPassword: async (data: any): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post('/auth/reset-password', data);
    return response.data;
  }
};
