const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User'); // Ensure correct path

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mern_database', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('MongoDB connected successfully'); 
    // Verify collection
    User.findOne().then(user => {
        console.log('Sample user from DB:', user);
    });
})
.catch(err => console.error('MongoDB connection error:', err));

// Get all users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password -__v')
            .lean();
        
        console.log(`Found ${users.length} users in collection ${User.collection.collectionName}`);
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

app.get('/', (req, res) => {
    res.send('User API is running. Access user data at /users');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));