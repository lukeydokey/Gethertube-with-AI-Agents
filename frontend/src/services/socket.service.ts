import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socket.types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

let socket: TypedSocket | null = null;

/**
 * Socket.IO client service
 */
export const socketService = {
  /**
   * Connect to WebSocket server with JWT authentication
   */
  connect(token: string): TypedSocket {
    if (socket?.connected) {
      return socket;
    }

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    }) as TypedSocket;

    return socket;
  },

  /**
   * Get current socket instance
   */
  getSocket(): TypedSocket | null {
    return socket;
  },

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return socket?.connected ?? false;
  },
};

export default socketService;
