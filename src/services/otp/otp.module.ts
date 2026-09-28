import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SMSModule } from '../sms';
import { MailModule } from '../mail';

@Module({
    imports: [SMSModule, MailModule],
    providers: [OtpService],
    exports: [OtpService],
})
export class OtpModule {}
