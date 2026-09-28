import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('auth_type', 20).notNullable().defaultTo('PHONE');
        table.string('user_type', 20).notNullable().defaultTo('TENANT');
        table.string('first_name', 255).nullable();
        table.string('last_name', 255).nullable();
        table.string('email', 255).nullable().unique();
        table.string('phone', 20).notNullable().unique();
        table.text('avatar').nullable();
        table.boolean('is_phone_verified').notNullable().defaultTo(false);
        table.string('status', 20).notNullable().defaultTo('NEW');
        table.timestamps(true, true);

        table.index(['status'], 'users_status_index');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('users');
}
