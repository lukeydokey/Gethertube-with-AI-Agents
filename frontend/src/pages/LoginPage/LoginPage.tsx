import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';
import styles from './LoginPage.module.css';

interface LocationState {
  error?: string;
  from?: string;
}

/**
 * Login page with Google OAuth
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, error, clearError } = useAuth();

  const locationState = location.state as LocationState | null;
  const errorMessage = locationState?.error || error;
  const redirectTo = locationState?.from || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Gethertube</h1>
          <p className={styles.subtitle}>함께 영상을 시청하세요</p>
        </div>

        {errorMessage && (
          <div className={styles.errorBanner} role="alert">
            <p className={styles.errorText}>{errorMessage}</p>
          </div>
        )}

        <div className={styles.buttonContainer}>
          <GoogleLoginButton />
        </div>

        <p className={styles.terms}>
          로그인하면{' '}
          <a href="#terms" onClick={(e) => e.preventDefault()}>
            이용약관
          </a>{' '}
          및{' '}
          <a href="#privacy" onClick={(e) => e.preventDefault()}>
            개인정보처리방침
          </a>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
