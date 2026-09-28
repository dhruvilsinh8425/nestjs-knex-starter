import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('otps', (table) => {
        table.increments('id').primary();
        table.string('channel', 20).notNullable();
        table.string('code', 10).notNullable();
        table.string('otp_type', 30).notNullable().defaultTo('VERIFY_PHONE');
        table.dateTime('expired_at').notNullable();
        table.dateTime('sent_at').nullable();
        table.integer('sent_counter').notNullable().defaultTo(0);
        table.string('status', 20).notNullable().defaultTo('ACTIVE');
        table.timestamps(true, true);

        table.index(['channel', 'otp_type', 'status'], 'otps_channel_type_status_index');
        table.index(['expired_at'], 'otps_expired_at_index');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('otps');
}
