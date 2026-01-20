/**
 * PlaylistItem - Individual playlist item component
 */

import React from 'react';
import type { PlaylistItemResponse } from '@/types/socket.types';
import styles from './PlaylistItem.module.css';

interface PlaylistItemProps {
  item: PlaylistItemResponse;
  isCurrentVideo: boolean;
  onPlay: () => void;
  onRemove: () => void;
  canRemove: boolean;
}

export const PlaylistItem: React.FC<PlaylistItemProps> = ({
  item,
  isCurrentVideo,
  onPlay,
  onRemove,
  canRemove,
}) => {
  /**
   * Format duration as MM:SS
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`${styles.container} ${isCurrentVideo ? styles.current : ''}`}
      onClick={onPlay}
      role="button"
      tabIndex={0}
    >
      <div className={styles.thumbnail}>
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} className={styles.thumbnailImage} />
        ) : (
          <div className={styles.thumbnailPlaceholder}>📹</div>
        )}

        {isCurrentVideo && (
          <div className={styles.playingBadge}>
            <span className={styles.playingIcon}>▶</span>
          </div>
        )}

        <div className={styles.durationBadge}>{formatDuration(item.duration)}</div>
      </div>

      <div className={styles.info}>
        <p className={styles.title}>{item.title}</p>
        <p className={styles.addedBy}>
          추가: {item.addedBy.name} • 위치: {item.position + 1}
        </p>
      </div>

      {canRemove && (
        <button
          className={styles.removeButton}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove from playlist"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default PlaylistItem;
