const express = require('express');
const router = express.Router();
const controller = require('../controllers/peopleController');
const authenticate = require('../middleware/auth');

router.get('/:id', authenticate, controller.getPersonById);

module.exports = router;
