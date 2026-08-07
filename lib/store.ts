export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export interface LeaveRequest {
  id: string;
  userId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  startFormat?: string;
  endFormat?: string;
  status: LeaveStatus;
  createdAt: string;
  approver?: string;
  approverReason?: string;
  department?: string;
  position?: string;
  attachment?: string;
}

// Fixed Thai public holidays (MM-DD)
export const FIXED_HOLIDAYS = [
  { monthDay: '01-01', title: 'วันขึ้นปีใหม่' },
  { monthDay: '04-06', title: 'วันจักรี' },
  { monthDay: '04-13', title: 'วันสงกรานต์' },
  { monthDay: '04-14', title: 'วันสงกรานต์' },
  { monthDay: '04-15', title: 'วันสงกรานต์' },
  { monthDay: '05-01', title: 'วันแรงงานแห่งชาติ' },
  { monthDay: '05-04', title: 'วันฉัตรมงคล' },
  { monthDay: '07-28', title: 'วันเฉลิมพระชนมพรรษา ร.10' },
  { monthDay: '08-12', title: 'วันแม่แห่งชาติ' },
  { monthDay: '10-13', title: 'วันคล้ายวันสวรรคต ร.9' },
  { monthDay: '10-23', title: 'วันปิยมหาราช' },
  { monthDay: '12-05', title: 'วันพ่อแห่งชาติ' },
  { monthDay: '12-10', title: 'วันรัฐธรรมนูญ' },
  { monthDay: '12-31', title: 'วันสิ้นปี' },
];

// Floating Thai public holidays (YYYY-MM-DD) like Buddhist holidays
export const FLOATING_HOLIDAYS = [
  { date: '2026-03-03', title: 'วันมาฆบูชา' },
  { date: '2026-05-31', title: 'วันวิสาขบูชา' },
  { date: '2026-07-29', title: 'วันอาสาฬหบูชา' },
  { date: '2026-07-30', title: 'วันเข้าพรรษา' },
];

export const getPublicHolidays = (year: number) => {
  const fixed = FIXED_HOLIDAYS.map(h => ({
    date: `${year}-${h.monthDay}`,
    title: h.title
  }));
  const floating = FLOATING_HOLIDAYS.filter(h => h.date.startsWith(`${year}-`));
  return [...fixed, ...floating];
};

const checkIsHoliday = (d: Date, customHolidays?: any[]): boolean => {
  if (customHolidays && customHolidays.length > 0) {
    const dTime = new Date(d);
    dTime.setHours(0, 0, 0, 0);
    return customHolidays.some(h => {
      if (!h.date) return false;
      const hDate = new Date(h.date);
      hDate.setHours(0, 0, 0, 0);
      return hDate.getTime() === dTime.getTime();
    });
  }

  const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const ymd = `${d.getFullYear()}-${md}`;
  return FIXED_HOLIDAYS.some(h => h.monthDay === md) || FLOATING_HOLIDAYS.some(h => h.date === ymd);
};

export const calculateLeaveDays = (startDate: string, endDate: string, startFormat?: string, endFormat?: string, customHolidays?: any[]): number => {
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
  if (s > e) return 0;

  let count = 0;
  let current = new Date(s);
  while (current <= e) {
    const dayOfWeek = current.getDay();

    // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = checkIsHoliday(current, customHolidays);

    if (!isWeekend && !isHoliday) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  if (count === 0) return 0; // if only requested on weekends/holidays

  const isSWeekendOrHoliday = s.getDay() === 0 || s.getDay() === 6 || checkIsHoliday(s, customHolidays);
  const isEWeekendOrHoliday = e.getDay() === 0 || e.getDay() === 6 || checkIsHoliday(e, customHolidays);

  if (s.getTime() === e.getTime()) {
    if ((startFormat === 'morning' || startFormat === 'afternoon') && !isSWeekendOrHoliday) {
      count -= 0.5;
    }
  } else {
    if (startFormat === 'afternoon' && !isSWeekendOrHoliday) {
      count -= 0.5;
    }
    if (endFormat === 'morning' && !isEWeekendOrHoliday) {
      count -= 0.5;
    }
  }

  return Math.max(0, count);
};

const API_URL = '/api/leaves';

export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch leave requests');
    const leaves = await res.json();

    try {
      const usersRes = await fetch('/api/users', { cache: 'no-store' });
      if (usersRes.ok) {
        const users = await usersRes.json();
        return leaves.map((leave: any) => {
          const user = users.find((u: any) =>
            u.username === leave.userId ||
            ([u.firstName, u.lastName].filter(Boolean).join(" ")) === leave.userId
          );
          if (user) {
            return {
              ...leave,
              employeeName: [user.firstName, user.lastName].filter(Boolean).join(" "),
              departmentName: typeof user.department === 'object' && user.department !== null
                ? user.department.name
                : (user.departmentName || user.department || "-"),
              positionName: user.positionName || "-"
            };
          }
          return leave;
        });
      }
    } catch (e) {
      console.error("Failed to attach users to leaves", e);
    }

    return leaves;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const addLeaveRequest = async (request: Omit<LeaveRequest, "id" | "status" | "createdAt">): Promise<LeaveRequest | null> => {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!res.ok) throw new Error('Failed to add leave request');
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateLeaveStatus = async (id: string, status: LeaveRequest['status'], approverName?: string, approverReason?: string) => {
  try {
    const res = await fetch(`${API_URL}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, approverName, approverReason }),
    });
    if (!res.ok) throw new Error('Failed to update leave status');
    return await res.json();
  } catch (error) {
    console.error('Error updating leave status:', error);
    throw error;
  }
};

const USERS_API_URL = '/api/users';

export const loginUser = async (username: string, password: string) => {
  try {
    const res = await fetch(`${USERS_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Invalid credentials');
      throw new Error('Failed to login');
    }
    return await res.json();
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const fetchDashboardStats = async (role: string, department?: string) => {
  try {
    const res = await fetch(`/api/dashboard/stats?role=${role}&department=${department || ''}`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};


export const getUser = async (id: string) => {
  try {
    const res = await fetch(`${USERS_API_URL}/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch user');
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getUsers = async () => {
  try {
    const res = await fetch(USERS_API_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch users');
    const users = await res.json();
    return users.map((u: any) => ({
      ...u,
      department: typeof u.department === 'object' && u.department !== null ? u.department.name : (u.departmentName || u.department || null)
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const updateUser = async (id: string, data: any) => {
  try {
    const res = await fetch(`${USERS_API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update user');
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const deleteLeaveRequest = async (id: string): Promise<void> => {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete leave request');
  } catch (error) {
    console.error(error);
  }
};

export const updateLeaveRequest = async (id: string, data: Partial<LeaveRequest>): Promise<void> => {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update leave request');
  } catch (error) {
    console.error(error);
  }
};

const NOTIFICATIONS_API_URL = '/api/notifications';

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type?: 'success' | 'info' | 'warning';
  targetUser: string;
}

export const getNotifications = async (username: string): Promise<Notification[]> => {
  try {
    const res = await fetch(`${NOTIFICATIONS_API_URL}?user=${username}`, { cache: 'no-store' });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch notifications: ${res.status} ${res.statusText} - ${text}`);
    }
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const markNotificationRead = async (id: string): Promise<void> => {
  try {
    await fetch(`${NOTIFICATIONS_API_URL}/${id}/read`, { method: 'PATCH' });
  } catch (error) {
    console.error(error);
  }
};

export const markAllNotificationsRead = async (username: string): Promise<void> => {
  try {
    await fetch(`${NOTIFICATIONS_API_URL}/readAll`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: username }),
    });
  } catch (error) {
    console.error(error);
  }
};
