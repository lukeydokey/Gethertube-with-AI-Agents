import { useCallback, useEffect, useState } from 'react';
import { useSocket } from './useSocket';
import type { VideoStateResponse } from '@/types/room.types';

interface UseVideoSyncReturn {
  videoState: VideoStateResponse | null;
  play: (currentTime: number) => void;
  pause: (currentTime: number) => void;
  seek: (currentTime: number) => void;
  changeVideo: (videoId: string) => void;
  changePlaybackRate: (rate: number) => void;
  requestSync: () => void;
}

export const useVideoSync = (roomId: string): UseVideoSyncReturn => {
  const { videoSocket } = useSocket();
  const [videoState, setVideoState] = useState<VideoStateResponse | null>(null);

  // Join the video room on the /video namespace
  useEffect(() => {
    if (!videoSocket || !roomId) return;

    videoSocket.emit('join_video_room', { roomId });
  }, [videoSocket, roomId]);

  useEffect(() => {
    if (!videoSocket) return;

    const handleVideoStateChanged = (payload: { videoState: VideoStateResponse }) => {
      setVideoState(payload.videoState);
    };

    const handleSyncResponse = (payload: { videoState: VideoStateResponse | null }) => {
      setVideoState(payload.videoState);
    };

    videoSocket.on('video_state_changed', handleVideoStateChanged);
    videoSocket.on('sync_response', handleSyncResponse);

    return () => {
      videoSocket.off('video_state_changed', handleVideoStateChanged);
      videoSocket.off('sync_response', handleSyncResponse);
    };
  }, [videoSocket]);

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
    (videoId: string) => {
      videoSocket?.emit('video_change', { roomId, videoId });
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
    play,
    pause,
    seek,
    changeVideo,
    changePlaybackRate,
    requestSync,
  };
};

export default useVideoSync;
