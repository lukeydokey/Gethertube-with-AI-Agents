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
  const { socket } = useSocket();
  const [videoState, setVideoState] = useState<VideoStateResponse | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleVideoStateChanged = (payload: { videoState: VideoStateResponse }) => {
      setVideoState(payload.videoState);
    };

    const handleSyncResponse = (payload: { videoState: VideoStateResponse }) => {
      setVideoState(payload.videoState);
    };

    socket.on('video_state_changed', handleVideoStateChanged);
    socket.on('sync_response', handleSyncResponse);

    return () => {
      socket.off('video_state_changed', handleVideoStateChanged);
      socket.off('sync_response', handleSyncResponse);
    };
  }, [socket]);

  const play = useCallback(
    (currentTime: number) => {
      socket?.emit('video_play', { roomId, currentTime });
    },
    [socket, roomId]
  );

  const pause = useCallback(
    (currentTime: number) => {
      socket?.emit('video_pause', { roomId, currentTime });
    },
    [socket, roomId]
  );

  const seek = useCallback(
    (currentTime: number) => {
      socket?.emit('video_seek', { roomId, currentTime });
    },
    [socket, roomId]
  );

  const changeVideo = useCallback(
    (videoId: string) => {
      socket?.emit('video_change', { roomId, videoId });
    },
    [socket, roomId]
  );

  const changePlaybackRate = useCallback(
    (rate: number) => {
      socket?.emit('playback_rate_change', { roomId, rate });
    },
    [socket, roomId]
  );

  const requestSync = useCallback(() => {
    socket?.emit('sync_request', { roomId });
  }, [socket, roomId]);

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
