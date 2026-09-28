import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('z_request_logs', (table) => {
        table.bigIncrements('id').primary();
        table.integer('user_id').unsigned().nullable();
        table.string('type', 20).notNullable();
        table.string('method', 10).notNullable();
        table.string('route', 1024).notNullable();
        table.text('headers').nullable();
        table.text('get').nullable();
        table.text('post', 'mediumtext').nullable();
        table.string('status_code', 5).nullable();
        table.text('response', 'mediumtext').nullable();
        table.integer('duration_ms').unsigned().nullable();
        table.dateTime('created_at').notNullable().defaultTo(knex.fn.now());

        table.index(['created_at'], 'z_request_logs_created_at_index');
        table.index(['user_id'], 'z_request_logs_user_id_index');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('z_request_logs');
}
