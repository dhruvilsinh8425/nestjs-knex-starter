import { Controller, Get, Query } from '@nestjs/common';
import { HealthCheck, HealthCheckResult, HealthCheckService, HealthIndicatorService } from '@nestjs/terminus';
import { Model } from 'objection';
import { RootService } from './root.service';

@Controller()
export class RootController {
    constructor(
        private readonly rootService: RootService,
        private readonly health: HealthCheckService,
        private readonly healthIndicator: HealthIndicatorService
    ) {}

    @Get('health-check')
    @HealthCheck()
    healthCheck(): Promise<HealthCheckResult> {
        return this.health.check([() => this.checkDatabase()]);
    }

    @Get('app-store')
    async appStore(@Query('page') page: string, @Query('id') id: number): Promise<string> {
        return await this.rootService.appStoreRedirect({ page, id });
    }

    private async checkDatabase() {
        const indicator = this.healthIndicator.check('database');

        try {
            await Model.knex().raw('SELECT 1');
            return indicator.up();
        } catch (err) {
            return indicator.down({ message: err?.code || err?.message });
        }
    }
}
