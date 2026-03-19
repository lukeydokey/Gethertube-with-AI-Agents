import React from 'react';
import styles from './GlobalErrorPage.module.css';

export const GlobalErrorPage: React.FC = () => {
  const handleGoHome = () => {
    // Use window.location instead of useNavigate() since this component
    // is rendered outside of BrowserRouter in App.tsx
    window.location.href = '/rooms';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className={styles.container} role="alert">
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden="true">
          ⚠️
        </div>
        <h1 className={styles.title}>예상치 못한 오류가 발생했습니다</h1>
        <p className={styles.message}>
          죄송합니다. 페이지를 표시하는 중 문제가 발생했습니다.
          <br />
          잠시 후 다시 시도해주세요.
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleReload}
            autoFocus
          >
            새로고침
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleGoHome}
          >
            홈으로 이동
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalErrorPage;
