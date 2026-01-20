/**
 * useVideoSync hook
 * Provides video synchronization functionality
 * Implements the sync algorithm from ARCHITECTURE.md Section 6.4
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocketContext } from '@/store/SocketContext';
import { useRoom } from './useRoom';
import type {
  VideoControlPayload,
  VideoChangePayload,
  VideoStateResponse,
  PlaybackRateChangePayload,
  SocketError,
} from '@/types/socket.types';

interface UseVideoSyncReturn {
  // State
  videoState: VideoStateResponse | null;
  isSyncing: boolean;
  error: string | null;

  // Video control actions
  play: (currentTime: number) => void;
  pause: (currentTime: number) => void;
  seek: (currentTime: number) => void;
  changeVideo: (videoId: string) => void;
  changePlaybackRate: (rate: number) => void;
  requestSync: () => void;

  // Local sync methods (for YouTube player)
  shouldSync: (playerTime: number, tolerance?: number) => boolean;
  calculateSyncDelta: (playerTime: number) => number;

  clearError: () => void;
}

// const SYNC_TOLERANCE_HARD = 2.0; // 2 seconds - force seek
const SYNC_TOLERANCE_SOFT = 0.5; // 0.5 seconds - gradual sync

export const useVideoSync = (): UseVideoSyncReturn => {
  const { getVideoSocket } = useSocketContext();
  const { currentRoomId, videoState: roomVideoState } = useRoom();

  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if the current client is the one who initiated the action
  const localActionRef = useRef(false);

  /**
   * Play video
   */
  const play = useCallback(
    (currentTime: number) => {
      if (!currentRoomId) {
        setError('방에 참여하지 않았습니다');
        return;
      }

      const socket = getVideoSocket();
      if (!socket) {
        setError('비디오 동기화 연결이 없습니다');
        return;
      }

      localActionRef.current = true;

      const payload: VideoControlPayload = {
        roomId: currentRoomId,
        currentTime,
      };

      socket.emit('video_play', payload);
    },
    [currentRoomId, getVideoSocket]
  );

  /**
   * Pause video
   */
  const pause = useCallback(
    (currentTime: number) => {
      if (!currentRoomId) {
        setError('방에 참여하지 않았습니다');
        return;
      }

      const socket = getVideoSocket();
      if (!socket) {
        setError('비디오 동기화 연결이 없습니다');
        return;
      }

      localActionRef.current = true;

      const payload: VideoControlPayload = {
        roomId: currentRoomId,
        currentTime,
      };

      socket.emit('video_pause', payload);
    },
    [currentRoomId, getVideoSocket]
  );

  /**
   * Seek to specific time
   */
  const seek = useCallback(
    (currentTime: number) => {
      if (!currentRoomId) {
        setError('방에 참여하지 않았습니다');
        return;
      }

      const socket = getVideoSocket();
      if (!socket) {
        setError('비디오 동기화 연결이 없습니다');
        return;
      }

      localActionRef.current = true;

      const payload: VideoControlPayload = {
        roomId: currentRoomId,
        currentTime,
      };

      socket.emit('video_seek', payload);
    },
    [currentRoomId, getVideoSocket]
  );

  /**
   * Change video
   */
  const changeVideo = useCallback(
    (videoId: string) => {
      if (!currentRoomId) {
        setError('방에 참여하지 않았습니다');
        return;
      }

      const socket = getVideoSocket();
      if (!socket) {
        setError('비디오 동기화 연결이 없습니다');
        return;
      }

      localActionRef.current = true;

      const payload: VideoChangePayload = {
        roomId: currentRoomId,
        videoId,
      };

      socket.emit('video_change', payload);
    },
    [currentRoomId, getVideoSocket]
  );

  /**
   * Change playback rate
   */
  const changePlaybackRate = useCallback(
    (rate: number) => {
      if (!currentRoomId) {
        setError('방에 참여하지 않았습니다');
        return;
      }

      const socket = getVideoSocket();
      if (!socket) {
        setError('비디오 동기화 연결이 없습니다');
        return;
      }

      localActionRef.current = true;

      const payload: PlaybackRateChangePayload = {
        roomId: currentRoomId,
        rate,
      };

      socket.emit('playback_rate_change', payload);
    },
    [currentRoomId, getVideoSocket]
  );

  /**
   * Request current video state from server
   */
  const requestSync = useCallback(() => {
    if (!currentRoomId) return;

    const socket = getVideoSocket();
    if (!socket) return;

    setIsSyncing(true);
    socket.emit('sync_request', { roomId: currentRoomId });
  }, [currentRoomId, getVideoSocket]);

  /**
   * Calculate time delta between player and server state
   */
  const calculateSyncDelta = useCallback(
    (playerTime: number): number => {
      if (!roomVideoState) return 0;
      return Math.abs(playerTime - roomVideoState.currentTime);
    },
    [roomVideoState]
  );

  /**
   * Check if sync is needed based on tolerance
   */
  const shouldSync = useCallback(
    (playerTime: number, tolerance: number = SYNC_TOLERANCE_SOFT): boolean => {
      if (!roomVideoState) return false;
      const delta = calculateSyncDelta(playerTime);
      return delta > tolerance;
    },
    [roomVideoState, calculateSyncDelta]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Set up event listeners
   */
  useEffect(() => {
    const socket = getVideoSocket();
    if (!socket) return;

    // Video state changed
    const handleVideoStateChanged = () => {
      // Ignore if this client initiated the change
      if (localActionRef.current) {
        localActionRef.current = false;
        return;
      }

      // State is updated in RoomContext
      setIsSyncing(false);
    };

    // Sync response
    const handleSyncResponse = () => {
      // State is updated in RoomContext
      setIsSyncing(false);
    };

    // Error occurred
    const handleError = (socketError: SocketError) => {
      setError(socketError.message);
      setIsSyncing(false);
    };

    socket.on('video_state_changed', handleVideoStateChanged);
    socket.on('sync_response', handleSyncResponse);
    socket.on('error', handleError);

    return () => {
      socket.off('video_state_changed', handleVideoStateChanged);
      socket.off('sync_response', handleSyncResponse);
      socket.off('error', handleError);
    };
  }, [getVideoSocket]);

  return {
    videoState: roomVideoState,
    isSyncing,
    error,
    play,
    pause,
    seek,
    changeVideo,
    changePlaybackRate,
    requestSync,
    shouldSync,
    calculateSyncDelta,
    clearError,
  };
};

export default useVideoSync;
