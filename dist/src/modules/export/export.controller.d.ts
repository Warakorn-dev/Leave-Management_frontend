import { ExportService } from './export.service';
import type { Response } from 'express';
export declare class ExportController {
    private readonly exportService;
    constructor(exportService: ExportService);
    exportExcel(res: Response): Promise<void>;
    exportPdf(res: Response): Promise<void>;
}
