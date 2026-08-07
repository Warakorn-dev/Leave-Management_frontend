import { PrismaService } from "../../prisma/prisma.service";
import { NotificationService } from '../notification/notification.service';
export declare class CeoService {
    private prisma;
    private notificationService;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    getDashboardStats(userId: string, targetYear?: number): Promise<{
        success: boolean;
        data: {
            totalEmployees: number;
            leavesToday: number;
            remainingEmployees: number;
            totalLeaves: number;
            pendingLeaves: number;
            approvedLeaves: number;
            rejectedLeaves: number;
            chart: number[];
            personal: {
                remainingVacation: number;
                pendingApprovals: number;
                approvedThisYear: number;
                rejectedRequests: number;
            };
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
        };
    }>;
    getReportStats(): Promise<{
        success: boolean;
        data: {
            workStatusData: {
                name: string;
                value: number;
                color: string;
            }[];
            leaveTypesData: {
                name: string;
                percent: number;
                color: string;
            }[];
            trendData: {
                day: string;
                value: number;
            }[];
        };
    }>;
    getCompanyReport(): Promise<({
        employee: {
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
    getDepartmentReport(departmentId: string): Promise<({
        employee: {
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
    approveSpecialLeave(ceoUserId: string, requestId: string, action: 'Approve' | 'Reject', comment?: string): Promise<{
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
    findAllEmployees(): Promise<any[]>;
}
