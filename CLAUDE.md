# CLAUDE.md - AI Assistant Development Guide

**Last Updated:** 2026-01-13
**Project:** Gethertube-Claude
**Version:** 0.0.1
**Status:** Early Development - Infrastructure Complete

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Git Conventions](#git-conventions)
6. [Code Style & Standards](#code-style--standards)
7. [AI Assistant Guidelines](#ai-assistant-guidelines)
8. [Testing Standards](#testing-standards)
9. [Custom Claude Agents](#custom-claude-agents)
10. [Environment Configuration](#environment-configuration)

---

## 🎯 Project Overview

### What is Gethertube-Claude?

**Gethertube-Claude** is a YouTube-related application with Claude AI integration, built as a full-stack monorepo project.

### Project Type

**pnpm Workspace Monorepo** consisting of:
- **Frontend:** React 18 single-page application
- **Backend:** NestJS 10 REST API server
- **Shared Packages:** Future shared libraries (prepared)

### Current Status

**Phase:** Infrastructure Setup Complete ✅
- ✅ Monorepo structure configured
- ✅ Build tooling operational
- ✅ Code quality tools configured (ESLint, Prettier)
- ✅ TypeScript strict mode enabled
- ✅ Custom Claude agents configured
- ✅ Development workflows ready
- ⏳ Domain implementation pending

---

## 🛠 Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **React Router** | 6.28.0 | Client-side routing |
| **TypeScript** | 5.6.3 | Type safety |
| **react-scripts** | 5.0.1 | Build tooling (CRA) |
| **Node.js** | 20.x | Runtime (specified in .nvmrc) |

**Key Features:**
- Path aliases configured (`@/*`, `@components/*`, `@pages/*`, etc.)
- Global CSS reset applied
- Korean language HTML template
- Component-based architecture ready

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 10.4.6 | Backend framework |
| **Express** | - | HTTP server (via NestJS) |
| **TypeScript** | 5.6.3 | Type safety |
| **Swagger** | 8.0.5 | API documentation |
| **Jest** | 29.7.0 | Testing framework |
| **class-validator** | 0.14.1 | DTO validation |
| **class-transformer** | 0.5.1 | DTO transformation |

**Key Features:**
- Global validation pipe enabled (whitelist, transform)
- CORS enabled globally
- Swagger UI at `http://localhost:3001/api`
- Path aliases configured (`@/*`, `@modules/*`, `@common/*`, etc.)
- Environment variables via `@nestjs/config`

### Tooling & Infrastructure

| Tool | Version | Purpose |
|------|---------|---------|
| **pnpm** | 9.15.0 | Package manager (workspace) |
| **ESLint** | 8.57.0 | Linting |
| **Prettier** | Latest | Code formatting |
| **ts-jest** | 29.2.5 | TypeScript testing |

---

## 📁 Project Structure

```
Gethertube-Claude/
├── .claude/                          # Claude Code AI configuration
│   ├── settings.json                # Enabled plugins (7 plugins)
│   ├── settings.local.json           # Permissions & MCP servers
│   ├── agents/
│   │   └── tech-lead.md              # Tech Lead AI agent (10yr experience)
│   └── commands/
│       ├── backend.md                # Backend developer guide
│       └── frontend.md                # Frontend developer guide
│
├── backend/                          # NestJS Backend
│   ├── src/
│   │   ├── modules/                  # Domain modules (empty - ready for features)
│   │   ├── common/                   # Shared utilities
│   │   │   ├── decorators/           # Custom decorators
│   │   │   ├── filters/              # Exception filters
│   │   │   ├── guards/               # Auth/authorization guards
│   │   │   ├── interceptors/         # Request/response interceptors
│   │   │   └── pipes/                # Validation pipes
│   │   ├── config/                   # Configuration management
│   │   ├── database/                 # Database connection setup
│   │   ├── app.module.ts             # Root module
│   │   ├── app.controller.ts         # Health check endpoint
│   │   ├── app.service.ts            # Application services
│   │   └── main.ts                   # Bootstrap (35 lines)
│   ├── test/                         # E2E tests
│   ├── .env.example                  # Environment variables template
│   ├── nest-cli.json                 # NestJS CLI config
│   ├── package.json                  # Backend dependencies
│   ├── tsconfig.json                 # TypeScript config with path aliases
│   └── tsconfig.build.json           # Build-specific TS config
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   ├── pages/                    # Route page components
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── services/                 # API calls & external services
│   │   ├── store/                    # Global state management
│   │   ├── styles/
│   │   │   └── index.css             # Global styles (CSS reset)
│   │   ├── types/                    # TypeScript type definitions
│   │   ├── utils/                    # Helper functions
│   │   ├── App.tsx                   # Root component (14 lines)
│   │   └── index.tsx                 # Entry point (14 lines)
│   ├── public/
│   │   └── index.html                # HTML template (lang="ko")
│   ├── package.json                  # Frontend dependencies
│   └── tsconfig.json                 # TypeScript config with path aliases
│
├── packages/                         # Future shared packages (prepared)
│
├── .editorconfig                     # Editor configuration
├── .eslintrc.json                    # Shared ESLint rules
├── .gitignore                        # Git ignore patterns
├── .nvmrc                            # Node.js version: 20
├── .prettierrc                       # Prettier configuration
├── CLAUDE.md                         # This file
├── README.md                         # Project README
├── package.json                      # Root workspace config
└── pnpm-workspace.yaml               # Workspace definition

```

### Key Directories Explained

#### Backend (`/backend`)
- **`src/modules/`** - Feature modules (users, rooms, videos, etc.) - Empty, ready for implementation
- **`src/common/`** - Shared utilities (decorators, filters, guards, interceptors, pipes)
- **`src/config/`** - Configuration management (database, JWT, etc.)
- **`src/database/`** - Database connection and migrations
- **`test/`** - End-to-end tests

#### Frontend (`/frontend`)
- **`src/components/`** - Reusable UI components (buttons, forms, etc.)
- **`src/pages/`** - Page-level components (Home, Room, Video, etc.)
- **`src/hooks/`** - Custom React hooks (useAuth, useFetch, etc.)
- **`src/services/`** - API integration and external service calls
- **`src/store/`** - State management (Context, Zustand, Redux, etc.)
- **`src/types/`** - Shared TypeScript types and interfaces

---

## 🔄 Development Workflow

### Initial Setup

```bash
# 1. Ensure Node.js 20.x is installed
nvm use 20

# 2. Install pnpm (if not already installed)
npm install -g pnpm@9.15.0

# 3. Install all dependencies
pnpm install

# 4. Set up environment variables (backend)
cd backend
cp .env.example .env
# Edit .env with your configuration

# 5. Run development servers
cd ..
pnpm dev  # Runs both frontend (port 3000) and backend (port 3001)
```

### Daily Development Commands

```bash
# Development (runs both frontend and backend)
pnpm dev

# Development (frontend only - port 3000)
pnpm dev:frontend

# Development (backend only - port 3001)
pnpm dev:backend

# Build all packages
pnpm build

# Build specific package
pnpm --filter frontend build
pnpm --filter backend build

# Run tests
pnpm test

# Run linter
pnpm lint

# Clean all artifacts
pnpm clean  # Removes dist/ and node_modules/
```

### Adding New Features

#### Backend Module Creation

```bash
# Navigate to backend
cd backend

# Generate new module (using NestJS CLI)
npx nest g module modules/users
npx nest g controller modules/users
npx nest g service modules/users

# Create DTOs
mkdir src/modules/users/dto
touch src/modules/users/dto/create-user.dto.ts
touch src/modules/users/dto/update-user.dto.ts
```

#### Frontend Component Creation

```bash
# Navigate to frontend
cd frontend/src/components

# Create new component
mkdir Button
touch Button/Button.tsx
touch Button/Button.module.css
touch Button/index.ts
```

---

## 🌿 Git Conventions

### Branch Naming

**CRITICAL:** All Claude AI development branches MUST follow this exact pattern:

```
claude/<descriptive-name>-<session-id>
```

**Examples:**
- `claude/add-user-module-mkcgi924jnpjbjrj-PLo14`
- `claude/implement-room-feature-xyz789abc123def`
- `claude/fix-auth-bug-qwe456rty789uio`

**Other Branch Prefixes (for human developers):**
- `feat/<feature-name>` - New features
- `fix/<bug-name>` - Bug fixes
- `docs/<doc-name>` - Documentation updates
- `refactor/<refactor-name>` - Code refactoring
- `test/<test-name>` - Test additions

### Commit Message Format

Follow **Conventional Commits** specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, semicolons, etc.)
- `refactor` - Code restructuring without behavior change
- `test` - Adding or updating tests
- `chore` - Maintenance (deps, config, etc.)
- `perf` - Performance improvements

**Scopes (examples):**
- `backend` - Backend changes
- `frontend` - Frontend changes
- `api` - API endpoints
- `auth` - Authentication/authorization
- `ui` - UI components
- `db` - Database changes

**Examples:**

```bash
# Good commit messages
feat(backend): add user registration endpoint
fix(frontend): resolve routing issue on home page
docs(api): update Swagger documentation for auth endpoints
refactor(backend): extract validation logic to shared pipe
test(frontend): add unit tests for Button component

# Bad commit messages (avoid)
update code
fix bug
changes
WIP
asdf
```

### Git Operations

**Pushing to Remote:**

```bash
# ALWAYS use -u flag for new branches
git push -u origin <branch-name>

# Example
git push -u origin claude/add-video-module-abc123xyz
```

**IMPORTANT:** Branch name MUST start with `claude/` and end with session ID, otherwise push will fail with 403 error.

**Network Retry Policy:**
- Automatically retry up to 4 times on network failures
- Exponential backoff: 2s → 4s → 8s → 16s
- Applies to: `git push`, `git fetch`, `git pull`

**Fetching/Pulling:**

```bash
# Prefer fetching specific branches
git fetch origin main
git fetch origin <branch-name>

# Pull specific branch
git pull origin main
```

---

## 💻 Code Style & Standards

### General Principles

1. **Simplicity Over Cleverness**
   - Write code that is easy to read and understand
   - Avoid unnecessary abstractions
   - Don't over-engineer solutions

2. **TypeScript Strict Mode**
   - All code MUST pass TypeScript strict checks
   - No `any` types without explicit justification
   - Prefer interfaces for object shapes
   - Use type guards for runtime checks

3. **Security First**
   - **ALWAYS** validate user inputs
   - **ALWAYS** sanitize outputs
   - **NEVER** commit secrets (.env files, API keys, tokens)
   - Use parameterized queries (prevent SQL injection)
   - Prevent XSS attacks (sanitize HTML)
   - Follow OWASP Top 10 guidelines

4. **Error Handling**
   - Handle errors at system boundaries (API requests, user input)
   - Provide meaningful error messages
   - Use proper HTTP status codes
   - Log errors with context

### Backend Code Standards (NestJS)

#### Module Structure

```typescript
// ✅ Good: Clear separation of concerns
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

#### Controller Standards

```typescript
// ✅ Good: Proper decorators, DTOs, and Swagger docs
@Controller('users')
@ApiTags('Users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
}
```

#### DTO Standards

```typescript
// ✅ Good: Proper validation decorators
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe', minLength: 2, maxLength: 50 })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
```

#### Service Standards

```typescript
// ✅ Good: Business logic in services, not controllers
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Business logic here
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}
```

### Frontend Code Standards (React)

#### Component Standards

```typescript
// ✅ Good: Functional component with proper typing
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button
      className={`button button--${variant}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {label}
    </button>
  );
};
```

#### Custom Hooks

```typescript
// ✅ Good: Reusable custom hook with proper typing
import { useState, useEffect } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        const data = await response.json();
        setState({ data, loading: false, error: null });
      } catch (error) {
        setState({ data: null, loading: false, error: error as Error });
      }
    };

    fetchData();
  }, [url]);

  return state;
}
```

### Naming Conventions

#### Files & Directories

```
✅ Good:
- user.controller.ts
- create-user.dto.ts
- user.service.spec.ts
- Button.tsx
- UserProfile.tsx
- use-auth.hook.ts

❌ Bad:
- UserController.ts (should be lowercase)
- CreateUserDTO.ts (should be kebab-case)
- button.tsx (component should be PascalCase)
- useAuth.ts (should indicate it's a hook)
```

#### Variables & Functions

```typescript
// ✅ Good: Descriptive names
const userData = await fetchUserData(userId);
const isAuthenticated = checkAuthStatus();
function calculateTotalPrice(items: Item[]): number { ... }

// ❌ Bad: Unclear names
const data = await fetch(id);
const flag = check();
function calc(arr: any[]): number { ... }
```

#### Constants

```typescript
// ✅ Good: UPPER_SNAKE_CASE for constants
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT_MS = 5000;
```

### Comments & Documentation

**When to Add Comments:**
- Complex business logic that isn't self-evident
- Workarounds for known issues
- Public APIs and interfaces
- Non-obvious performance optimizations

**When NOT to Add Comments:**
- Explaining what the code does (code should be self-explanatory)
- Restating variable/function names
- Commented-out code (delete it)
- Obvious statements

```typescript
// ❌ Bad: Unnecessary comment
// Get user by ID
function getUserById(id: string) { ... }

// ✅ Good: Explains why, not what
// Using cache to reduce database load during peak hours
const cachedUser = await cache.get(userId);
if (cachedUser) return cachedUser;
```

---

## 🤖 AI Assistant Guidelines

### Critical Rules for AI Assistants

1. **ALWAYS Read Before Editing**
   - Use `Read` tool to examine files before making changes
   - Understand existing patterns and conventions
   - Maintain consistency with existing code style

2. **Use Appropriate Tools**
   - ✅ **Read** - For viewing file contents
   - ✅ **Edit** - For modifying existing files
   - ✅ **Write** - For creating new files
   - ✅ **Glob** - For finding files by pattern
   - ✅ **Grep** - For searching code content
   - ✅ **Bash** - For git, pnpm, npm commands only
   - ✅ **Task** - For complex multi-step operations
   - ❌ **NEVER use bash** for file operations (cat, echo, sed, awk)

3. **Task Management**
   - Use `TodoWrite` for planning complex tasks (3+ steps)
   - Mark ONE task as `in_progress` at a time
   - Complete tasks immediately when done
   - Break large tasks into smaller, actionable steps

4. **Git Workflow**
   - ✅ Work on `claude/*` branches only
   - ✅ Use conventional commit messages
   - ✅ Run tests before committing
   - ❌ NEVER push to `main` without permission
   - ❌ NEVER skip git hooks (--no-verify)
   - ❌ NEVER force push to main/master

5. **Security Checklist**
   - ✅ Validate ALL user inputs
   - ✅ Sanitize outputs to prevent XSS
   - ✅ Use environment variables for secrets
   - ✅ Check for SQL injection vulnerabilities
   - ❌ NEVER commit .env files
   - ❌ NEVER commit API keys or tokens
   - ❌ NEVER commit credentials

6. **Testing Requirements**
   - ✅ Write tests for new features
   - ✅ Run existing tests before committing
   - ✅ Fix broken tests immediately
   - ✅ Maintain test coverage above 80%
   - ❌ NEVER skip tests with `.only` or `.skip` in production

7. **Don't Over-Engineer**
   - ✅ Implement ONLY what's requested
   - ✅ Keep solutions simple and focused
   - ✅ Trust framework guarantees
   - ❌ DON'T add unrequested features
   - ❌ DON'T create premature abstractions
   - ❌ DON'T refactor unrelated code
   - ❌ DON'T add comments to unchanged code

8. **Communication**
   - ✅ Reference files with line numbers: `app.controller.ts:15`
   - ✅ Output text directly to communicate
   - ✅ Provide clear, concise updates
   - ❌ NEVER use echo/printf for communication

### Feature Implementation Checklist

When implementing a new feature:

**Backend Feature:**
- [ ] Read existing module structure
- [ ] Create module using NestJS CLI if needed
- [ ] Create DTOs with validation decorators
- [ ] Implement controller with Swagger docs
- [ ] Implement service with business logic
- [ ] Add proper error handling
- [ ] Write unit tests (`.spec.ts`)
- [ ] Write E2E tests if applicable
- [ ] Update Swagger documentation
- [ ] Test manually via Swagger UI
- [ ] Run `pnpm test` before committing
- [ ] Commit with conventional commit message

**Frontend Feature:**
- [ ] Read existing component structure
- [ ] Create component directory structure
- [ ] Implement component with TypeScript types
- [ ] Add proper prop validation
- [ ] Implement accessibility (ARIA labels, keyboard nav)
- [ ] Add responsive CSS
- [ ] Write unit tests (`.test.tsx`)
- [ ] Test manually in browser
- [ ] Run `pnpm test` before committing
- [ ] Commit with conventional commit message

### Common Pitfalls to Avoid

| ❌ DON'T | ✅ DO |
|----------|-------|
| Commit without reading existing code | Read files before making changes |
| Add features not requested | Implement only what's asked |
| Create unnecessary abstractions | Keep it simple and focused |
| Use bash for file operations | Use Read/Edit/Write tools |
| Skip tests | Write and run tests |
| Push to wrong branch | Always use `claude/*` branches |
| Commit secrets (.env, keys) | Use environment variables |
| Over-validate internal code | Validate at system boundaries only |
| Add comments to unchanged code | Only comment new complex logic |
| Use `any` type freely | Use proper TypeScript types |

---

## 🧪 Testing Standards

### Test Coverage Requirements

**Minimum Coverage:** 80% overall
- Unit tests: 85%+
- Integration tests: 75%+
- E2E tests: Key user flows

### Backend Testing (NestJS + Jest)

#### Running Tests

```bash
cd backend

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:cov

# Run E2E tests
pnpm test:e2e
```

#### Unit Test Example

```typescript
// user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      const user = { id: '1', name: 'John' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(user as User);

      expect(await service.findOne('1')).toEqual(user);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });
});
```

### Frontend Testing (React + Jest + RTL)

#### Running Tests

```bash
cd frontend

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run tests with coverage
pnpm test -- --coverage
```

#### Component Test Example

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button label="Click me" onClick={handleClick} />);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button label="Click me" onClick={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

---

## 🎭 Custom Claude Agents & Skills

### Agents (병렬 실행 가능)

#### Tech Lead Agent
**File:** `.claude/agents/tech-lead.md` | **Model:** Opus | **Color:** Green

10년차 개발 팀장. 코드 리뷰, 아키텍처, 테스트 총괄.
- PR 리뷰 및 GitHub 코멘트 작성
- 보안/성능 분석

#### Backend Agent
**File:** `.claude/agents/backend.md` | **Model:** Sonnet | **Color:** Blue

5년차 NestJS 백엔드 개발자. API, DB, WebSocket 구현.
- NestJS 모듈/컨트롤러/서비스 구현
- Prisma 스키마 및 마이그레이션
- WebSocket Gateway 구현

#### Frontend Agent
**File:** `.claude/agents/frontend.md` | **Model:** Sonnet | **Color:** Orange

5년차 React 프론트엔드 개발자. UI, 상태관리, WebSocket 클라이언트.
- React 컴포넌트/페이지 구현
- Context API 상태관리
- WebSocket 클라이언트 hook

### Custom Skills (Slash Commands)

| Command | Purpose |
|---------|---------|
| `/room-scaffold <name>` | Room 기능 보일러플레이트 생성 |
| `/api-sync <module>` | 백엔드 DTO → 프론트엔드 타입 동기화 |
| `/ws-event <gateway> <event>` | WebSocket 이벤트 핸들러 생성 |
| `/db-migrate <name>` | 안전한 Prisma 마이그레이션 |
| `/test-feature <feature>` | 특정 기능 테스트 실행 |
| `/backend-compact` | 백엔드 문서 최적화 |
| `/frontend-compact` | 프론트엔드 문서 최적화 |
| `/full-compact` | 전체 문서 최적화 |

### Claude Code Hooks

**File:** `.claude/settings.local.json`

| Hook | Trigger | Action |
|------|---------|--------|
| PreToolExecution | `git commit` | `pnpm lint` |
| PreToolExecution | `git push` | `pnpm test` |
| PostToolExecution | Prisma 스키마 수정 | `prisma format` |
| PostToolExecution | Backend TS 파일 수정 | `lint --fix` |
| PostToolExecution | Frontend TSX 파일 수정 | `lint --fix` |

---

## ⚙️ Environment Configuration

### Backend Environment Variables

**File:** `backend/.env.example`

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/gethertube

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# API Keys (if needed)
# YOUTUBE_API_KEY=your-youtube-api-key
# CLAUDE_API_KEY=your-claude-api-key
```

**Setup:**
```bash
cd backend
cp .env.example .env
# Edit .env with your actual values
```

**IMPORTANT:**
- ❌ NEVER commit `.env` files
- ✅ ALWAYS use `.env.example` for templates
- ✅ Use strong, random values for `JWT_SECRET` in production
- ✅ Keep API keys secure and rotate them regularly

### Frontend Environment Variables

**Create:** `frontend/.env.local`

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001

# Feature Flags (if needed)
# REACT_APP_ENABLE_FEATURE_X=true
```

**Usage in React:**
```typescript
const apiUrl = process.env.REACT_APP_API_URL;
```

---

## 📚 Additional Resources

### Project Documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview and setup instructions |
| `CLAUDE.md` | This file - AI assistant development guide |
| `backend/.env.example` | Backend environment variable template |
| `.claude/agents/tech-lead.md` | Tech Lead agent (code review) |
| `.claude/agents/backend.md` | Backend agent (NestJS) |
| `.claude/agents/frontend.md` | Frontend agent (React) |
| `.claude/settings.local.json` | Claude Code hooks configuration |

### Development Tools

| Tool | URL/Command | Purpose |
|------|-------------|---------|
| **Swagger UI** | http://localhost:3001/api | Backend API documentation |
| **Frontend Dev** | http://localhost:3000 | React development server |
| **Backend Health** | http://localhost:3001 | Health check endpoint |

### Useful Commands

```bash
# Check Node.js version
node --version

# Check pnpm version
pnpm --version

# Install dependencies for all packages
pnpm install

# Update dependencies
pnpm update

# Check for outdated dependencies
pnpm outdated

# Workspace-specific commands
pnpm --filter backend <command>
pnpm --filter frontend <command>

# Run command in all workspaces
pnpm -r <command>

# Run command in parallel across workspaces
pnpm -r --parallel <command>
```

---

## 📊 Project Status & Roadmap

### Phase 1: Infrastructure Setup ✅ COMPLETE

- ✅ Monorepo structure configured
- ✅ Backend (NestJS) scaffold complete
- ✅ Frontend (React) scaffold complete
- ✅ Build tooling operational
- ✅ Code quality tools configured
- ✅ Custom Claude agents created
- ✅ TypeScript strict mode enabled
- ✅ Development workflows ready

### Phase 2: Authentication ✅ COMPLETE

- ✅ Database integration (Prisma 5.22 + PostgreSQL)
- ✅ Google OAuth 2.0 authentication
- ✅ JWT token management
- ✅ User model with Google profile
- ✅ Frontend AuthContext + ProtectedRoute
- ✅ Login/Callback pages

### Phase 3: Real-time Features 🚧 IN PROGRESS

**Backend:**
- [ ] Room/session management module
- [ ] WebSocket Gateway (Socket.IO)
- [ ] Chat module
- [ ] Video sync module
- [ ] Playlist module

**Frontend:**
- [ ] Room list/create pages
- [ ] Room page with video + chat layout
- [ ] WebSocket hooks (useChat, useVideoSync, usePlaylist)
- [ ] YouTube player integration

**Database:**
- [ ] Room, RoomMember models
- [ ] Message model
- [ ] VideoSync model
- [ ] PlaylistItem model

### Phase 4: Enhancement 📅 PLANNED

- [ ] Reactions/emoji support
- [ ] Typing indicators
- [ ] User presence
- [ ] Performance optimization
- [ ] Monitoring and logging

### Phase 5: Production Ready 📅 FUTURE

- [ ] Security audit
- [ ] Load testing
- [ ] CI/CD pipeline
- [ ] Documentation completion

---

## 📞 Contact & Support

**Project Owner:** Lucas Song
**Email:** pudingles@gmail.com
**Repository:** lukeydokey/Gethertube-Claude

For issues, questions, or contributions, please refer to the project's issue tracker.

---

## 📄 Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-16 | 3.0.0 | Agents 구조 개편, Skills/Hooks 추가, Google OAuth 완료 |
| 2026-01-13 | 2.0.0 | Complete rewrite based on actual monorepo structure |
| 2026-01-13 | 1.0.0 | Initial CLAUDE.md creation |

---

**Last Updated:** 2026-01-16
**Document Maintained By:** AI Assistants & Project Contributors

**Note:** This document should be updated whenever significant project changes occur (new modules, architecture changes, workflow updates, etc.).
