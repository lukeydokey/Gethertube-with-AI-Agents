/**
 * PlaylistPanel - Playlist management panel
 */

import React, { useState } from 'react';
import { usePlaylist } from '@/hooks/usePlaylist';
import { useVideoSync } from '@/hooks/useVideoSync';
import { PlaylistItem } from '@/components/PlaylistItem';
import styles from './PlaylistPanel.module.css';

export const PlaylistPanel: React.FC = () => {
  const { playlist, currentVideo, addVideo, removeVideo, playNext, playPrevious, hasNext, hasPrevious, error, clearError } = usePlaylist();
  const { changeVideo } = useVideoSync();
  const [videoUrl, setVideoUrl] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);

  /**
   * Extract video ID from YouTube URL
   */
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // If it's just a video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }

    return null;
  };

  /**
   * Handle add video
   */
  const handleAddVideo = () => {
    const videoId = extractVideoId(videoUrl.trim());

    if (!videoId) {
      alert('유효한 YouTube URL 또는 비디오 ID를 입력하세요.');
      return;
    }

    setIsAddingVideo(true);
    addVideo(videoId);
    setVideoUrl('');

    // Reset adding state after a delay
    setTimeout(() => {
      setIsAddingVideo(false);
    }, 1000);
  };

  /**
   * Handle play video from playlist
   */
  const handlePlayVideo = (videoId: string) => {
    changeVideo(videoId);
  };

  /**
   * Handle remove video
   */
  const handleRemoveVideo = (itemId: string) => {
    if (window.confirm('플레이리스트에서 이 영상을 제거하시겠습니까?')) {
      removeVideo(itemId);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>플레이리스트</h3>
        <span className={styles.count}>{playlist.length}개</span>
      </div>

      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={clearError} className={styles.errorClose}>
            ✕
          </button>
        </div>
      )}

      <div className={styles.addSection}>
        <input
          type="text"
          className={styles.input}
          placeholder="YouTube URL 또는 비디오 ID"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
        />
        <button
          className={styles.addButton}
          onClick={handleAddVideo}
          disabled={!videoUrl.trim() || isAddingVideo}
        >
          {isAddingVideo ? '추가 중...' : '추가'}
        </button>
      </div>

      <div className={styles.navigation}>
        <button
          className={styles.navButton}
          onClick={playPrevious}
          disabled={!hasPrevious}
        >
          ← 이전
        </button>
        <button
          className={styles.navButton}
          onClick={playNext}
          disabled={!hasNext}
        >
          다음 →
        </button>
      </div>

      <div className={styles.playlistContent}>
        {playlist.length === 0 ? (
          <div className={styles.empty}>
            <p>플레이리스트가 비어있습니다.</p>
            <p className={styles.emptyHint}>YouTube 영상을 추가해보세요!</p>
          </div>
        ) : (
          <div className={styles.playlistList}>
            {playlist.map((item) => (
              <PlaylistItem
                key={item.id}
                item={item}
                isCurrentVideo={currentVideo?.id === item.id}
                onPlay={() => handlePlayVideo(item.videoId)}
                onRemove={() => handleRemoveVideo(item.id)}
                canRemove={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistPanel;
