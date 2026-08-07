import { PrismaService } from "../../prisma/prisma.service";
export declare class UploadController {
    private prisma;
    constructor(prisma: PrismaService);
    uploadFile(file: Express.Multer.File, leaveRequestId: string): Promise<{
        message: string;
        attachment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            leaveRequestId: string;
            filePath: string;
            fileType: string;
        };
    }>;
    uploadAvatar(file: Express.Multer.File, user: any): Promise<{
        message: string;
        avatarUrl: string;
    }>;
}
