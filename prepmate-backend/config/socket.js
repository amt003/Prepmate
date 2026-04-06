const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true },
  });

  // Auth middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id).select('name points level');
      if (!socket.user) return next(new Error('User not found'));
      next();
    } catch {
      next(new Error('Auth failed'));
    }
  });

  const onlineUsers = new Map(); // socketId → { userId, name }

  io.on('connection', (socket) => {
    console.log(`⚡ ${socket.user.name} connected`);

    socket.on('join', ({ userId, name }) => {
      onlineUsers.set(socket.id, { userId, name });
      io.emit('online_count', onlineUsers.size);
    });

    // When a user completes a quiz, broadcast updated leaderboard top 10
    socket.on('quiz_complete', async ({ points }) => {
      try {
        const top = await User.find({ role: 'student' })
          .select('name points level stats')
          .sort({ points: -1 })
          .limit(10);

        const board = top.map((u, i) => ({
          rank: i + 1,
          id: u._id,
          name: u.name,
          points: u.points,
          level: u.level,
          quizzes: u.stats.totalQuizzes,
        }));

        io.emit('leaderboard_update', board);
        console.log(`📊 Leaderboard updated after ${socket.user.name} earned ${points} pts`);
      } catch (err) {
        console.error('Socket leaderboard error:', err);
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      io.emit('online_count', onlineUsers.size);
      console.log(`💤 ${socket.user?.name} disconnected`);
    });
  });

  return io;
};
