import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import styles from './AuthCallbackPage.module.css';

/**
 * OAuth callback page
 * Extracts token from URL and sets auth state
 */
export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthFromCallback, error } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    // Remove token from URL immediately for security
    if (token || errorParam) {
      window.history.replaceState({}, '', '/auth/callback');
    }

    if (errorParam) {
      navigate('/login', {
        state: { error: '로그인에 실패했습니다. 다시 시도해주세요.' },
        replace: true,
      });
      return;
    }

    if (!token) {
      navigate('/login', {
        state: { error: '인증 토큰이 없습니다.' },
        replace: true,
      });
      return;
    }

    setAuthFromCallback(token)
      .then(() => {
        navigate('/', { replace: true });
      })
      .catch(() => {
        navigate('/login', {
          state: { error: '인증 처리 중 오류가 발생했습니다.' },
          replace: true,
        });
      });
  }, [searchParams, navigate, setAuthFromCallback]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <p className={styles.errorText}>{error}</p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className={styles.retryButton}
          >
            다시 로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.loadingCard}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
