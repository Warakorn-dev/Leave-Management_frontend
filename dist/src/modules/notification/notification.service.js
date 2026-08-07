"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
let NotificationService = NotificationService_1 = class NotificationService {
    configService;
    prisma;
    transporter;
    logger = new common_1.Logger(NotificationService_1.name);
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('email.host'),
            port: this.configService.get('email.port'),
            secure: false,
            auth: {
                user: this.configService.get('email.user'),
                pass: this.configService.get('email.pass'),
            },
        });
    }
    async sendEmail(to, subject, text, html) {
        try {
            const info = await this.transporter.sendMail({
                from: `"Leave Management System" <${this.configService.get('email.user')}>`,
                to,
                subject,
                text,
                html: html || text,
            });
            this.logger.log(`Message sent: ${info.messageId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Error sending email to ${to}`, error);
            return false;
        }
    }
    handleCron() {
        this.logger.debug('Running daily cron job for pending leave request reminders');
    }
    async getNotifications(userId) {
        let list = await this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        for (const item of list) {
            let needsUpdate = false;
            let newMsg = item.message;
            if (newMsg.includes('(0.25 วัน)')) {
                newMsg = newMsg.replace('(0.25 วัน)', '(2 ชั่วโมง) วันที่ 10 ส.ค. 2026 เวลา 09:00 - 11:00 น.');
                needsUpdate = true;
            }
            if (newMsg.includes('ส่งคำขอลาพักร้อน 3 วัน (10 - 12 ส.ค.)')) {
                newMsg = newMsg.replace('ส่งคำขอลาพักร้อน 3 วัน (10 - 12 ส.ค.)', 'ได้ยื่นคำขอ ลาพักร้อน (3 วัน) วันที่ 10 - 12 ส.ค. 2026');
                needsUpdate = true;
            }
            if (needsUpdate) {
                await this.prisma.notification.update({
                    where: { id: item.id },
                    data: { message: newMsg }
                });
                item.message = newMsg;
            }
        }
        if (list.length === 0) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { role: true },
            });
            const roleName = user?.role?.name?.toLowerCase() || 'user';
            let sampleNotifications = [];
            if (roleName === 'ceo') {
                sampleNotifications = [
                    {
                        userId,
                        title: 'มีคำขอลาจากผู้จัดการแผนก',
                        message: 'ผู้จัดการแผนก "วิไล ใจดี" ได้ยื่นคำขอ ลากิจธุระอันจำเป็น (3 ชั่วโมง) วันที่ 10 ส.ค. 2026 เวลา 09:00 - 12:00 น.',
                        type: 'NEW_ORDER',
                        redirectUrl: '/dashboard/ceo/approval',
                        isRead: false,
                        createdAt: new Date(Date.now() - 5 * 60 * 1000),
                    },
                    {
                        userId,
                        title: 'ประกาศใหม่จาก HR',
                        message: 'รายงานสรุปสถิติการลางานและโควต้าคงเหลือพนักงานประจำไตรมาสที่ 3',
                        type: 'SYSTEM',
                        redirectUrl: '/dashboard/ceo/dashboard',
                        isRead: false,
                        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    },
                ];
            }
            else if (roleName === 'manager') {
                sampleNotifications = [
                    {
                        userId,
                        title: 'มีคำขอลาใหม่ในแผนก',
                        message: 'พนักงาน "สมชาย พากเพียร" ได้ส่งคำขอลาป่วย 2 วัน (5 - 6 ส.ค.)',
                        type: 'NEW_ORDER',
                        redirectUrl: '/dashboard/manager/approve',
                        isRead: false,
                        createdAt: new Date(Date.now() - 10 * 60 * 1000),
                    },
                    {
                        userId,
                        title: 'คำขอลาได้รับการอนุมัติจาก CEO',
                        message: 'คำขอลาพักร้อนล่วงหน้าของคุณได้รับการอนุมัติจาก CEO เรียบร้อยแล้ว',
                        type: 'APPROVE',
                        redirectUrl: '/dashboard/manager/history',
                        isRead: false,
                        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
                    },
                    {
                        userId,
                        title: 'ประกาศใหม่จาก HR',
                        message: 'ประกาศแจ้งกำหนดการประเมินผลการทำงานพนักงานประจำปี 2026',
                        type: 'SYSTEM',
                        redirectUrl: '/dashboard/manager',
                        isRead: true,
                        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                ];
            }
            else if (roleName === 'hr') {
                sampleNotifications = [
                    {
                        userId,
                        title: 'คำขอลาได้รับการอนุมัติจาก CEO',
                        message: 'คำขอลาพักร้อนของคุณได้รับการอนุมัติโดย CEO เรียบร้อยแล้ว',
                        type: 'APPROVE',
                        redirectUrl: '/dashboard/hr/leave-history',
                        isRead: false,
                        createdAt: new Date(Date.now() - 15 * 60 * 1000),
                    },
                    {
                        userId,
                        title: 'ประกาศใหม่จาก HR',
                        message: 'การปรับปรุงเกณฑ์และแบบฟอร์มการสวัสดิการพนักงานใหม่ประจำปี',
                        type: 'SYSTEM',
                        redirectUrl: '/dashboard/hr/dashboard',
                        isRead: false,
                        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
                    },
                ];
            }
            else {
                sampleNotifications = [
                    {
                        userId,
                        title: 'คำขอลาได้รับการอนุมัติจาก Manager',
                        message: 'คำขอลาพักร้อนประจำปีของคุณได้รับการอนุมัติจากผู้จัดการแผนกเรียบร้อยแล้ว',
                        type: 'APPROVE',
                        redirectUrl: '/dashboard/user/history',
                        isRead: false,
                        createdAt: new Date(Date.now() - 12 * 60 * 1000),
                    },
                    {
                        userId,
                        title: 'ประกาศใหม่จาก HR',
                        message: 'ประกาศวันหยุดชดเชยเทศกาลและแนวทางการยื่นคำขอลาพักผ่อนประจำปี',
                        type: 'SYSTEM',
                        redirectUrl: '/dashboard/user/calendar',
                        isRead: false,
                        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    },
                ];
            }
            for (const item of sampleNotifications) {
                await this.prisma.notification.create({ data: item });
            }
            list = await this.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });
        }
        return list;
    }
    async createNotification(data) {
        return this.prisma.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type || 'SYSTEM',
                redirectUrl: data.redirectUrl || null,
            }
        });
    }
    async markAsRead(id, userId) {
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
};
exports.NotificationService = NotificationService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_9AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotificationService.prototype, "handleCron", null);
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map