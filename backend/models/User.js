const mongoose = require('mongoose');

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
    unique: true,  // This creates an index automatically
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

// Remove any separate index calls like this if you have them:
// UserSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);