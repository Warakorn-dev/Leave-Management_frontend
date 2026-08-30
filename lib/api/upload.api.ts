import axiosInstance from './axios';
import { ApiResponse } from './types';

export const uploadApi = {
  uploadFile: async (formData: FormData): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post('/upload', formData, {

      timeout: 30000, // 30s timeout for file uploads
    });
    return response.data;
  }
};
