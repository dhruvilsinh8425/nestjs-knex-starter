import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SMSModule } from '../sms';

@Module({
    imports: [SMSModule],
    providers: [OtpService],
    exports: [OtpService],
})
export class OtpModule {}
