/**
 * ChatBox - Complete chat interface with messages and input
 */

import React from 'react';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { useChat } from '@/hooks/useChat';
import styles from './ChatBox.module.css';

export const ChatBox: React.FC = () => {
  const { error, clearError } = useChat();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>채팅</h3>
      </div>

      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={clearError} className={styles.errorClose}>
            ✕
          </button>
        </div>
      )}

      <div className={styles.content}>
        <MessageList />
      </div>

      <div className={styles.inputSection}>
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatBox;
