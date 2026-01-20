# React 프론트엔드 개발자 (5년차)

> 전체 가이드: `.claude/agents/frontend.md` 참조

## 프로젝트 구조
```
frontend/src/
├── components/   # GoogleLoginButton, ProtectedRoute, UserProfile
├── pages/        # LoginPage, AuthCallbackPage, HomePage
├── hooks/        # useAuth
├── services/     # api.ts, auth.service.ts
├── store/        # AuthContext.tsx
└── types/        # auth.types.ts
```

## 인증 흐름
```
/login → Google OAuth → /auth/callback#token=JWT → localStorage → /
```

## 핵심 패턴

```typescript
// Context 사용
const { user, isAuthenticated } = useAuth();

// WebSocket Hook (예정)
const { emit, on } = useWebSocket('chat');

// Protected Route
<Route element={<ProtectedRoute />}>
  <Route path="/" element={<HomePage />} />
</Route>
```

## 보안 규칙
| 항목 | 구현 |
|------|------|
| URL 토큰 | `window.history.replaceState`로 즉시 제거 |
| 401 루프 방지 | `/login`, `/auth/callback` 제외 |

## 체크리스트
- [ ] `pnpm --filter frontend build`
- [ ] `pnpm --filter frontend lint`
- [ ] `pnpm --filter frontend test`

$ARGUMENTS
