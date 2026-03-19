import React, { useEffect, useRef, useCallback, useState } from 'react';
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
  canInteract?: boolean;
  suppressAuthorityEvents?: boolean;
  onResync?: () => void;
  onPlay?: (currentTime: number) => void;
  onPause?: (currentTime: number) => void;
  onSeek?: (currentTime: number) => void;
}

const LIVE_PROMPT_THRESHOLD_SECONDS = 3;
const DRIFT_CHECK_INTERVAL_MS = 1500;

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

    if (firstScriptTag?.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      (document.head || document.body || document.documentElement).appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      ytApiLoading = false;
      resolve();
    };
  });
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoState,
  canInteract = true,
  suppressAuthorityEvents = false,
  onResync,
  onPlay,
  onPause,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const isRemoteUpdate = useRef(false);
  const latestVideoStateRef = useRef<VideoStateResponse | null>(videoState);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const currentVideoIdRef = useRef<string | null>(videoState?.videoId ?? null);
  const [localVolume, setLocalVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [displayTime, setDisplayTime] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [driftSeconds, setDriftSeconds] = useState<number | null>(null);

  const projectVideoTime = useCallback((state: VideoStateResponse) => {
    if (!state.isPlaying) {
      return state.currentTime;
    }

    const lastUpdated = new Date(state.lastUpdated).getTime();
    const elapsedSeconds = Math.max(0, (Date.now() - lastUpdated) / 1000);
    return state.currentTime + elapsedSeconds * state.playbackRate;
  }, []);

  useEffect(() => {
    latestVideoStateRef.current = videoState;
  }, [videoState]);

  useEffect(() => {
    if (!videoState) {
      setDisplayTime(0);
      return;
    }

    const getProjectedTime = () => {
      return projectVideoTime(videoState);
    };

    setDisplayTime(getProjectedTime());

    if (!videoState.isPlaying) {
      return;
    }

    const interval = window.setInterval(() => {
      setDisplayTime(getProjectedTime());
    }, 250);

    return () => {
      window.clearInterval(interval);
    };
  }, [projectVideoTime, videoState]);

  useEffect(() => {
    onPlayRef.current = onPlay;
  }, [onPlay]);

  useEffect(() => {
    onPauseRef.current = onPause;
  }, [onPause]);

  const applyVideoState = useCallback(
    (player: YT.Player, nextVideoState: VideoStateResponse) => {
      const playerState = player.getPlayerState?.();
      if (playerState === undefined) return;

      isRemoteUpdate.current = true;

      if (currentVideoIdRef.current !== nextVideoState.videoId) {
        currentVideoIdRef.current = nextVideoState.videoId;

        if (!nextVideoState.videoId) {
          return;
        }

        if (nextVideoState.isPlaying) {
          player.loadVideoById({
            videoId: nextVideoState.videoId,
            startSeconds: nextVideoState.currentTime,
          });
        } else {
          player.cueVideoById({
            videoId: nextVideoState.videoId,
            startSeconds: nextVideoState.currentTime,
          });
        }
        return;
      }

      player.seekTo(nextVideoState.currentTime, true);

      if (nextVideoState.isPlaying) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    },
    [],
  );

  const syncLocalAudioState = useCallback((player: YT.Player) => {
    const volume = player.getVolume?.();
    const muted = player.isMuted?.();

    if (typeof volume === 'number') {
      setLocalVolume(volume);
    }

    if (typeof muted === 'boolean') {
      setIsMuted(muted);
    }
  }, []);

  const evaluateDrift = useCallback(() => {
    const shouldTrackDrift = !canInteract || suppressAuthorityEvents;

    if (!shouldTrackDrift || !videoState || !videoState.isPlaying || !playerRef.current) {
      setDriftSeconds(null);
      return;
    }

    const localTime = playerRef.current.getCurrentTime?.();

    if (typeof localTime !== 'number') {
      return;
    }

    const drift = projectVideoTime(videoState) - localTime;

    if (Math.abs(drift) >= LIVE_PROMPT_THRESHOLD_SECONDS) {
      setDriftSeconds(drift);
      return;
    }

    setDriftSeconds(null);
  }, [canInteract, projectVideoTime, suppressAuthorityEvents, videoState]);

  const initPlayer = useCallback(
    async (videoId: string) => {
      await loadYouTubeApi();

      if (playerRef.current || !containerRef.current) return;

      const playerDiv = document.createElement('div');
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(playerDiv);
      currentVideoIdRef.current = videoId;

      playerRef.current = new window.YT.Player(playerDiv, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: canInteract ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
          playsinline: 1,
          disablekb: canInteract ? 0 : 1,
        },
        events: {
          onReady: (event: YT.PlayerEvent) => {
            const iframe = event.target.getIframe?.();
            iframe?.setAttribute('tabindex', canInteract ? '0' : '-1');
            syncLocalAudioState(event.target);
            setIsPlayerReady(true);

            const nextVideoState = latestVideoStateRef.current;
            if (nextVideoState?.videoId) {
              applyVideoState(event.target, nextVideoState);
            }
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            if (isRemoteUpdate.current) {
              isRemoteUpdate.current = false;
              return;
            }

            if (canInteract && (document.hidden || suppressAuthorityEvents)) {
              return;
            }

            const currentTime = event.target.getCurrentTime();
            if (event.data === window.YT.PlayerState.PLAYING) {
              onPlayRef.current?.(currentTime);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              onPauseRef.current?.(currentTime);
            }
          },
        },
      });
    },
    [applyVideoState, canInteract, suppressAuthorityEvents, syncLocalAudioState]
  );

  // Initialize or change video
  useEffect(() => {
    if (videoState?.videoId) {
      void initPlayer(videoState.videoId);
    }
  }, [videoState?.videoId, initPlayer]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
      currentVideoIdRef.current = null;
      setIsPlayerReady(false);
    };
  }, []);

  useEffect(() => {
    if (!isPlayerReady) {
      return;
    }

    evaluateDrift();

    const interval = window.setInterval(() => {
      evaluateDrift();
    }, DRIFT_CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [evaluateDrift, isPlayerReady]);

  const handleLocalVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextVolume = Number(event.target.value);
    setLocalVolume(nextVolume);

    if (!playerRef.current) {
      return;
    }

    playerRef.current.setVolume?.(nextVolume);

    if (nextVolume === 0) {
      playerRef.current.mute?.();
      setIsMuted(true);
      return;
    }

    if (playerRef.current.isMuted?.()) {
      playerRef.current.unMute?.();
    }
    setIsMuted(false);
  };

  const handleLocalMuteToggle = () => {
    if (!playerRef.current) {
      return;
    }

    if (playerRef.current.isMuted?.()) {
      playerRef.current.unMute?.();
      setIsMuted(false);
      return;
    }

    playerRef.current.mute?.();
    setIsMuted(true);
  };

  const handleFullscreenToggle = async () => {
    if (!shellRef.current) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await shellRef.current.requestFullscreen();
  };

  const handleResyncClick = () => {
    setDriftSeconds(null);
    onResync?.();
  };

  const showHostResyncPrompt =
    canInteract && suppressAuthorityEvents && driftSeconds !== null && Boolean(onResync);

  // Sync play/pause state from remote
  useEffect(() => {
    if (!playerRef.current || !videoState) return;

    const player = playerRef.current;
    const currentTime = player.getCurrentTime?.() ?? 0;
    const timeDiff = Math.abs(currentTime - videoState.currentTime);
    const playerState = player.getPlayerState?.();

    if (
      playerState !== undefined &&
      ((videoState.isPlaying && playerState !== window.YT?.PlayerState?.PLAYING) ||
        (!videoState.isPlaying && playerState === window.YT?.PlayerState?.PLAYING) ||
        timeDiff > 2)
    ) {
      applyVideoState(player, videoState);
    }
  }, [applyVideoState, videoState]);

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

  return (
    <div
      ref={shellRef}
      className={styles.shell}
      onMouseEnter={() => setControlsVisible(true)}
      onMouseLeave={() => setControlsVisible(false)}
      onFocusCapture={() => setControlsVisible(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setControlsVisible(false);
        }
      }}
    >
      <div ref={containerRef} className={styles.container} />

      {showHostResyncPrompt && (
        <div className={styles.hostResyncPrompt}>
          <span className={styles.hostResyncText}>방 상태와 {formatDrift(driftSeconds)} 차이</span>
          <button
            type="button"
            className={`${styles.audioButton} ${styles.liveButtonAlert}`}
            onClick={handleResyncClick}
            aria-label="방 상태로 다시 맞추기"
          >
            Live로 복귀
          </button>
        </div>
      )}

      {!canInteract && (
        <>
          <div className={styles.interactionBlocker} aria-hidden="true" />

          <div
            className={`${styles.guestHud} ${controlsVisible || driftSeconds !== null ? styles.controlsVisible : ''}`}
          >
            <span className={styles.blockerBadge}>호스트가 재생을 제어합니다</span>
            <span className={styles.timeBadge}>{formatTime(displayTime)}</span>
          </div>

          <div
            className={`${styles.localAudioControls} ${controlsVisible || driftSeconds !== null ? styles.controlsVisible : ''}`}
          >
            {driftSeconds !== null && (
              <span className={styles.syncHint} aria-live="polite">
                호스트와 {formatDrift(driftSeconds)} 차이
              </span>
            )}
            <button
              type="button"
              className={styles.audioButton}
              onClick={handleLocalMuteToggle}
              aria-label={isMuted ? '음소거 해제' : '음소거'}
            >
              {isMuted ? '음소거 해제' : '음소거'}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={localVolume}
              onChange={handleLocalVolumeChange}
              className={styles.volumeSlider}
              aria-label="로컬 볼륨"
            />
            <button
              type="button"
              className={styles.audioButton}
              onClick={() => void handleFullscreenToggle()}
              aria-label="전체화면"
            >
              전체화면
            </button>
            {onResync && (
              <button
                type="button"
                className={`${styles.audioButton} ${driftSeconds !== null ? styles.liveButtonAlert : ''}`}
                onClick={handleResyncClick}
                aria-label="동기화 다시 맞추기"
              >
                Live
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatDrift(seconds: number): string {
  return `${Math.abs(seconds).toFixed(1)}초`;
}

export default VideoPlayer;
