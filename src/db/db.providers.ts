import { resolve } from 'path';
import { Model } from 'objection';
import { Logger } from '@nestjs/common';

const knexConfig = require(resolve('knexfile.js'));
const knex = require('knex')(knexConfig);

const logger = new Logger('DbProvider');
logger.debug(`ENV: ${process.env.NODE_ENV}`);

export const databaseProviders = [
    {
        provide: 'DATABASE_CONNECTION',
        useFactory: async () => {
            Model.knex(knex);

            await knex
                .raw('SELECT VERSION() as version')
                .then(([version]: any) => logger.debug(`Database version: ${version[0]?.version}`))
                .catch((err: any) => {
                    const { host, port, database } = knexConfig.connection;
                    logger.error(
                        `Cannot connect to MySQL at ${host}:${port}/${database} (${err.code || err.message}). ` +
                            'Start MySQL and run `npm run setup` - queries will retry on the next request.'
                    );
                });

            return knex;
        },
    },
];
