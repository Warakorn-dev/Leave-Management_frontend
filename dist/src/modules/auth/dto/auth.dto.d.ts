export declare class LoginDto {
    username: string;
    password: string;
    captchaInput?: string;
    captchaId?: string;
}
export declare class VerifyCaptchaDto {
    captchaId: string;
    captchaCode: string;
}
export declare class ForgotPasswordDto {
    username: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
export declare class UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    password?: string;
}
