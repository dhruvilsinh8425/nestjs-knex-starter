import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { StatusType } from 'src/common/enums';
import { AuthType } from '../enums';

export class JWTPayload {
    id?: number;
    sessionToken: string;
    isLoginVerifyOnly?: boolean;
    isGuest?: boolean;
    iat: number;
    exp?: number;
    iss?: string;
}

export class SessionUserInfo {
    @ApiProperty()
    id: number;

    @ApiProperty({ enum: AuthType })
    authType: AuthType;

    @ApiProperty({ required: false })
    firstName?: string;

    @ApiProperty({ required: false })
    lastName?: string;

    @ApiProperty({ required: false })
    email?: string;

    @ApiProperty({ required: false })
    countryCode?: string;

    @ApiProperty({ required: false, description: 'International format, e.g. +11234567890' })
    phone?: string;

    @ApiProperty({ required: false, nullable: true })
    avatar?: string | null;

    @ApiHideProperty()
    sessionToken?: string;

    @ApiProperty()
    isEmailVerified: boolean;

    @ApiProperty()
    isPhoneVerified: boolean;

    @ApiHideProperty()
    isLoginVerifyOnly?: boolean;

    @ApiHideProperty()
    isGuest?: false;

    @ApiHideProperty()
    status: StatusType;
}

export class GuestSessionInfo {
    isGuest: true;
    sessionToken: string;
}
