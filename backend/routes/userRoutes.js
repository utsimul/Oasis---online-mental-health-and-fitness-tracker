// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/', userController.register);
router.get('/debug', userController.debugUsers);

module.exports = router;