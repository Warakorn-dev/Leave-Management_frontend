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
exports.ManagerController = void 0;
const common_1 = require("@nestjs/common");
const manager_service_1 = require("./manager.service");
const manager_dto_1 = require("./dto/manager.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let ManagerController = class ManagerController {
    managerService;
    constructor(managerService) {
        this.managerService = managerService;
    }
    getDashboardStats(user, year) {
        return this.managerService.getDashboardStats(user.id, year ? parseInt(year) : undefined);
    }
    getPendingRequests(user) {
        return this.managerService.getPendingRequests(user.id);
    }
    getDepartmentHistory(user) {
        return this.managerService.getDepartmentHistory(user.id);
    }
    approveRequest(user, id, dto) {
        return this.managerService.processRequest(user.id, id, 'Approve', dto);
    }
    rejectRequest(user, id, dto) {
        return this.managerService.processRequest(user.id, id, 'Reject', dto);
    }
};
exports.ManagerController = ManagerController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get manager dashboard statistics' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ManagerController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending leave requests for the department' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ManagerController.prototype, "getPendingRequests", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get leave history for the department' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ManagerController.prototype, "getDepartmentHistory", null);
__decorate([
    (0, common_1.Put)('approve/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a leave request' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, manager_dto_1.ProcessLeaveRequestDto]),
    __metadata("design:returntype", void 0)
], ManagerController.prototype, "approveRequest", null);
__decorate([
    (0, common_1.Put)('reject/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a leave request' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, manager_dto_1.ProcessLeaveRequestDto]),
    __metadata("design:returntype", void 0)
], ManagerController.prototype, "rejectRequest", null);
exports.ManagerController = ManagerController = __decorate([
    (0, swagger_1.ApiTags)('Manager Leave Processing Module'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Manager', 'CEO'),
    (0, common_1.Controller)('manager'),
    __metadata("design:paramtypes", [manager_service_1.ManagerService])
], ManagerController);
//# sourceMappingURL=manager.controller.js.map