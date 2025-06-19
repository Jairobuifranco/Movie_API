exports.up = function(knex) {
    return knex.schema.table('users', function(table) {
        table.string('firstName');
        table.string('lastName');
        table.date('dob');
        table.string('address');
    });
};

exports.down = function(knex) {
    return knex.schema.table('users', function(table) {
        table.dropColumns('firstName', 'lastName', 'dob', 'address');
    });
};
