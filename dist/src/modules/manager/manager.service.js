"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
let ManagerService = class ManagerService {
    prisma;
    notificationService;
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    async getPendingRequests(managerUserId) {
        const manager = await this.getEmployeeByUserId(managerUserId);
        return this.prisma.leaveRequest.findMany({
            where: {
                status: 'Pending',
                employee: {
                    departmentId: manager.departmentId,
                    id: { not: manager.id }
                }
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        title: true,
                        firstName: true,
                        lastName: true,
                        department: { select: { name: true } },
                        position: { select: { name: true } },
                        user: { select: { role: { select: { name: true } } } }
                    }
                },
                leaveType: true,
                attachments: true,
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getDepartmentHistory(managerUserId) {
        const manager = await this.getEmployeeByUserId(managerUserId);
        return this.prisma.leaveRequest.findMany({
            where: {
                employee: {
                    departmentId: manager.departmentId,
                    id: { not: manager.id }
                }
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        title: true,
                        firstName: true,
                        lastName: true,
                        department: { select: { name: true } },
                        position: { select: { name: true } },
                        user: { select: { id: true, avatarUrl: true, role: { select: { name: true } } } }
                    }
                },
                leaveType: true,
                attachments: true,
                approvals: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async processRequest(managerUserId, requestId, action, dto) {
        const manager = await this.getEmployeeByUserId(managerUserId);
        const request = await this.prisma.leaveRequest.findUnique({
            where: { id: requestId },
            include: { leaveType: true, employee: true }
        });
        if (!request || request.status !== 'Pending') {
            throw new common_1.BadRequestException('Invalid request or already processed');
        }
        if (request.employee.departmentId !== manager.departmentId) {
            throw new common_1.BadRequestException('Employee is not in your department');
        }
        let nextStatus = '';
        if (action === 'Reject') {
            nextStatus = 'Rejected Manager';
        }
        else {
            nextStatus = 'Approved';
        }
        return this.prisma.$transaction(async (prisma) => {
            const updatedRequest = await prisma.leaveRequest.update({
                where: { id: requestId },
                data: { status: nextStatus },
            });
            await prisma.leaveApproval.create({
                data: {
                    leaveRequestId: requestId,
                    approverId: managerUserId,
                    status: nextStatus,
                    comment: dto.comment,
                }
            });
            if (action === 'Approve') {
                const currentYear = new Date(request.startDate).getFullYear();
                const leaveBalance = await prisma.leaveBalance.findFirst({
                    where: {
                        employeeId: request.employeeId,
                        leaveTypeId: request.leaveTypeId,
                        year: currentYear
                    }
                });
                if (leaveBalance) {
                    const newUsedDays = leaveBalance.usedDays + request.totalDays;
                    const newRemainingDays = leaveBalance.totalDays - newUsedDays;
                    if (newRemainingDays < 0) {
                        throw new common_1.BadRequestException('Insufficient leave balance');
                    }
                    await prisma.leaveBalance.update({
                        where: { id: leaveBalance.id },
                        data: {
                            usedDays: newUsedDays,
                            remainingDays: newRemainingDays
                        }
                    });
                }
            }
            return updatedRequest;
        }).then(async (updatedRequest) => {
            try {
                const employeeUser = await this.prisma.user.findUnique({ where: { id: request.employee.userId } });
                const statusText = nextStatus.includes('Approved') ? 'อนุมัติ' : 'ปฏิเสธ';
                if (employeeUser?.id) {
                    await this.prisma.notification.create({
                        data: {
                            userId: employeeUser.id,
                            title: statusText === 'อนุมัติ' ? 'คำขอลาได้รับการอนุมัติจาก Manager' : 'คำขอลาถูกปฏิเสธโดย Manager',
                            message: `คำขอ${request.leaveType.name} ของคุณได้รับการ${statusText}โดยผู้จัดการแผนกเรียบร้อยแล้ว`,
                            type: statusText === 'อนุมัติ' ? 'APPROVE' : 'REJECT',
                            redirectUrl: '/dashboard/user/history',
                        }
                    });
                }
                if (employeeUser?.email) {
                    this.notificationService.sendEmail(employeeUser.email, `[Leave Request] คำขอลางานของคุณถูก${statusText}`, `เรียน ${request.employee.firstName},\n\nคำขอลา${request.leaveType.name} ของคุณ (วันที่ ${request.startDate.toLocaleDateString()} ถึง ${request.endDate.toLocaleDateString()}) ได้ถูก${statusText}โดยหัวหน้างานแล้ว\nหมายเหตุ: ${dto.comment || '-'}\n\nคุณสามารถตรวจสอบสถานะได้ในระบบ`);
                }
            }
            catch (e) {
                console.error('Failed to send manager notification', e);
            }
            return updatedRequest;
        });
    }
    async getEmployeeByUserId(userId) {
        const employee = await this.prisma.employee.findUnique({ where: { userId } });
        if (!employee)
            throw new common_1.NotFoundException('Manager profile not found');
        return employee;
    }
    async getDashboardStats(userId, targetYear) {
        const manager = await this.getEmployeeByUserId(userId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const currentYear = targetYear || today.getFullYear();
        const [totalEmployees, pendingRequests, announcements, activities] = await Promise.all([
            this.prisma.employee.count({
                where: { departmentId: manager.departmentId }
            }),
            this.prisma.leaveRequest.count({
                where: {
                    status: 'Pending',
                    employee: { departmentId: manager.departmentId }
                }
            }),
            this.prisma.announcement.findMany({ take: 2, orderBy: { createdAt: 'desc' } }),
            this.prisma.leaveRequest.findMany({
                where: { employee: { departmentId: manager.departmentId } },
                take: 3,
                orderBy: { createdAt: 'desc' },
                include: { leaveType: true, employee: true }
            })
        ]);
        const leavesTodayCount = await this.prisma.leaveRequest.count({
            where: {
                status: { contains: 'Approved' },
                startDate: { lte: tomorrow },
                endDate: { gte: today },
                employee: { departmentId: manager.departmentId }
            }
        });
        const monthlyStatsRaw = await this.prisma.leaveRequest.findMany({
            where: {
                status: { contains: 'Approved' },
                startDate: {
                    gte: new Date(`${currentYear}-01-01`),
                    lt: new Date(`${currentYear + 1}-01-01`)
                },
                employee: { departmentId: manager.departmentId }
            },
            select: { startDate: true }
        });
        const monthlyCounts = Array(12).fill(0);
        monthlyStatsRaw.forEach(req => {
            monthlyCounts[new Date(req.startDate).getMonth()]++;
        });
        const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const monthlyStats = monthNames.map((month, index) => ({
            month,
            value: monthlyCounts[index]
        }));
        return {
            stats: {
                totalEmployees,
                leavesToday: leavesTodayCount,
                remainingEmployees: totalEmployees > leavesTodayCount ? totalEmployees - leavesTodayCount : 0,
                leaveQuotaToday: 1,
                pendingApprovals: pendingRequests,
            },
            monthlyStats,
            announcements: announcements.map(a => ({
                id: a.id,
                title: a.title,
                subtitle: a.subtitle || '...',
                isImportant: a.isImportant
            })),
            activities: activities.map(req => {
                let type = 'leave';
                let title = `${req.employee?.firstName || 'พนักงาน'} ส่งคำขอลา${req.leaveType?.name || 'ลา'} ${req.totalDays || 1} วัน`;
                if (req.status === 'Approved') {
                    type = 'approve';
                    title = `หัวหน้าอนุมัติการลาของ ${req.employee?.firstName || 'พนักงาน'}`;
                }
                return {
                    id: req.id,
                    title,
                    time: new Date(req.createdAt).toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    type
                };
            })
        };
    }
};
exports.ManagerService = ManagerService;
exports.ManagerService = ManagerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, notification_service_1.NotificationService])
], ManagerService);
//# sourceMappingURL=manager.service.js.map