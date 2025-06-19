const express = require('express');
const router = express.Router();
const controller = require('../controllers/moviesController');

router.get('/search', controller.searchMovies);
router.get('/data/:id', controller.getMovieById);


module.exports = router;
