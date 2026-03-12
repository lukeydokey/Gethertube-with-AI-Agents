import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RoomLayout } from '@/components/layout/RoomLayout';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { ChatBox } from '@/components/chat/ChatBox';
import { PlaylistPanel } from '@/components/playlist/PlaylistPanel';
import { MemberList } from '@/components/room/MemberList';
import { Loading } from '@/components/common/Loading';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useSocket } from '@/hooks/useSocket';
import { useChat } from '@/hooks/useChat';
import { useVideoSync } from '@/hooks/useVideoSync';
import { usePlaylist } from '@/hooks/usePlaylist';
import { usePresence } from '@/hooks/usePresence';
import { useToast } from '@/hooks/useToast';
import { roomService } from '@/services/room.service';
import type { RoomResponse, MemberResponse } from '@/types/room.types';
import styles from './RoomPage.module.css';

export const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { roomsSocket, isConnected } = useSocket();
  const { showToast } = useToast();
  const [joinedRoomId, setJoinedRoomId] = useState('');

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chat = useChat(joinedRoomId);
  const videoSync = useVideoSync(joinedRoomId);
  const playlist = usePlaylist(joinedRoomId);
  const presence = usePresence(joinedRoomId);
  const { requestSync } = videoSync;

  // Fetch room data via REST
  const fetchRoom = useCallback(async () => {
    if (!roomId) return;

    try {
      await roomService.joinRoom(roomId);
      const roomData = await roomService.getRoom(roomId);
      setRoom(roomData);
      setJoinedRoomId(roomId);
    } catch {
      setJoinedRoomId('');
      setError('방을 찾을 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void fetchRoom();
  }, [fetchRoom]);

  // Join room via /rooms namespace WebSocket
  const handleRoomJoined = useCallback(
    (payload: { room: RoomResponse; members: MemberResponse[] }) => {
      setRoom(payload.room);
      setMembers(payload.members);
    },
    [],
  );

  const handleMemberJoined = useCallback(
    (payload: { member: MemberResponse }) => {
      setMembers((prev) => [...prev, payload.member]);
      showToast(`${payload.member.name || '사용자'}님이 입장했습니다.`, 'info');
    },
    [showToast],
  );

  // Backend sends { userId } not { memberId }
  const handleMemberLeft = useCallback(
    (payload: { userId: string }) => {
      setMembers((prev) => {
        const left = prev.find((m) => m.userId === payload.userId);
        if (left) {
          showToast(`${left.name || '사용자'}님이 퇴장했습니다.`, 'info');
        }
        return prev.filter((m) => m.userId !== payload.userId);
      });
    },
    [showToast],
  );

  const handleRoomClosed = useCallback(
    (payload: { reason: string }) => {
      showToast(`방이 닫혔습니다: ${payload.reason}`, 'warning');
      navigate('/rooms');
    },
    [showToast, navigate],
  );

  const handleError = useCallback(
    (payload: { code: string; message: string }) => {
      showToast(payload.message, 'error');
    },
    [showToast],
  );

  useEffect(() => {
    if (!roomsSocket || !isConnected || !joinedRoomId) return;

    roomsSocket.emit('join_room', { roomId: joinedRoomId });
    requestSync();

    roomsSocket.on('room_joined', handleRoomJoined);
    roomsSocket.on('member_joined', handleMemberJoined);
    roomsSocket.on('member_left', handleMemberLeft);
    roomsSocket.on('room_closed', handleRoomClosed);
    roomsSocket.on('error', handleError);

    return () => {
      roomsSocket.emit('leave_room', { roomId: joinedRoomId });
      roomsSocket.off('room_joined', handleRoomJoined);
      roomsSocket.off('member_joined', handleMemberJoined);
      roomsSocket.off('member_left', handleMemberLeft);
      roomsSocket.off('room_closed', handleRoomClosed);
      roomsSocket.off('error', handleError);
    };
  }, [
    roomsSocket,
    isConnected,
    joinedRoomId,
    handleRoomJoined,
    handleMemberJoined,
    handleMemberLeft,
    handleRoomClosed,
    handleError,
    requestSync,
  ]);

  if (loading) {
    return <Loading fullPage text="방에 입장하는 중..." />;
  }

  if (error || !room) {
    return (
      <div className={styles.errorPage}>
        <h2>{error || '방을 찾을 수 없습니다.'}</h2>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate('/rooms')}
        >
          방 목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <RoomLayout roomName={room.name}>
        <div className={styles.videoArea}>
          <VideoPlayer
            videoState={videoSync.videoState}
            onPlay={(time) => videoSync.play(time)}
            onPause={(time) => videoSync.pause(time)}
            onSeek={(time) => videoSync.seek(time)}
          />
          <div className={styles.playlistArea}>
            <PlaylistPanel
              playlist={playlist.playlist}
              currentVideoId={videoSync.videoState?.videoId ?? null}
              onAddVideo={playlist.addVideo}
              onRemoveVideo={playlist.removeVideo}
              onPlayNext={playlist.playNext}
              onPlayPrevious={playlist.playPrevious}
            />
          </div>
        </div>

        <div className={styles.sidebar}>
          <MemberList members={members} presenceMap={presence.presenceMap} />
          <ChatBox
            messages={chat.messages}
            typingUsers={chat.typingUsers}
            onSendMessage={chat.sendMessage}
            onTypingStart={chat.startTyping}
            onTypingStop={chat.stopTyping}
            onAddReaction={chat.addReaction}
            onRemoveReaction={chat.removeReaction}
          />
        </div>
      </RoomLayout>
    </ErrorBoundary>
  );
};

export default RoomPage;
