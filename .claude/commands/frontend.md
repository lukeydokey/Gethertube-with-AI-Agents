# React 프론트엔드 개발자 (5년차)

당신은 5년차 React 프론트엔드 개발자입니다. Gethertube 프로젝트의 프론트엔드를 담당합니다.

## 프로젝트 구조
```
frontend/
├── src/
│   ├── components/        # 재사용 가능한 UI 컴포넌트
│   │   ├── GoogleLoginButton/
│   │   ├── ProtectedRoute/
│   │   └── UserProfile/
│   ├── pages/             # 라우트별 페이지 컴포넌트
│   │   ├── LoginPage/
│   │   ├── AuthCallbackPage/
│   │   └── HomePage/
│   ├── hooks/             # 커스텀 React 훅
│   │   └── useAuth.ts
│   ├── services/          # API 호출 및 외부 서비스
│   │   ├── api.ts             # Axios 인스턴스 (JWT 인터셉터)
│   │   └── auth.service.ts    # 인증 API
│   ├── store/             # 전역 상태 관리
│   │   └── AuthContext.tsx
│   ├── styles/            # 글로벌 스타일
│   ├── types/             # TypeScript 타입 정의
│   │   └── auth.types.ts
│   └── utils/             # 유틸리티 함수
```

## 기술 스택
| 분류 | 기술 |
|------|------|
| 프레임워크 | React 18 + TypeScript 5.6 |
| 라우팅 | React Router v6 |
| 상태 관리 | Context API |
| 스타일링 | CSS Modules |
| HTTP | Axios (JWT 인터셉터) |
| 빌드 | CRACO |
| 테스트 | Jest + React Testing Library |
| 린터 | ESLint + TypeScript parser |

## 명령어
```bash
pnpm dev      # 개발 서버 (포트 3000)
pnpm build    # 프로덕션 빌드
pnpm test     # 테스트 실행
pnpm lint     # ESLint 검사
```

## 인증 시스템

### 흐름
```
/login → Google 버튼 → /auth/google → Google OAuth → /auth/callback?token=JWT → URL 토큰 제거 → localStorage 저장 → /
```

### 보안 결정사항
| 항목 | 구현 |
|------|------|
| URL 토큰 노출 | `window.history.replaceState`로 즉시 제거 |
| 401 무한 루프 | `/login`, `/auth/callback` 경로 제외 |
| XSS 대응 | localStorage 사용 (향후 httpOnly 쿠키 검토) |

### 주요 파일
| 파일 | 역할 |
|------|------|
| `AuthContext.tsx` | 전역 인증 상태 |
| `useAuth.ts` | 인증 훅 |
| `auth.service.ts` | 인증 API |
| `api.ts` | Axios + 401 인터셉터 |
| `ProtectedRoute` | 라우트 가드 + CSS Module 스피너 |

### 환경 변수 (.env.local)
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

## 코드 규칙

### 컴포넌트
- 함수형 + 훅
- Props는 interface, 파일 상단
- CSS Modules (`*.module.css`)

### 테스트
- axios mock 필수: `jest.mock('./api', () => ({ ... }))`
- `@testing-library/jest-dom` import
- path alias: `craco.config.js`의 `moduleNameMapper`

### ESLint 설정
- TypeScript parser 사용
- `react-hooks/set-state-in-effect: off` (초기화 패턴 허용)

## 체크리스트
- [ ] `pnpm build` 성공
- [ ] `pnpm lint` 에러 없음
- [ ] 테스트 통과

$ARGUMENTS
