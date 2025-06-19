const knex = require('../db/knex');

// Controller to fetch person details and their roles by ID
exports.getPersonById = async (req, res) => {
    // Reject if any query parameters are passed
    if (Object.keys(req.query).length > 0) {
        const invalidParams = Object.keys(req.query).join(', ');
        return res.status(400).json({
            error: true,
            message: `Invalid query parameters: ${invalidParams}. Query parameters are not permitted.`
        });
    }
    const { id } = req.params;

    try {
        // Fetch basic information about the person
        const person = await knex('names')
            .select('primaryName as name', 'birthYear', 'deathYear', 'primaryProfession')
            .where('nconst', id)
            .first();

        // Return 404 if no person is found
        if (!person) {
            return res.status(404).json({ error: true, message: "No record exists of a person with this ID" });
        }

        // Fetch all roles the person had in different movies
        const roles = await knex('principals')
            .join('basics', 'principals.tconst', '=', 'basics.tconst')
            .select(
                'basics.tconst as imdbID',
                'basics.primaryTitle as movieTitle',
                'basics.imdbRating',
                'principals.category',
                'principals.characters'
            )
            .where('principals.nconst', id);

        // Parse the 'characters' JSON string and structure the role data
        const formattedRoles = roles.map(role => {
            let characters = [];
            try {
                characters = JSON.parse(role.characters || '[]');
            } catch {
                characters = [];
            }

            return {
                movieName: role.movieTitle,
                movieId: role.imdbID,
                category: role.category,
                characters,
                imdbRating: role.imdbRating !== null ? parseFloat(role.imdbRating) : null
            };
        });

        // Send structured response
        res.json({
            name: person.name,
            birthYear: person.birthYear,
            deathYear: person.deathYear,
            roles: formattedRoles
        });
    } catch (err) {
        console.error(" DATABASE ERROR:", err);
        res.status(500).json({ error: true, message: "Database error" });
    }
};
