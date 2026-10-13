import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';

let ioInstance: SocketIOServer | null = null;

export const initSocketIO = (io: SocketIOServer) => {
  ioInstance = io;

  // Optional socket authentication middleware
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie
        ?.split('; ')
        .find((row: string) => row.startsWith('resqcloud_token='))
        ?.split('=')[1];

      if (token) {
        const payload = verifyToken(token);
        if (payload) {
          (socket as any).user = payload;
          if (payload.role === 'RESCUE_OPERATOR' || payload.role === 'ADMIN') {
            socket.join('rescue_team_channel');
          }
          socket.join(`user_${payload.id}`);
        }
      }
      // Allow connection even if guest for public updates, but join appropriate rooms
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join_rescue_channel', () => {
      socket.join('rescue_team_channel');
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });
};

export const getIO = (): SocketIOServer | null => {
  return ioInstance;
};

export const emitToRescueTeam = (event: string, data: any) => {
  if (ioInstance) {
    ioInstance.to('rescue_team_channel').emit(event, data);
    // Also emit globally for live dashboards
    ioInstance.emit(event, data);
  }
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit(event, data);
  }
};
