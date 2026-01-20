/**
 * RoomListPage - Display list of public rooms
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRooms } from '@/services/room.service';
import { RoomCard } from '@/components/RoomCard';
import type { RoomResponse } from '@/types/room.types';
import styles from './RoomListPage.module.css';

export const RoomListPage: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * Fetch rooms from API
   */
  const fetchRooms = async (currentPage: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getRooms(currentPage, 20);
      setRooms(data.rooms);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError('방 목록을 불러오는데 실패했습니다.');
      console.error('Failed to fetch rooms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load rooms on mount and page change
   */
  useEffect(() => {
    fetchRooms(page);
  }, [page]);

  /**
   * Handle room card click
   */
  const handleRoomClick = (roomId: string) => {
    navigate(`/rooms/${roomId}`);
  };

  /**
   * Handle create room button click
   */
  const handleCreateRoom = () => {
    navigate('/rooms/create');
  };

  /**
   * Handle previous page
   */
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  /**
   * Handle next page
   */
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>공개 방 목록</h1>
        <button className={styles.createButton} onClick={handleCreateRoom}>
          새 방 만들기
        </button>
      </header>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => fetchRooms(page)}>다시 시도</button>
        </div>
      )}

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>방 목록을 불러오는 중...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className={styles.empty}>
          <p>공개 방이 없습니다.</p>
          <button onClick={handleCreateRoom}>첫 방을 만들어보세요!</button>
        </div>
      ) : (
        <>
          <div className={styles.roomGrid}>
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} onClick={() => handleRoomClick(room.id)} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.paginationButton}
                onClick={handlePreviousPage}
                disabled={page === 1}
              >
                이전
              </button>
              <span className={styles.pageInfo}>
                {page} / {totalPages}
              </span>
              <button
                className={styles.paginationButton}
                onClick={handleNextPage}
                disabled={page === totalPages}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RoomListPage;
