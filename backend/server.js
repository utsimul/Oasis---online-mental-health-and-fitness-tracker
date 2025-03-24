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

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

// Serve frontend files
app.use(express.static(path.join(__dirname, "../frontend/pages")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages", "index.html"));
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const UserSchema = new mongoose.Schema({
  nickname: String,
  fullname: String,
  email: { type: String, unique: true },
  password: String,
});
const User = mongoose.model("User", UserSchema);

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};

// Register (Signup)
app.post("/api/users", async (req, res) => {
  try {
    const { nickname, fullname, email, password } = req.body;

    if (!nickname || !fullname || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ nickname, fullname, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!", user: { nickname, fullname, email } });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Error registering user" });
  }
});

// Login (Sign In)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: "1h" });

    res.json({ 
      message: "Login successful", 
      user: { nickname: user.nickname, fullname: user.fullname, email: user.email },
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in" });
  }
});

// Authentication Check (for frontend)
app.get("/api/auth/me", verifyToken, (req, res) => {
  res.json({ userId: req.user.userId });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
