exports.up = function(knex) {
    return knex.schema.createTable('users', table => {
        table.increments('id').primary();
        table.string('email').notNullable().unique();
        table.string('passwordHash').notNullable();
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('users');
};
