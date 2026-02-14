import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/common/Avatar';
import styles from './RoomLayout.module.css';

interface RoomLayoutProps {
  roomName?: string;
  children: React.ReactNode;
}

/**
 * Layout for Room page with video player area + sidebar (chat/playlist)
 * Uses a 3-column grid: sidebar-left | video | sidebar-right
 */
export const RoomLayout: React.FC<RoomLayoutProps> = ({ roomName, children }) => {
  const { user } = useAuth();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/rooms" className={styles.backLink} aria-label="방 목록으로 돌아가기">
            &larr;
          </Link>
          <h1 className={styles.roomName}>{roomName || '방'}</h1>
        </div>

        {user && (
          <div className={styles.headerRight}>
            <Avatar
              src={user.profileImage}
              name={user.name || user.email}
              size="sm"
            />
          </div>
        )}
      </header>

      <div className={styles.content}>{children}</div>
    </div>
  );
};

export default RoomLayout;
