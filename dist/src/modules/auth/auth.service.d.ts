import { JwtService } from '@nestjs/jwt';
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigService } from '@nestjs/config';
import { LoginDto, ResetPasswordDto, UpdateProfileDto, VerifyCaptchaDto } from './dto/auth.dto';
import { NotificationService } from '../notification/notification.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private notificationService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, notificationService: NotificationService);
    generateCaptcha(theme?: string): Promise<{
        captcha_id: string;
        captcha_image: string;
    }>;
    verifyCaptcha(verifyDto: VerifyCaptchaDto): Promise<{
        success: boolean;
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            role: string;
            profilePic: string | null;
            firstName: string | undefined;
            lastName: string | undefined;
            employeeCode: string | null;
            departmentName: string | undefined;
            positionName: string | undefined;
        };
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    refreshTokens(userId: string, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    forgotPassword(username: string, baseUrl: string): Promise<{
        message: string;
        token: string;
    }>;
    resetPassword(resetDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    updateProfile(userId: string, updateDto: UpdateProfileDto): Promise<{
        success: boolean;
        message: string;
    }>;
    private getTokens;
    private updateRefreshToken;
}
