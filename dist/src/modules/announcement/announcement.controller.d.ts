import { AnnouncementService } from './announcement.service';
export declare class AnnouncementController {
    private readonly announcementService;
    constructor(announcementService: AnnouncementService);
    getAnnouncements(limit?: string): Promise<{
        success: boolean;
        data: any;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        data?: undefined;
    }>;
    createAnnouncement(body: {
        title: string;
        subtitle: string;
        isImportant: boolean;
    }): Promise<{
        success: boolean;
        data: any;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        data?: undefined;
    }>;
    updateAnnouncement(id: string, body: {
        title?: string;
        subtitle?: string;
        isImportant?: boolean;
    }): Promise<{
        success: boolean;
        data: any;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        data?: undefined;
    }>;
    deleteAnnouncement(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
