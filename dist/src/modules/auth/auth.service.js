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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const notification_service_1 = require("../notification/notification.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    notificationService;
    constructor(prisma, jwtService, configService, notificationService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.notificationService = notificationService;
    }
    async generateCaptcha(theme) {
        const isLight = theme === 'gray' || theme === 'light';
        const textColor = isLight ? '#ffffffff' : '#000000ff';
        const bgFill = isLight ? '#000000' : '#ffffff';
        const noiseColor = isLight ? '#444444' : '#cccccc';
        const svgCaptcha = require('svg-captcha');
        const captcha = svgCaptcha.create({
            size: 5,
            noise: 1,
            width: 150,
            height: 50,
        });
        let svgData = captcha.data.replace(/<path\b([^>]*)>/g, (match, attrs) => {
            const dMatch = attrs.match(/d=['"]([^'"]+)['"]/);
            const d = dMatch ? dMatch[1] : '';
            if (attrs.includes('fill="none"') || attrs.includes("fill='none'")) {
                return `<path d="${d}" fill="none" stroke="${noiseColor}" stroke-width="1"/>`;
            }
            return `<path d="${d}" fill="${textColor}" stroke="${textColor}" stroke-width="1.5" stroke-linejoin="round"/>`;
        });
        svgData = svgData.replace('>', `><rect width="100%" height="100%" fill="${bgFill}"/>`);
        const expiredAt = new Date();
        expiredAt.setMinutes(expiredAt.getMinutes() + 10);
        const newCaptcha = await this.prisma.captcha.create({
            data: {
                captchaCode: captcha.text,
                isUsed: false,
                expiredAt: expiredAt,
            }
        });
        return {
            captcha_id: newCaptcha.id,
            captcha_image: `data:image/svg+xml;base64,${Buffer.from(svgData).toString('base64')}`,
        };
    }
    async verifyCaptcha(verifyDto) {
        const { captchaId, captchaCode } = verifyDto;
        const captchaRecord = await this.prisma.captcha.findUnique({
            where: { id: captchaId }
        });
        if (!captchaRecord) {
            throw new common_1.BadRequestException('รหัส CAPTCHA ไม่ถูกต้องหรือไม่มีอยู่ในระบบ');
        }
        if (!captchaRecord.isUsed) {
            await this.prisma.captcha.update({
                where: { id: captchaId },
                data: { isUsed: true }
            });
        }
        if (captchaRecord.isUsed) {
            throw new common_1.BadRequestException('รหัส CAPTCHA ถูกใช้งานไปแล้ว กรุณาขอใหม่');
        }
        if (new Date() > captchaRecord.expiredAt) {
            throw new common_1.BadRequestException('รหัส CAPTCHA หมดอายุ กรุณาขอใหม่');
        }
        if (captchaRecord.captchaCode.toLowerCase() !== captchaCode.toLowerCase()) {
            throw new common_1.BadRequestException('รหัส CAPTCHA ไม่ถูกต้อง');
        }
        return { success: true };
    }
    async login(loginDto) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { username: loginDto.username },
                    { email: loginDto.username }
                ]
            },
            include: {
                role: true,
                employee: {
                    include: {
                        department: true,
                        position: true
                    }
                }
            },
        });
        if (!loginDto.captchaId || !loginDto.captchaInput) {
            throw new common_1.BadRequestException('กรุณากรอกรหัส CAPTCHA');
        }
        await this.verifyCaptcha({ captchaId: loginDto.captchaId, captchaCode: loginDto.captchaInput });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.isActive === false) {
            throw new common_1.UnauthorizedException('user ของคุณโดนระงับการใช้งานไปแล้ว');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.getTokens(user.id, user.email, user.role.name);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role.name,
                profilePic: user.avatarUrl,
                firstName: user.employee?.firstName,
                lastName: user.employee?.lastName,
                employeeCode: user.employee?.employeeCode || null,
                departmentName: user.employee?.department?.name,
                positionName: user.employee?.position?.name,
            },
            ...tokens,
        };
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
        return { message: 'Logged out successfully' };
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user || !user.refreshToken) {
            throw new common_1.UnauthorizedException('Access Denied');
        }
        if (user.isActive === false) {
            throw new common_1.UnauthorizedException('ACCOUNT_SUSPENDED');
        }
        const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!refreshTokenMatches) {
            throw new common_1.UnauthorizedException('Access Denied');
        }
        const tokens = await this.getTokens(user.id, user.email, user.role.name);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }
    async forgotPassword(username, baseUrl) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: username },
                    { username: username }
                ]
            }
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const resetToken = this.jwtService.sign({ sub: user.id }, { secret: this.configService.get('jwt.secret'), expiresIn: '15m' });
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
        await this.notificationService.sendEmail(user.email, 'Reset Your Password - Leave Management System', `Please click the following link to reset your password: ${resetUrl}`, `<p>Hello ${user.username},</p><p>Please click the link below to reset your password:</p><p><a href="${resetUrl}">Reset Password</a></p><p>If you didn't request this, you can ignore this email.</p>`);
        return { message: 'Password reset link sent to email', token: resetToken };
    }
    async resetPassword(resetDto) {
        try {
            const payload = this.jwtService.verify(resetDto.token, {
                secret: this.configService.get('jwt.secret'),
            });
            const hashedPassword = await bcrypt.hash(resetDto.newPassword, 10);
            await this.prisma.user.update({
                where: { id: payload.sub },
                data: { passwordHash: hashedPassword, refreshToken: null },
            });
            return { message: 'Password reset successfully' };
        }
        catch (e) {
            throw new common_1.BadRequestException('Invalid or expired token');
        }
    }
    async updateProfile(userId, updateDto) {
        if (updateDto.password) {
            const passwordHash = await bcrypt.hash(updateDto.password, 10);
            await this.prisma.user.update({
                where: { id: userId },
                data: { passwordHash },
            });
        }
        if (updateDto.firstName || updateDto.lastName || updateDto.phone) {
            const employee = await this.prisma.employee.findUnique({
                where: { userId }
            });
            if (employee) {
                await this.prisma.employee.update({
                    where: { id: employee.id },
                    data: {
                        ...(updateDto.firstName && { firstName: updateDto.firstName }),
                        ...(updateDto.lastName && { lastName: updateDto.lastName }),
                        ...(updateDto.phone && { phone: updateDto.phone })
                    }
                });
            }
        }
        return { success: true, message: 'Profile updated successfully' };
    }
    async getTokens(userId, email, role) {
        const jwtPayload = { sub: userId, email, role };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(jwtPayload, {
                secret: this.configService.get('jwt.secret') || 'defaultSecret',
                expiresIn: (this.configService.get('jwt.expiration') || '15m'),
            }),
            this.jwtService.signAsync(jwtPayload, {
                secret: this.configService.get('jwt.refreshSecret') || 'defaultRefresh',
                expiresIn: (this.configService.get('jwt.refreshExpiration') || '7d'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
    async updateRefreshToken(userId, refreshToken) {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: hashedRefreshToken },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        notification_service_1.NotificationService])
], AuthService);
//# sourceMappingURL=auth.service.js.map