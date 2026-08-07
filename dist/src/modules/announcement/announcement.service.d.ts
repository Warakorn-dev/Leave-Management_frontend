import { PrismaService } from '../../prisma/prisma.service';
export declare class AnnouncementService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(limit?: number): Promise<any>;
    create(data: {
        title: string;
        subtitle: string;
        isImportant: boolean;
    }): Promise<any>;
    update(id: string, data: {
        title?: string;
        subtitle?: string;
        isImportant?: boolean;
    }): Promise<any>;
    delete(id: string): Promise<any>;
}
