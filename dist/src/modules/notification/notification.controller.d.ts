import { NotificationService } from './notification.service';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    getNotifications(user: any): Promise<{
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
    markAsRead(id: string, user: any): Promise<{
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
    markAllAsReadPost(user: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllAsReadPatch(user: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
