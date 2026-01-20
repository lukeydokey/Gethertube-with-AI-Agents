/**
 * RoomCard - Display room information in a card format
 */

import React from 'react';
import type { RoomResponse } from '@/types/room.types';
import styles from './RoomCard.module.css';

interface RoomCardProps {
  room: RoomResponse;
  onClick: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  const thumbnailUrl = room.videoState?.videoThumbnail || '/default-thumbnail.png';
  const isPublic = room.isPublic;
  const isFull = room.memberCount >= room.maxMembers;

  return (
    <div className={styles.card} onClick={onClick} role="button" tabIndex={0}>
      <div className={styles.thumbnail}>
        <img src={thumbnailUrl} alt={room.name} className={styles.thumbnailImage} />
        <div className={styles.memberBadge}>
          {room.memberCount} / {room.maxMembers}
        </div>
        {!isPublic && <div className={styles.privateBadge}>🔒 비공개</div>}
        {isFull && <div className={styles.fullBadge}>만원</div>}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{room.name}</h3>

        {room.description && <p className={styles.description}>{room.description}</p>}

        <div className={styles.footer}>
          <div className={styles.host}>
            {room.host.profileImage && (
              <img
                src={room.host.profileImage}
                alt={room.host.name}
                className={styles.hostAvatar}
              />
            )}
            <span className={styles.hostName}>{room.host.name}</span>
          </div>

          {room.videoState?.videoTitle && (
            <div className={styles.nowPlaying}>
              <span className={styles.playIcon}>▶</span>
              <span className={styles.videoTitle}>{room.videoState.videoTitle}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
