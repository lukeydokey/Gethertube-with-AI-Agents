import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
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

export const SocketContext = createContext<SocketContextValue | undefined>(
  undefined,
);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
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

  // Keep showToastRef up to date to avoid dependency issues
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const connect = useCallback(() => {
    if (!token) return;

    setState({ isConnected: false, isConnecting: true, error: null });

    const allSockets = socketService.connectAll(token);
    const roomsSock = allSockets.get('rooms') ?? null;
    const chatSock = allSockets.get('chat') ?? null;
    const videoSock = allSockets.get('video') ?? null;
    const playlistSock = allSockets.get('playlist') ?? null;

    setSockets({
      rooms: roomsSock,
      chat: chatSock,
      video: videoSock,
      playlist: playlistSock,
    });

    // Track connection state via the rooms socket (primary)
    if (roomsSock) {
      roomsSock.on('connect', () => {
        setState({ isConnected: true, isConnecting: false, error: null });
      });

      roomsSock.on('disconnect', () => {
        setState({ isConnected: false, isConnecting: false, error: null });
      });

      roomsSock.on('connect_error', (err) => {
        setState({
          isConnected: false,
          isConnecting: false,
          error: err.message,
        });
        showToastRef.current(
          '서버 연결에 실패했습니다. 다시 시도 중...',
          'error',
        );
      });

      // Reconnection events (Socket.IO automatically retries)
      roomsSock.io.on('reconnect_attempt', (attempt) => {
        if (attempt > 1) {
          showToastRef.current(
            `서버 재연결 중... (${attempt}번째 시도)`,
            'info',
          );
        }
      });

      roomsSock.io.on('reconnect', () => {
        showToastRef.current('서버에 다시 연결되었습니다.', 'success');
        setState({ isConnected: true, isConnecting: false, error: null });
      });

      roomsSock.io.on('reconnect_failed', () => {
        showToastRef.current(
          '서버 연결에 실패했습니다. 페이지를 새로고침해주세요.',
          'error',
        );
        setState({
          isConnected: false,
          isConnecting: false,
          error: '재연결 실패',
        });
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
