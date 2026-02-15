import React from 'react';
import { getYouTubeThumbnail, formatDuration } from '@/utils/youtube.utils';
import type { PlaylistItemResponse } from '@/types/playlist.types';
import styles from './PlaylistItem.module.css';

interface PlaylistItemProps {
  item: PlaylistItemResponse;
  isPlaying: boolean;
  onRemove: (itemId: string) => void;
}

export const PlaylistItem: React.FC<PlaylistItemProps> = React.memo(({
  item,
  isPlaying,
  onRemove,
}) => {
  return (
    <div className={`${styles.item} ${isPlaying ? styles.playing : ''}`}>
      <img
        src={item.thumbnail || getYouTubeThumbnail(item.videoId)}
        alt={item.title}
        className={styles.thumbnail}
        loading="lazy"
      />
      <div className={styles.itemInfo}>
        <p className={styles.itemTitle}>{item.title}</p>
        <div className={styles.itemMeta}>
          <span>{formatDuration(item.duration)}</span>
          <span>{item.addedBy.name}</span>
        </div>
      </div>
      <button
        type="button"
        className={styles.removeButton}
        onClick={() => onRemove(item.id)}
        aria-label={`${item.title} 삭제`}
      >
        &times;
      </button>
    </div>
  );
});

PlaylistItem.displayName = 'PlaylistItem';

export default PlaylistItem;
