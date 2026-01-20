/**
 * RoomContext - Manages current room state
 * Coordinates with SocketContext for real-time updates
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSocketContext } from './SocketContext';
import type { RoomState } from '@/types/room.types';
import type {
  RoomJoinedPayload,
  MemberJoinedPayload,
  MemberLeftPayload,
  RoomUpdatedPayload,
  RoomClosedPayload,
  MessageResponse,
  VideoStateResponse,
  PlaylistItemResponse,
  SocketError,
} from '@/types/socket.types';

interface RoomContextValue extends RoomState {
  // Room actions
  joinRoom: (roomId: string, password?: string) => void;
  leaveRoom: () => void;
  clearError: () => void;

  // Current room ID
  currentRoomId: string | null;
}

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

interface RoomProviderProps {
  children: React.ReactNode;
}

export const RoomProvider: React.FC<RoomProviderProps> = ({ children }) => {
  const socketContext = useSocketContext();
  const { getRoomsSocket, getVideoSocket, getChatSocket, getPlaylistSocket } = socketContext;

  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [state, setState] = useState<RoomState>({
    room: null,
    members: [],
    videoState: null,
    playlist: [],
    messages: [],
    isLoading: false,
    error: null,
  });

  /**
   * Join a room
   */
  const joinRoom = useCallback(
    (roomId: string, password?: string) => {
      const socket = getRoomsSocket();
      if (!socket) {
        setState((prev) => ({
          ...prev,
          error: 'Socket connection not available',
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      socket.emit('join_room', { roomId, password });
      setCurrentRoomId(roomId);
    },
    [getRoomsSocket]
  );

  /**
   * Leave current room
   */
  const leaveRoom = useCallback(() => {
    const socket = getRoomsSocket();
    if (!socket || !currentRoomId) return;

    socket.emit('leave_room', { roomId: currentRoomId });

    // Reset state
    setState({
      room: null,
      members: [],
      videoState: null,
      playlist: [],
      messages: [],
      isLoading: false,
      error: null,
    });
    setCurrentRoomId(null);
  }, [getRoomsSocket, currentRoomId]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Set up socket event listeners
   */
  useEffect(() => {
    const socket = getRoomsSocket();
    if (!socket) return;

    // Room joined successfully
    const handleRoomJoined = (payload: RoomJoinedPayload) => {
      setState({
        room: payload.room,
        members: payload.members,
        videoState: payload.videoState,
        playlist: payload.playlist,
        messages: [],
        isLoading: false,
        error: null,
      });
    };

    // Room left successfully
    const handleRoomLeft = () => {
      setState({
        room: null,
        members: [],
        videoState: null,
        playlist: [],
        messages: [],
        isLoading: false,
        error: null,
      });
      setCurrentRoomId(null);
    };

    // New member joined
    const handleMemberJoined = (payload: MemberJoinedPayload) => {
      setState((prev) => ({
        ...prev,
        members: [...prev.members, payload.member],
        room: prev.room
          ? {
              ...prev.room,
              memberCount: prev.room.memberCount + 1,
            }
          : null,
      }));
    };

    // Member left
    const handleMemberLeft = (payload: MemberLeftPayload) => {
      setState((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== payload.memberId),
        room: prev.room
          ? {
              ...prev.room,
              memberCount: prev.room.memberCount - 1,
            }
          : null,
      }));
    };

    // Room updated
    const handleRoomUpdated = (payload: RoomUpdatedPayload) => {
      setState((prev) => ({
        ...prev,
        room: payload.room,
      }));
    };

    // Room closed
    const handleRoomClosed = (payload: RoomClosedPayload) => {
      setState((prev) => ({
        ...prev,
        error: `방이 닫혔습니다: ${payload.reason}`,
      }));
      setCurrentRoomId(null);
    };

    // Error occurred
    const handleError = (error: SocketError) => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
    };

    // Register event listeners
    socket.on('room_joined', handleRoomJoined);
    socket.on('room_left', handleRoomLeft);
    socket.on('member_joined', handleMemberJoined);
    socket.on('member_left', handleMemberLeft);
    socket.on('room_updated', handleRoomUpdated);
    socket.on('room_closed', handleRoomClosed);
    socket.on('error', handleError);

    // Cleanup
    return () => {
      socket.off('room_joined', handleRoomJoined);
      socket.off('room_left', handleRoomLeft);
      socket.off('member_joined', handleMemberJoined);
      socket.off('member_left', handleMemberLeft);
      socket.off('room_updated', handleRoomUpdated);
      socket.off('room_closed', handleRoomClosed);
      socket.off('error', handleError);
    };
  }, [getRoomsSocket]);

  /**
   * Listen for video state changes from VideoSync
   */
  useEffect(() => {
    const socket = getVideoSocket();
    if (!socket) return;

    const handleVideoStateChanged = (videoState: VideoStateResponse) => {
      setState((prev) => ({
        ...prev,
        videoState,
      }));
    };

    socket.on('video_state_changed', handleVideoStateChanged);

    return () => {
      socket.off('video_state_changed', handleVideoStateChanged);
    };
  }, [getVideoSocket]);

  /**
   * Listen for playlist changes from Playlist
   */
  useEffect(() => {
    const socket = getPlaylistSocket();
    if (!socket) return;

    const handleVideoAdded = (payload: { item: PlaylistItemResponse }) => {
      setState((prev) => ({
        ...prev,
        playlist: [...prev.playlist, payload.item].sort((a, b) => a.position - b.position),
      }));
    };

    const handleVideoRemoved = (payload: { itemId: string }) => {
      setState((prev) => ({
        ...prev,
        playlist: prev.playlist.filter((item) => item.id !== payload.itemId),
      }));
    };

    const handlePlaylistUpdated = (payload: { playlist: PlaylistItemResponse[] }) => {
      setState((prev) => ({
        ...prev,
        playlist: payload.playlist,
      }));
    };

    socket.on('video_added', handleVideoAdded);
    socket.on('video_removed', handleVideoRemoved);
    socket.on('playlist_updated', handlePlaylistUpdated);

    return () => {
      socket.off('video_added', handleVideoAdded);
      socket.off('video_removed', handleVideoRemoved);
      socket.off('playlist_updated', handlePlaylistUpdated);
    };
  }, [getPlaylistSocket]);

  /**
   * Listen for new messages from Chat
   */
  useEffect(() => {
    const socket = getChatSocket();
    if (!socket) return;

    const handleNewMessage = (message: MessageResponse) => {
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, message],
      }));
    };

    const handleMessageDeleted = (payload: { messageId: string }) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.filter((msg) => msg.id !== payload.messageId),
      }));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [getChatSocket]);

  const value: RoomContextValue = {
    ...state,
    currentRoomId,
    joinRoom,
    leaveRoom,
    clearError,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};

/**
 * Hook to access room context
 */
export const useRoomContext = (): RoomContextValue => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoomContext must be used within a RoomProvider');
  }
  return context;
};

export default RoomProvider;
