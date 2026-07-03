require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Socket.io connection logic
const userSockets = {}; // Map to store userId -> socketId

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // When a user logs in, they send their userId to register
  socket.on('register', (userId) => {
    userSockets[userId] = socket.id;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Handle incoming messages
  socket.on('send_message', async (data) => {
    const { sender, receiver, content } = data;
    
    try {
      // Save to database
      const newMessage = new Message({ sender, receiver, content });
      await newMessage.save();

      // Check if receiver is online
      const receiverSocketId = userSockets[receiver];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', newMessage);
      }

      // Also emit back to the sender so their UI can update immediately (optional but good practice)
      // socket.emit('receive_message', newMessage); 
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Find and remove the disconnected socket
    for (const [userId, socketId] of Object.entries(userSockets)) {
      if (socketId === socket.id) {
        delete userSockets[userId];
        break;
      }
    }
  });
});

// Connect to MongoDB
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
