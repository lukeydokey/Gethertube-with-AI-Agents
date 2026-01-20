/**
 * RoomCreatePage - Create a new room
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '@/services/room.service';
import type { CreateRoomRequest } from '@/types/room.types';
import styles from './RoomCreatePage.module.css';

export const RoomCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateRoomRequest>({
    name: '',
    description: '',
    isPublic: true,
    password: '',
    maxMembers: 10,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setError('방 이름을 입력해주세요.');
      return;
    }

    if (!formData.isPublic && !formData.password) {
      setError('비공개 방은 비밀번호가 필요합니다.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const roomData: CreateRoomRequest = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        isPublic: formData.isPublic,
        password: !formData.isPublic && formData.password ? formData.password : undefined,
        maxMembers: formData.maxMembers,
      };

      const createdRoom = await createRoom(roomData);

      // Navigate to the newly created room
      navigate(`/rooms/${createdRoom.id}`);
    } catch (err) {
      setError('방 생성에 실패했습니다. 다시 시도해주세요.');
      console.error('Failed to create room:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    navigate('/rooms');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>새 방 만들기</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              방 이름 *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
              placeholder="방 이름을 입력하세요"
              required
              maxLength={50}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              설명
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="방 설명 (선택사항)"
              maxLength={200}
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="maxMembers" className={styles.label}>
              최대 인원
            </label>
            <input
              type="number"
              id="maxMembers"
              name="maxMembers"
              value={formData.maxMembers}
              onChange={handleChange}
              className={styles.input}
              min={2}
              max={50}
            />
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span>공개 방</span>
            </label>
          </div>

          {!formData.isPublic && (
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                비밀번호 *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles.input}
                placeholder="비공개 방 비밀번호"
                required={!formData.isPublic}
              />
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              취소
            </button>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? '생성 중...' : '방 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomCreatePage;
