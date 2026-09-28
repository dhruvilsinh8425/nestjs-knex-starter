import twilio from 'twilio';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { SMSConstants } from './constants';
import { SendSMSRequest } from './dto';
import { SMSType } from './enums';

@Injectable()
export class SMSService {
    private client: any;
    private readonly from: string;
    private send: boolean;
    private logger: Logger;

    constructor(private configService: ConfigService) {
        this.logger = new Logger('SMSService');

        this.from = this.configService.get('TWILIO_FROM', '');
        this.send = this.configService.get('IS_SMS_ON') === 'true';

        if (this.send) {
            const accountSid = this.configService.get('TWILIO_ACCOUNT_SID', '');
            const authToken = this.configService.get('TWILIO_AUTH_TOKEN', '');

            if (accountSid?.startsWith('AC') && authToken) {
                this.client = twilio(accountSid, authToken);
            } else {
                this.send = false;
                this.logger.warn('SMS disabled because Twilio credentials are missing or invalid.');
            }
        }
    }

    async sendSMS({ to, smsType, locals }: SendSMSRequest): Promise<boolean> {
        if (!to) {
            this.logger.error(`sendSMS cannot send email with empty recipient!`);
            return false;
        }

        if (!locals?.fullName) {
            locals.fullName = SMSConstants.defaultUserName;
        }

        let body = '';
        switch (smsType) {
            case SMSType.CurrentPhone:
                body = SMSConstants.template.CurrentPhone;
                break;
            case SMSType.VerifyPhone:
                body = SMSConstants.template.VerifyPhone;
                break;
            case SMSType.ChangePhone:
                body = SMSConstants.template.ChangePhone;
                break;
            case SMSType.ResetPasswordPhone:
                body = SMSConstants.template.ResetPasswordPhone;
        }
        body = body.replace('{appName}', this.configService.get('PROJECT_NAME')).replace('{otpCode}', locals.otpCode);

        this.send && this.logger.debug(`sending sms to: ${to}, smsType: ${smsType}, locals: ${JSON.stringify(locals)}`);

        if (!this.send) {
            return true;
        }

        if (!this.client) {
            this.logger.error('Twilio client is not configured.');
            return false;
        }

        return await this.client.messages
            .create({
                body,
                to, // Text this number
                from: this.from, // From a valid Twilio number
            })
            .then((message: any) => !!message.sid)
            .catch((err: any) => {
                this.logger.error(err);
                this.logger.error(err.stack);
                return false;
            });
    }
}
