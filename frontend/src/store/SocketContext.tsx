import React, { createContext, useCallback, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { socketService } from '@/services/socket.service';
import type { ServerToClientEvents, ClientToServerEvents, SocketState } from '@/types/socket.types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue extends SocketState {
  socket: TypedSocket | null;
  connect: () => void;
  disconnect: () => void;
}

export const SocketContext = createContext<SocketContextValue | undefined>(undefined);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [state, setState] = useState<SocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const connect = useCallback(() => {
    if (!token) return;

    setState({ isConnected: false, isConnecting: true, error: null });
    const sock = socketService.connect(token);
    setSocket(sock);

    sock.on('connect', () => {
      setState({ isConnected: true, isConnecting: false, error: null });
    });

    sock.on('disconnect', () => {
      setState({ isConnected: false, isConnecting: false, error: null });
    });

    sock.on('connect_error', (err) => {
      setState({ isConnected: false, isConnecting: false, error: err.message });
    });
  }, [token]);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setSocket(null);
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
    <SocketContext.Provider value={{ ...state, socket, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
