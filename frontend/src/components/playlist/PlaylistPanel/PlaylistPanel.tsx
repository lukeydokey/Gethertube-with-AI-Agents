import React, { useState } from 'react';
import { Button } from '@/components/common/Button';
import { extractVideoId, getYouTubeThumbnail, formatDuration } from '@/utils/youtube.utils';
import type { PlaylistItemResponse } from '@/types/playlist.types';
import styles from './PlaylistPanel.module.css';

interface AddVideoParams {
  videoId: string;
  title: string;
  thumbnail?: string;
  duration: number;
}

interface PlaylistPanelProps {
  playlist: PlaylistItemResponse[];
  currentVideoId: string | null;
  onAddVideo: (params: AddVideoParams) => void;
  onRemoveVideo: (itemId: string) => void;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
  playlist,
  currentVideoId,
  onAddVideo,
  onRemoveVideo,
  onPlayNext,
  onPlayPrevious,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    const videoId = extractVideoId(urlInput.trim());
    if (!videoId) {
      setInputError('올바른 YouTube URL을 입력해주세요.');
      return;
    }

    setAdding(true);
    try {
      // Fetch video info via YouTube oEmbed API (no API key needed)
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await fetch(oembedUrl);

      let title = `YouTube Video (${videoId})`;
      if (response.ok) {
        const data = await response.json();
        title = data.title || title;
      }

      onAddVideo({
        videoId,
        title,
        thumbnail: getYouTubeThumbnail(videoId),
        duration: 0, // Duration not available via oEmbed; updated by backend if available
      });
      setUrlInput('');
    } catch {
      setInputError('영상 정보를 가져오는데 실패했습니다.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          플레이리스트 ({playlist.length})
        </h3>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.controlButton}
            onClick={onPlayPrevious}
            disabled={playlist.length === 0}
            aria-label="이전"
          >
            &laquo;
          </button>
          <button
            type="button"
            className={styles.controlButton}
            onClick={onPlayNext}
            disabled={playlist.length === 0}
            aria-label="다음"
          >
            &raquo;
          </button>
        </div>
      </div>

      <form className={styles.addForm} onSubmit={handleAddVideo}>
        <input
          type="text"
          className={styles.urlInput}
          placeholder="YouTube URL을 붙여넣기..."
          value={urlInput}
          onChange={(e) => {
            setUrlInput(e.target.value);
            setInputError(null);
          }}
          aria-label="YouTube URL 입력"
        />
        <Button type="submit" variant="primary" size="sm" disabled={!urlInput.trim() || adding} loading={adding}>
          추가
        </Button>
      </form>

      {inputError && <p className={styles.inputError}>{inputError}</p>}

      <div className={styles.list}>
        {playlist.length === 0 && (
          <p className={styles.emptyText}>플레이리스트가 비어있습니다.</p>
        )}
        {playlist.map((item) => (
          <div
            key={item.id}
            className={`${styles.item} ${item.videoId === currentVideoId ? styles.playing : ''}`}
          >
            <img
              src={item.thumbnail || getYouTubeThumbnail(item.videoId)}
              alt={item.title}
              className={styles.thumbnail}
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
              onClick={() => onRemoveVideo(item.id)}
              aria-label={`${item.title} 삭제`}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistPanel;
