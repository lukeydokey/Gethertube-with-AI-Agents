import React, { useState } from 'react';
import { Avatar } from '@/components/common/Avatar';
import { ReactionBar } from '@/components/chat/ReactionBar';
import { ReactionPicker } from '@/components/chat/ReactionPicker';
import type { MessageResponse, ReactionEmoji } from '@/types/chat.types';
import styles from './ChatMessage.module.css';

interface ChatMessageProps {
  message: MessageResponse;
  isOwn: boolean;
  onAddReaction: (messageId: string, emoji: ReactionEmoji) => void;
  onRemoveReaction: (messageId: string, emoji: ReactionEmoji) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = React.memo(
  ({ message, isOwn, onAddReaction, onRemoveReaction }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    if (message.type === 'SYSTEM') {
      return (
        <div className={styles.systemMessage}>
          <span className={styles.systemText}>{message.content}</span>
        </div>
      );
    }

    const handleAddReaction = (emoji: ReactionEmoji) => {
      onAddReaction(message.id, emoji);
    };

    const handleRemoveReaction = (emoji: ReactionEmoji) => {
      onRemoveReaction(message.id, emoji);
    };

    return (
      <div
        className={`${styles.message} ${isOwn ? styles.own : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {!isOwn && (
          <Avatar
            src={message.userProfileImage}
            name={message.userName}
            size="sm"
          />
        )}
        <div className={styles.bubbleContainer}>
          <div className={styles.bubble}>
            {!isOwn && (
              <span className={styles.userName}>{message.userName}</span>
            )}
            <p className={styles.content}>{message.content}</p>

            {isHovered && (
              <button
                type="button"
                className={styles.reactionButton}
                onClick={() => setShowPicker(!showPicker)}
                aria-label="리액션 추가"
              >
                😊
              </button>
            )}

            {showPicker && (
              <ReactionPicker
                onSelect={handleAddReaction}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>

          {message.reactions && message.reactions.length > 0 && (
            <ReactionBar
              reactions={message.reactions}
              onAddReaction={handleAddReaction}
              onRemoveReaction={handleRemoveReaction}
            />
          )}
        </div>
      </div>
    );
  },
);

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
