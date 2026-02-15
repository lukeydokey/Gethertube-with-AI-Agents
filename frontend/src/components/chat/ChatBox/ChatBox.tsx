import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ChatMessage } from '@/components/chat/ChatMessage';
import type { MessageResponse } from '@/types/chat.types';
import styles from './ChatBox.module.css';

interface ChatBoxProps {
  messages: MessageResponse[];
  typingUsers: Map<string, string>;
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  typingUsers,
  onSendMessage,
  onTypingStart,
  onTypingStop,
}) => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;

      onSendMessage(input);
      setInput('');
      onTypingStop();
    },
    [input, onSendMessage, onTypingStop],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
      if (e.target.value.trim()) {
        onTypingStart();
      } else {
        onTypingStop();
      }
    },
    [onTypingStart, onTypingStop],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  const typingNames = useMemo(
    () =>
      Array.from(typingUsers.values()).filter((name) => name !== user?.name),
    [typingUsers, user?.name],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>채팅</h3>
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <p className={styles.emptyText}>아직 메시지가 없습니다.</p>
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isOwn={msg.userId === user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {typingNames.length > 0 && (
        <div className={styles.typing}>
          {typingNames.length === 1
            ? `${typingNames[0]}님이 입력 중...`
            : `${typingNames.length}명이 입력 중...`}
        </div>
      )}

      <form className={styles.inputArea} onSubmit={handleSubmit}>
        <input
          type="text"
          className={styles.input}
          placeholder="메시지를 입력하세요..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          maxLength={500}
          aria-label="채팅 메시지 입력"
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!input.trim()}
          aria-label="전송"
        >
          전송
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
