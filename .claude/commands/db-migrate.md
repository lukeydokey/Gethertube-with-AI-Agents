# Database Migration Helper

Prisma 마이그레이션을 안전하게 수행합니다.

## 사용법
```
/db-migrate <migration-name>
```

예시:
- `/db-migrate add-room-model`
- `/db-migrate add-message-index`
- `/db-migrate rename-user-field`

## 실행 단계

### 1. 스키마 변경 확인
```bash
cd backend && npx prisma format
cd backend && npx prisma validate
```

### 2. 변경사항 분석
- 새로운 모델 추가
- 필드 추가/삭제
- 인덱스 변경
- 관계 변경

### 3. 위험도 평가
| 변경 유형 | 위험도 | 설명 |
|----------|--------|------|
| 새 모델 추가 | 낮음 | 데이터 손실 없음 |
| 필드 추가 (optional) | 낮음 | 기존 데이터 영향 없음 |
| 필드 추가 (required) | 중간 | 기본값 필요 |
| 필드 삭제 | 높음 | 데이터 손실 가능 |
| 필드 타입 변경 | 높음 | 데이터 변환 필요 |
| 관계 변경 | 높음 | 참조 무결성 확인 필요 |

### 4. 마이그레이션 실행
```bash
cd backend && npx prisma migrate dev --name <migration-name>
```

### 5. Prisma Client 재생성 확인
```bash
cd backend && npx prisma generate
```

### 6. 영향받는 서비스 확인
- 수정된 모델을 사용하는 서비스 파일 식별
- 필요시 서비스 코드 업데이트

## 롤백 방법

### 개발 환경
```bash
cd backend && npx prisma migrate reset
```

### 특정 마이그레이션 제거
```bash
# migrations 폴더에서 해당 마이그레이션 삭제 후
cd backend && npx prisma migrate dev
```

## 주의사항
- **프로덕션**: `prisma migrate deploy` 사용
- **데이터 백업**: 위험한 변경 전 필수
- **트랜잭션**: 마이그레이션은 자동 트랜잭션
- **Prisma 7.x 금지**: 현재 5.22 버전 유지

## 체크리스트
- [ ] `prisma format` 실행
- [ ] `prisma validate` 통과
- [ ] 위험도 평가 완료
- [ ] 마이그레이션 실행
- [ ] `prisma generate` 확인
- [ ] 관련 서비스 코드 업데이트

$ARGUMENTS
