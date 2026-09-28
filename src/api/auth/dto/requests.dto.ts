import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsAppEmail, IsPassword, TransformStringTrimLowerCase } from 'src/common/decorators';
import { commonConstants } from 'src/common/constants';
import { DeviceType } from '../enums';

export class DeviceInfoRequest {
    @IsString()
    @IsOptional()
    @MaxLength(commonConstants.maxTokenLength)
    fcmToken?: string;

    @IsEnum(DeviceType)
    @IsOptional()
    deviceType?: DeviceType;
}

export class SendOtpRequest {
    /** International format, e.g. +11234567890 */
    @IsString()
    @IsNotEmpty()
    @MaxLength(commonConstants.maxPhoneLength + 4)
    mobileNumber: string;
}

export class VerifyOtpRequest extends DeviceInfoRequest {
    /** International format, e.g. +11234567890 */
    @IsString()
    @IsNotEmpty()
    @MaxLength(commonConstants.maxPhoneLength + 4)
    mobileNumber: string;

    @IsString()
    @IsNotEmpty()
    otp: string;
}

export class RefreshTokenRequest {
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

export class LogoutRequest extends RefreshTokenRequest {}

export class CheckUserExistsRequest {
    @TransformStringTrimLowerCase()
    @IsAppEmail()
    @IsOptional()
    email?: string;

    /** e.g. +1 */
    @IsString()
    @IsOptional()
    countryCode?: string;

    @IsString()
    @IsOptional()
    phone?: string;
}

export class CreateAccountRequest extends DeviceInfoRequest {
    @IsString()
    @IsNotEmpty()
    @MaxLength(commonConstants.maxNameLength)
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(commonConstants.maxNameLength)
    lastName: string;

    @TransformStringTrimLowerCase()
    @IsAppEmail()
    email: string;

    @IsPassword()
    password: string;
}

export class AuthSignInRequest extends DeviceInfoRequest {
    @TransformStringTrimLowerCase()
    @IsAppEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class GuestSignInRequest extends DeviceInfoRequest {}

export class LoginWithPhoneRequest {
    /** e.g. +1 */
    @IsString()
    @IsNotEmpty()
    countryCode: string;

    @IsString()
    @IsNotEmpty()
    phone: string;
}

export class VerifyLoginOtpRequest extends DeviceInfoRequest {
    @IsString()
    @IsOptional()
    countryCode?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @TransformStringTrimLowerCase()
    @IsAppEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsNotEmpty()
    code: string;
}

export class ResendVerifyOTPRequest {
    @IsString()
    @IsOptional()
    countryCode?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @TransformStringTrimLowerCase()
    @IsAppEmail()
    @IsOptional()
    email?: string;
}

export class GoogleSignInRequest extends DeviceInfoRequest {
    /** Google ID token from the client SDK */
    @IsString()
    @IsNotEmpty()
    idToken: string;
}

export class AppleSignInRequest extends DeviceInfoRequest {
    @IsString()
    @IsNotEmpty()
    identityToken: string;

    @IsString()
    @IsNotEmpty()
    appleUserId: string;

    /** Apple only sends the name on the first sign in */
    @IsString()
    @IsOptional()
    @MaxLength(commonConstants.maxNameLength)
    firstName?: string;

    @IsString()
    @IsOptional()
    @MaxLength(commonConstants.maxNameLength)
    lastName?: string;
}

export class ResetPasswordRequest {
    @TransformStringTrimLowerCase()
    @IsAppEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    countryCode?: string;

    @IsString()
    @IsOptional()
    phone?: string;
}

export class VerifyResetPasswordOTPRequest extends ResetPasswordRequest {
    @IsString()
    @IsNotEmpty()
    code: string;
}

export class RecoverPasswordRequest {
    @IsString()
    @IsNotEmpty()
    @MaxLength(1024)
    recoveryToken: string;

    @IsPassword()
    newPassword: string;
}

export class LoginWithTokenRequest extends DeviceInfoRequest {
    @IsString()
    @IsNotEmpty()
    token: string;
}
