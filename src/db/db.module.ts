import { Knex } from 'knex';
import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { databaseProviders } from './db.providers';

@Module({
    providers: [...databaseProviders],
    exports: [...databaseProviders],
})
export class DbModule implements OnApplicationShutdown {
    constructor(@Inject('DATABASE_CONNECTION') private readonly knex: Knex) {}

    async onApplicationShutdown(): Promise<void> {
        await this.knex.destroy();
    }
}
