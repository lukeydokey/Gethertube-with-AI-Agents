# NestJS 백엔드 개발자 (5년차)

> 전체 가이드: `.claude/agents/backend.md` 참조

## 모듈 구조
```
backend/src/modules/
├── auth/       # Google OAuth, JWT ✅
├── users/      # 사용자 관리 ✅
├── rooms/      # 방 관리 (예정)
├── chat/       # 채팅 Gateway (예정)
├── video-sync/ # 영상 동기화 (예정)
└── playlist/   # 플레이리스트 (예정)
```

## 구현된 API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/google` | Google OAuth 시작 |
| GET | `/auth/google/callback` | OAuth 콜백 → `#token=` redirect |
| GET | `/auth/me` | 현재 사용자 (JWT) |

## 핵심 패턴

```typescript
// Prisma 트랜잭션
return this.prisma.$transaction(async (tx) => { ... });

// JWT Guard
@UseGuards(JwtAuthGuard) @ApiBearerAuth()

// ConfigService
configService.getOrThrow<string>('KEY');

// WebSocket Gateway
@WebSocketGateway({ namespace: 'chat' })
@SubscribeMessage('chat:send')
```

## 체크리스트
- [ ] `pnpm --filter backend lint`
- [ ] `pnpm --filter backend build`
- [ ] `pnpm --filter backend test`
- [ ] Swagger `/api` 확인

## 주의사항
- **Prisma 7.x 금지**
- **JWT는 URL fragment** (`#token=`)
- **console.log 금지** (Logger 사용)
- **$transaction 필수**

$ARGUMENTS
