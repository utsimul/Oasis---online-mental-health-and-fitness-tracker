// controllers/journalController.js
const JournalEntry = require('../models/JournalEntry');

exports.createEntry = async (req, res) => {
  try {
    const entry = new JournalEntry({
      userId: req.user.userId,
      text: req.body.text,
      mood: req.body.mood
    });
    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error saving journal entry' });
  }
};

exports.getEntries = async (req, res) => {
  try {
    const entries = await JournalEntry.find({ userId: req.user.userId });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching entries' });
  }
};

exports.getEntry = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching entry' });
  }
};

exports.updateEntry = async (req, res) => {
  try {
    const entry = await JournalEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true }
    );
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error updating entry' });
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    await JournalEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting entry' });
  }
};