import React from 'react';
import styles from './Loading.module.css';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  fullPage = false,
  text,
}) => {
  const content = (
    <div className={styles.container} role="status" aria-label={text || '로딩 중'}>
      <div className={`${styles.spinner} ${styles[size]}`} />
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );

  if (fullPage) {
    return <div className={styles.fullPage}>{content}</div>;
  }

  return content;
};

export default Loading;
