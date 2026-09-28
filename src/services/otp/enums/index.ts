export enum OtpType {
    VerifyPhone = 'VERIFY_PHONE',
    VerifyEmail = 'VERIFY_EMAIL',
    ResetPasswordEmail = 'RESET_PASSWORD_EMAIL',
    ResetPasswordPhone = 'RESET_PASSWORD_PHONE',
}

export const emailOtpTypes: OtpType[] = [OtpType.VerifyEmail, OtpType.ResetPasswordEmail];
