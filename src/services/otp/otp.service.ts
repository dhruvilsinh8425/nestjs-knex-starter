import { fn } from 'objection';
import { Injectable, Logger } from '@nestjs/common';
import { commonConstants } from 'src/common/constants';
import { StatusType } from 'src/common/enums';
import { Otp } from 'src/models';
import { EmailType, MailService } from '../mail';
import { SMSService } from '../sms/sms.service';
import { SMSType } from '../sms';
import { otpConstants } from './constants';
import {
    ChannelCodeWithOtpTypeRequest,
    ChannelOtpTypeForcedRequest,
    ChannelOtpTypeRequest,
    OtpCodeResponse,
    OtpTarget,
    OtpTypeRequest,
} from './dto';
import { emailOtpTypes, OtpType } from './enums';

const emailTypeByOtpType: Partial<Record<OtpType, EmailType>> = {
    [OtpType.VerifyEmail]: EmailType.VerifyEmail,
    [OtpType.ResetPasswordEmail]: EmailType.ResetPassword,
};

const smsTypeByOtpType: Partial<Record<OtpType, SMSType>> = {
    [OtpType.VerifyPhone]: SMSType.VerifyPhone,
    [OtpType.ResetPasswordPhone]: SMSType.ResetPasswordPhone,
};

@Injectable()
export class OtpService {
    private readonly logger = new Logger(OtpService.name);

    constructor(
        private readonly smsService: SMSService,
        private readonly mailService: MailService
    ) {}

    static channelFor(target: OtpTarget, otpType: OtpType): string | null {
        const channel = emailOtpTypes.includes(otpType) ? target.email?.trim().toLowerCase() : target.phone?.trim();
        return channel || null;
    }

    private static generateOtpCode(): string {
        let result = '';

        for (let i = 0; i < otpConstants.codeLength; i++) {
            result += otpConstants.codeCharacters.charAt(
                Math.floor(Math.random() * otpConstants.codeCharacters.length)
            );
        }

        return result;
    }

    private static isMasterCode(code: string): boolean {
        return process.env.NODE_ENV !== 'production' && code === commonConstants.otpCode;
    }

    private async getCurrentOtpCode({ channel, otpType }: ChannelOtpTypeRequest): Promise<Otp | undefined> {
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

        if (OtpService.isMasterCode(code)) {
            return true;
        }

        return !!(await Otp.query()
            .findOne({ channel, code, otp_type: otpType, status: StatusType.Active })
            .where('expired_at', '>=', fn.now()));
    }

    /** Checks the code and disables it, so each code works only once. */
    async consumeOtpCode(request: ChannelCodeWithOtpTypeRequest): Promise<boolean> {
        if (!(await this.isOtpCodeValid(request))) {
            return false;
        }

        await this.disableOtpCode({ channel: request.channel, otpType: request.otpType, force: true });
        return true;
    }

    async requestOTPCode(target: OtpTarget, { otpType, isNewOtp }: OtpTypeRequest): Promise<OtpCodeResponse> {
        const channel = OtpService.channelFor(target, otpType);
        if (!channel) {
            return { isSent: false, timeout: 0 };
        }

        if (isNewOtp) {
            await this.disableOtpCode({ channel, otpType, force: true });
        }

        let otpCode = await this.getCurrentOtpCode({ channel, otpType });
        if (otpCode?.sent_at) {
            const secondsSinceSent = Math.floor((Date.now() - new Date(otpCode.sent_at).getTime()) / 1000);
            const timeout = otpConstants.requestTimeout - secondsSinceSent;

            if (timeout > 0) {
                return { isSent: false, timeout };
            }
        }

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

        await otpCode.$query().patch({ sent_counter: otpCode.sent_counter + 1, sent_at: fn.now() as any });

        const isSent = await this.deliver(channel, otpType, otpCode.code, target.fullName).catch((error) => {
            this.logger.error(`Failed to send ${otpType} code: ${error?.message}`);
            return false;
        });

        return { isSent, timeout: otpConstants.requestTimeout };
    }

    private async deliver(channel: string, otpType: OtpType, code: string, fullName?: string): Promise<boolean> {
        const locals = {
            otpCode: code,
            fullName: fullName || commonConstants.defaultUserName,
            expiresInMinutes: Math.round(otpConstants.expiredInSec / 60),
        };

        const emailType = emailTypeByOtpType[otpType];
        if (emailType) {
            return this.mailService.sendMail({ to: channel, emailType, locals });
        }

        return this.smsService.sendSMS({ to: channel, smsType: smsTypeByOtpType[otpType], locals });
    }
}
