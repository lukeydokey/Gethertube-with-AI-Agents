/**
 * MessageInput - Chat message input component with typing indicator
 */

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import styles from './MessageInput.module.css';

export const MessageInput: React.FC = () => {
  const { sendMessage, startTyping, stopTyping } = useChat();
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Start typing indicator
    if (value.trim()) {
      startTyping();

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 2000);
    } else {
      stopTyping();
    }
  };

  /**
   * Handle send message
   */
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    sendMessage(trimmedMessage);
    setMessage('');
    stopTyping();

    // Focus back to input
    inputRef.current?.focus();
  };

  /**
   * Handle key press (Enter to send, Shift+Enter for new line)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, [stopTyping]);

  return (
    <div className={styles.container}>
      <textarea
        ref={inputRef}
        className={styles.input}
        placeholder="메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={1}
        maxLength={500}
      />

      <button
        className={styles.sendButton}
        onClick={handleSend}
        disabled={!message.trim()}
        aria-label="메시지 전송"
      >
        <SendIcon />
      </button>
    </div>
  );
};

/**
 * Send icon SVG
 */
const SendIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

export default MessageInput;
