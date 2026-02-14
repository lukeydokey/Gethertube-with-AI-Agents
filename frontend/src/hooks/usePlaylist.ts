import { useCallback, useEffect, useState } from 'react';
import { useSocket } from './useSocket';
import type { PlaylistItemResponse } from '@/types/playlist.types';

interface UsePlaylistReturn {
  playlist: PlaylistItemResponse[];
  addVideo: (videoId: string) => void;
  removeVideo: (itemId: string) => void;
  reorderPlaylist: (items: { id: string; position: number }[]) => void;
  playNext: () => void;
  playPrevious: () => void;
}

export const usePlaylist = (roomId: string): UsePlaylistReturn => {
  const { socket } = useSocket();
  const [playlist, setPlaylist] = useState<PlaylistItemResponse[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handlePlaylistUpdated = (payload: { playlist: PlaylistItemResponse[] }) => {
      setPlaylist(payload.playlist);
    };

    const handleVideoAdded = (payload: { item: PlaylistItemResponse }) => {
      setPlaylist((prev) => [...prev, payload.item]);
    };

    const handleVideoRemoved = (payload: { itemId: string }) => {
      setPlaylist((prev) => prev.filter((item) => item.id !== payload.itemId));
    };

    socket.on('playlist_updated', handlePlaylistUpdated);
    socket.on('video_added', handleVideoAdded);
    socket.on('video_removed', handleVideoRemoved);

    return () => {
      socket.off('playlist_updated', handlePlaylistUpdated);
      socket.off('video_added', handleVideoAdded);
      socket.off('video_removed', handleVideoRemoved);
    };
  }, [socket]);

  const addVideo = useCallback(
    (videoId: string) => {
      socket?.emit('add_video', { roomId, videoId });
    },
    [socket, roomId]
  );

  const removeVideo = useCallback(
    (itemId: string) => {
      socket?.emit('remove_video', { roomId, itemId });
    },
    [socket, roomId]
  );

  const reorderPlaylist = useCallback(
    (items: { id: string; position: number }[]) => {
      socket?.emit('reorder_playlist', { roomId, items });
    },
    [socket, roomId]
  );

  const playNext = useCallback(() => {
    socket?.emit('play_next', { roomId });
  }, [socket, roomId]);

  const playPrevious = useCallback(() => {
    socket?.emit('play_previous', { roomId });
  }, [socket, roomId]);

  return { playlist, addVideo, removeVideo, reorderPlaylist, playNext, playPrevious };
};

export default usePlaylist;
