/**
 * VideoControls - Custom video player controls
 */

import React, { useState, useEffect } from 'react';
import type { VideoStateResponse } from '@/types/socket.types';
import styles from './VideoControls.module.css';

interface VideoControlsProps {
  videoState: VideoStateResponse;
  onSeek: (time: number) => void;
  onPlayPause: () => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  videoState,
  onSeek,
  onPlayPause,
}) => {
  const [currentTime, setCurrentTime] = useState(videoState.currentTime);
  const [isSeeking, setIsSeeking] = useState(false);

  /**
   * Update current time from video state
   */
  useEffect(() => {
    if (!isSeeking) {
      setCurrentTime(videoState.currentTime);
    }
  }, [videoState.currentTime, isSeeking]);

  /**
   * Handle seek bar change
   */
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    setIsSeeking(true);
  };

  /**
   * Handle seek bar mouse up (commit seek)
   */
  const handleSeekEnd = () => {
    setIsSeeking(false);
    onSeek(currentTime);
  };

  /**
   * Format time as MM:SS
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        <div className={styles.videoInfo}>
          {videoState.videoThumbnail && (
            <img
              src={videoState.videoThumbnail}
              alt={videoState.videoTitle || 'Video'}
              className={styles.thumbnail}
            />
          )}
          <div className={styles.videoDetails}>
            <p className={styles.videoTitle}>{videoState.videoTitle || 'Untitled Video'}</p>
            <p className={styles.videoTime}>
              {formatTime(currentTime)} / {formatTime(videoState.currentTime)}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <button className={styles.playButton} onClick={onPlayPause} aria-label="Play/Pause">
          {videoState.isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <div className={styles.seekBar}>
          <input
            type="range"
            min="0"
            max={videoState.currentTime + 300}
            step="0.1"
            value={currentTime}
            onChange={handleSeekChange}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            className={styles.seekInput}
          />
        </div>

        <div className={styles.timeDisplay}>
          <span>{formatTime(currentTime)}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Play icon SVG
 */
const PlayIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

/**
 * Pause icon SVG
 */
const PauseIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
  </svg>
);

export default VideoControls;
