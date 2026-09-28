import { fn } from 'objection';
import { Injectable, Logger } from '@nestjs/common';
import { SessionUserInfo } from 'src/api/auth/dto';
import { StatusType } from 'src/common/enums';
import { Otp } from 'src/models';
import { SMSService } from '../sms/sms.service';
import { SMSType } from '../sms';
import { otpConstants } from './constants';
import {
    ChannelCodeWithOtpTypeRequest,
    ChannelOtpTypeForcedRequest,
    ChannelOtpTypeRequest,
    OtpCodeResponse,
    OtpTypeRequest,
} from './dto';
import { OtpType } from './enums';

@Injectable()
export class OtpService {
    private readonly logger = new Logger(OtpService.name);

    constructor(private readonly smsService: SMSService) {}

    private normalizeChannel(phone?: string): string | null {
        const normalizedPhone = phone?.trim();
        return normalizedPhone || null;
    }

    private static generateOtpCode(): string {
        let result = '';

        for (let i = 0; i < otpConstants.codeLength; i++) {
            result += otpConstants.codeCharacters.charAt(Math.floor(Math.random() * otpConstants.codeCharacters.length));
        }

        return result;
    }

    private async getCurrentOtpCode({ channel, otpType }: ChannelOtpTypeRequest): Promise<Otp | undefined> {
        if (!channel) {
            return;
        }

        await this.disableOtpCode({ channel, otpType });

        return Otp.query()
            .findOne({ channel, otp_type: otpType, status: StatusType.Active })
            .where('expired_at', '>=', fn.now());
    }

    async disableOtpCode({ channel, otpType, force = false }: ChannelOtpTypeForcedRequest): Promise<void> {
        if (!channel) {
            return;
        }

        await Otp.query()
            .patch({ status: StatusType.Disabled })
            .where({ channel, otp_type: otpType, status: StatusType.Active })
            .where((builder: any) => {
                if (!force) {
                    builder.where('expired_at', '<=', fn.now());
                }
            });
    }

    async isOtpCodeValid({ channel, code, otpType }: ChannelCodeWithOtpTypeRequest): Promise<boolean> {
        if (!channel || !code) {
            return false;
        }

        return !!(await Otp.query()
            .findOne({ channel, code, otp_type: otpType, status: StatusType.Active })
            .where('expired_at', '>=', fn.now()));
    }

    async requestOTPCode(user: SessionUserInfo, { otpType, isNewOtp }: OtpTypeRequest): Promise<OtpCodeResponse> {
        const channel = this.normalizeChannel(user.phone);

        if (!channel || otpType !== OtpType.VerifyPhone) {
            return { isSent: false, timeout: 0 };
        }

        if (isNewOtp) {
            await this.disableOtpCode({ channel, otpType, force: true });
        }

        let otpCode = await this.getCurrentOtpCode({ channel, otpType });
        if (!otpCode) {
            otpCode = await Otp.query().insert({
                channel,
                code: OtpService.generateOtpCode(),
                otp_type: otpType,
                sent_counter: 0,
                expired_at: new Date(Date.now() + otpConstants.expiredInSec * 1000)
                    .toISOString()
                    .replace('T', ' ')
                    .substring(0, 19),
                status: StatusType.Active,
            });
        }

        const timeoutForNextSent =
            otpConstants.requestTimeout -
            (otpCode.sent_at
                ? Math.ceil((Date.now() - new Date(otpCode.sent_at).getTime()) / 1000)
                : otpConstants.requestTimeout);

        if (timeoutForNextSent > 0 && otpCode.sent_counter > 1) {
            return { isSent: false, timeout: timeoutForNextSent };
        }

        await otpCode.$query().increment('sent_counter', 1);
        await otpCode.$query().patch({ sent_at: fn.now() });

        let isSent = true;
        if (process.env.IS_SMS_ON === 'true') {
            isSent = await this.smsService
                .sendSMS({
                    smsType: SMSType.VerifyPhone,
                    to: otpCode.channel,
                    locals: { otpCode: otpCode.code },
                })
                .catch((error) => {
                    this.logger.error(error);
                    return false;
                });
        }

        return { isSent, timeout: otpCode.sent_counter <= 1 ? 0 : otpConstants.requestTimeout };
    }
}
