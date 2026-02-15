import React, { useEffect, useRef } from 'react';
import { REACTION_EMOJIS, type ReactionEmoji } from '@/types/chat.types';
import styles from './ReactionPicker.module.css';

interface ReactionPickerProps {
  onSelect: (emoji: ReactionEmoji) => void;
  onClose: () => void;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = React.memo(({
  onSelect,
  onClose,
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleSelect = (emoji: ReactionEmoji) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <div ref={pickerRef} className={styles.container} role="dialog" aria-label="리액션 선택">
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className={styles.emojiButton}
          onClick={() => handleSelect(emoji)}
          aria-label={`${emoji} 리액션 추가`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
});

ReactionPicker.displayName = 'ReactionPicker';

export default ReactionPicker;
