import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export type NamespaceType = 'rooms' | 'chat' | 'video' | 'playlist';

const sockets = new Map<NamespaceType, Socket>();

const SOCKET_OPTIONS = {
  transports: ['websocket', 'polling'] as string[],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
};

/**
 * Socket.IO client service with namespace support
 * Backend uses separate namespaces: /rooms, /chat, /video, /playlist
 */
export const socketService = {
  /**
   * Connect to a specific namespace with JWT authentication
   */
  connectNamespace(namespace: NamespaceType, token: string): Socket {
    const existing = sockets.get(namespace);
    if (existing?.connected) {
      return existing;
    }

    // Disconnect old socket if exists but not connected
    existing?.disconnect();

    const socket = io(`${SOCKET_URL}/${namespace}`, {
      auth: { token },
      ...SOCKET_OPTIONS,
    });

    sockets.set(namespace, socket);
    return socket;
  },

  /**
   * Connect to all 4 namespaces
   */
  connectAll(token: string): Map<NamespaceType, Socket> {
    const namespaces: NamespaceType[] = ['rooms', 'chat', 'video', 'playlist'];
    for (const ns of namespaces) {
      this.connectNamespace(ns, token);
    }
    return sockets;
  },

  /**
   * Get socket for a specific namespace
   */
  getSocket(namespace: NamespaceType): Socket | null {
    return sockets.get(namespace) ?? null;
  },

  /**
   * Disconnect a specific namespace
   */
  disconnectNamespace(namespace: NamespaceType): void {
    const socket = sockets.get(namespace);
    if (socket) {
      socket.disconnect();
      sockets.delete(namespace);
    }
  },

  /**
   * Disconnect all namespaces
   */
  disconnectAll(): void {
    for (const [ns, socket] of sockets) {
      socket.disconnect();
      sockets.delete(ns);
    }
  },

  /**
   * Check if a specific namespace is connected
   */
  isConnected(namespace: NamespaceType): boolean {
    return sockets.get(namespace)?.connected ?? false;
  },
};

export default socketService;
