import axiosInstance from './axios';
import { ApiResponse } from './types';

export const calendarApi = {
  getCalendar: async (): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get('/calendar');
    return response.data;
  },

  getCalendarByMonth: async (year: number, month: number): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(`/calendar?year=${year}&month=${month}`);
    return response.data;
  },

  getCalendarByDate: async (date: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(`/calendar/date/${date}`);
    return response.data;
  },

  getTeamCalendar: async (): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get('/calendar/team');
    return response.data;
  }
};
