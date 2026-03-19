import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Avatar } from '@/components/common/Avatar';
import { Loading } from '@/components/common/Loading';
import { roomService } from '@/services/room.service';
import type { RoomResponse } from '@/types/room.types';
import styles from './RoomJoinPage.module.css';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return '알 수 없는 오류가 발생했습니다.';
}

function getLoadErrorCopy(message: string): string {
  if (message === 'Room not found') {
    return '초대 링크가 유효하지 않거나 방이 더 이상 존재하지 않습니다.';
  }

  return '방 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
}

function getJoinErrorState(message: string): {
  pageError: string | null;
  passwordError: string | null;
} {
  if (message === 'Invalid room password') {
    return {
      pageError: null,
      passwordError: '비밀번호가 올바르지 않습니다. 다시 입력해주세요.',
    };
  }

  if (message === 'Room is full') {
    return {
      pageError: '현재 방 인원이 가득 차 있어 참가할 수 없습니다.',
      passwordError: null,
    };
  }

  if (message === 'Room not found') {
    return {
      pageError: '초대 링크가 유효하지 않거나 방이 더 이상 존재하지 않습니다.',
      passwordError: null,
    };
  }

  return {
    pageError: '방 참가에 실패했습니다. 잠시 후 다시 시도해주세요.',
    passwordError: null,
  };
}

export const RoomJoinPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  const fetchRoom = useCallback(async () => {
    if (!roomId) {
      setPageError('잘못된 방 주소입니다.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError(null);

    try {
      const roomData = await roomService.getRoom(roomId);
      setRoom(roomData);
    } catch (error) {
      setPageError(getLoadErrorCopy(getErrorMessage(error)));
      setRoom(null);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void fetchRoom();
  }, [fetchRoom]);

  const helperText = useMemo(() => {
    if (!room) {
      return null;
    }

    return room.isPublic
      ? '참가 후 바로 방으로 이동합니다.'
      : '비공개 방입니다. 초대한 사람이 공유한 비밀번호를 입력해주세요.';
  }, [room]);

  const handleJoin = async () => {
    if (!roomId || !room) {
      return;
    }

    setJoining(true);
    setPageError(null);
    setPasswordError(null);

    try {
      await roomService.joinRoom(
        roomId,
        room.isPublic ? undefined : { password: password.trim() },
      );
      navigate(`/rooms/${roomId}`, { replace: true });
    } catch (error) {
      const { pageError: nextPageError, passwordError: nextPasswordError } =
        getJoinErrorState(getErrorMessage(error));
      setPageError(nextPageError);
      setPasswordError(nextPasswordError);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <Loading fullPage text="초대 링크를 확인하는 중..." />;
  }

  if (!room || pageError) {
    return (
      <MainLayout>
        <div className={styles.pageState}>
          <div className={styles.card}>
            <span className={styles.badge}>참가 불가</span>
            <h1 className={styles.title}>방에 참가할 수 없습니다.</h1>
            <p className={styles.description}>{pageError || '방 정보를 찾을 수 없습니다.'}</p>
            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => navigate('/rooms')}>
                방 목록으로 이동
              </Button>
              <Button variant="primary" onClick={() => void fetchRoom()}>
                다시 시도
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <span className={styles.badge}>{room.isPublic ? '공개 방' : '비공개 방'}</span>
            <h1 className={styles.title}>{room.name}</h1>
            <p className={styles.description}>
              {room.description || '친구와 함께 영상을 볼 수 있는 방입니다.'}
            </p>
          </div>

          <div className={styles.summary}>
            <div className={styles.hostSection}>
              <span className={styles.label}>호스트</span>
              <div className={styles.hostInfo}>
                <Avatar
                  src={room.host.profileImage}
                  name={room.host.name || '호스트'}
                  size="md"
                />
                <span className={styles.hostName}>{room.host.name || '호스트'}</span>
              </div>
            </div>

            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.label}>현재 인원</span>
                <strong>{room.memberCount} / {room.maxMembers}</strong>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.label}>방 상태</span>
                <strong>{room.isPublic ? '누구나 참가 가능' : '비밀번호 필요'}</strong>
              </div>
            </div>
          </div>

          {!room.isPublic && (
            <Input
              label="비밀번호"
              type="password"
              placeholder="방 비밀번호를 입력하세요"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (passwordError) {
                  setPasswordError(null);
                }
              }}
              error={passwordError || undefined}
              helperText={helperText || undefined}
              fullWidth
            />
          )}

          {room.isPublic && helperText && (
            <p className={styles.helperText}>{helperText}</p>
          )}

          {pageError && <p className={styles.pageError}>{pageError}</p>}

          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => navigate('/rooms')}>
              방 목록으로 이동
            </Button>
            <Button variant="primary" onClick={() => void handleJoin()} loading={joining}>
              {room.isPublic ? '방 참가하기' : '비밀번호 확인 후 참가'}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RoomJoinPage;
