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
  role?: unknown;
  status?: 'active' | 'inactive';
}

export interface LeaveType {
  id: string;
  code: string;
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
  hireDate?: string;
  gender?: string;
  firstNameEN?: string;
  lastNameEN?: string;
  idCardNumber?: string;
  dateOfBirth?: string;
  idCardAddress?: string;
  currentAddress?: string;
}

export interface CreateEmployeeInput {
  employeeCode?: string;
  username?: string;
  title?: string;
  firstName: string;
  lastName: string;
  firstNameEN?: string;
  lastNameEN?: string;
  idCardNumber?: string;
  dateOfBirth?: string;
  idCardAddress?: string;
  currentAddress?: string;
  email: string;
  departmentId?: string;
  positionId?: string;
  roleName?: string;
  password?: string;
  phone?: string;
  hireDate?: string;
  gender?: string;
}

export interface Leave {
  id: string;
  requestCode?: string;
  employeeId?: string;
  employeeCode?: string;
  empCode?: string;
  dateRangeStr?: string;
  employeeName: string;
  employee?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    employeeCode?: string;
    userId?: string;
    department?: { name?: string };
    position?: { name?: string };
    positionName?: string;
    title?: string;
    user?: { id?: string; avatarUrl?: string; email?: string };
    [key: string]: unknown;
  };
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    title?: string;
    avatarUrl?: string;
    department?: { name?: string };
    position?: { name?: string };
    [key: string]: unknown;
  };
  departmentName?: string;
  department?: string;
  positionName?: string;
  position?: string;
  leaveType?: string | { id?: string; name?: string };
  leaveTypeId?: string;
  leaveTypeName?: string;
  type?: string;
  startDate: string;
  endDate: string;
  startFormat?: 'full' | 'morning' | 'afternoon' | 'hourly';
  endFormat?: 'full' | 'morning' | 'afternoon' | 'hourly';
  leaveHours?: number;
  leaveMode?: string;
  startTime?: string;
  endTime?: string;
  durationDays?: number;
  daysCount?: number;
  totalDays?: number;
  status: string;
  reason: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachment?: string;
  approverName?: string;
  approver?: string;
  approverReason?: string;
  attachments?: Array<{ filePath?: string; fileType?: string }>;
  approvals?: Array<{ id?: string; status?: string; comment?: string; createdAt?: string }>;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  isViewedByHr?: boolean;
  currentHrReviewerId?: string | null;
  hrReviewStartedAt?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  statusCode?: number;
}
