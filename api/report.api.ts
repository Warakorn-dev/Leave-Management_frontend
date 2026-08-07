import axiosInstance from './axios';
import { ApiResponse } from './types';

export const reportApi = {
  exportLeaveReport: async (filters?: any): Promise<Blob> => {
    // Reports usually return files (Blobs)
    const response = await axiosInstance.get('/hr/report/export', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },

  getStats: async (year?: number): Promise<ApiResponse<any>> => {
    const query = year ? `?year=${year}` : '';
    const response = await axiosInstance.get(`/hr/report/stats${query}`);
    return response.data;
  }
};
