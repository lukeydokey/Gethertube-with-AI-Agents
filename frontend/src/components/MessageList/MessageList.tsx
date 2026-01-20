/**
 * MessageList - Scrollable list of chat messages
 */

import React, { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from '@/components/ChatMessage';
import styles from './MessageList.module.css';

export const MessageList: React.FC = () => {
  const { messages, typingUsers } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={styles.container} ref={containerRef}>
      {messages.length === 0 ? (
        <div className={styles.empty}>
          <p>아직 메시지가 없습니다.</p>
          <p className={styles.emptyHint}>첫 메시지를 보내보세요!</p>
        </div>
      ) : (
        <div className={styles.messageList}>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {typingUsers.length > 0 && (
            <div className={styles.typingIndicator}>
              <div className={styles.typingDots}>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className={styles.typingText}>
                {typingUsers.length === 1
                  ? `${typingUsers[0]}님이 입력 중...`
                  : `${typingUsers.length}명이 입력 중...`}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default MessageList;
