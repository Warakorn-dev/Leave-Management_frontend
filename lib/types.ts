export interface Department {
  id: string;
  code?: string;
  name: string;
  description?: string;
  managerName?: string;
  status?: 'active' | 'inactive';
}

export interface Position {
  id: string;
  code?: string;
  name?: string;
  title?: string;
  description?: string;
  departmentName?: string;
  departmentId?: string;
  department?: Department;
  roleId?: string;
  role?: any;
  status?: 'active' | 'inactive';
}

export interface LeaveType {
  id: string;
  name: string;
  defaultDays: number;
  requiresCertificate: boolean;
  isSpecial: boolean;
  advanceNoticeDays: number;
  minTenureDays: number;
}

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  departmentName?: string;
  departmentId?: string;
  position?: string;
  positionName?: string;
  positionId?: string;
  joinDate?: string;
  role?: string;
  username?: string;
  password?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'inactive';
  avatar?: string;
}

export interface Leave {
  id: string;
  employeeId?: string;
  employeeCode?: string;
  employeeName: string;
  employee?: any;
  departmentName?: string;
  department?: string;
  leaveType?: string;
  leaveTypeId?: string;
  leaveTypeName?: string;
  type?: string;
  startDate: string;
  endDate: string;
  startFormat?: 'full' | 'morning' | 'afternoon' | 'hourly';
  endFormat?: 'full' | 'morning' | 'afternoon' | 'hourly';
  leaveHours?: number;
  durationDays?: number;
  totalDays?: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'pending' | 'approved' | 'rejected' | 'Waiting CEO' | 'waiting ceo';
  reason: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachment?: string;
  approverName?: string;
  approver?: string;
  approverReason?: string;
  attachments?: any[];
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}
