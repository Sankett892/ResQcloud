import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api.js';

let socket: Socket | null = null;
let isConnected = false;

export const initSocket = (): Socket => {
  if (socket) return socket;

  const token = getAuthToken();

  socket = io(window.location.origin, {
    auth: { token },
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    isConnected = true;
    console.log('[Socket] Connected to real-time dispatch server:', socket?.id);
    socket?.emit('join_rescue_channel');
  });

  socket.on('disconnect', () => {
    isConnected = false;
    console.log('[Socket] Disconnected from real-time dispatch server');
  });

  socket.on('connect_error', (error) => {
    isConnected = false;
    console.warn('[Socket] Connection error:', error.message);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const isSocketConnected = (): boolean => isConnected;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
  }
};
