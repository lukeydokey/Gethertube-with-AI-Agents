import React, { useEffect, useRef, useCallback } from 'react';
import type { VideoStateResponse } from '@/types/room.types';
import styles from './VideoPlayer.module.css';

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface VideoPlayerProps {
  videoState: VideoStateResponse | null;
  onPlay?: (currentTime: number) => void;
  onPause?: (currentTime: number) => void;
  onSeek?: (currentTime: number) => void;
}

let ytApiLoaded = false;
let ytApiLoading = false;

function loadYouTubeApi(): Promise<void> {
  if (ytApiLoaded) return Promise.resolve();
  if (ytApiLoading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (ytApiLoaded) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }

  ytApiLoading = true;
  return new Promise((resolve) => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      ytApiLoading = false;
      resolve();
    };
  });
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoState,
  onPlay,
  onPause,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const isRemoteUpdate = useRef(false);

  const initPlayer = useCallback(
    async (videoId: string) => {
      await loadYouTubeApi();

      if (playerRef.current) {
        playerRef.current.destroy();
      }

      if (!containerRef.current) return;

      const playerDiv = document.createElement('div');
      playerDiv.id = 'yt-player';
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(playerDiv);

      playerRef.current = new window.YT.Player('yt-player', {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onStateChange: (event: YT.OnStateChangeEvent) => {
            if (isRemoteUpdate.current) {
              isRemoteUpdate.current = false;
              return;
            }
            const currentTime = event.target.getCurrentTime();
            if (event.data === window.YT.PlayerState.PLAYING) {
              onPlay?.(currentTime);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              onPause?.(currentTime);
            }
          },
        },
      });
    },
    [onPlay, onPause]
  );

  // Initialize or change video
  useEffect(() => {
    if (videoState?.videoId) {
      void initPlayer(videoState.videoId);
    }

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoState?.videoId, initPlayer]);

  // Sync play/pause state from remote
  useEffect(() => {
    if (!playerRef.current || !videoState) return;

    const player = playerRef.current;
    const playerState = player.getPlayerState?.();
    if (playerState === undefined) return;

    isRemoteUpdate.current = true;

    if (videoState.isPlaying && playerState !== window.YT?.PlayerState?.PLAYING) {
      player.seekTo(videoState.currentTime, true);
      player.playVideo();
    } else if (!videoState.isPlaying && playerState === window.YT?.PlayerState?.PLAYING) {
      player.seekTo(videoState.currentTime, true);
      player.pauseVideo();
    } else {
      const currentTime = player.getCurrentTime?.() ?? 0;
      const timeDiff = Math.abs(currentTime - videoState.currentTime);
      if (timeDiff > 2) {
        player.seekTo(videoState.currentTime, true);
      }
    }
  }, [videoState?.isPlaying, videoState?.currentTime, videoState]);

  if (!videoState?.videoId) {
    return (
      <div className={styles.placeholder}>
        <p className={styles.placeholderText}>
          재생 중인 영상이 없습니다.
        </p>
        <p className={styles.placeholderSubtext}>
          플레이리스트에서 영상을 추가해주세요.
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className={styles.container} />;
};

export default VideoPlayer;
