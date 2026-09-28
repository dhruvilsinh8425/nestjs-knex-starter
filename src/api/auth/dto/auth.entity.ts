import { ApiHideProperty } from '@nestjs/swagger';
import { StatusType, UserType } from 'src/common/enums';
import { AuthType } from '../enums';

export class JWTPayload {
    id: number;
    sessionToken: string;
    iat: number;
    exp?: number;
    iss?: string;
}

export class SessionUserInfo {
    id: number;
    authType: AuthType;
    userType: UserType;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    avatar?: string | null;
    sessionToken?: string;
    isPhoneVerified: boolean;
    @ApiHideProperty()
    status: StatusType;
}
