// routes/journalRoutes.js
const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const verifyToken = require('../middleware/authMiddleware');

// Make sure all these controller methods exist
router.post('/', verifyToken, journalController.createEntry);
router.get('/', verifyToken, journalController.getEntries);
router.get('/:id', verifyToken, journalController.getEntry);
router.put('/:id', verifyToken, journalController.updateEntry);
router.delete('/:id', verifyToken, journalController.deleteEntry);

module.exports = router;