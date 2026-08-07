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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const prisma_service_1 = require("../../prisma/prisma.service");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const fs = __importStar(require("fs"));
let UploadController = class UploadController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async uploadFile(file, leaveRequestId) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        if (!leaveRequestId) {
            throw new common_1.BadRequestException('leaveRequestId is required');
        }
        await this.prisma.leaveAttachment.deleteMany({
            where: {
                leaveRequestId,
            },
        });
        let base64Data = '';
        if (file.buffer) {
            base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        }
        else if (file.path && fs.existsSync(file.path)) {
            const fileBuffer = fs.readFileSync(file.path);
            base64Data = `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
            try {
                fs.unlinkSync(file.path);
            }
            catch (e) { }
        }
        const attachment = await this.prisma.leaveAttachment.create({
            data: {
                leaveRequestId,
                filePath: base64Data || `/${file.path.replace(/\\/g, '/')}`,
                fileType: file.mimetype,
            }
        });
        return {
            message: 'File uploaded and saved to database successfully',
            attachment
        };
    }
    async uploadAvatar(file, user) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        let avatarUrl = '';
        if (file.buffer) {
            avatarUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        }
        else if (file.path && fs.existsSync(file.path)) {
            const fileBuffer = fs.readFileSync(file.path);
            avatarUrl = `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
            try {
                fs.unlinkSync(file.path);
            }
            catch (e) { }
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl: avatarUrl || `/${file.path.replace(/\\/g, '/')}` },
        });
        return {
            message: 'Avatar uploaded and saved to database successfully',
            avatarUrl
        };
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Upload file for leave request attachment' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                leaveRequestId: {
                    type: 'string',
                }
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('leaveRequestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Post)('avatar'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload user avatar' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadAvatar", null);
exports.UploadController = UploadController = __decorate([
    (0, swagger_1.ApiTags)('Upload Module'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map