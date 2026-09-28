import { EmailType } from '../enums';

export class SendMailRequest {
    to: string;
    emailType: EmailType;
    locals?: Record<string, unknown>;
}
