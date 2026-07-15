require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const initSocket = require('./sockets/chat.socket');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 5000;

// Local / Docker: full HTTP + Socket.io
if (!process.env.VERCEL) {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  initSocket(io);
  server.listen(PORT, () => {
    console.log(`[MyHeath] API listening on port ${PORT} (CLIENT_URL=${CLIENT_URL})`);
  });
  module.exports = { app, server, io };
} else {
  module.exports = app;
}
