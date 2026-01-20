# Feature Test Runner

특정 기능의 테스트만 실행합니다.

## 사용법
```
/test-feature <feature>
```

예시:
- `/test-feature auth` - auth 모듈 테스트
- `/test-feature rooms` - rooms 모듈 테스트
- `/test-feature chat` - chat 모듈 테스트
- `/test-feature frontend` - 프론트엔드 전체 테스트
- `/test-feature backend` - 백엔드 전체 테스트
- `/test-feature all` - 전체 테스트

## 실행 명령

### Backend 모듈 테스트
```bash
pnpm --filter backend test -- --testPathPattern="<feature>"
```

### Backend 전체 테스트
```bash
pnpm --filter backend test
```

### Frontend 컴포넌트/페이지 테스트
```bash
pnpm --filter frontend test -- --testPathPattern="<feature>"
```

### Frontend 전체 테스트
```bash
pnpm --filter frontend test
```

### 전체 프로젝트 테스트
```bash
pnpm test
```

## 테스트 옵션

### Watch 모드
```bash
pnpm --filter backend test:watch -- --testPathPattern="<feature>"
```

### Coverage 포함
```bash
pnpm --filter backend test:cov -- --testPathPattern="<feature>"
```

### Verbose 출력
```bash
pnpm --filter backend test -- --testPathPattern="<feature>" --verbose
```

## 테스트 파일 위치

### Backend
| 유형 | 위치 | 패턴 |
|------|------|------|
| 단위 테스트 | `backend/src/modules/<feature>/` | `*.spec.ts` |
| E2E 테스트 | `backend/test/` | `*.e2e-spec.ts` |

### Frontend
| 유형 | 위치 | 패턴 |
|------|------|------|
| 컴포넌트 테스트 | `frontend/src/components/<Component>/` | `*.test.tsx` |
| 페이지 테스트 | `frontend/src/pages/<Page>/` | `*.test.tsx` |
| Hook 테스트 | `frontend/src/hooks/` | `*.test.ts` |

## 실행 단계
1. feature 인자 확인
2. 해당 feature의 테스트 파일 존재 확인
3. 테스트 실행
4. 결과 요약 출력
5. 실패 시 상세 정보 제공

## 테스트 작성 가이드

### Backend (NestJS + Jest)
```typescript
describe('RoomsService', () => {
  let service: RoomsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  it('should create a room', async () => {
    // Arrange, Act, Assert
  });
});
```

### Frontend (React Testing Library)
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { RoomPage } from './RoomPage';

describe('RoomPage', () => {
  it('renders room name', () => {
    render(<RoomPage />);
    expect(screen.getByText('Room Name')).toBeInTheDocument();
  });
});
```

$ARGUMENTS
