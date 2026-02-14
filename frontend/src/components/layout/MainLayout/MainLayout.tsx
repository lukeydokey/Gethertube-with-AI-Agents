import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/common/Avatar';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            Gethertube
          </Link>

          <nav className={styles.nav}>
            <Link to="/rooms" className={styles.navLink}>
              방 목록
            </Link>
          </nav>

          {user && (
            <div className={styles.userSection}>
              <Avatar
                src={user.profileImage}
                name={user.name || user.email}
                size="sm"
              />
              <span className={styles.userName}>{user.name || '사용자'}</span>
              <button
                type="button"
                onClick={handleLogout}
                className={styles.logoutButton}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </header>

      <main className={styles.main}>{children}</main>
    </div>
  );
};

export default MainLayout;
