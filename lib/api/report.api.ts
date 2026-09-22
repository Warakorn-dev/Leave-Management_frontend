import axiosInstance from './axios';
import { ApiResponse } from './types';

export const reportApi = {
  exportLeaveReport: async (filters?: Record<string, unknown>): Promise<Blob> => {
    // Reports usually return files (Blobs)
    const response = await axiosInstance.get('/hr/report/export', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },

  getStats: async (year?: number): Promise<ApiResponse<unknown>> => {
    const query = year ? `?year=${year}` : '';
    const response = await axiosInstance.get(`/hr/report/stats${query}`);
    return response.data;
  }
};
