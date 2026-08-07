import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class NotificationService {
    private configService;
    private prisma;
    private transporter;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService);
    sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean>;
    handleCron(): void;
    getNotifications(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        type: string | null;
        message: string;
        isRead: boolean;
        redirectUrl: string | null;
    }[]>;
    createNotification(data: {
        userId: string;
        title: string;
        message: string;
        type?: string;
        redirectUrl?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        type: string | null;
        message: string;
        isRead: boolean;
        redirectUrl: string | null;
    }>;
    markAsRead(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        type: string | null;
        message: string;
        isRead: boolean;
        redirectUrl: string | null;
    }>;
    markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
