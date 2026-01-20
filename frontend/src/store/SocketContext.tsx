/**
 * SocketContext - Manages Socket.IO connections
 * Automatically connects/disconnects based on authentication state
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import socketService, { SocketNamespace } from '@/services/socket.service';
import type { SocketConnectionState } from '@/types/socket.types';

interface SocketContextValue {
  // Connection state
  rooms: SocketConnectionState;
  chat: SocketConnectionState;
  video: SocketConnectionState;
  playlist: SocketConnectionState;

  // Socket instances
  getRoomsSocket: () => Socket | null;
  getChatSocket: () => Socket | null;
  getVideoSocket: () => Socket | null;
  getPlaylistSocket: () => Socket | null;

  // Connection management
  connectAll: () => void;
  disconnectAll: () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();

  // Connection states for each namespace
  const [rooms, setRooms] = useState<SocketConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const [chat, setChat] = useState<SocketConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const [video, setVideo] = useState<SocketConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const [playlist, setPlaylist] = useState<SocketConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  /**
   * Initialize socket connections when authenticated
   */
  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketService.disconnectAll();
      return;
    }

    // Helper function to get state setter for each namespace
    const getStateSetter = (
      namespace: SocketNamespace
    ): React.Dispatch<React.SetStateAction<SocketConnectionState>> => {
      switch (namespace) {
        case 'rooms':
          return setRooms;
        case 'chat':
          return setChat;
        case 'video':
          return setVideo;
        case 'playlist':
          return setPlaylist;
      }
    };

    // Set token for all socket connections
    socketService.setToken(token);

    // Initialize sockets for all namespaces
    const namespaces: SocketNamespace[] = ['rooms', 'chat', 'video', 'playlist'];

    namespaces.forEach((namespace) => {
      try {
        const socket = socketService.getSocket(namespace, { token, autoConnect: true });

        // Update state based on namespace
        const setStateForNamespace = getStateSetter(namespace);

        socket.on('connect', () => {
          setStateForNamespace({
            isConnected: true,
            isConnecting: false,
            error: null,
          });
        });

        socket.on('disconnect', () => {
          setStateForNamespace({
            isConnected: false,
            isConnecting: false,
            error: null,
          });
        });

        socket.on('connect_error', (error: Error) => {
          setStateForNamespace({
            isConnected: false,
            isConnecting: false,
            error: error.message,
          });
        });

        // Connect the socket
        socket.connect();

        setStateForNamespace({
          isConnected: false,
          isConnecting: true,
          error: null,
        });
      } catch (error) {
        console.error(`Failed to initialize socket for namespace ${namespace}:`, error);
        const setStateForNamespace = getStateSetter(namespace);
        setStateForNamespace({
          isConnected: false,
          isConnecting: false,
          error: error instanceof Error ? error.message : 'Failed to initialize socket',
        });
      }
    });

    // Cleanup on unmount or when auth changes
    return () => {
      socketService.disconnectAll();
    };
  }, [isAuthenticated, token]);

  /**
   * Get socket instance for rooms namespace
   */
  const getRoomsSocket = (): Socket | null => {
    try {
      return socketService.getSocket('rooms');
    } catch {
      return null;
    }
  };

  /**
   * Get socket instance for chat namespace
   */
  const getChatSocket = (): Socket | null => {
    try {
      return socketService.getSocket('chat');
    } catch {
      return null;
    }
  };

  /**
   * Get socket instance for video namespace
   */
  const getVideoSocket = (): Socket | null => {
    try {
      return socketService.getSocket('video');
    } catch {
      return null;
    }
  };

  /**
   * Get socket instance for playlist namespace
   */
  const getPlaylistSocket = (): Socket | null => {
    try {
      return socketService.getSocket('playlist');
    } catch {
      return null;
    }
  };

  /**
   * Connect all sockets
   */
  const connectAll = (): void => {
    if (!token) return;

    const namespaces: SocketNamespace[] = ['rooms', 'chat', 'video', 'playlist'];
    namespaces.forEach((namespace) => {
      socketService.connect(namespace);
    });
  };

  /**
   * Disconnect all sockets
   */
  const disconnectAll = (): void => {
    socketService.disconnectAll();
  };

  const value: SocketContextValue = {
    rooms,
    chat,
    video,
    playlist,
    getRoomsSocket,
    getChatSocket,
    getVideoSocket,
    getPlaylistSocket,
    connectAll,
    disconnectAll,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

/**
 * Hook to access socket context
 */
export const useSocketContext = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};

export default SocketProvider;
