const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users
router.get('/', async (req, res, next) => {
    try {
        const users = await User.find().select('-password -__v');
        res.json(users);
    } catch (err) {
        next(err);
    }
});

// Get single user by ID
router.get('/:id', async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password -__v');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        next(err);
    }
});

module.exports = router;