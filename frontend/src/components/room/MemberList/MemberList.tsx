import React, { useState, useMemo } from 'react';
import { Avatar } from '@/components/common/Avatar';
import { PresenceIndicator } from '@/components/common/PresenceIndicator';
import type { MemberResponse, UserPresence } from '@/types/room.types';
import styles from './MemberList.module.css';

interface MemberListProps {
  members: MemberResponse[];
  presenceMap: Map<string, UserPresence>;
}

export const MemberList: React.FC<MemberListProps> = React.memo(({
  members,
  presenceMap,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort members: online first, then away, then offline
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const aPresence = presenceMap.get(a.userId);
      const bPresence = presenceMap.get(b.userId);

      const statusPriority = { online: 0, away: 1, offline: 2 };
      const aStatus = aPresence?.status || 'offline';
      const bStatus = bPresence?.status || 'offline';

      return statusPriority[aStatus] - statusPriority[bStatus];
    });
  }, [members, presenceMap]);

  // Count online members
  const onlineCount = useMemo(() => {
    return members.filter((member) => {
      const presence = presenceMap.get(member.userId);
      return presence?.status === 'online';
    }).length;
  }, [members, presenceMap]);

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? '멤버 목록 접기' : '멤버 목록 펼치기'}
      >
        <span className={styles.title}>
          멤버 ({onlineCount}/{members.length})
        </span>
        <span className={`${styles.arrow} ${isExpanded ? styles.expanded : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className={styles.list}>
          {sortedMembers.map((member) => {
            const presence = presenceMap.get(member.userId);
            const status = presence?.status || 'offline';

            return (
              <div key={member.id} className={styles.member}>
                <div className={styles.avatarContainer}>
                  <Avatar
                    src={member.profileImage}
                    name={member.name}
                    size="sm"
                  />
                  <div className={styles.presenceIndicator}>
                    <PresenceIndicator status={status} size="sm" />
                  </div>
                </div>
                <div className={styles.memberInfo}>
                  <span className={styles.memberName}>{member.name}</span>
                  {member.role !== 'MEMBER' && (
                    <span className={styles.memberRole}>
                      {member.role === 'HOST' ? '호스트' : '관리자'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

MemberList.displayName = 'MemberList';

export default MemberList;
