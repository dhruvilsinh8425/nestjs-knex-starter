import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('session_tokens', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable();
        table.string('token', 255).notNullable().unique();
        table.dateTime('expired_at').notNullable();
        table.string('status', 20).notNullable().defaultTo('ACTIVE');
        table.timestamps(true, true);

        table
            .foreign('user_id', 'session_tokens_user_id_foreign')
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');

        table.index(['user_id', 'status'], 'session_tokens_user_status_index');
        table.index(['expired_at'], 'session_tokens_expired_at_index');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('session_tokens');
}
