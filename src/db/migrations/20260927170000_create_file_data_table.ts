import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('file_data', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().nullable();
        table.string('name', 255).nullable();
        table.string('file_type', 20).notNullable();
        table.string('file_url', 1024).notNullable();
        table.string('file_key', 512).notNullable();
        table.string('mime_type', 128).notNullable();
        table.integer('size').unsigned().notNullable().defaultTo(0);
        table.integer('width').unsigned().nullable();
        table.integer('height').unsigned().nullable();
        table.string('thumb_url', 1024).nullable();
        table.string('thumb_key', 512).nullable();
        table.string('thumb_mime_type', 128).nullable();
        table.string('status', 20).notNullable().defaultTo('ACTIVE');
        table.timestamps(true, true);

        table.foreign('user_id', 'file_data_user_id_foreign').references('id').inTable('users').onDelete('SET NULL');

        table.index(['user_id', 'status'], 'file_data_user_status_index');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('file_data');
}
