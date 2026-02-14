import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/common/Avatar';
import type { RoomResponse } from '@/types/room.types';
import styles from './RoomCard.module.css';

interface RoomCardProps {
  room: RoomResponse;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/rooms/${room.id}`);
  };

  return (
    <button type="button" className={styles.card} onClick={handleClick}>
      <div className={styles.header}>
        <h3 className={styles.name}>{room.name}</h3>
        {!room.isPublic && <span className={styles.privateBadge}>비공개</span>}
      </div>

      {room.description && (
        <p className={styles.description}>{room.description}</p>
      )}

      <div className={styles.footer}>
        <div className={styles.host}>
          <Avatar
            src={room.host.profileImage}
            name={room.host.name || '호스트'}
            size="sm"
          />
          <span className={styles.hostName}>{room.host.name || '호스트'}</span>
        </div>

        <div className={styles.members}>
          <span className={styles.memberCount}>
            {room.memberCount}/{room.maxMembers}명
          </span>
        </div>
      </div>
    </button>
  );
};

export default RoomCard;
