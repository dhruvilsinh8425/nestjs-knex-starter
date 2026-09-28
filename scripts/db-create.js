const knexConfig = require('../knexfile.js');

const { database, ...connection } = knexConfig.connection;
const knex = require('knex')({ client: knexConfig.client, connection });

knex.raw('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', [database])
    .then(() => console.log(`Database "${database}" is ready`))
    .catch((err) => {
        console.error(`Cannot create database "${database}": ${err.code || err.message}`);
        process.exitCode = 1;
    })
    .finally(() => knex.destroy());
