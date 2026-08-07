import { EmployeeService } from './employee.service';
import { CreateLeaveRequestDto, UpdateLeaveRequestDto } from './dto/employee.dto';
export declare class EmployeeController {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
    createLeaveRequest(user: any, dto: CreateLeaveRequestDto): Promise<{
        id: string;
        startDate: Date;
        endDate: Date;
        startFormat: string;
        endFormat: string;
        totalDays: number;
        paidDays: number;
        unpaidDays: number;
        reason: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        leaveTypeId: string;
    }>;
    getDashboardStats(user: any, year?: string): Promise<{
        remainingVacation: number;
        pendingApprovals: number;
        approvedThisYear: number;
        rejectedRequests: number;
        chartData: {
            name: string;
            value: number;
        }[];
        announcements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            subtitle: string;
            isImportant: boolean;
            attachmentData: string | null;
            attachmentName: string | null;
        }[];
        activities: {
            title: string;
            time: string;
            color: string;
        }[];
        employeeName: string;
    }>;
    getLeaveTypes(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        defaultDays: number;
        requiresCertificate: boolean;
        isSpecial: boolean;
        advanceNoticeDays: number;
        minTenureDays: number;
    }[]>;
    getPublicHolidays(): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            date: Date;
        }[];
    }>;
    getLeaveHistory(user: any): Promise<({
        attachments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            leaveRequestId: string;
            filePath: string;
            fileType: string;
        }[];
        approvals: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            leaveRequestId: string;
            approverId: string;
            comment: string | null;
        }[];
        employee: {
            id: string;
            employeeCode: string | null;
            title: string | null;
            firstName: string;
            lastName: string;
            department: {
                name: string;
            };
            position: {
                name: string;
            };
            user: {
                id: string;
                role: {
                    name: string;
                };
                avatarUrl: string | null;
            };
        };
        leaveType: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            defaultDays: number;
            requiresCertificate: boolean;
            isSpecial: boolean;
            advanceNoticeDays: number;
            minTenureDays: number;
        };
    } & {
        id: string;
        startDate: Date;
        endDate: Date;
        startFormat: string;
        endFormat: string;
        totalDays: number;
        paidDays: number;
        unpaidDays: number;
        reason: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        leaveTypeId: string;
    })[]>;
    getAllCompanyLeaves(): Promise<({
        attachments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            leaveRequestId: string;
            filePath: string;
            fileType: string;
        }[];
        approvals: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            leaveRequestId: string;
            approverId: string;
            comment: string | null;
        }[];
        employee: {
            id: string;
            employeeCode: string | null;
            title: string | null;
            firstName: string;
            lastName: string;
            department: {
                name: string;
            };
            position: {
                name: string;
            };
            user: {
                id: string;
                role: {
                    name: string;
                };
                avatarUrl: string | null;
            };
        };
        leaveType: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            defaultDays: number;
            requiresCertificate: boolean;
            isSpecial: boolean;
            advanceNoticeDays: number;
            minTenureDays: number;
        };
    } & {
        id: string;
        startDate: Date;
        endDate: Date;
        startFormat: string;
        endFormat: string;
        totalDays: number;
        paidDays: number;
        unpaidDays: number;
        reason: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        leaveTypeId: string;
    })[]>;
    getDepartmentLeaves(user: any): Promise<({
        attachments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            leaveRequestId: string;
            filePath: string;
            fileType: string;
        }[];
        approvals: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            leaveRequestId: string;
            approverId: string;
            comment: string | null;
        }[];
        employee: {
            id: string;
            employeeCode: string | null;
            title: string | null;
            firstName: string;
            lastName: string;
            department: {
                name: string;
            };
            position: {
                name: string;
            };
            user: {
                id: string;
                role: {
                    name: string;
                };
                avatarUrl: string | null;
            };
        };
        leaveType: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            defaultDays: number;
            requiresCertificate: boolean;
            isSpecial: boolean;
            advanceNoticeDays: number;
            minTenureDays: number;
        };
    } & {
        id: string;
        startDate: Date;
        endDate: Date;
        startFormat: string;
        endFormat: string;
        totalDays: number;
        paidDays: number;
        unpaidDays: number;
        reason: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        leaveTypeId: string;
    })[]>;
    getMe(user: any): Promise<({
        role: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        username: string | null;
        passwordHash: string;
        refreshToken: string | null;
        avatarUrl: string | null;
        roleId: string;
        isActive: boolean;
    }) | ({
        department: {
            name: string;
        };
        position: {
            name: string;
        };
        user: {
            role: {
                name: string;
            };
            email: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        employeeCode: string | null;
        title: string | null;
        firstName: string;
        lastName: string;
        gender: string | null;
        phone: string | null;
        departmentId: string;
        positionId: string;
        hireDate: Date;
        currentAddress: string | null;
        dateOfBirth: Date | null;
        idCardAddress: string | null;
        idCardNumber: string | null;
        firstNameEN: string | null;
        lastNameEN: string | null;
    })>;
    updateAvatar(user: any, dto: {
        avatarUrl: string;
    }): Promise<{
        success: boolean;
        message: string;
        avatarUrl: string | null;
    }>;
    getLeaveBalance(user: any): Promise<{
        pendingDays: number;
        effectiveRemainingDays: number;
        employeeHireDate: Date;
        leaveType: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            defaultDays: number;
            requiresCertificate: boolean;
            isSpecial: boolean;
            advanceNoticeDays: number;
            minTenureDays: number;
        };
        id: string;
        totalDays: number;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        leaveTypeId: string;
        year: number;
        usedDays: number;
        remainingDays: number;
    }[]>;
    updateLeaveRequest(user: any, id: string, dto: UpdateLeaveRequestDto): Promise<{
        id: string;
        startDate: Date;
        endDate: Date;
        startFormat: string;
        endFormat: string;
        totalDays: number;
        paidDays: number;
        unpaidDays: number;
        reason: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        leaveTypeId: string;
    }>;
    deleteLeaveRequest(user: any, id: string): Promise<{
        id: string;
        startDate: Date;
        endDate: Date;
        startFormat: string;
        endFormat: string;
        totalDays: number;
        paidDays: number;
        unpaidDays: number;
        reason: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        leaveTypeId: string;
    }>;
}
