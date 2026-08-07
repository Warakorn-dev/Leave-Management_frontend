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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const ExcelJS = __importStar(require("exceljs"));
const PDFDocument = __importStar(require("pdfkit"));
let ExportService = class ExportService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async exportToExcel(res) {
        const leaves = await this.prisma.leaveRequest.findMany({
            include: { employee: true, leaveType: true },
        });
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Leave Requests');
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 36 },
            { header: 'Employee Name', key: 'employeeName', width: 30 },
            { header: 'Leave Type', key: 'leaveType', width: 20 },
            { header: 'Start Date', key: 'startDate', width: 15 },
            { header: 'End Date', key: 'endDate', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
        ];
        leaves.forEach(leave => {
            worksheet.addRow({
                id: leave.id,
                employeeName: `${leave.employee.firstName} ${leave.employee.lastName}`,
                leaveType: leave.leaveType.name,
                startDate: leave.startDate.toISOString().split('T')[0],
                endDate: leave.endDate.toISOString().split('T')[0],
                status: leave.status,
            });
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=leave_report.xlsx');
        return workbook.xlsx.write(res).then(() => {
            res.status(200).end();
        });
    }
    async exportToPDF(res) {
        const leaves = await this.prisma.leaveRequest.findMany({
            include: { employee: true, leaveType: true },
        });
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=leave_report.pdf');
        doc.pipe(res);
        doc.fontSize(20).text('Leave Management Report', { align: 'center' });
        doc.moveDown();
        leaves.forEach((leave, i) => {
            doc.fontSize(12).text(`${i + 1}. ${leave.employee.firstName} ${leave.employee.lastName} - ${leave.leaveType.name}`);
            doc.text(`   Dates: ${leave.startDate.toISOString().split('T')[0]} to ${leave.endDate.toISOString().split('T')[0]}`);
            doc.text(`   Status: ${leave.status}`);
            doc.moveDown();
        });
        doc.end();
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExportService);
//# sourceMappingURL=export.service.js.map