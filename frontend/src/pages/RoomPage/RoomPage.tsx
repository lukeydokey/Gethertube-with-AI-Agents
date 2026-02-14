import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RoomLayout } from '@/components/layout/RoomLayout';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { ChatBox } from '@/components/chat/ChatBox';
import { PlaylistPanel } from '@/components/playlist/PlaylistPanel';
import { Loading } from '@/components/common/Loading';
import { useSocket } from '@/hooks/useSocket';
import { useChat } from '@/hooks/useChat';
import { useVideoSync } from '@/hooks/useVideoSync';
import { usePlaylist } from '@/hooks/usePlaylist';
import { useToast } from '@/hooks/useToast';
import { roomService } from '@/services/room.service';
import type { RoomResponse, MemberResponse } from '@/types/room.types';
import type { RoomJoinedPayload } from '@/types/socket.types';
import styles from './RoomPage.module.css';

export const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { showToast } = useToast();

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chat = useChat(roomId || '');
  const videoSync = useVideoSync(roomId || '');
  const playlist = usePlaylist(roomId || '');

  // Fetch room data via REST
  const fetchRoom = useCallback(async () => {
    if (!roomId) return;

    try {
      const roomData = await roomService.getRoom(roomId);
      setRoom(roomData);
    } catch {
      setError('방을 찾을 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void fetchRoom();
  }, [fetchRoom]);

  // Join room via WebSocket when connected
  useEffect(() => {
    if (!socket || !isConnected || !roomId) return;

    socket.emit('join_room', { roomId });

    const handleRoomJoined = (payload: RoomJoinedPayload) => {
      setRoom(payload.room);
      setMembers(payload.members);
    };

    const handleMemberJoined = (payload: { member: MemberResponse }) => {
      setMembers((prev) => [...prev, payload.member]);
      showToast(`${payload.member.name || '사용자'}님이 입장했습니다.`, 'info');
    };

    const handleMemberLeft = (payload: { memberId: string }) => {
      setMembers((prev) => {
        const left = prev.find((m) => m.id === payload.memberId);
        if (left) {
          showToast(`${left.name || '사용자'}님이 퇴장했습니다.`, 'info');
        }
        return prev.filter((m) => m.id !== payload.memberId);
      });
    };

    const handleRoomClosed = (payload: { reason: string }) => {
      showToast(`방이 닫혔습니다: ${payload.reason}`, 'warning');
      navigate('/rooms');
    };

    const handleError = (payload: { code: string; message: string }) => {
      showToast(payload.message, 'error');
    };

    socket.on('room_joined', handleRoomJoined);
    socket.on('member_joined', handleMemberJoined);
    socket.on('member_left', handleMemberLeft);
    socket.on('room_closed', handleRoomClosed);
    socket.on('error', handleError);

    return () => {
      socket.emit('leave_room', { roomId });
      socket.off('room_joined', handleRoomJoined);
      socket.off('member_joined', handleMemberJoined);
      socket.off('member_left', handleMemberLeft);
      socket.off('room_closed', handleRoomClosed);
      socket.off('error', handleError);
    };
  }, [socket, isConnected, roomId, navigate, showToast]);

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
        <div className={styles.memberInfo}>
          <span className={styles.memberCount}>{members.length}명 참여 중</span>
        </div>
        <ChatBox
          messages={chat.messages}
          typingUsers={chat.typingUsers}
          onSendMessage={chat.sendMessage}
          onTypingStart={chat.startTyping}
          onTypingStop={chat.stopTyping}
        />
      </div>
    </RoomLayout>
  );
};

export default RoomPage;
