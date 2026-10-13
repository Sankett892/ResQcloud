import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { initSocketIO } from './sockets/socketHandler.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

initSocketIO(io);

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚨 ResQCloud Emergency API Server running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`📡 Socket.IO Real-Time Dispatch Engine initialized`);
  console.log(`====================================================`);
});

export { server, io };
