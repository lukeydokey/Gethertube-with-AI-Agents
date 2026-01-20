/**
 * VideoPlayer - YouTube player with real-time synchronization
 * Uses YouTube IFrame Player API
 */

import React, { useEffect, useRef, useState } from 'react';
import { useVideoSync } from '@/hooks/useVideoSync';
import { VideoControls } from '@/components/VideoControls';
import styles from './VideoPlayer.module.css';

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const VideoPlayer: React.FC = () => {
  const playerRef = useRef<YT.Player | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isAPIReady, setIsAPIReady] = useState(false);

  const { videoState, play, pause, seek, shouldSync, requestSync } = useVideoSync();

  /**
   * Load YouTube IFrame API
   */
  useEffect(() => {
    if (window.YT) {
      setIsAPIReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsAPIReady(true);
    };
  }, []);

  /**
   * Initialize YouTube player
   */
  useEffect(() => {
    if (!isAPIReady || !playerContainerRef.current) return;

    /**
     * Handle player ready
     */
    const handlePlayerReady = () => {
      setIsPlayerReady(true);
      requestSync();
    };

    /**
     * Handle player state change
     */
    const handlePlayerStateChange = (event: YT.OnStateChangeEvent) => {
      const player = playerRef.current;
      if (!player) return;

      const currentTime = player.getCurrentTime();

      // When user manually plays/pauses
      if (event.data === window.YT.PlayerState.PLAYING) {
        play(currentTime);
      } else if (event.data === window.YT.PlayerState.PAUSED) {
        pause(currentTime);
      }
    };

    playerRef.current = new window.YT.Player(playerContainerRef.current, {
      width: '100%',
      height: '100%',
      videoId: videoState?.videoId || undefined,
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: handlePlayerReady,
        onStateChange: handlePlayerStateChange,
      },
    });

    return () => {
      playerRef.current?.destroy();
    };
  }, [isAPIReady, videoState?.videoId, requestSync, play, pause]);

  /**
   * Sync player with server state
   */
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current || !videoState) return;

    const player = playerRef.current;

    // Change video if different
    if (videoState.videoId && player.getVideoData().video_id !== videoState.videoId) {
      player.loadVideoById(videoState.videoId, videoState.currentTime);
      return;
    }

    // Sync playback state
    const playerState = player.getPlayerState();
    const isPlaying = playerState === window.YT.PlayerState.PLAYING;

    if (videoState.isPlaying && !isPlaying) {
      player.playVideo();
    } else if (!videoState.isPlaying && isPlaying) {
      player.pauseVideo();
    }

    // Sync current time if out of sync
    const currentTime = player.getCurrentTime();
    if (shouldSync(currentTime, 2.0)) {
      player.seekTo(videoState.currentTime, true);
    }

    // Sync playback rate
    if (player.getPlaybackRate() !== videoState.playbackRate) {
      player.setPlaybackRate(videoState.playbackRate);
    }
  }, [videoState, isPlayerReady, shouldSync]);

  /**
   * Handle seek from controls
   */
  const handleSeek = (time: number) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(time, true);
    seek(time);
  };

  /**
   * Handle play/pause from controls
   */
  const handlePlayPause = () => {
    if (!playerRef.current) return;

    const player = playerRef.current;
    const currentTime = player.getCurrentTime();
    const playerState = player.getPlayerState();

    if (playerState === window.YT.PlayerState.PLAYING) {
      player.pauseVideo();
      pause(currentTime);
    } else {
      player.playVideo();
      play(currentTime);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.playerWrapper}>
        {!videoState?.videoId ? (
          <div className={styles.placeholder}>
            <div className={styles.placeholderContent}>
              <span className={styles.placeholderIcon}>📺</span>
              <p className={styles.placeholderText}>플레이리스트에서 영상을 선택하세요</p>
            </div>
          </div>
        ) : (
          <div ref={playerContainerRef} className={styles.player}></div>
        )}
      </div>

      {videoState?.videoId && (
        <VideoControls
          videoState={videoState}
          onSeek={handleSeek}
          onPlayPause={handlePlayPause}
        />
      )}
    </div>
  );
};

export default VideoPlayer;
