import { AuthService } from './auth.service';
import { LoginDto, ForgotPasswordDto, ResetPasswordDto, UpdateProfileDto, VerifyCaptchaDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    updateProfile(user: any, updateDto: UpdateProfileDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getCaptcha(theme?: string): Promise<{
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
    logout(user: any): Promise<{
        message: string;
    }>;
    refreshTokens(user: any): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto, origin: string, referer: string): Promise<{
        message: string;
        token: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
