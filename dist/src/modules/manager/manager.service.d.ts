import { PrismaService } from "../../prisma/prisma.service";
import { ProcessLeaveRequestDto } from './dto/manager.dto';
import { NotificationService } from '../notification/notification.service';
export declare class ManagerService {
    private prisma;
    private notificationService;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    getPendingRequests(managerUserId: string): Promise<({
        employee: {
            id: string;
            user: {
                role: {
                    name: string;
                };
            };
            department: {
                name: string;
            };
            employeeCode: string | null;
            title: string | null;
            firstName: string;
            lastName: string;
            position: {
                name: string;
            };
        };
        attachments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            leaveRequestId: string;
            filePath: string;
            fileType: string;
        }[];
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
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        leaveTypeId: string;
        startDate: Date;
        endDate: Date;
        startFormat: string;
        endFormat: string;
        totalDays: number;
        paidDays: number;
        unpaidDays: number;
        reason: string;
        status: string;
    })[]>;
    getDepartmentHistory(managerUserId: string): Promise<({
        employee: {
            id: string;
            user: {
                id: string;
                avatarUrl: string | null;
                role: {
                    name: string;
                };
            };
            department: {
                name: string;
            };
            employeeCode: string | null;
            title: string | null;
            firstName: string;
            lastName: string;
            position: {
                name: string;
            };
        };
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
            createdAt: Date;
            updatedAt: Date;
            status: string;
            leaveRequestId: string;
            approverId: string;
            comment: string | null;
        }[];
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
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        leaveTypeId: string;
        startDate: Date;
        endDate: Date;
        startFormat: string;
        endFormat: string;
        totalDays: number;
        paidDays: number;
        unpaidDays: number;
        reason: string;
        status: string;
    })[]>;
    processRequest(managerUserId: string, requestId: string, action: 'Approve' | 'Reject', dto: ProcessLeaveRequestDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        leaveTypeId: string;
        startDate: Date;
        endDate: Date;
        startFormat: string;
        endFormat: string;
        totalDays: number;
        paidDays: number;
        unpaidDays: number;
        reason: string;
        status: string;
    }>;
    private getEmployeeByUserId;
    getDashboardStats(userId: string, targetYear?: number): Promise<{
        stats: {
            totalEmployees: number;
            leavesToday: number;
            remainingEmployees: number;
            leaveQuotaToday: number;
            pendingApprovals: number;
        };
        monthlyStats: {
            month: string;
            value: any;
        }[];
        announcements: {
            id: string;
            title: string;
            subtitle: string;
            isImportant: boolean;
        }[];
        activities: {
            id: string;
            title: string;
            time: string;
            type: string;
        }[];
    }>;
}
