import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from './useSocket';
import type {
  MessageResponse,
  MessageType,
  ReactionEmoji,
  ReactionAddedEvent,
  ReactionRemovedEvent,
} from '@/types/chat.types';

interface UseChatReturn {
  messages: MessageResponse[];
  typingUsers: Map<string, string>;
  sendMessage: (content: string, type?: MessageType) => void;
  startTyping: () => void;
  stopTyping: () => void;
  addReaction: (messageId: string, emoji: ReactionEmoji) => void;
  removeReaction: (messageId: string, emoji: ReactionEmoji) => void;
}

export const useChat = (roomId: string): UseChatReturn => {
  const { chatSocket } = useSocket();
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(
    new Map(),
  );
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Join the chat room on the /chat namespace
  useEffect(() => {
    if (!chatSocket || !roomId) return;

    chatSocket.emit('join_chat_room', { roomId });
  }, [chatSocket, roomId]);

  useEffect(() => {
    if (!chatSocket) return;

    const handleNewMessage = (payload: { message: MessageResponse }) => {
      setMessages((prev) => [...prev, payload.message]);
    };

    const handleUserTyping = (payload: {
      userId: string;
      userName: string;
    }) => {
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

    const handleReactionAdded = (payload: ReactionAddedEvent) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== payload.messageId) return msg;

          const existingReaction = msg.reactions.find(
            (r) => r.emoji === payload.emoji,
          );

          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions.map((r) =>
                r.emoji === payload.emoji
                  ? {
                      ...r,
                      count: r.count + 1,
                      users: [
                        ...r.users,
                        { userId: payload.userId, userName: payload.userName },
                      ],
                    }
                  : r,
              ),
            };
          }

          return {
            ...msg,
            reactions: [
              ...msg.reactions,
              {
                emoji: payload.emoji,
                count: 1,
                users: [{ userId: payload.userId, userName: payload.userName }],
                hasReacted: false,
              },
            ],
          };
        }),
      );
    };

    const handleReactionRemoved = (payload: ReactionRemovedEvent) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== payload.messageId) return msg;

          return {
            ...msg,
            reactions: msg.reactions
              .map((r) =>
                r.emoji === payload.emoji
                  ? {
                      ...r,
                      count: r.count - 1,
                      users: r.users.filter((u) => u.userId !== payload.userId),
                    }
                  : r,
              )
              .filter((r) => r.count > 0),
          };
        }),
      );
    };

    chatSocket.on('new_message', handleNewMessage);
    chatSocket.on('user_typing', handleUserTyping);
    chatSocket.on('user_stopped_typing', handleUserStoppedTyping);
    chatSocket.on('message_deleted', handleMessageDeleted);
    chatSocket.on('reaction_added', handleReactionAdded);
    chatSocket.on('reaction_removed', handleReactionRemoved);

    return () => {
      chatSocket.off('new_message', handleNewMessage);
      chatSocket.off('user_typing', handleUserTyping);
      chatSocket.off('user_stopped_typing', handleUserStoppedTyping);
      chatSocket.off('message_deleted', handleMessageDeleted);
      chatSocket.off('reaction_added', handleReactionAdded);
      chatSocket.off('reaction_removed', handleReactionRemoved);
    };
  }, [chatSocket]);

  const sendMessage = useCallback(
    (content: string, type?: MessageType) => {
      if (!chatSocket || !content.trim()) return;
      chatSocket.emit('send_message', {
        roomId,
        content: content.trim(),
        type,
      });
    },
    [chatSocket, roomId],
  );

  const startTyping = useCallback(() => {
    if (!chatSocket) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    chatSocket.emit('typing_start', { roomId });

    typingTimeoutRef.current = setTimeout(() => {
      chatSocket.emit('typing_stop', { roomId });
    }, 3000);
  }, [chatSocket, roomId]);

  const stopTyping = useCallback(() => {
    if (!chatSocket) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    chatSocket.emit('typing_stop', { roomId });
  }, [chatSocket, roomId]);

  const addReaction = useCallback(
    (messageId: string, emoji: ReactionEmoji) => {
      if (!chatSocket) return;
      chatSocket.emit('add_reaction', { roomId, messageId, emoji });
    },
    [chatSocket, roomId],
  );

  const removeReaction = useCallback(
    (messageId: string, emoji: ReactionEmoji) => {
      if (!chatSocket) return;
      chatSocket.emit('remove_reaction', { roomId, messageId, emoji });
    },
    [chatSocket, roomId],
  );

  return {
    messages,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    addReaction,
    removeReaction,
  };
};

export default useChat;
