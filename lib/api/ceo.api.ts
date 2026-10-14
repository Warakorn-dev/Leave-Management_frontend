import axiosInstance from './axios';
import { ApiResponse } from './types';

export const ceoApi = {
  getReportStats: async (year?: string): Promise<ApiResponse<{
    workStatusData?: { name: string; value: number; color: string }[];
    leaveTypesData?: { name: string; percent: number; color: string }[];
    trendData?: { day: string; value: number }[];
  }>> => {
    const query = year ? `?year=${year}` : '';
    const response = await axiosInstance.get(`/ceo/report/stats${query}`);
    return response.data;
  },
  // CEO approve/reject live in app/dashboard/ceo/approval/page.tsx (D-09: the old
  // helpers here sent `reason` instead of `comment` and were never used).
};
