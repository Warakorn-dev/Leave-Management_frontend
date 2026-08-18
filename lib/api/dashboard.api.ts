import axiosInstance from './axios';
import { ApiResponse } from './types';

export const dashboardApi = {
  getStats: async (endpoint: string, year?: number): Promise<ApiResponse<any>> => {
    const query = year ? `?year=${year}` : '';
    const response = await axiosInstance.get(`/${endpoint}${query}`);
    return response.data;
  }
};
