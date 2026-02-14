import React, { createContext, useCallback, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { socketService } from '@/services/socket.service';
import type { NamespaceType } from '@/services/socket.service';
import type { SocketState } from '@/types/socket.types';

interface SocketContextValue extends SocketState {
  roomsSocket: Socket | null;
  chatSocket: Socket | null;
  videoSocket: Socket | null;
  playlistSocket: Socket | null;
  connect: () => void;
  disconnect: () => void;
}

export const SocketContext = createContext<SocketContextValue | undefined>(undefined);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [sockets, setSockets] = useState<Record<NamespaceType, Socket | null>>({
    rooms: null,
    chat: null,
    video: null,
    playlist: null,
  });
  const [state, setState] = useState<SocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const connect = useCallback(() => {
    if (!token) return;

    setState({ isConnected: false, isConnecting: true, error: null });

    const allSockets = socketService.connectAll(token);
    const roomsSock = allSockets.get('rooms') ?? null;
    const chatSock = allSockets.get('chat') ?? null;
    const videoSock = allSockets.get('video') ?? null;
    const playlistSock = allSockets.get('playlist') ?? null;

    setSockets({ rooms: roomsSock, chat: chatSock, video: videoSock, playlist: playlistSock });

    // Track connection state via the rooms socket (primary)
    if (roomsSock) {
      roomsSock.on('connect', () => {
        setState({ isConnected: true, isConnecting: false, error: null });
      });

      roomsSock.on('disconnect', () => {
        setState({ isConnected: false, isConnecting: false, error: null });
      });

      roomsSock.on('connect_error', (err) => {
        setState({ isConnected: false, isConnecting: false, error: err.message });
      });
    }
  }, [token]);

  const disconnect = useCallback(() => {
    socketService.disconnectAll();
    setSockets({ rooms: null, chat: null, video: null, playlist: null });
    setState({ isConnected: false, isConnecting: false, error: null });
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, connect, disconnect]);

  return (
    <SocketContext.Provider
      value={{
        ...state,
        roomsSocket: sockets.rooms,
        chatSocket: sockets.chat,
        videoSocket: sockets.video,
        playlistSocket: sockets.playlist,
        connect,
        disconnect,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
