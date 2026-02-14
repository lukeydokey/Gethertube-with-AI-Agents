import React from 'react';
import { Avatar } from '@/components/common/Avatar';
import type { MessageResponse } from '@/types/chat.types';
import styles from './ChatMessage.module.css';

interface ChatMessageProps {
  message: MessageResponse;
  isOwn: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwn }) => {
  if (message.type === 'SYSTEM') {
    return (
      <div className={styles.systemMessage}>
        <span className={styles.systemText}>{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.message} ${isOwn ? styles.own : ''}`}>
      {!isOwn && (
        <Avatar
          src={message.userProfileImage}
          name={message.userName}
          size="sm"
        />
      )}
      <div className={styles.bubble}>
        {!isOwn && <span className={styles.userName}>{message.userName}</span>}
        <p className={styles.content}>{message.content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
