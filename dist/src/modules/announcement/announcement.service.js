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
exports.AnnouncementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AnnouncementService = class AnnouncementService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(limit) {
        const query = {
            orderBy: { createdAt: 'desc' },
        };
        if (limit) {
            query.take = limit;
        }
        return this.prisma.announcement.findMany(query);
    }
    async create(data) {
        const item = await this.prisma.announcement.create({
            data,
        });
        try {
            const allUsers = await this.prisma.user.findMany({ select: { id: true } });
            for (const u of allUsers) {
                await this.prisma.notification.create({
                    data: {
                        userId: u.id,
                        title: 'ประกาศใหม่จาก HR',
                        message: data.title + (data.subtitle ? `: ${data.subtitle}` : ''),
                        type: 'SYSTEM',
                        redirectUrl: '/dashboard/user/page',
                    }
                });
            }
        }
        catch (err) {
            console.error('Failed to notify users about HR announcement', err);
        }
        return item;
    }
    async update(id, data) {
        return this.prisma.announcement.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        return this.prisma.announcement.delete({
            where: { id },
        });
    }
};
exports.AnnouncementService = AnnouncementService;
exports.AnnouncementService = AnnouncementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnnouncementService);
//# sourceMappingURL=announcement.service.js.map