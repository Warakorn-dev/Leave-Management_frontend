import { PrismaService } from "../../prisma/prisma.service";
import { Response } from 'express';
export declare class ExportService {
    private prisma;
    constructor(prisma: PrismaService);
    exportToExcel(res: Response): Promise<void>;
    exportToPDF(res: Response): Promise<void>;
}
