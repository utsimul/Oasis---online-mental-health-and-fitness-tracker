require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose"); // Add this line


// Import route files
const journalRoutes = require('./routes/journalRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Import database connection
const connectDB = require('./database/db');
const app = express();
const PORT = process.env.PORT || 5001;

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message });
});

// Add this right before your server starts listening

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const testEntry = new JournalEntry({
      userId: new mongoose.Types.ObjectId(),
      text: 'TEST ENTRY',
      mood: 'neutral'
    });
    const saved = await testEntry.save();
    res.json({
      dbState: mongoose.connection.readyState,
      testEntry: saved
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all journal entries (for debugging)
app.get('/api/debug/entries', async (req, res) => {
  try {
    const entries = await JournalEntry.find({});
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add before your routes
app.get('/api/db-info', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const journalEntries = await mongoose.connection.db.collection('journal_entries').find().toArray();
    
    res.json({
      db: mongoose.connection.db.databaseName,
      collections: collections.map(c => c.name),
      journalEntriesCount: journalEntries.length,
      sampleEntry: journalEntries[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Connect to MongoDB
connectDB();

// Serve frontend files
app.use(express.static(path.join(__dirname, "../frontend/pages")));

// Basic route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages", "index.html"));
});

// API Routes
app.use('/api/journal', journalRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    dbState: mongoose.connection.readyState,
    timestamp: new Date()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});