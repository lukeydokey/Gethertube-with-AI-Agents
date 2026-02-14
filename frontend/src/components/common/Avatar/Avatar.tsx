import React from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className,
}) => {
  const initial = name.charAt(0).toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${styles.avatar} ${styles[size]} ${className || ''}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`${styles.placeholder} ${styles[size]} ${className || ''}`}
      aria-label={name}
    >
      {initial}
    </div>
  );
};

export default Avatar;
