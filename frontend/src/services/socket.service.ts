/**
 * Socket.IO client service
 * Manages WebSocket connections with automatic JWT authentication
 */

import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Socket namespace types
 */
export type SocketNamespace = 'rooms' | 'chat' | 'video' | 'playlist';

/**
 * Socket connection options
 */
interface SocketOptions {
  token: string | null;
  autoConnect?: boolean;
}

/**
 * Socket service class for managing WebSocket connections
 */
class SocketService {
  private sockets: Map<SocketNamespace, Socket> = new Map();
  private token: string | null = null;

  /**
   * Set JWT token for all socket connections
   */
  setToken(token: string | null): void {
    this.token = token;

    // Update auth for existing connections
    this.sockets.forEach((socket) => {
      if (token) {
        socket.auth = { token };
        // Reconnect if already connected
        if (socket.connected) {
          socket.disconnect();
          socket.connect();
        }
      } else {
        // Disconnect if token is removed
        socket.disconnect();
      }
    });
  }

  /**
   * Get or create socket connection for a namespace
   */
  getSocket(namespace: SocketNamespace, options?: SocketOptions): Socket {
    const existingSocket = this.sockets.get(namespace);

    if (existingSocket) {
      return existingSocket;
    }

    const token = options?.token ?? this.token;

    if (!token) {
      throw new Error(`Cannot create socket connection without token for namespace: ${namespace}`);
    }

    const socket = io(`${API_BASE_URL}/${namespace}`, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: options?.autoConnect ?? false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log(`[Socket] Connected to /${namespace}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected from /${namespace}:`, reason);
    });

    socket.on('connect_error', (error) => {
      console.error(`[Socket] Connection error on /${namespace}:`, error);
    });

    socket.on('error', (error) => {
      console.error(`[Socket] Error on /${namespace}:`, error);
    });

    this.sockets.set(namespace, socket);
    return socket;
  }

  /**
   * Connect to a specific namespace
   */
  connect(namespace: SocketNamespace): void {
    const socket = this.getSocket(namespace);
    if (!socket.connected) {
      socket.connect();
    }
  }

  /**
   * Disconnect from a specific namespace
   */
  disconnect(namespace: SocketNamespace): void {
    const socket = this.sockets.get(namespace);
    if (socket) {
      socket.disconnect();
    }
  }

  /**
   * Disconnect from all namespaces
   */
  disconnectAll(): void {
    this.sockets.forEach((socket) => {
      socket.disconnect();
    });
  }

  /**
   * Remove socket instance from cache
   */
  removeSocket(namespace: SocketNamespace): void {
    const socket = this.sockets.get(namespace);
    if (socket) {
      socket.disconnect();
      socket.removeAllListeners();
      this.sockets.delete(namespace);
    }
  }

  /**
   * Remove all socket instances
   */
  removeAllSockets(): void {
    this.sockets.forEach((socket) => {
      socket.disconnect();
      socket.removeAllListeners();
    });
    this.sockets.clear();
  }

  /**
   * Check if socket is connected
   */
  isConnected(namespace: SocketNamespace): boolean {
    const socket = this.sockets.get(namespace);
    return socket?.connected ?? false;
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }
}

// Export singleton instance
export const socketService = new SocketService();

export default socketService;
