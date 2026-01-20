/**
 * MemberList - Display list of room members
 */

import React from 'react';
import { useRoom } from '@/hooks/useRoom';
import { useAuth } from '@/hooks/useAuth';
import styles from './MemberList.module.css';

export const MemberList: React.FC = () => {
  const { members } = useRoom();
  const { user } = useAuth();

  /**
   * Get role badge style
   */
  const getRoleBadgeClass = (role: string): string => {
    switch (role) {
      case 'HOST':
        return styles.hostBadge;
      case 'MODERATOR':
        return styles.moderatorBadge;
      default:
        return styles.memberBadge;
    }
  };

  /**
   * Get role display text
   */
  const getRoleText = (role: string): string => {
    switch (role) {
      case 'HOST':
        return '방장';
      case 'MODERATOR':
        return '운영자';
      default:
        return '멤버';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>멤버 목록</h3>
        <span className={styles.count}>{members.length}명</span>
      </div>

      <div className={styles.memberList}>
        {members.map((member) => {
          const isCurrentUser = user?.id === member.userId;

          return (
            <div key={member.id} className={styles.memberItem}>
              <div className={styles.memberInfo}>
                {member.profileImage ? (
                  <img
                    src={member.profileImage}
                    alt={member.name}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className={styles.memberDetails}>
                  <div className={styles.memberName}>
                    {member.name}
                    {isCurrentUser && <span className={styles.youBadge}>(나)</span>}
                  </div>
                  <div className={getRoleBadgeClass(member.role)}>
                    {getRoleText(member.role)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MemberList;
