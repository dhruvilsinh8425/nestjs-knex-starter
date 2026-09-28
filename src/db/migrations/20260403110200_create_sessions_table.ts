import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('sessions', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable();
        table.string('device_id', 255).nullable();
        table.string('token', 255).notNullable().unique();
        table.dateTime('expired_at').notNullable();
        table.dateTime('last_use_at').nullable();
        table.string('status', 20).notNullable().defaultTo('ACTIVE');
        table.timestamps(true, true);

        table
            .foreign('user_id', 'sessions_user_id_foreign')
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');

        table.index(['user_id', 'device_id'], 'sessions_user_device_index');
        table.index(['status', 'expired_at'], 'sessions_status_expired_at_index');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('sessions');
}
