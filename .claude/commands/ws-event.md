# WebSocket Event Generator

새로운 WebSocket 이벤트 핸들러를 생성합니다.

## 사용법
```
/ws-event <gateway> <event-name>
```

예시:
- `/ws-event chat typing` - chat gateway에 typing 이벤트 추가
- `/ws-event video reaction` - video gateway에 reaction 이벤트 추가
- `/ws-event playlist vote` - playlist gateway에 vote 이벤트 추가

## 생성 내용

### Backend (Gateway Handler)
```typescript
// <gateway>.gateway.ts에 추가

@SubscribeMessage('<gateway>:<event>')
async handle<Event>(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: <Event>Dto,
) {
  const userId = client.data.userId;
  // TODO: Implement handler
  this.server.to(`room:${data.roomId}`).emit('<gateway>:<event>', result);
}
```

### Backend (DTO)
```typescript
// dto/<event>.dto.ts
import { IsString } from 'class-validator';

export class <Event>Dto {
  @IsString()
  roomId: string;

  // TODO: Add fields
}
```

### Frontend (Hook 업데이트)
```typescript
// use<Gateway>.ts에 추가

const <event> = useCallback((data: <Event>Data) => {
  emit('<gateway>:<event>', data);
}, [emit]);

useEffect(() => {
  const unsubscribe = on('<gateway>:<event>', (result) => {
    // TODO: Handle event
  });
  return unsubscribe;
}, [on]);

return { ..., <event> };
```

### Frontend (Type)
```typescript
// <gateway>.types.ts에 추가
export interface <Event>Data {
  roomId: string;
  // TODO: Add fields
}
```

## 이벤트 네이밍 규칙
| 방향 | 패턴 | 예시 |
|------|------|------|
| Client → Server | `<gateway>:<action>` | `chat:typing` |
| Server → Client | `<gateway>:<action>` | `chat:typing` (broadcast) |
| Server → Client (결과) | `<gateway>:<action>ed` | `playlist:added` |

## 실행 단계
1. Gateway 파일 확인 (`backend/src/modules/<gateway>/<gateway>.gateway.ts`)
2. DTO 파일 생성
3. Gateway에 handler 추가
4. Frontend hook 업데이트
5. Frontend type 추가
6. 테스트 파일 업데이트

$ARGUMENTS
