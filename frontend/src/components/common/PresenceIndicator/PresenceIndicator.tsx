import React from 'react';
import type { PresenceStatus } from '@/types/room.types';
import styles from './PresenceIndicator.module.css';

interface PresenceIndicatorProps {
  status: PresenceStatus;
  size?: 'sm' | 'md';
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = React.memo(({
  status,
  size = 'sm',
}) => {
  return (
    <span
      className={`${styles.indicator} ${styles[status]} ${styles[size]}`}
      aria-label={`상태: ${status === 'online' ? '온라인' : status === 'away' ? '자리비움' : '오프라인'}`}
      role="status"
    />
  );
});

PresenceIndicator.displayName = 'PresenceIndicator';

export default PresenceIndicator;
