import axiosInstance from './axios';
import { ApiResponse } from './types';

export const uploadApi = {
  uploadFile: async (formData: FormData): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
