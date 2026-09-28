import { IsNotEmpty, IsString } from 'class-validator';

export class SendOtpRequest {
    @IsString()
    @IsNotEmpty()
    mobileNumber: string;
}

export class VerifyOtpRequest {
    @IsString()
    @IsNotEmpty()
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
