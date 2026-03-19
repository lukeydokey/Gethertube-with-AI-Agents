import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { buildInternalPath, saveReturnTo } from '@/utils/authRedirect';
import styles from './ProtectedRoute.module.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard component for authenticated routes
 * Redirects to login if not authenticated
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const returnTo = buildInternalPath(location);
    saveReturnTo(returnTo);

    return <Navigate to="/login" state={{ from: returnTo }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
