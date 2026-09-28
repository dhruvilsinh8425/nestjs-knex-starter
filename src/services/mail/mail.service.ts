import { resolve } from 'path';
import Email from 'email-templates';
import nodemailer, { Transporter } from 'nodemailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendMailRequest } from './dto';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly transport: Transporter;
    private readonly isLogOnly: boolean;

    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('SMTP_HOST', '');
        this.isLogOnly = !host;

        this.transport = this.isLogOnly
            ? nodemailer.createTransport({ jsonTransport: true })
            : nodemailer.createTransport({
                  host,
                  port: parseInt(this.configService.get<string>('SMTP_PORT', '587'), 10),
                  secure: this.configService.get<string>('SMTP_SECURE', 'false') === 'true',
                  auth: this.configService.get<string>('SMTP_USER')
                      ? {
                            user: this.configService.get<string>('SMTP_USER'),
                            pass: this.configService.get<string>('SMTP_PASSWORD'),
                        }
                      : undefined,
              });

        if (this.isLogOnly) {
            this.logger.warn('SMTP_HOST is not set: emails are logged instead of sent');
        }
    }

    async sendMail({ to, emailType, locals = {} }: SendMailRequest): Promise<boolean> {
        if (!to) {
            this.logger.error('sendMail called without a recipient');
            return false;
        }

        const email = new Email({
            message: {
                from: {
                    name: this.configService.get<string>('PROJECT_NAME', ''),
                    address: this.configService.get<string>('EMAIL_FROM', 'no-reply@example.com'),
                },
            },
            send: true,
            preview: false,
            transport: this.transport,
            views: { root: resolve('templates/email'), options: { extension: 'pug' } },
        });

        try {
            await email.send({
                template: emailType,
                message: { to },
                locals: {
                    appName: this.configService.get<string>('PROJECT_NAME', ''),
                    webUrl: this.configService.get<string>('WEB_URL', ''),
                    supportEmail: this.configService.get<string>('SUPPORT_EMAIL', ''),
                    ...locals,
                },
            });

            this.isLogOnly && this.logger.log(`Email "${emailType}" to ${to} (not sent: SMTP_HOST is not set)`);
            return true;
        } catch (err) {
            this.logger.error(`Failed to send "${emailType}" email to ${to}: ${err?.message}`);
            return false;
        }
    }
}
