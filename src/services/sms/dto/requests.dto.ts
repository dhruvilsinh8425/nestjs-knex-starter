import { SMSType } from '../enums';
import { LocalsParamsInfo } from '.';

export class SendSMSRequest {
    to: string;
    smsType: SMSType;
    locals: LocalsParamsInfo;
}
