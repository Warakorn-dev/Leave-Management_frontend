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
exports.HrController = void 0;
const common_1 = require("@nestjs/common");
const hr_service_1 = require("./hr.service");
const hr_dto_1 = require("./dto/hr.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let HrController = class HrController {
    hrService;
    constructor(hrService) {
        this.hrService = hrService;
    }
    getDashboardStats(req, year) {
        return this.hrService.getDashboardStats(req.user.id, year ? parseInt(year) : undefined);
    }
    getLeaveSummary(searchQuery, startDate, endDate, leaveTypeId, status) {
        return this.hrService.getLeaveSummary({ searchQuery, startDate, endDate, leaveTypeId, status });
    }
    createDepartment(dto) {
        return this.hrService.createDepartment(dto);
    }
    findAllDepartments() {
        return this.hrService.findAllDepartments();
    }
    updateDepartment(id, dto) {
        return this.hrService.updateDepartment(id, dto);
    }
    deleteDepartment(id) {
        return this.hrService.deleteDepartment(id);
    }
    createPosition(dto) {
        return this.hrService.createPosition(dto);
    }
    findAllPositions() {
        return this.hrService.findAllPositions();
    }
    updatePosition(id, dto) {
        return this.hrService.updatePosition(id, dto);
    }
    deletePosition(id) {
        return this.hrService.deletePosition(id);
    }
    createLeaveType(dto) {
        return this.hrService.createLeaveType(dto);
    }
    findAllLeaveTypes() {
        return this.hrService.findAllLeaveTypes();
    }
    updateLeaveType(id, dto) {
        return this.hrService.updateLeaveType(id, dto);
    }
    deleteLeaveType(id) {
        return this.hrService.deleteLeaveType(id);
    }
    createEmployee(dto) {
        return this.hrService.createEmployee(dto);
    }
    findAllEmployees() {
        return this.hrService.findAllEmployees();
    }
    findEmployeeById(id) {
        return this.hrService.findEmployeeById(id);
    }
    updateEmployee(id, dto) {
        return this.hrService.updateEmployee(id, dto);
    }
    updateEmployeeStatus(id, isActive) {
        return this.hrService.updateEmployeeStatus(id, isActive);
    }
    deleteEmployee(id) {
        return this.hrService.deleteEmployee(id);
    }
    initializeLeaveBalances(id) {
        return this.hrService.initializeLeaveBalances(id);
    }
    resetLeaveBalances(id) {
        return this.hrService.resetLeaveBalances(id);
    }
    findAllLeaves() {
        return this.hrService.findAllLeaves();
    }
    createHoliday(dto) {
        return this.hrService.createHoliday(dto);
    }
    findAllHolidays() {
        return this.hrService.findAllHolidays();
    }
    updateHoliday(id, dto) {
        return this.hrService.updateHoliday(id, dto);
    }
    deleteHoliday(id) {
        return this.hrService.deleteHoliday(id);
    }
    updateLeaveBalance(id, dto) {
        return this.hrService.updateLeaveBalance(id, dto);
    }
};
exports.HrController = HrController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get HR dashboard statistics' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('leave-summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get leave summary of all employees' }),
    __param(0, (0, common_1.Query)('searchQuery')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('leaveTypeId')),
    __param(4, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "getLeaveSummary", null);
__decorate([
    (0, common_1.Post)('departments'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new department' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.CreateDepartmentDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "createDepartment", null);
__decorate([
    (0, common_1.Get)('departments'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all departments' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HrController.prototype, "findAllDepartments", null);
__decorate([
    (0, common_1.Put)('departments/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a department' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, hr_dto_1.UpdateDepartmentDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "updateDepartment", null);
__decorate([
    (0, common_1.Delete)('departments/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a department' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "deleteDepartment", null);
__decorate([
    (0, common_1.Post)('positions'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new position' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.CreatePositionDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "createPosition", null);
__decorate([
    (0, common_1.Get)('positions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all positions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HrController.prototype, "findAllPositions", null);
__decorate([
    (0, common_1.Put)('positions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a position' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, hr_dto_1.UpdatePositionDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "updatePosition", null);
__decorate([
    (0, common_1.Delete)('positions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a position' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "deletePosition", null);
__decorate([
    (0, common_1.Post)('leave-types'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new leave type' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.CreateLeaveTypeDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "createLeaveType", null);
__decorate([
    (0, common_1.Get)('leave-types'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all leave types' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HrController.prototype, "findAllLeaveTypes", null);
__decorate([
    (0, common_1.Patch)('leave-types/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a leave type' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, hr_dto_1.UpdateLeaveTypeDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "updateLeaveType", null);
__decorate([
    (0, common_1.Delete)('leave-types/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a leave type' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "deleteLeaveType", null);
__decorate([
    (0, common_1.Post)('employees'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new employee and user' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.CreateEmployeeDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "createEmployee", null);
__decorate([
    (0, common_1.Get)('employees'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all employees' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HrController.prototype, "findAllEmployees", null);
__decorate([
    (0, common_1.Get)('employees/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get employee by id' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "findEmployeeById", null);
__decorate([
    (0, common_1.Patch)('employees/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an employee' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, hr_dto_1.UpdateEmployeeDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "updateEmployee", null);
__decorate([
    (0, common_1.Patch)('employees/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update employee status (active/inactive)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "updateEmployeeStatus", null);
__decorate([
    (0, common_1.Delete)('employees/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an employee (and their user account)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "deleteEmployee", null);
__decorate([
    (0, common_1.Post)('employees/:id/initialize-leave-balances'),
    (0, swagger_1.ApiOperation)({ summary: 'Initialize leave balances for an employee for the current year' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "initializeLeaveBalances", null);
__decorate([
    (0, common_1.Post)('employees/:id/reset-leave-balances'),
    (0, swagger_1.ApiOperation)({ summary: 'Reset leave balances for an employee (set usedDays to 0)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "resetLeaveBalances", null);
__decorate([
    (0, common_1.Get)('leaves'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all leave requests across the company' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HrController.prototype, "findAllLeaves", null);
__decorate([
    (0, common_1.Post)('holidays'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new public holiday' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.CreatePublicHolidayDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "createHoliday", null);
__decorate([
    (0, common_1.Get)('holidays'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all public holidays' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HrController.prototype, "findAllHolidays", null);
__decorate([
    (0, common_1.Put)('holidays/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a public holiday' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, hr_dto_1.UpdatePublicHolidayDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "updateHoliday", null);
__decorate([
    (0, common_1.Delete)('holidays/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a public holiday' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "deleteHoliday", null);
__decorate([
    (0, common_1.Put)('leave-balances/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Manually adjust an employee leave balance' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, hr_dto_1.UpdateLeaveBalanceDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "updateLeaveBalance", null);
exports.HrController = HrController = __decorate([
    (0, swagger_1.ApiTags)('HR Module'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HR', 'CEO'),
    (0, common_1.Controller)('hr'),
    __metadata("design:paramtypes", [hr_service_1.HrService])
], HrController);
//# sourceMappingURL=hr.controller.js.map