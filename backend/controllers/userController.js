// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { nickname, fullname, email, password } = req.body;
    
    // Validate input
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

    // Check for existing user
    const existingUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        message: "Email already exists",
        existingEmail: true
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = new User({ 
      nickname: nickname.trim(),
      fullname: fullname.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    const savedUser = await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: savedUser._id }, 
      process.env.SECRET_KEY, 
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: savedUser._id,
        nickname: savedUser.nickname,
        email: savedUser.email
      },
      token
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      message: "Error registering user",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.debugUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password -__v');
    res.json({
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      message: "Error fetching users",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};