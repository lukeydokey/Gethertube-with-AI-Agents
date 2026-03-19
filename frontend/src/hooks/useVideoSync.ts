import { useCallback, useEffect, useState } from 'react';
import { useSocket } from './useSocket';
import { useToast } from './useToast';
import type { VideoStateResponse } from '@/types/room.types';

interface UseVideoSyncReturn {
  videoState: VideoStateResponse | null;
  lastStateUpdateAt: number;
  play: (currentTime: number) => void;
  pause: (currentTime: number) => void;
  seek: (currentTime: number) => void;
  changeVideo: (
    videoId: string,
    videoTitle?: string,
    videoThumbnail?: string,
    autoPlay?: boolean,
  ) => void;
  changePlaybackRate: (rate: number) => void;
  requestSync: () => void;
}

export const useVideoSync = (roomId: string): UseVideoSyncReturn => {
  const { videoSocket, playlistSocket } = useSocket();
  const { showToast } = useToast();
  const [videoState, setVideoState] = useState<VideoStateResponse | null>(null);
  const [lastStateUpdateAt, setLastStateUpdateAt] = useState(0);

  // Join the video room on the /video namespace
  useEffect(() => {
    if (!videoSocket || !roomId) return;

    videoSocket.emit('join_video_room', { roomId });
  }, [videoSocket, roomId]);

  useEffect(() => {
    if (!videoSocket) return;

    const handleVideoStateChanged = (payload: { videoState: VideoStateResponse }) => {
      setVideoState(payload.videoState);
      setLastStateUpdateAt(Date.now());
    };

    const handleSyncResponse = (payload: { videoState: VideoStateResponse | null }) => {
      setVideoState(payload.videoState);
      setLastStateUpdateAt(Date.now());
    };

    const handleSocketError = (payload: { message: string }) => {
      showToast(payload.message, 'error');
    };

    videoSocket.on('video_state_changed', handleVideoStateChanged);
    videoSocket.on('sync_response', handleSyncResponse);
    videoSocket.on('error', handleSocketError);

    return () => {
      videoSocket.off('video_state_changed', handleVideoStateChanged);
      videoSocket.off('sync_response', handleSyncResponse);
      videoSocket.off('error', handleSocketError);
    };
  }, [showToast, videoSocket]);

  useEffect(() => {
    if (!playlistSocket) return;

    const handleVideoStateChanged = (payload: { videoState: VideoStateResponse }) => {
      setVideoState(payload.videoState);
      setLastStateUpdateAt(Date.now());
    };

    playlistSocket.on('video_state_changed', handleVideoStateChanged);

    return () => {
      playlistSocket.off('video_state_changed', handleVideoStateChanged);
    };
  }, [playlistSocket]);

  const play = useCallback(
    (currentTime: number) => {
      videoSocket?.emit('video_play', { roomId, currentTime });
    },
    [videoSocket, roomId]
  );

  const pause = useCallback(
    (currentTime: number) => {
      videoSocket?.emit('video_pause', { roomId, currentTime });
    },
    [videoSocket, roomId]
  );

  const seek = useCallback(
    (currentTime: number) => {
      videoSocket?.emit('video_seek', { roomId, currentTime });
    },
    [videoSocket, roomId]
  );

  const changeVideo = useCallback(
    (
      videoId: string,
      videoTitle?: string,
      videoThumbnail?: string,
      autoPlay = false,
    ) => {
      videoSocket?.emit('video_change', {
        roomId,
        videoId,
        videoTitle,
        videoThumbnail,
        autoPlay,
      });
    },
    [videoSocket, roomId]
  );

  const changePlaybackRate = useCallback(
    (rate: number) => {
      videoSocket?.emit('playback_rate_change', { roomId, rate });
    },
    [videoSocket, roomId]
  );

  const requestSync = useCallback(() => {
    videoSocket?.emit('sync_request', { roomId });
  }, [videoSocket, roomId]);

  return {
    videoState,
    lastStateUpdateAt,
    play,
    pause,
    seek,
    changeVideo,
    changePlaybackRate,
    requestSync,
  };
};

export default useVideoSync;
