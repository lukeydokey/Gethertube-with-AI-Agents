/**
 * ChatMessage - Individual chat message component
 */

import React from 'react';
import type { MessageResponse } from '@/types/socket.types';
import { useAuth } from '@/hooks/useAuth';
import styles from './ChatMessage.module.css';

interface ChatMessageProps {
  message: MessageResponse;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { user } = useAuth();
  const isOwnMessage = user?.id === message.userId;
  const isSystemMessage = message.type === 'SYSTEM';
  const isEmojiMessage = message.type === 'EMOJI';

  if (isSystemMessage) {
    return (
      <div className={styles.systemMessage}>
        <span className={styles.systemText}>{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.message} ${isOwnMessage ? styles.ownMessage : ''}`}>
      <div className={styles.messageHeader}>
        {message.userProfileImage ? (
          <img
            src={message.userProfileImage}
            alt={message.userName}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {message.userName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className={styles.userName}>{message.userName}</span>
        <span className={styles.timestamp}>{formatTime(message.createdAt)}</span>
      </div>

      <div className={`${styles.messageContent} ${isEmojiMessage ? styles.emojiContent : ''}`}>
        {message.content}
      </div>
    </div>
  );
};

/**
 * Format timestamp to HH:MM
 */
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default ChatMessage;
