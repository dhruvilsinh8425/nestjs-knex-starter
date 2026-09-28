import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CronTestResponse } from './dto';

@Injectable()
export class CronService {
    private readonly logger = new Logger(CronService.name);
    private readonly isOn: boolean;

    constructor(configService: ConfigService) {
        this.isOn = configService.get<string>('IS_CRON_ON', 'false') === 'true';
    }

    @Cron(CronExpression.EVERY_HOUR, { name: 'test' })
    async scheduledTest(): Promise<void> {
        if (!this.isOn) {
            return;
        }

        await this.runTest();
    }

    async runTest(): Promise<CronTestResponse> {
        const ranAt = new Date().toISOString();
        this.logger.log(`Test job ran at ${ranAt}`);

        return { ok: true, ranAt };
    }
}
