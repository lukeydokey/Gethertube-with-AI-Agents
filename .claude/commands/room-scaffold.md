# Room Feature Scaffold

새로운 Room 관련 기능의 보일러플레이트를 생성합니다.

## 사용법
```
/room-scaffold <feature-name>
```

예시: `/room-scaffold reactions` → reactions 모듈 생성

## 생성 파일

### Backend
- `backend/src/modules/<name>/dto/create-<name>.dto.ts`
- `backend/src/modules/<name>/dto/<name>-response.dto.ts`
- `backend/src/modules/<name>/<name>.controller.ts`
- `backend/src/modules/<name>/<name>.service.ts`
- `backend/src/modules/<name>/<name>.module.ts`
- `backend/src/modules/<name>/<name>.service.spec.ts`

### Frontend
- `frontend/src/hooks/use<Name>.ts`
- `frontend/src/types/<name>.types.ts`
- `frontend/src/services/<name>.service.ts`

## 생성 템플릿

### Backend Module
```typescript
// <name>.module.ts
import { Module } from '@nestjs/common';
import { <Name>Service } from './<name>.service';
import { <Name>Controller } from './<name>.controller';

@Module({
  controllers: [<Name>Controller],
  providers: [<Name>Service],
  exports: [<Name>Service],
})
export class <Name>Module {}
```

### Backend Service
```typescript
// <name>.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class <Name>Service {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: Implement methods
}
```

### Backend Controller
```typescript
// <name>.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { <Name>Service } from './<name>.service';

@Controller('rooms/:roomId/<name>')
@ApiTags('<Name>')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class <Name>Controller {
  constructor(private readonly <name>Service: <Name>Service) {}

  // TODO: Implement endpoints
}
```

### Frontend Hook
```typescript
// use<Name>.ts
import { useState, useEffect, useCallback } from 'react';
import { <name>Service } from '@/services/<name>.service';

export function use<Name>(roomId: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // TODO: Implement hook logic

  return { data, loading, error };
}
```

## 실행 단계
1. 인자로 받은 feature-name 확인
2. PascalCase, camelCase, kebab-case 변환
3. 각 파일 생성
4. AppModule에 import 추가 안내
5. 린트 실행

$ARGUMENTS
