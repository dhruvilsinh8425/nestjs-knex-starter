import { json } from 'express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ApiMiddleware, LogMiddleware } from 'src/middlewares';
import { DbModule } from 'src/db/db.module';
import { ApiModulesList } from 'src/api';
import { RootModule } from 'src/root/root.module';
import { envValidationSchema } from './env.validation';
import { AppThrottlerGuard, throttlerOptions } from './throttle';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, expandVariables: true, validationSchema: envValidationSchema }),
        ThrottlerModule.forRootAsync({ inject: [ConfigService], useFactory: throttlerOptions }),
        DbModule,
        ScheduleModule.forRoot(),
        RootModule,
        RouterModule.register([{ path: 'common', module: RootModule }]),
        ...ApiModulesList,
    ],
    providers: [{ provide: APP_GUARD, useClass: AppThrottlerGuard }],
})
export class AppModule implements NestModule {
    constructor(private readonly configService: ConfigService) {}

    configure(consumer: MiddlewareConsumer) {
        const apiPrefix = this.configService.get('API_ROUTE_PREFIX', 'api');

        consumer
            .apply(json())
            .exclude({ path: `/${apiPrefix}/webhooks/{*splat}`, method: RequestMethod.ALL })
            .forRoutes('{*splat}');

        consumer.apply(ApiMiddleware, LogMiddleware).forRoutes({ path: '{*splat}', method: RequestMethod.ALL });
    }
}
