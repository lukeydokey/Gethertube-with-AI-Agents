/**
 * useChat hook
 * Provides chat functionality for a room
 */

import { useCallback, useEffect, useState } from 'react';
import { useSocketContext } from '@/store/SocketContext';
import { useRoom } from './useRoom';
import type {
  SendMessagePayload,
  MessageResponse,
  UserTypingPayload,
  SocketError,
} from '@/types/socket.types';

interface UseChatReturn {
  // State
  messages: MessageResponse[];
  typingUsers: string[]; // User names who are typing
  isLoading: boolean;
  error: string | null;

  // Actions
  sendMessage: (content: string, type?: 'TEXT' | 'SYSTEM' | 'EMOJI') => void;
  startTyping: () => void;
  stopTyping: () => void;
  clearError: () => void;
}

export const useChat = (): UseChatReturn => {
  const { getChatSocket } = useSocketContext();
  const { currentRoomId, messages: roomMessages } = useRoom();

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send a chat message
   */
  const sendMessage = useCallback(
    (content: string, type: 'TEXT' | 'SYSTEM' | 'EMOJI' = 'TEXT') => {
      if (!currentRoomId) {
        setError('방에 참여하지 않았습니다');
        return;
      }

      const socket = getChatSocket();
      if (!socket) {
        setError('채팅 연결이 없습니다');
        return;
      }

      const payload: SendMessagePayload = {
        roomId: currentRoomId,
        content,
        type,
      };

      socket.emit('send_message', payload);
    },
    [currentRoomId, getChatSocket]
  );

  /**
   * Start typing indicator
   */
  const startTyping = useCallback(() => {
    if (!currentRoomId) return;

    const socket = getChatSocket();
    if (!socket) return;

    socket.emit('typing_start', { roomId: currentRoomId });
  }, [currentRoomId, getChatSocket]);

  /**
   * Stop typing indicator
   */
  const stopTyping = useCallback(() => {
    if (!currentRoomId) return;

    const socket = getChatSocket();
    if (!socket) return;

    socket.emit('typing_stop', { roomId: currentRoomId });
  }, [currentRoomId, getChatSocket]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Set up event listeners
   */
  useEffect(() => {
    const socket = getChatSocket();
    if (!socket) return;

    // User started typing
    const handleUserTyping = (payload: UserTypingPayload) => {
      setTypingUsers((prev) => {
        if (prev.includes(payload.userName)) return prev;
        return [...prev, payload.userName];
      });
    };

    // User stopped typing
    const handleUserStoppedTyping = (payload: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((name) => name !== payload.userId));
    };

    // Error occurred
    const handleError = (socketError: SocketError) => {
      setError(socketError.message);
    };

    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('error', handleError);

    return () => {
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('error', handleError);
    };
  }, [getChatSocket]);

  /**
   * Auto-clear typing users after timeout
   */
  useEffect(() => {
    if (typingUsers.length === 0) return;

    const timeout = setTimeout(() => {
      setTypingUsers([]);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [typingUsers]);

  return {
    messages: roomMessages,
    typingUsers,
    isLoading: false,
    error,
    sendMessage,
    startTyping,
    stopTyping,
    clearError,
  };
};

export default useChat;
