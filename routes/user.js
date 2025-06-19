const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const auth = require('../middleware/auth');
const tryAuth = require('../middleware/tryAuth');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/:email/profile', tryAuth, controller.getProfile);
router.put('/:email/profile', auth, controller.updateProfile);

module.exports = router;
