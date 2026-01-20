# API Type Synchronization

백엔드 DTO와 프론트엔드 타입을 동기화합니다.

## 사용법
```
/api-sync <module>   # 특정 모듈만
/api-sync all        # 전체 모듈
```

예시:
- `/api-sync auth` - auth 모듈 타입만 동기화
- `/api-sync rooms` - rooms 모듈 타입만 동기화
- `/api-sync all` - 모든 모듈 동기화

## 동기화 규칙

### DTO → Type 변환
| Backend (DTO) | Frontend (Type) |
|---------------|-----------------|
| `CreateRoomDto` | `CreateRoomRequest` |
| `RoomResponseDto` | `Room` |
| `class-validator` decorators | TypeScript types |

### 변환 예시

**Backend DTO:**
```typescript
// backend/src/modules/rooms/dto/create-room.dto.ts
import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: 'My Room' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}
```

**Frontend Type:**
```typescript
// frontend/src/types/room.types.ts
export interface CreateRoomRequest {
  name: string;
  isPrivate?: boolean;
}
```

## 실행 단계
1. `backend/src/modules/<module>/dto/*.dto.ts` 파일 탐색
2. DTO 클래스 파싱
3. TypeScript interface로 변환
4. `frontend/src/types/<module>.types.ts`에 작성
5. 기존 타입과 충돌 확인
6. 린트 실행

## 주의사항
- Response DTO는 `*Response` 접미사 제거
- `@ApiProperty`의 `example`은 무시
- `class-validator` decorator에서 타입 추론
- Enum은 별도 export

$ARGUMENTS
