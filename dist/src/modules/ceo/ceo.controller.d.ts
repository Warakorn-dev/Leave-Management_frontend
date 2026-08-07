import { CeoService } from './ceo.service';
export declare class CeoController {
    private readonly ceoService;
    constructor(ceoService: CeoService);
    getDashboardStats(user: any, year?: string): Promise<{
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
    approveSpecialLeave(user: any, id: string, comment: string): Promise<{
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
    rejectSpecialLeave(user: any, id: string, comment: string): Promise<{
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
    getEmployees(): Promise<any[]>;
}
