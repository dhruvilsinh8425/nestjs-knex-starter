import { OtpType } from '../enums';

export class ChannelOtpTypeRequest {
    channel: string;
    otpType: OtpType;
}

export class ChannelOtpTypeForcedRequest extends ChannelOtpTypeRequest {
    force?: boolean;
}

export class ChannelCodeWithOtpTypeRequest extends ChannelOtpTypeRequest {
    code: string;
}

export class OtpTypeRequest {
    otpType: OtpType;
    isNewOtp?: boolean;
}

export class OtpTarget {
    email?: string | null;
    phone?: string | null;
    fullName?: string;
}
