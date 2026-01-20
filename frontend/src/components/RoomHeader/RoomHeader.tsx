/**
 * RoomHeader - Room header with title, controls, and member count
 */

import React from 'react';
import type { RoomResponse } from '@/types/room.types';
import { useRoom } from '@/hooks/useRoom';
import styles from './RoomHeader.module.css';

interface RoomHeaderProps {
  room: RoomResponse;
  onLeaveRoom: () => void;
  onToggleMemberList: () => void;
  showMemberList: boolean;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  room,
  onLeaveRoom,
  onToggleMemberList,
  showMemberList,
}) => {
  const { members } = useRoom();

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <h1 className={styles.title}>{room.name}</h1>
        {room.description && <p className={styles.description}>{room.description}</p>}
      </div>

      <div className={styles.rightSection}>
        <button className={styles.memberButton} onClick={onToggleMemberList}>
          <span className={styles.memberIcon}>👥</span>
          <span className={styles.memberCount}>{members.length}</span>
          <span className={styles.memberText}>
            {showMemberList ? '멤버 숨기기' : '멤버 보기'}
          </span>
        </button>

        <button className={styles.leaveButton} onClick={onLeaveRoom}>
          나가기
        </button>
      </div>
    </header>
  );
};

export default RoomHeader;
