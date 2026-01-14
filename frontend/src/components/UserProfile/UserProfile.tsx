import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from './UserProfile.module.css';

/**
 * User profile display component with logout
 */
export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.userInfo}>
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt={user.name || '사용자'}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {user.name?.charAt(0) || user.email.charAt(0)}
          </div>
        )}
        <div className={styles.details}>
          <p className={styles.name}>{user.name || '사용자'}</p>
          <p className={styles.email}>{user.email}</p>
        </div>
      </div>
      <button type="button" onClick={logout} className={styles.logoutButton}>
        로그아웃
      </button>
    </div>
  );
};

export default UserProfile;
