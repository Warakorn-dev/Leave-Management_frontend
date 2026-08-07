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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CeoController = void 0;
const common_1 = require("@nestjs/common");
const ceo_service_1 = require("./ceo.service");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let CeoController = class CeoController {
    ceoService;
    constructor(ceoService) {
        this.ceoService = ceoService;
    }
    getDashboardStats(user, year) {
        return this.ceoService.getDashboardStats(user.id, year ? parseInt(year) : undefined);
    }
    getCompanyReport() {
        return this.ceoService.getCompanyReport();
    }
    getReportStats() {
        return this.ceoService.getReportStats();
    }
    getDepartmentReport(departmentId) {
        return this.ceoService.getDepartmentReport(departmentId);
    }
    approveSpecialLeave(user, id, comment) {
        return this.ceoService.approveSpecialLeave(user.id, id, 'Approve', comment);
    }
    rejectSpecialLeave(user, id, comment) {
        return this.ceoService.approveSpecialLeave(user.id, id, 'Reject', comment);
    }
    getEmployees() {
        return this.ceoService.findAllEmployees();
    }
};
exports.CeoController = CeoController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get CEO Dashboard statistics' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CeoController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('report/company'),
    (0, swagger_1.ApiOperation)({ summary: 'Get overall company leave report' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CeoController.prototype, "getCompanyReport", null);
__decorate([
    (0, common_1.Get)('report/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get report statistics for CEO' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CeoController.prototype, "getReportStats", null);
__decorate([
    (0, common_1.Get)('report/department'),
    (0, swagger_1.ApiOperation)({ summary: 'Get leave report by department' }),
    __param(0, (0, common_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CeoController.prototype, "getDepartmentReport", null);
__decorate([
    (0, common_1.Put)('approve/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'CEO approve special leave request' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('comment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], CeoController.prototype, "approveSpecialLeave", null);
__decorate([
    (0, common_1.Put)('reject/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'CEO reject special leave request' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('comment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], CeoController.prototype, "rejectSpecialLeave", null);
__decorate([
    (0, common_1.Get)('employees'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all employees for CEO' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CeoController.prototype, "getEmployees", null);
exports.CeoController = CeoController = __decorate([
    (0, swagger_1.ApiTags)('CEO Dashboard and Reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CEO'),
    (0, common_1.Controller)('ceo'),
    __metadata("design:paramtypes", [ceo_service_1.CeoService])
], CeoController);
//# sourceMappingURL=ceo.controller.js.map