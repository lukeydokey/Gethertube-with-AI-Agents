import React, { useState } from 'react';
import type { ReactionGroup, ReactionEmoji } from '@/types/chat.types';
import styles from './ReactionBar.module.css';

interface ReactionBarProps {
  reactions: ReactionGroup[];
  onAddReaction: (emoji: ReactionEmoji) => void;
  onRemoveReaction: (emoji: ReactionEmoji) => void;
}

export const ReactionBar: React.FC<ReactionBarProps> = React.memo(({
  reactions,
  onAddReaction,
  onRemoveReaction,
}) => {
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);

  if (reactions.length === 0) {
    return null;
  }

  const handleReactionClick = (reaction: ReactionGroup) => {
    if (reaction.hasReacted) {
      onRemoveReaction(reaction.emoji as ReactionEmoji);
    } else {
      onAddReaction(reaction.emoji as ReactionEmoji);
    }
  };

  return (
    <div className={styles.container}>
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          className={`${styles.reactionButton} ${
            reaction.hasReacted ? styles.active : ''
          }`}
          onClick={() => handleReactionClick(reaction)}
          onMouseEnter={() => setHoveredReaction(reaction.emoji)}
          onMouseLeave={() => setHoveredReaction(null)}
          aria-label={`${reaction.emoji} ${reaction.count}개, 눌러서 토글`}
        >
          <span className={styles.emoji}>{reaction.emoji}</span>
          <span className={styles.count}>{reaction.count}</span>

          {hoveredReaction === reaction.emoji && reaction.users.length > 0 && (
            <div className={styles.tooltip} role="tooltip">
              {reaction.users.map((user, idx) => (
                <span key={user.userId}>
                  {user.userName}
                  {idx < reaction.users.length - 1 && ', '}
                </span>
              ))}
            </div>
          )}
        </button>
      ))}
    </div>
  );
});

ReactionBar.displayName = 'ReactionBar';

export default ReactionBar;
