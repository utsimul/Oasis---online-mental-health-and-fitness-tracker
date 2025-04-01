require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5001;
const SECRET_KEY = process.env.SECRET_KEY;
const JournalEntry = require('./models/JournalEntry');
// Enhanced Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Serve frontend files
app.use(express.static(path.join(__dirname, "../frontend/pages")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages", "index.html"));
});

// Robust MongoDB Connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/mern_database", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,
  w: "majority"
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Replace your current mongoose.connection.once('open') block with:
mongoose.connection.once('open', async () => {
  console.log('Mongoose connected to DB');
  console.log('Database name:', mongoose.connection.name);
  
  try {
    // Create indexes if they don't exist
    await JournalEntry.init();
    await User.init();
    console.log('All indexes verified');
    
    // Alternatively, you can create indexes directly:
    // await mongoose.connection.db.collection('journal_entries').createIndex({ userId: 1 });
    // await mongoose.connection.db.collection('journal_entries').createIndex({ userId: 1, date: -1 });
    // await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
  } catch (err) {
    console.error('Index creation error:', err);
  }
});

// MongoDB event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
  console.log('Collection name:', mongoose.model('User').collection.collectionName);
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

// Enhanced User Schema with validation
const UserSchema = new mongoose.Schema({
  nickname: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 2
  },
  fullname: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      message: "Invalid email format"
    }
  },
  password: { 
    type: String, 
    required: true,
    minlength: 8
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create model with explicit collection name
const User = mongoose.model('User', UserSchema, 'users');

// Enhanced Token Verification Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: "Access denied" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
};

// Enhanced Registration Endpoint
app.post("/api/users", async (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    
    const { nickname, fullname, email, password } = req.body;
    
    // Validation
    if (!nickname || !fullname || !email || !password) {
      return res.status(400).json({ 
        message: "All fields are required",
        missingFields: {
          nickname: !nickname,
          fullname: !fullname,
          email: !email,
          password: !password
        }
      });
    }

    // Check for existing user (case-insensitive)
    const existingUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });
    
    if (existingUser) {
      console.log('Duplicate email detected:', email);
      return res.status(409).json({ 
        message: "Email already exists",
        existingEmail: true
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Password hashed successfully');

    // Create and save user
    const newUser = new User({ 
      nickname: nickname.trim(),
      fullname: fullname.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    const savedUser = await newUser.save();
    console.log('User saved to DB:', {
      id: savedUser._id,
      email: savedUser.email,
      createdAt: savedUser.createdAt
    });

    // Generate JWT token immediately after registration
    const token = jwt.sign({ userId: savedUser._id }, SECRET_KEY, { expiresIn: "1h" });

    res.status(201).json({ 
      message: "User registered successfully!", 
      user: { 
        id: savedUser._id,
        nickname: savedUser.nickname,
        fullname: savedUser.fullname,
        email: savedUser.email
      },
      token
    });

  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle duplicate key error separately
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Email already exists",
        existingEmail: true
      });
    }
    
    res.status(500).json({ 
      message: "Error registering user",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced Login Endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log('Login attempt with non-existent email:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('Invalid password attempt for email:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: "1h" });

    res.json({ 
      message: "Login successful", 
      user: { 
        id: user._id,
        nickname: user.nickname,
        fullname: user.fullname,
        email: user.email
      },
      token
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Error logging in",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced Authentication Check
app.get("/api/auth/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password -__v');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(500).json({ message: "Error fetching user data" });
  }
});

// Enhanced Debug Endpoint
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password -__v')
      .lean();
    
    console.log(`Found ${users.length} users in database`);
    console.log('Sample user:', users.length > 0 ? users[0] : null);
    
    res.json({
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    dbState: mongoose.connection.readyState,
    timestamp: new Date()
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${mongoose.connection.host}/${mongoose.connection.name}`);
});

// Create journal entry
app.post('/api/journal', verifyToken, async (req, res) => {
  try {
    const { text, mood, tags } = req.body;
    const entry = new JournalEntry({
      userId: req.user.userId,
      text,
      mood,
      tags
    });
    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error saving journal entry' });
  }
});

// Get journal entries for user
app.get('/api/journal', verifyToken, async (req, res) => {
  try {
    const { date } = req.query;
    let query = { userId: req.user.userId };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      query.date = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    const entries = await JournalEntry.find(query).sort({ date: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching journal entries' });
  }
});

// Update journal entry
app.put('/api/journal/:id', verifyToken, async (req, res) => {
  try {
    const entry = await JournalEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { text: req.body.text, mood: req.body.mood, tags: req.body.tags },
      { new: true }
    );
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error updating journal entry' });
  }
});

// Delete journal entry
app.delete('/api/journal/:id', verifyToken, async (req, res) => {
  try {
    await JournalEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting journal entry' });
  }
});

