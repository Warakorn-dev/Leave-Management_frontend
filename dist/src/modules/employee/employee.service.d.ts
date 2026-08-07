import { PrismaService } from "../../prisma/prisma.service";
import { CreateLeaveRequestDto, UpdateLeaveRequestDto } from './dto/employee.dto';
import { NotificationService } from '../notification/notification.service';
export declare class EmployeeService {
    private prisma;
    private notificationService;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    createLeaveRequest(userId: string, dto: CreateLeaveRequestDto): Promise<{
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
    updateLeaveRequest(userId: string, requestId: string, dto: UpdateLeaveRequestDto): Promise<{
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
    deleteLeaveRequest(userId: string, requestId: string): Promise<{
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
    getMe(userId: string): Promise<({
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
    updateAvatar(userId: string, avatarUrl: string): Promise<{
        success: boolean;
        message: string;
        avatarUrl: string | null;
    }>;
    getLeaveHistory(userId: string): Promise<({
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
    getDepartmentLeaves(userId: string): Promise<({
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
    getLeaveBalance(userId: string): Promise<{
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
    getDashboardStats(userId: string, targetYear?: number): Promise<{
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
    private getEmployeeByUserId;
    private calculateWorkingDays;
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
}
