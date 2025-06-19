const knex = require('../db/knex');

// Search for movies with optional title/year and pagination
exports.searchMovies = async (req, res) => {
    const { title, year, page = 1 } = req.query;

    //Validate page
    if (isNaN(page) || !Number.isInteger(Number(page))) {
        return res.status(400).json({
            error: true,
            message: "Invalid page format. page must be a number."
        });
    }

    const perPage = 100;
    const offset = (page - 1) * perPage;

    try {
        // Build base query with pagination and rating conversion
        const query = knex('basics')
            .select(
                'primaryTitle as title',
                'year',
                'tconst as imdbID',
                knex.raw('CAST(imdbRating AS DECIMAL(3,1)) as imdbRating'),
                knex.raw('CAST(rottentomatoesRating AS UNSIGNED) as rottenTomatoesRating'),
                knex.raw('CAST(metacriticRating AS UNSIGNED) as metacriticRating'),
                'rated as classification'
            )
            .orderBy('tconst', 'asc')
            .limit(perPage)
            .offset(offset);
        // Filter by title (partial match)
        if (title) query.where('primaryTitle', 'like', `%${title}%`);
        // Filter by year (strict 4-digit format)
        if (year) {
            if (!/^\d{4}$/.test(year)) {
                return res.status(400).json({
                    error: true,
                    message: "Invalid year format. Format must be yyyy."
                });
            }
            query.where('year', year);
        }

        // Clone for count
        const countQuery = knex('basics');
        if (title) countQuery.where('primaryTitle', 'like', `%${title}%`);
        if (year) countQuery.where('year', year);
        const total = await countQuery.count('* as count').first();

        // Fetch movies and format ratings as numbers
        const movies = await query;
        const totalResults = total.count;
        const lastPage = Math.ceil(totalResults / perPage);

        res.json({
            data: movies.map(m => ({
                ...m,
                imdbRating: m.imdbRating !== null ? Number(m.imdbRating) : null,
                rottenTomatoesRating: m.rottenTomatoesRating !== null ? Number(m.rottenTomatoesRating) : null,
                metacriticRating: m.metacriticRating !== null ? Number(m.metacriticRating) : null
            })),
            pagination: {
                total: Number(totalResults),
                lastPage,
                perPage,
                currentPage: Number(page),
                from: offset,
                to: offset + movies.length,
                prevPage: page > 1 ? Number(page) - 1 : null,
                nextPage: page < lastPage ? Number(page) + 1 : null
            }
        });
    } catch (err) {
        console.error(" /movies/search error:", err);
        res.status(500).json({ error: true, message: "Database error" });
    }
};


exports.getMovieById = async (req, res) => {
    const { id } = req.params;

    // Reject any query parameters
    if (Object.keys(req.query).length > 0) {
        return res.status(400).json({
            error: true,
            message: "Invalid query parameters: year. Query parameters are not permitted."
        });
    }

    try {
        // Get the main movie details
        const movie = await knex('basics')
            .select(
                'primaryTitle as title',
                'year',
                'runtimeMinutes as runtime',
                'genres',
                'country',
                'plot',
                'poster',
                'boxoffice'
            )
            .where('tconst', id)
            .first();

        if (!movie) {
            return res.status(404).json({
                error: true,
                message: "No record exists of a movie with this ID"
            });
        }

        // Parse genre string to array
        movie.genres = movie.genres ? movie.genres.split(',') : [];

        // Fetch all ratings and normalize their values
        const rawRatings = await knex('ratings')
            .select('source', 'value')
            .where('tconst', id);

        const ratings = rawRatings.map(r => {
            let val = r.value;
            if (typeof val === 'string') {
                if (val.includes('/')) val = val.split('/')[0];
                if (val.endsWith('%')) val = val.replace('%', '');
            }
            return {
                source: r.source,
                value: isNaN(val) ? val : parseFloat(val)
            };
        });

        // Fetch cast/crew details (principals) with their associated people
        const principalsRaw = await knex('principals')
            .join('names', 'principals.nconst', '=', 'names.nconst')
            .select(
                'names.nconst as id',
                'names.primaryName as name',
                'principals.category',
                'principals.characters',
                'principals.ordering'
            )
            .where('principals.tconst', id)
            .orderBy('principals.ordering', 'asc'); // ordering is important for consistent test results

        // Parse characters JSON string for each person
        const principals = principalsRaw.map(p => {
            let characters = [];
            try {
                characters = JSON.parse(p.characters || '[]');
            } catch {
                characters = [];
            }
            return {
                id: p.id,
                name: p.name,
                category: p.category,
                characters
            };
        });

        // Sort categories using a preferred display order
        const preferredOrder = [
            'production_designer',
            'editor',
            'cinematographer',
            'producer',
            'writer',
            'director',
            'actor',
            'actress'
        ];

        principals.sort((a, b) => {
            const aIdx = preferredOrder.indexOf(a.category);
            const bIdx = preferredOrder.indexOf(b.category);
            if (aIdx === bIdx) {
                return 0;
            }
            return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
        });

        //Return full combined response
        res.json({
            title: movie.title,
            year: movie.year,
            runtime: movie.runtime,
            genres: movie.genres,
            country: movie.country,
            principals,
            ratings,
            boxoffice: movie.boxoffice,
            plot: movie.plot,
            poster: movie.poster
        });
    } catch (err) {
        console.error(" DATABASE ERROR:", err);
        res.status(500).json({ error: true, message: "Database error" });
    }
};





