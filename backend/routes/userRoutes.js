const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');
const authMiddleware = require('../middleware/authMiddleware');

// Get all users (except the logged in user)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const users = await User.find({ _id: { $ne: currentUserId } }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get chat history with a specific user
router.get('/messages/:otherUserId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
