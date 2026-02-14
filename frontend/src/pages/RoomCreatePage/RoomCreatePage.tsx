import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useToast } from '@/hooks/useToast';
import { roomService } from '@/services/room.service';
import type { CreateRoomRequest } from '@/types/room.types';
import styles from './RoomCreatePage.module.css';

interface FormErrors {
  name?: string;
  description?: string;
  password?: string;
  maxMembers?: string;
}

export const RoomCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CreateRoomRequest>({
    name: '',
    description: '',
    isPublic: true,
    maxMembers: 50,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name || form.name.trim().length < 2) {
      newErrors.name = '방 이름은 2자 이상이어야 합니다.';
    } else if (form.name.length > 50) {
      newErrors.name = '방 이름은 50자 이하여야 합니다.';
    }

    if (form.description && form.description.length > 200) {
      newErrors.description = '설명은 200자 이하여야 합니다.';
    }

    if (!form.isPublic && (!form.password || form.password.length < 4)) {
      newErrors.password = '비공개 방은 4자 이상의 비밀번호가 필요합니다.';
    }

    if (
      form.maxMembers !== undefined &&
      (form.maxMembers < 2 || form.maxMembers > 100)
    ) {
      newErrors.maxMembers = '최대 인원은 2~100명 사이여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: CreateRoomRequest = {
        name: form.name.trim(),
        isPublic: form.isPublic,
        maxMembers: form.maxMembers,
      };
      if (form.description?.trim()) {
        payload.description = form.description.trim();
      }
      if (!form.isPublic && form.password) {
        payload.password = form.password;
      }

      const room = await roomService.createRoom(payload);
      showToast('방이 생성되었습니다!', 'success');
      navigate(`/rooms/${room.id}`);
    } catch {
      showToast('방 생성에 실패했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateRoomRequest, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>방 만들기</h2>
          <p className={styles.subtitle}>
            친구들과 함께 영상을 시청할 방을 만들어보세요.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            label="방 이름"
            placeholder="예: 영화 같이 보자!"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            maxLength={50}
            fullWidth
            required
          />

          <div className={styles.field}>
            <label htmlFor="description" className={styles.label}>
              설명 (선택)
            </label>
            <textarea
              id="description"
              className={`${styles.textarea} ${errors.description ? styles.textareaError : ''}`}
              placeholder="방에 대한 간단한 설명을 입력하세요."
              value={form.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              maxLength={200}
              rows={3}
            />
            {errors.description && (
              <p className={styles.error}>{errors.description}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>공개 설정</label>
            <div className={styles.toggleRow}>
              <button
                type="button"
                className={`${styles.toggleOption} ${form.isPublic ? styles.toggleActive : ''}`}
                onClick={() => handleChange('isPublic', true)}
              >
                공개
              </button>
              <button
                type="button"
                className={`${styles.toggleOption} ${!form.isPublic ? styles.toggleActive : ''}`}
                onClick={() => handleChange('isPublic', false)}
              >
                비공개
              </button>
            </div>
          </div>

          {!form.isPublic && (
            <Input
              label="비밀번호"
              type="password"
              placeholder="4자 이상 입력"
              value={form.password || ''}
              onChange={(e) => handleChange('password', e.target.value)}
              error={errors.password}
              fullWidth
            />
          )}

          <Input
            label="최대 인원"
            type="number"
            value={String(form.maxMembers ?? 50)}
            onChange={(e) => handleChange('maxMembers', parseInt(e.target.value, 10) || 2)}
            error={errors.maxMembers}
            helperText="2~100명"
            min={2}
            max={100}
            fullWidth
          />

          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/rooms')}
            >
              취소
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              방 만들기
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default RoomCreatePage;
