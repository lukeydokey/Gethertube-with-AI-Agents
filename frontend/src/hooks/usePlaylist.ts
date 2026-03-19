import { useCallback, useEffect, useState } from 'react';
import { useSocket } from './useSocket';
import { useToast } from './useToast';
import type { PlaylistItemResponse } from '@/types/playlist.types';

interface AddVideoParams {
  videoId: string;
  title: string;
  thumbnail?: string;
  duration: number;
}

interface UsePlaylistReturn {
  playlist: PlaylistItemResponse[];
  addVideo: (params: AddVideoParams) => void;
  removeVideo: (itemId: string) => void;
  reorderPlaylist: (items: { id: string; position: number }[]) => void;
  playNext: () => void;
  playPrevious: () => void;
}

export const usePlaylist = (roomId: string): UsePlaylistReturn => {
  const { playlistSocket } = useSocket();
  const { showToast } = useToast();
  const [playlist, setPlaylist] = useState<PlaylistItemResponse[]>([]);

  useEffect(() => {
    if (!playlistSocket || !roomId) return;

    const handlePlaylistUpdated = (payload: { playlist: PlaylistItemResponse[] }) => {
      setPlaylist(payload.playlist);
    };

    const handleVideoAdded = (payload: { item: PlaylistItemResponse }) => {
      setPlaylist((prev) => [...prev, payload.item]);
    };

    const handleVideoRemoved = (payload: { itemId: string }) => {
      setPlaylist((prev) => prev.filter((item) => item.id !== payload.itemId));
    };

    const handlePlaylistError = (payload: { message: string }) => {
      showToast(payload.message, 'error');
    };

    playlistSocket.on('playlist_updated', handlePlaylistUpdated);
    playlistSocket.on('video_added', handleVideoAdded);
    playlistSocket.on('video_removed', handleVideoRemoved);
    playlistSocket.on('error', handlePlaylistError);
    playlistSocket.emit('join_playlist_room', { roomId });

    return () => {
      playlistSocket.off('playlist_updated', handlePlaylistUpdated);
      playlistSocket.off('video_added', handleVideoAdded);
      playlistSocket.off('video_removed', handleVideoRemoved);
      playlistSocket.off('error', handlePlaylistError);
    };
  }, [playlistSocket, roomId, showToast]);

  const addVideo = useCallback(
    (params: AddVideoParams) => {
      playlistSocket?.emit('add_video', {
        roomId,
        videoId: params.videoId,
        title: params.title,
        thumbnail: params.thumbnail,
        duration: params.duration,
      });
    },
    [playlistSocket, roomId]
  );

  const removeVideo = useCallback(
    (itemId: string) => {
      playlistSocket?.emit('remove_video', { roomId, itemId });
    },
    [playlistSocket, roomId]
  );

  const reorderPlaylist = useCallback(
    (items: { id: string; position: number }[]) => {
      playlistSocket?.emit('reorder_playlist', { roomId, items });
    },
    [playlistSocket, roomId]
  );

  const playNext = useCallback(() => {
    playlistSocket?.emit('play_next', { roomId });
  }, [playlistSocket, roomId]);

  const playPrevious = useCallback(() => {
    playlistSocket?.emit('play_previous', { roomId });
  }, [playlistSocket, roomId]);

  return { playlist, addVideo, removeVideo, reorderPlaylist, playNext, playPrevious };
};

export default usePlaylist;
