import React from 'react';
import { UserProfile } from '@/components/UserProfile';
import styles from './HomePage.module.css';

/**
 * Home page for authenticated users
 */
export const HomePage: React.FC = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gethertube</h1>
      </header>

      <main className={styles.main}>
        <section className={styles.profileSection}>
          <h2 className={styles.sectionTitle}>내 프로필</h2>
          <UserProfile />
        </section>

        <section className={styles.welcomeSection}>
          <h2 className={styles.welcomeTitle}>환영합니다!</h2>
          <p className={styles.welcomeText}>
            Gethertube에서 친구들과 함께 영상을 시청하세요.
          </p>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
