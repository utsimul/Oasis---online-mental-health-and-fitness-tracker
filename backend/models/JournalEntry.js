const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  mood: {
    type: String,
    enum: ['happy', 'neutral', 'sad', 'angry', 'anxious'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { collection: 'journal_entries' }); // Force collection name

module.exports = mongoose.model('JournalEntry', journalEntrySchema);