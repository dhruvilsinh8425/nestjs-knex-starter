import { ApiProperty } from '@nestjs/swagger';
import { StatusType } from 'src/common/enums';
import { AuthType } from '../enums';
import { SessionUserInfo } from './auth.entity';

export class OtpSentResponse {
    @ApiProperty()
    isSent: boolean;

    @ApiProperty({ description: 'Seconds to wait before a new code can be requested' })
    timeout: number;
}

export class AuthSessionUserResponse {
    @ApiProperty({ type: () => SessionUserInfo })
    sessionUser: SessionUserInfo;
}

export class AuthSuccessResponse extends AuthSessionUserResponse {
    @ApiProperty()
    accessToken: string;

    @ApiProperty({ required: false, description: 'Only returned for a fully verified login' })
    refreshToken?: string;

    @ApiProperty({
        required: false,
        type: () => OtpSentResponse,
        description: 'Set when a verification code was sent (create-account, login-with-phone)',
    })
    otp?: OtpSentResponse;
}

export class AuthUserResponse {
    @ApiProperty()
    id: number;

    @ApiProperty({ required: false, nullable: true })
    fullName?: string | null;

    @ApiProperty({ required: false, nullable: true })
    email?: string | null;

    @ApiProperty({ required: false, nullable: true })
    mobileNumber?: string | null;

    @ApiProperty({ required: false, nullable: true })
    avatar?: string | null;

    @ApiProperty({ required: false, nullable: true })
    createdAt?: string | null;

    @ApiProperty({ required: false, nullable: true })
    updatedAt?: string | null;
}

export class SendOtpResponse extends OtpSentResponse {
    @ApiProperty()
    message: string;
}

export class RefreshTokenResponse {
    @ApiProperty()
    accessToken: string;

    @ApiProperty()
    refreshToken: string;
}

export class VerifyOtpResponse extends AuthSuccessResponse {
    @ApiProperty()
    message: string;

    @ApiProperty({ type: () => AuthUserResponse })
    user: AuthUserResponse;
}

export class LogoutResponse {
    @ApiProperty()
    message: string;
}

export class CheckUserExistsResponse {
    @ApiProperty()
    exists: boolean;

    @ApiProperty({ required: false, enum: StatusType })
    status?: StatusType;

    @ApiProperty({ required: false, enum: AuthType })
    authType?: AuthType;
}

export class GuestSignInResponse {
    @ApiProperty()
    accessToken: string;
}

export class ResetPasswordTokenResponse {
    @ApiProperty()
    recoveryToken: string;
}

export class SessionTokenResponse {
    @ApiProperty({ description: 'One-time token to use with /auth/login-with-token' })
    token: string;
}
