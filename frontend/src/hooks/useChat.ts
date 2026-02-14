import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from './useSocket';
import type { MessageResponse, MessageType } from '@/types/chat.types';

interface UseChatReturn {
  messages: MessageResponse[];
  typingUsers: Map<string, string>;
  sendMessage: (content: string, type?: MessageType) => void;
  startTyping: () => void;
  stopTyping: () => void;
}

export const useChat = (roomId: string): UseChatReturn => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (payload: { message: MessageResponse }) => {
      setMessages((prev) => [...prev, payload.message]);
    };

    const handleUserTyping = (payload: { userId: string; userName: string }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(payload.userId, payload.userName);
        return next;
      });
    };

    const handleUserStoppedTyping = (payload: { userId: string }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(payload.userId);
        return next;
      });
    };

    const handleMessageDeleted = (payload: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket]);

  const sendMessage = useCallback(
    (content: string, type?: MessageType) => {
      if (!socket || !content.trim()) return;
      socket.emit('send_message', { roomId, content: content.trim(), type });
    },
    [socket, roomId]
  );

  const startTyping = useCallback(() => {
    if (!socket) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.emit('typing_start', { roomId });

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { roomId });
    }, 3000);
  }, [socket, roomId]);

  const stopTyping = useCallback(() => {
    if (!socket) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    socket.emit('typing_stop', { roomId });
  }, [socket, roomId]);

  return { messages, typingUsers, sendMessage, startTyping, stopTyping };
};

export default useChat;
