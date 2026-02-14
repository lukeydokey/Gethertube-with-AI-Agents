import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { RoomCard } from '@/components/room/RoomCard';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { roomService } from '@/services/room.service';
import type { RoomResponse } from '@/types/room.types';
import styles from './RoomListPage.module.css';

type TabType = 'public' | 'my';

export const RoomListPage: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('public');

  const fetchRooms = useCallback(async (tab: TabType) => {
    setLoading(true);
    setError(null);
    try {
      const data =
        tab === 'public'
          ? await roomService.listRooms()
          : await roomService.listMyRooms();
      setRooms(data);
    } catch {
      setError('방 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRooms(activeTab);
  }, [activeTab, fetchRooms]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>방 목록</h2>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/rooms/create')}
          >
            방 만들기
          </Button>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'public' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('public')}
          >
            공개 방
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'my' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('my')}
          >
            내 방
          </button>
        </div>

        {loading && (
          <div className={styles.center}>
            <Loading text="방 목록을 불러오는 중..." />
          </div>
        )}

        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchRooms(activeTab)}
            >
              다시 시도
            </Button>
          </div>
        )}

        {!loading && !error && rooms.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyText}>
              {activeTab === 'public'
                ? '공개된 방이 없습니다.'
                : '참여 중인 방이 없습니다.'}
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/rooms/create')}
            >
              첫 번째 방 만들기
            </Button>
          </div>
        )}

        {!loading && !error && rooms.length > 0 && (
          <div className={styles.grid}>
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default RoomListPage;
