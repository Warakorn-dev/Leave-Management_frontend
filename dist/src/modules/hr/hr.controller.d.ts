import { HrService } from './hr.service';
import { CreateDepartmentDto, UpdateDepartmentDto, CreatePositionDto, UpdatePositionDto, CreateLeaveTypeDto, UpdateLeaveTypeDto, CreateEmployeeDto, UpdateEmployeeDto, CreatePublicHolidayDto, UpdatePublicHolidayDto, UpdateLeaveBalanceDto } from './dto/hr.dto';
export declare class HrController {
    private readonly hrService;
    constructor(hrService: HrService);
    getDashboardStats(req: any, year?: string): Promise<{
        success: boolean;
        data: {
            totalEmployees: number;
            leavesToday: number;
            remainingEmployees: number;
            pendingRequests: number;
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
            personal: {
                remainingVacation: number;
                pendingApprovals: number;
                approvedThisYear: number;
                rejectedRequests: number;
            };
        };
    }>;
    getLeaveSummary(searchQuery?: string, startDate?: string, endDate?: string, leaveTypeId?: string, status?: string): Promise<{
        success: boolean;
        data: {
            leaveTypes: {
                id: string;
                name: string;
            }[];
            summary: {
                id: string;
                employeeCode: string;
                firstName: string;
                lastName: string;
                department: string;
                leaveData: Record<string, number>;
                remainingData: Record<string, number>;
                totalUsedDays: number;
                totalRemainingDays: number;
                leaveDates: never[];
            }[];
        };
    }>;
    createDepartment(dto: CreateDepartmentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string | null;
    }>;
    findAllDepartments(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string | null;
    }[]>;
    updateDepartment(id: string, dto: UpdateDepartmentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string | null;
    }>;
    deleteDepartment(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string | null;
    }>;
    createPosition(dto: CreatePositionDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        departmentId: string | null;
        code: string | null;
    }>;
    findAllPositions(): Promise<({
        department: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        departmentId: string | null;
        code: string | null;
    })[]>;
    updatePosition(id: string, dto: UpdatePositionDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        departmentId: string | null;
        code: string | null;
    }>;
    deletePosition(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        departmentId: string | null;
        code: string | null;
    }>;
    createLeaveType(dto: CreateLeaveTypeDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        defaultDays: number;
        requiresCertificate: boolean;
        isSpecial: boolean;
        advanceNoticeDays: number;
        minTenureDays: number;
    }>;
    findAllLeaveTypes(): Promise<{
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
    updateLeaveType(id: string, dto: UpdateLeaveTypeDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        defaultDays: number;
        requiresCertificate: boolean;
        isSpecial: boolean;
        advanceNoticeDays: number;
        minTenureDays: number;
    }>;
    deleteLeaveType(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        defaultDays: number;
        requiresCertificate: boolean;
        isSpecial: boolean;
        advanceNoticeDays: number;
        minTenureDays: number;
    }>;
    createEmployee(dto: CreateEmployeeDto): Promise<{
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
    }>;
    findAllEmployees(): Promise<{
        employeeId: string;
        username: string;
        email: string;
        role: string;
        departmentName: string;
        positionTitle: string;
        positionName: string;
        status: string;
        user: {
            email: string;
            username: string | null;
            isActive: boolean;
            role: {
                name: string;
            };
        };
        department: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string | null;
        };
        position: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            departmentId: string | null;
            code: string | null;
        };
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
    }[]>;
    findEmployeeById(id: string): Promise<{
        user: {
            email: string;
            isActive: boolean;
            role: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
            };
        };
        department: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string | null;
        };
        position: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            departmentId: string | null;
            code: string | null;
        };
        leaveBalances: ({
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
            totalDays: number;
            year: number;
            usedDays: number;
            remainingDays: number;
        })[];
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
    }>;
    updateEmployee(id: string, dto: UpdateEmployeeDto): Promise<{
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
    }>;
    updateEmployeeStatus(id: string, isActive: boolean): Promise<{
        success: boolean;
        isActive: boolean;
    }>;
    deleteEmployee(id: string): Promise<void>;
    initializeLeaveBalances(id: string): Promise<{
        success: boolean;
        initialized: number;
        updated: number;
    }>;
    resetLeaveBalances(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    findAllLeaves(): Promise<{
        id: string;
        employeeId: string;
        leaveTypeId: string;
        employeeName: string;
        departmentName: string;
        leaveTypeName: string;
        type: string;
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
        startDate: Date;
        endDate: Date;
        startFormat: string;
        endFormat: string;
        leaveHours: number;
        totalDays: number;
        paidDays: number;
        unpaidDays: number;
        durationDays: number;
        reason: string;
        status: string;
        attachmentUrl: string | null;
        createdAt: Date;
        approvals: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
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
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                code: string | null;
            };
            position: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                departmentId: string | null;
                code: string | null;
            };
            user: {
                role: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                };
            } & {
                id: string;
                email: string;
                username: string | null;
                passwordHash: string;
                refreshToken: string | null;
                avatarUrl: string | null;
                roleId: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
            };
        };
    }[]>;
    createHoliday(dto: CreatePublicHolidayDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        date: Date;
    }>;
    findAllHolidays(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        date: Date;
    }[]>;
    updateHoliday(id: string, dto: UpdatePublicHolidayDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        date: Date;
    }>;
    deleteHoliday(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        date: Date;
    }>;
    updateLeaveBalance(id: string, dto: UpdateLeaveBalanceDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        leaveTypeId: string;
        totalDays: number;
        year: number;
        usedDays: number;
        remainingDays: number;
    }>;
}
