/**
 * RoomPage - Main room interface with video, chat, and playlist
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '@/hooks/useRoom';
import { RoomHeader } from '@/components/RoomHeader';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ChatBox } from '@/components/ChatBox';
import { PlaylistPanel } from '@/components/PlaylistPanel';
import { MemberList } from '@/components/MemberList';
import styles from './RoomPage.module.css';

export const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { room, joinRoom, leaveRoom, error, isLoading } = useRoom();

  const [showMemberList, setShowMemberList] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(true);

  /**
   * Join room on mount
   */
  useEffect(() => {
    if (!roomId) {
      navigate('/rooms');
      return;
    }

    // Join room via WebSocket
    joinRoom(roomId);

    // Leave room on unmount
    return () => {
      leaveRoom();
    };
  }, [roomId, joinRoom, leaveRoom, navigate]);

  /**
   * Handle leave room
   */
  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/rooms');
  };

  /**
   * Toggle member list
   */
  const toggleMemberList = () => {
    setShowMemberList((prev) => !prev);
  };

  /**
   * Toggle playlist
   */
  const togglePlaylist = () => {
    setShowPlaylist((prev) => !prev);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>방에 입장하는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <h2>방 입장 실패</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/rooms')} className={styles.backButton}>
            방 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <div className={styles.container}>
      <RoomHeader
        room={room}
        onLeaveRoom={handleLeaveRoom}
        onToggleMemberList={toggleMemberList}
        showMemberList={showMemberList}
      />

      <div className={styles.mainContent}>
        {/* Left: Video and Playlist */}
        <div className={styles.leftColumn}>
          <div className={styles.videoSection}>
            <VideoPlayer />
          </div>

          <div className={styles.playlistSection}>
            <button onClick={togglePlaylist} className={styles.playlistToggle}>
              {showPlaylist ? '플레이리스트 숨기기' : '플레이리스트 보기'}
            </button>
            {showPlaylist && (
              <div className={styles.playlistContainer}>
                <PlaylistPanel />
              </div>
            )}
          </div>
        </div>

        {/* Right: Chat and Member List */}
        <div className={styles.rightColumn}>
          {showMemberList && (
            <div className={styles.memberListSection}>
              <MemberList />
            </div>
          )}
          <div className={styles.chatSection}>
            <ChatBox />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
