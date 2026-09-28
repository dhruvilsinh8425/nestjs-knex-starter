import { IsOptional, IsString, MaxLength } from 'class-validator';
import { DeviceType } from 'src/api/auth/enums';
import { commonConstants } from 'src/common/constants';
import { UserIdRequest } from 'src/common/dto';

export class CreateGuestSessionRequest {
    deviceId?: string;
    fcmToken?: string;
    deviceType?: DeviceType;
}

export class CreateUserSessionRequest extends CreateGuestSessionRequest {
    isLoginVerifyOnly?: boolean;
}

export class AuthSessionUserRequest extends UserIdRequest {
    @IsOptional()
    @IsString()
    @MaxLength(commonConstants.maxTokenLength)
    sessionToken?: string;
}
