export declare class CreateDepartmentDto {
    code?: string;
    name: string;
}
export declare class UpdateDepartmentDto {
    code?: string;
    name?: string;
}
export declare class CreatePositionDto {
    code?: string;
    name: string;
    departmentId?: string;
}
export declare class UpdatePositionDto {
    code?: string;
    name?: string;
    departmentId?: string;
}
export declare class CreateLeaveTypeDto {
    name: string;
    defaultDays: number;
    requiresCertificate?: boolean;
    isSpecial?: boolean;
    advanceNoticeDays?: number;
    minTenureDays?: number;
}
export declare class UpdateLeaveTypeDto {
    name?: string;
    defaultDays?: number;
    requiresCertificate?: boolean;
    isSpecial?: boolean;
    advanceNoticeDays?: number;
    minTenureDays?: number;
}
export declare class CreateEmployeeDto {
    email: string;
    title?: string;
    firstName: string;
    lastName: string;
    phone?: string;
    departmentId: string;
    positionId: string;
    roleId?: string;
    roleName?: string;
    password?: string;
    employeeCode?: string;
    username?: string;
    hireDate?: string;
    gender?: string;
}
export declare class UpdateEmployeeDto {
    employeeCode?: string;
    username?: string;
    title?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    departmentId?: string;
    positionId?: string;
    hireDate?: string;
    gender?: string;
    roleId?: string;
    roleName?: string;
}
export declare class CreatePublicHolidayDto {
    name: string;
    date: string;
}
export declare class UpdatePublicHolidayDto {
    name?: string;
    date?: string;
}
export declare class UpdateLeaveBalanceDto {
    remainingDays: number;
}
