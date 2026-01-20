/**
 * usePlaylist hook
 * Provides playlist management functionality
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSocketContext } from '@/store/SocketContext';
import { useRoom } from './useRoom';
import type {
  AddVideoPayload,
  RemoveVideoPayload,
  ReorderPlaylistPayload,
  PlaylistItemResponse,
  SocketError,
} from '@/types/socket.types';

interface UsePlaylistReturn {
  // State
  playlist: PlaylistItemResponse[];
  currentVideo: PlaylistItemResponse | null;
  currentIndex: number;
  hasNext: boolean;
  hasPrevious: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  addVideo: (videoId: string) => void;
  removeVideo: (itemId: string) => void;
  reorderPlaylist: (items: Array<{ id: string; position: number }>) => void;
  playNext: () => void;
  playPrevious: () => void;
  playVideoAt: (index: number) => void;

  clearError: () => void;
}

export const usePlaylist = (): UsePlaylistReturn => {
  const { getPlaylistSocket } = useSocketContext();
  const { currentRoomId, playlist: roomPlaylist, videoState } = useRoom();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Find current video index in playlist
   */
  const currentIndex = useMemo(() => {
    if (!videoState?.videoId || roomPlaylist.length === 0) return -1;
    return roomPlaylist.findIndex((item) => item.videoId === videoState.videoId);
  }, [videoState, roomPlaylist]);

  /**
   * Get current video item
   */
  const currentVideo = useMemo(() => {
    if (currentIndex === -1) return null;
    return roomPlaylist[currentIndex] || null;
  }, [currentIndex, roomPlaylist]);

  /**
   * Check if there's a next video
   */
  const hasNext = useMemo(() => {
    return currentIndex !== -1 && currentIndex < roomPlaylist.length - 1;
  }, [currentIndex, roomPlaylist.length]);

  /**
   * Check if there's a previous video
   */
  const hasPrevious = useMemo(() => {
    return currentIndex > 0;
  }, [currentIndex]);

  /**
   * Add video to playlist
   */
  const addVideo = useCallback(
    (videoId: string) => {
      if (!currentRoomId) {
        setError('방에 참여하지 않았습니다');
        return;
      }

      const socket = getPlaylistSocket();
      if (!socket) {
        setError('플레이리스트 연결이 없습니다');
        return;
      }

      const payload: AddVideoPayload = {
        roomId: currentRoomId,
        videoId,
      };

      setIsLoading(true);
      socket.emit('add_video', payload);
    },
    [currentRoomId, getPlaylistSocket]
  );

  /**
   * Remove video from playlist
   */
  const removeVideo = useCallback(
    (itemId: string) => {
      if (!currentRoomId) {
        setError('방에 참여하지 않았습니다');
        return;
      }

      const socket = getPlaylistSocket();
      if (!socket) {
        setError('플레이리스트 연결이 없습니다');
        return;
      }

      const payload: RemoveVideoPayload = {
        roomId: currentRoomId,
        itemId,
      };

      setIsLoading(true);
      socket.emit('remove_video', payload);
    },
    [currentRoomId, getPlaylistSocket]
  );

  /**
   * Reorder playlist
   */
  const reorderPlaylist = useCallback(
    (items: Array<{ id: string; position: number }>) => {
      if (!currentRoomId) {
        setError('방에 참여하지 않았습니다');
        return;
      }

      const socket = getPlaylistSocket();
      if (!socket) {
        setError('플레이리스트 연결이 없습니다');
        return;
      }

      const payload: ReorderPlaylistPayload = {
        roomId: currentRoomId,
        items,
      };

      setIsLoading(true);
      socket.emit('reorder_playlist', payload);
    },
    [currentRoomId, getPlaylistSocket]
  );

  /**
   * Play next video in playlist
   */
  const playNext = useCallback(() => {
    if (!currentRoomId) {
      setError('방에 참여하지 않았습니다');
      return;
    }

    if (!hasNext) {
      setError('다음 비디오가 없습니다');
      return;
    }

    const socket = getPlaylistSocket();
    if (!socket) {
      setError('플레이리스트 연결이 없습니다');
      return;
    }

    socket.emit('play_next', { roomId: currentRoomId });
  }, [currentRoomId, hasNext, getPlaylistSocket]);

  /**
   * Play previous video in playlist
   */
  const playPrevious = useCallback(() => {
    if (!currentRoomId) {
      setError('방에 참여하지 않았습니다');
      return;
    }

    if (!hasPrevious) {
      setError('이전 비디오가 없습니다');
      return;
    }

    const socket = getPlaylistSocket();
    if (!socket) {
      setError('플레이리스트 연결이 없습니다');
      return;
    }

    socket.emit('play_previous', { roomId: currentRoomId });
  }, [currentRoomId, hasPrevious, getPlaylistSocket]);

  /**
   * Play video at specific index
   */
  const playVideoAt = useCallback(
    (index: number) => {
      if (index < 0 || index >= roomPlaylist.length) {
        setError('잘못된 인덱스입니다');
        return;
      }

      const video = roomPlaylist[index];
      if (!video) return;

      // Note: Video change will be handled by the caller using useVideoSync
      // This function just validates and returns the video item
      // The parent component should call videoSync.changeVideo(video.videoId)
    },
    [roomPlaylist]
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
    const socket = getPlaylistSocket();
    if (!socket) return;

    // Video added to playlist
    const handleVideoAdded = () => {
      setIsLoading(false);
    };

    // Video removed from playlist
    const handleVideoRemoved = () => {
      setIsLoading(false);
    };

    // Playlist updated
    const handlePlaylistUpdated = () => {
      setIsLoading(false);
    };

    // Error occurred
    const handleError = (socketError: SocketError) => {
      setError(socketError.message);
      setIsLoading(false);
    };

    socket.on('video_added', handleVideoAdded);
    socket.on('video_removed', handleVideoRemoved);
    socket.on('playlist_updated', handlePlaylistUpdated);
    socket.on('error', handleError);

    return () => {
      socket.off('video_added', handleVideoAdded);
      socket.off('video_removed', handleVideoRemoved);
      socket.off('playlist_updated', handlePlaylistUpdated);
      socket.off('error', handleError);
    };
  }, [getPlaylistSocket]);

  return {
    playlist: roomPlaylist,
    currentVideo,
    currentIndex,
    hasNext,
    hasPrevious,
    isLoading,
    error,
    addVideo,
    removeVideo,
    reorderPlaylist,
    playNext,
    playPrevious,
    playVideoAt,
    clearError,
  };
};

export default usePlaylist;
