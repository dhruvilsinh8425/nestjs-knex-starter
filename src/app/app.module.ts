import { json } from 'express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiMiddleware } from 'src/middlewares';
import { DbModule } from 'src/db/db.module';
import { ApiModulesList } from 'src/api';
import { RootModule } from 'src/root/root.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
        DbModule,
        ScheduleModule.forRoot(),
        RootModule,
        RouterModule.register([{ path: 'common', module: RootModule }]),
        ...ApiModulesList,
    ],
})
export class AppModule implements NestModule {
    constructor(private readonly configService: ConfigService) {}

    configure(consumer: MiddlewareConsumer) {
        const apiPrefix = this.configService.get('API_ROUTE_PREFIX', 'api');

        consumer
            .apply(json())
            .exclude({ path: `/${apiPrefix}/webhooks/{*splat}`, method: RequestMethod.ALL })
            .forRoutes('{*splat}');

        consumer.apply(ApiMiddleware).forRoutes({ path: '{*splat}', method: RequestMethod.ALL });
    }
}
