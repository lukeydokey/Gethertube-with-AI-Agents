# Gethertube

YouTube 영상을 함께 시청할 수 있는 실시간 동기화 웹 애플리케이션입니다.

## 주요 기능

- Google OAuth 로그인
- 방 생성/참여 및 실시간 채팅 (Socket.IO)
- YouTube 영상 동기화 재생
- 플레이리스트 관리
- 메시지 리액션

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18, TypeScript, Socket.IO Client |
| Backend | NestJS 10, TypeScript, Socket.IO, Passport |
| Database | PostgreSQL 16, Prisma ORM |
| Cache | Redis 7 |
| Infra | Docker Compose, pnpm Workspace |

---

## 사전 요구사항

| 도구 | 버전 | 설치 확인 |
|------|------|-----------|
| **Node.js** | 20.x | `node -v` |
| **pnpm** | 9.15+ | `pnpm -v` |
| **Docker** | 20.10+ | `docker -v` |
| **Docker Compose** | v2+ | `docker compose version` |

### Node.js 설치

```bash
# nvm 사용 (권장)
nvm install 20
nvm use 20

# 또는 .nvmrc 활용
nvm use
```

### pnpm 설치

```bash
npm install -g pnpm@9.15.0
```

---

## 로컬 환경 설정

### 1. 의존성 설치

```bash
git clone <repository-url>
cd Gethertube-with-AI-Agents
pnpm install
```

### 2. 환경 변수 설정

#### Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env
```

`backend/.env` 파일을 열고 아래 항목을 수정합니다:

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `PORT` | 백엔드 서버 포트 | `3001` |
| `NODE_ENV` | 실행 환경 | `development` |
| `DATABASE_URL` | PostgreSQL 접속 URL | `postgresql://gethertube:gethertube123@localhost:5432/gethertube` |
| `REDIS_URL` | Redis 접속 URL | `redis://localhost:6379` |
| `JWT_SECRET` | JWT 서명 키 (임의 문자열) | 직접 설정 필요 |
| `JWT_EXPIRES_IN` | JWT 만료 시간 | `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | [Google Cloud Console](https://console.cloud.google.com/apis/credentials)에서 발급 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | 위와 동일 |
| `GOOGLE_CALLBACK_URL` | OAuth 콜백 URL | `http://localhost:3001/auth/google/callback` |
| `FRONTEND_URL` | 프론트엔드 URL (CORS) | `http://localhost:3000` |

#### Frontend (`frontend/.env.local`)

```bash
cp frontend/.env.example frontend/.env.local
```

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `REACT_APP_API_URL` | 백엔드 API URL | `http://localhost:3001` |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth Client ID (백엔드와 동일) | [Google Cloud Console](https://console.cloud.google.com/apis/credentials)에서 발급 |

#### Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. **APIs & Services > Credentials** 이동
3. **OAuth 2.0 Client ID** 생성 (웹 애플리케이션)
4. 승인된 리디렉션 URI에 `http://localhost:3001/auth/google/callback` 추가
5. 발급된 Client ID와 Client Secret을 `.env` 파일에 입력

### 3. 인프라 서비스 실행 (Docker)

PostgreSQL과 Redis를 Docker로 실행합니다:

```bash
docker compose up -d
```

서비스 상태 확인:

```bash
docker compose ps
```

정상이면 `gethertube-postgres`와 `gethertube-redis` 컨테이너가 `running (healthy)` 상태입니다.

### 4. 데이터베이스 마이그레이션

```bash
cd backend
npx prisma migrate dev
```

최초 실행 시 Prisma Client도 함께 생성됩니다.

---

## 실행

### 개발 서버 (Frontend + Backend 동시)

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Swagger API 문서: http://localhost:3001/api

### 개별 실행

```bash
# 프론트엔드만
pnpm dev:frontend

# 백엔드만
pnpm dev:backend
```

---

## 테스트

### 전체 테스트

```bash
pnpm test
```

### Backend 테스트

```bash
cd backend

# 단위 테스트
pnpm test

# watch 모드
pnpm test:watch

# 커버리지 리포트
pnpm test:cov

# E2E 테스트
pnpm test:e2e
```

### Frontend 테스트

```bash
cd frontend

# 단위 테스트
pnpm test

# watch 모드
pnpm test -- --watch

# 커버리지 리포트
pnpm test -- --coverage
```

---

## 빌드

```bash
# 전체 빌드
pnpm build

# 개별 빌드
pnpm build:frontend
pnpm build:backend
```

---

## 프로젝트 구조

```
Gethertube-with-AI-Agents/
├── backend/                  # NestJS 백엔드
│   ├── src/
│   │   ├── modules/          # 도메인 모듈 (auth, rooms, chat, video-sync, playlist)
│   │   ├── common/           # 공통 유틸리티 (guards, filters, decorators)
│   │   ├── config/           # 설정 관리
│   │   └── database/         # DB 연결
│   ├── prisma/
│   │   └── schema.prisma     # DB 스키마 정의
│   └── test/                 # E2E 테스트
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/       # 재사용 UI 컴포넌트
│   │   ├── pages/            # 페이지 컴포넌트
│   │   ├── hooks/            # 커스텀 React hooks
│   │   ├── services/         # API 호출
│   │   ├── store/            # 상태 관리
│   │   └── types/            # TypeScript 타입
│   └── public/
├── docker-compose.yml        # PostgreSQL, Redis
├── package.json              # Workspace 루트
└── pnpm-workspace.yaml       # pnpm 워크스페이스 설정
```

---

## 유용한 명령어

```bash
# 린트
pnpm lint

# Prisma Studio (DB GUI)
cd backend && npx prisma studio

# Docker 로그 확인
docker compose logs -f

# Docker 중지 및 데이터 초기화
docker compose down -v

# 전체 클린 (node_modules + dist 삭제)
pnpm clean
```
