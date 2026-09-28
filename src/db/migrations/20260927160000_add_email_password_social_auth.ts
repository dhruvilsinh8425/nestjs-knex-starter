import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('user_type');
        table.string('country_code', 10).nullable().after('email');
        table.string('phone', 20).nullable().alter();
        table.boolean('is_email_verified').notNullable().defaultTo(false).after('avatar');
        table.string('social_google_id', 255).nullable().unique();
        table.string('social_apple_id', 255).nullable().unique();
    });

    await knex.schema.createTable('creds', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable().unique();
        table.string('hash', 255).notNullable();
        table.string('salt', 64).notNullable();
        table.timestamps(true, true);

        table.foreign('user_id', 'creds_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
    });

    await knex.schema.createTable('reset_tokens', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable();
        table.string('token', 255).notNullable().unique();
        table.dateTime('expired_at').notNullable();
        table.string('status', 20).notNullable().defaultTo('ACTIVE');
        table.timestamps(true, true);

        table.foreign('user_id', 'reset_tokens_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');

        table.index(['user_id', 'status'], 'reset_tokens_user_status_index');
    });

    await knex.schema.alterTable('sessions', (table) => {
        table.integer('user_id').unsigned().nullable().alter();
        table.string('fcm_token', 255).nullable().after('device_id');
        table.string('device_type', 20).nullable().after('fcm_token');

        table.index(['fcm_token'], 'sessions_fcm_token_index');
    });

    await knex.schema.alterTable('otps', (table) => {
        table.string('channel', 255).notNullable().alter();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('otps', (table) => {
        table.string('channel', 20).notNullable().alter();
    });

    await knex('sessions').whereNull('user_id').del();
    await knex.schema.alterTable('sessions', (table) => {
        table.dropIndex(['fcm_token'], 'sessions_fcm_token_index');
        table.dropColumn('device_type');
        table.dropColumn('fcm_token');
        table.integer('user_id').unsigned().notNullable().alter();
    });

    await knex.schema.dropTableIfExists('reset_tokens');
    await knex.schema.dropTableIfExists('creds');

    await knex.schema.alterTable('users', (table) => {
        table.dropUnique(['social_apple_id']);
        table.dropUnique(['social_google_id']);
        table.dropColumn('social_apple_id');
        table.dropColumn('social_google_id');
        table.dropColumn('is_email_verified');
        table.dropColumn('country_code');
        table.string('user_type', 20).notNullable().defaultTo('TENANT');
    });
}
