# Gethertube System Architecture

**Version:** 1.0.0  
**Last Updated:** 2026-01-20  
**Status:** Phase 3 Design Document

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Database Schema Design](#5-database-schema-design)
6. [WebSocket Event Design](#6-websocket-event-design)
7. [REST API Design](#7-rest-api-design)
8. [Security Architecture](#8-security-architecture)
9. [Deployment Architecture](#9-deployment-architecture)

---

## 1. System Overview

### 1.1 Project Goals

Gethertube is a real-time collaborative platform where users can:

- **Watch YouTube videos together** in synchronized playback
- **Chat in real-time** while watching videos
- **Create and manage rooms** for group viewing sessions
- **Manage playlists** collaboratively

### 1.2 Key Features

| Feature | Description |
|---------|-------------|
| **Room Management** | Create, join, and manage viewing rooms |
| **Video Sync** | Synchronized YouTube video playback across all room members |
| **Real-time Chat** | Live chat functionality within rooms |
| **Playlist Management** | Collaborative playlist creation and management |
| **User Authentication** | Google OAuth 2.0 authentication |

### 1.3 Technology Stack

```mermaid
graph TB
    subgraph Frontend["Frontend (React 18)"]
        React[React 18.3.1]
        RRouter[React Router 6]
        TS1[TypeScript 5.6]
        SocketIO_C[Socket.IO Client]
        YT[YouTube IFrame API]
    end

    subgraph Backend["Backend (NestJS 10)"]
        NestJS[NestJS 10.4.6]
        TS2[TypeScript 5.6]
        Passport[Passport.js]
        JWT[JWT]
        SocketIO_S[Socket.IO Server]
        Prisma[Prisma 5.22]
    end

    subgraph Database["Database"]
        PostgreSQL[(PostgreSQL 15+)]
    end

    subgraph External["External Services"]
        Google[Google OAuth 2.0]
        YouTube[YouTube Data API]
    end

    Frontend --> Backend
    Backend --> Database
    Backend --> External
```

---

## 2. High-Level Architecture

### 2.1 System Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Browser[Web Browser]
        ReactApp[React SPA]
        WSClient[WebSocket Client]
    end

    subgraph Server["Server Layer"]
        subgraph NestJS["NestJS Application"]
            REST[REST Controllers]
            WS[WebSocket Gateway]
            Services[Business Services]
            Guards[Auth Guards]
        end
    end

    subgraph Data["Data Layer"]
        PostgreSQL[(PostgreSQL)]
        Redis[(Redis - Optional)]
    end

    subgraph External["External Services"]
        GoogleOAuth[Google OAuth]
        YouTubeAPI[YouTube API]
    end

    Browser --> ReactApp
    ReactApp --> REST
    ReactApp --> WSClient
    WSClient --> WS
    REST --> Guards
    WS --> Guards
    Guards --> Services
    Services --> PostgreSQL
    Services --> Redis
    NestJS --> GoogleOAuth
    NestJS --> YouTubeAPI
```

### 2.2 Request Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant WebSocket
    participant Database

    User->>Frontend: Access Room
    Frontend->>Backend: GET /api/rooms/:id
    Backend->>Database: Query Room
    Database-->>Backend: Room Data
    Backend-->>Frontend: Room Response

    Frontend->>WebSocket: Connect (JWT)
    WebSocket->>Backend: Validate Token
    Backend-->>WebSocket: Token Valid
    WebSocket-->>Frontend: Connected

    Frontend->>WebSocket: join_room
    WebSocket->>Database: Add Member
    WebSocket-->>Frontend: room_joined
    WebSocket-->>Frontend: room_state (sync)

    User->>Frontend: Play Video
    Frontend->>WebSocket: video_play
    WebSocket-->>Frontend: Broadcast to Room
```

---

## 3. Backend Architecture

### 3.1 Module Structure

```mermaid
graph TB
    subgraph AppModule["App Module (Root)"]
        subgraph CoreModules["Core Modules"]
            Config[ConfigModule]
            DB[DatabaseModule]
        end

        subgraph FeatureModules["Feature Modules"]
            Auth[AuthModule]
            Users[UsersModule]
            Rooms[RoomsModule]
            Chat[ChatModule]
            VideoSync[VideoSyncModule]
            Playlist[PlaylistModule]
        end

        subgraph SharedModules["Shared"]
            Common[CommonModule]
        end
    end

    AppModule --> CoreModules
    AppModule --> FeatureModules
    FeatureModules --> SharedModules

    Auth --> Users
    Rooms --> Users
    Chat --> Rooms
    VideoSync --> Rooms
    Playlist --> Rooms
```

### 3.2 Directory Structure

```
backend/src/
├── main.ts                     # Application bootstrap
├── app.module.ts               # Root module
├── app.controller.ts           # Health check
├── app.service.ts
│
├── common/                     # Shared utilities
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── ws-current-user.decorator.ts
│   ├── filters/
│   │   ├── http-exception.filter.ts
│   │   └── ws-exception.filter.ts
│   ├── guards/
│   │   └── ws-jwt-auth.guard.ts
│   ├── interceptors/
│   │   └── transform.interceptor.ts
│   └── pipes/
│       └── validation.pipe.ts
│
├── config/                     # Configuration
│   ├── app.config.ts
│   ├── database.config.ts
│   └── jwt.config.ts
│
├── database/                   # Database setup
│   ├── database.module.ts
│   └── prisma.service.ts
│
└── modules/
    ├── auth/                   # Authentication (Existing)
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── dto/
    │   ├── guards/
    │   └── strategies/
    │
    ├── users/                  # User management (Existing)
    │   ├── users.module.ts
    │   ├── users.service.ts
    │   └── dto/
    │
    ├── rooms/                  # Room management (New)
    │   ├── rooms.module.ts
    │   ├── rooms.controller.ts
    │   ├── rooms.service.ts
    │   ├── rooms.gateway.ts    # WebSocket Gateway
    │   ├── dto/
    │   │   ├── create-room.dto.ts
    │   │   ├── update-room.dto.ts
    │   │   ├── join-room.dto.ts
    │   │   └── room-response.dto.ts
    │   └── entities/
    │       └── room.entity.ts
    │
    ├── chat/                   # Real-time chat (New)
    │   ├── chat.module.ts
    │   ├── chat.service.ts
    │   ├── chat.gateway.ts
    │   ├── dto/
    │   │   ├── send-message.dto.ts
    │   │   └── message-response.dto.ts
    │   └── entities/
    │       └── message.entity.ts
    │
    ├── video-sync/             # Video synchronization (New)
    │   ├── video-sync.module.ts
    │   ├── video-sync.service.ts
    │   ├── video-sync.gateway.ts
    │   ├── dto/
    │   │   ├── video-state.dto.ts
    │   │   └── sync-request.dto.ts
    │   └── entities/
    │       └── video-state.entity.ts
    │
    └── playlist/               # Playlist management (New)
        ├── playlist.module.ts
        ├── playlist.controller.ts
        ├── playlist.service.ts
        ├── playlist.gateway.ts
        ├── dto/
        │   ├── add-video.dto.ts
        │   ├── reorder-playlist.dto.ts
        │   └── playlist-item-response.dto.ts
        └── entities/
            └── playlist-item.entity.ts
```

### 3.3 Module Responsibilities

| Module | Responsibility | Protocols |
|--------|----------------|-----------|
| **AuthModule** | Google OAuth, JWT tokens, session management | REST |
| **UsersModule** | User CRUD, profile management | REST |
| **RoomsModule** | Room CRUD, member management, room state | REST + WebSocket |
| **ChatModule** | Real-time messaging, message history | WebSocket |
| **VideoSyncModule** | Video playback synchronization | WebSocket |
| **PlaylistModule** | Playlist CRUD, video queue management | REST + WebSocket |

### 3.4 Gateway Architecture

```mermaid
graph LR
    subgraph Gateways["WebSocket Gateways"]
        RG[RoomsGateway<br/>Namespace: /rooms]
        CG[ChatGateway<br/>Namespace: /chat]
        VG[VideoSyncGateway<br/>Namespace: /video]
        PG[PlaylistGateway<br/>Namespace: /playlist]
    end

    subgraph Guards["WebSocket Guards"]
        WsAuth[WsJwtAuthGuard]
        WsRoom[WsRoomMemberGuard]
    end

    subgraph Services["Services"]
        RS[RoomsService]
        CS[ChatService]
        VS[VideoSyncService]
        PS[PlaylistService]
    end

    RG --> WsAuth
    CG --> WsAuth
    VG --> WsAuth
    PG --> WsAuth

    RG --> WsRoom
    CG --> WsRoom
    VG --> WsRoom
    PG --> WsRoom

    RG --> RS
    CG --> CS
    VG --> VS
    PG --> PS
```

---

## 4. Frontend Architecture

### 4.1 Component Structure

```mermaid
graph TB
    subgraph Pages["Pages"]
        Login[LoginPage]
        Home[HomePage]
        RoomList[RoomListPage]
        RoomCreate[RoomCreatePage]
        Room[RoomPage]
    end

    subgraph Layouts["Layouts"]
        MainLayout[MainLayout]
        RoomLayout[RoomLayout]
    end

    subgraph Features["Feature Components"]
        subgraph VideoFeature["Video"]
            VideoPlayer[VideoPlayer]
            VideoControls[VideoControls]
            VideoOverlay[VideoOverlay]
        end

        subgraph ChatFeature["Chat"]
            ChatBox[ChatBox]
            MessageList[MessageList]
            MessageInput[MessageInput]
            ChatMessage[ChatMessage]
        end

        subgraph PlaylistFeature["Playlist"]
            PlaylistPanel[PlaylistPanel]
            PlaylistItem[PlaylistItem]
            AddVideoForm[AddVideoForm]
        end

        subgraph RoomFeature["Room"]
            RoomCard[RoomCard]
            RoomHeader[RoomHeader]
            MemberList[MemberList]
            MemberAvatar[MemberAvatar]
        end
    end

    subgraph Common["Common Components"]
        Button[Button]
        Input[Input]
        Modal[Modal]
        Loading[Loading]
        Avatar[Avatar]
        Toast[Toast]
    end

    Pages --> Layouts
    Room --> RoomLayout
    RoomLayout --> VideoFeature
    RoomLayout --> ChatFeature
    RoomLayout --> PlaylistFeature
    RoomLayout --> RoomFeature
```

### 4.2 Directory Structure

```
frontend/src/
├── index.tsx                   # Entry point
├── App.tsx                     # Root component + Routes
│
├── components/                 # Reusable components
│   ├── common/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Loading/
│   │   ├── Avatar/
│   │   └── Toast/
│   │
│   ├── layout/
│   │   ├── MainLayout/
│   │   ├── RoomLayout/
│   │   ├── Header/
│   │   └── Sidebar/
│   │
│   ├── auth/                   # Existing
│   │   ├── GoogleLoginButton/
│   │   ├── ProtectedRoute/
│   │   └── UserProfile/
│   │
│   ├── room/
│   │   ├── RoomCard/
│   │   ├── RoomHeader/
│   │   ├── MemberList/
│   │   └── MemberAvatar/
│   │
│   ├── video/
│   │   ├── VideoPlayer/
│   │   ├── VideoControls/
│   │   └── VideoOverlay/
│   │
│   ├── chat/
│   │   ├── ChatBox/
│   │   ├── MessageList/
│   │   ├── MessageInput/
│   │   └── ChatMessage/
│   │
│   └── playlist/
│       ├── PlaylistPanel/
│       ├── PlaylistItem/
│       └── AddVideoForm/
│
├── pages/
│   ├── LoginPage/              # Existing
│   ├── AuthCallbackPage/       # Existing
│   ├── HomePage/               # Existing (modify)
│   ├── RoomListPage/
│   ├── RoomCreatePage/
│   └── RoomPage/
│
├── hooks/
│   ├── useAuth.ts              # Existing
│   ├── useSocket.ts            # Socket.IO connection
│   ├── useRoom.ts              # Room state management
│   ├── useChat.ts              # Chat functionality
│   ├── useVideoSync.ts         # Video synchronization
│   ├── usePlaylist.ts          # Playlist management
│   └── useToast.ts             # Toast notifications
│
├── services/
│   ├── api.ts                  # Existing - Axios instance
│   ├── auth.service.ts         # Existing
│   ├── room.service.ts         # Room API calls
│   ├── socket.service.ts       # Socket.IO client
│   └── youtube.service.ts      # YouTube API integration
│
├── store/
│   ├── AuthContext.tsx         # Existing
│   ├── SocketContext.tsx       # Socket connection context
│   ├── RoomContext.tsx         # Current room state
│   └── ToastContext.tsx        # Toast notifications
│
├── types/
│   ├── auth.types.ts           # Existing
│   ├── room.types.ts
│   ├── chat.types.ts
│   ├── video.types.ts
│   ├── playlist.types.ts
│   └── socket.types.ts
│
├── utils/
│   ├── youtube.utils.ts        # YouTube URL parsing
│   ├── time.utils.ts           # Time formatting
│   └── validation.utils.ts     # Form validation
│
└── styles/
    ├── index.css               # Existing - Global styles
    ├── variables.css           # CSS variables
    └── components/
```

### 4.3 State Management Flow

```mermaid
flowchart TB
    subgraph Contexts["React Contexts"]
        AuthCtx[AuthContext<br/>User & Token]
        SocketCtx[SocketContext<br/>Connection State]
        RoomCtx[RoomContext<br/>Room State]
        ToastCtx[ToastContext<br/>Notifications]
    end

    subgraph Hooks["Custom Hooks"]
        useAuth[useAuth]
        useSocket[useSocket]
        useRoom[useRoom]
        useChat[useChat]
        useVideoSync[useVideoSync]
        usePlaylist[usePlaylist]
    end

    subgraph Components["Components"]
        RoomPage[RoomPage]
        VideoPlayer[VideoPlayer]
        ChatBox[ChatBox]
        PlaylistPanel[PlaylistPanel]
    end

    AuthCtx --> useAuth
    SocketCtx --> useSocket
    RoomCtx --> useRoom

    useSocket --> useChat
    useSocket --> useVideoSync
    useSocket --> usePlaylist

    useAuth --> RoomPage
    useRoom --> RoomPage
    useChat --> ChatBox
    useVideoSync --> VideoPlayer
    usePlaylist --> PlaylistPanel
```

---

## 5. Database Schema Design

### 5.1 Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ RoomMember : "joins"
    User ||--o{ Room : "creates"
    User ||--o{ Message : "sends"
    User ||--o{ PlaylistItem : "adds"

    Room ||--o{ RoomMember : "has"
    Room ||--o| VideoState : "has"
    Room ||--o{ Message : "contains"
    Room ||--o{ PlaylistItem : "contains"

    User {
        string id PK "cuid"
        string email UK
        string name
        string profileImage
        string googleId UK
        datetime createdAt
        datetime updatedAt
    }

    Room {
        string id PK "cuid"
        string name
        string description
        string hostId FK
        boolean isPublic
        string password
        int maxMembers
        datetime createdAt
        datetime updatedAt
    }

    RoomMember {
        string id PK "cuid"
        string roomId FK
        string userId FK
        enum role "HOST, MODERATOR, MEMBER"
        datetime joinedAt
    }

    VideoState {
        string id PK "cuid"
        string roomId FK UK
        string videoId
        string videoTitle
        string videoThumbnail
        float currentTime
        boolean isPlaying
        float playbackRate
        datetime lastUpdated
    }

    Message {
        string id PK "cuid"
        string roomId FK
        string userId FK
        string content
        enum type "TEXT, SYSTEM, EMOJI"
        datetime createdAt
    }

    PlaylistItem {
        string id PK "cuid"
        string roomId FK
        string addedById FK
        string videoId
        string title
        string thumbnail
        int duration
        int position
        datetime addedAt
    }
```

### 5.2 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// User Model (Existing - Extended)
// ============================================
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  profileImage  String?
  googleId      String?   @unique

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  hostedRooms   Room[]        @relation("RoomHost")
  memberships   RoomMember[]
  messages      Message[]
  playlistItems PlaylistItem[]

  @@map("users")
}

// ============================================
// Room Model (New)
// ============================================
model Room {
  id          String    @id @default(cuid())
  name        String
  description String?
  isPublic    Boolean   @default(true)
  password    String?   // Hashed if private room
  maxMembers  Int       @default(50)

  hostId      String
  host        User      @relation("RoomHost", fields: [hostId], references: [id])

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  members     RoomMember[]
  videoState  VideoState?
  messages    Message[]
  playlist    PlaylistItem[]

  @@index([hostId])
  @@index([isPublic])
  @@map("rooms")
}

// ============================================
// Room Member Model (New)
// ============================================
enum RoomRole {
  HOST
  MODERATOR
  MEMBER
}

model RoomMember {
  id        String    @id @default(cuid())
  roomId    String
  userId    String
  role      RoomRole  @default(MEMBER)
  joinedAt  DateTime  @default(now())

  room      Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([roomId, userId])
  @@index([roomId])
  @@index([userId])
  @@map("room_members")
}

// ============================================
// Video State Model (New)
// ============================================
model VideoState {
  id             String    @id @default(cuid())
  roomId         String    @unique
  videoId        String?   // YouTube video ID
  videoTitle     String?
  videoThumbnail String?
  currentTime    Float     @default(0)
  isPlaying      Boolean   @default(false)
  playbackRate   Float     @default(1.0)
  lastUpdated    DateTime  @default(now())

  room           Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@map("video_states")
}

// ============================================
// Message Model (New)
// ============================================
enum MessageType {
  TEXT
  SYSTEM
  EMOJI
}

model Message {
  id        String      @id @default(cuid())
  roomId    String
  userId    String
  content   String
  type      MessageType @default(TEXT)
  createdAt DateTime    @default(now())

  room      Room        @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([roomId, createdAt])
  @@index([userId])
  @@map("messages")
}

// ============================================
// Playlist Item Model (New)
// ============================================
model PlaylistItem {
  id         String   @id @default(cuid())
  roomId     String
  addedById  String
  videoId    String   // YouTube video ID
  title      String
  thumbnail  String?
  duration   Int      // Duration in seconds
  position   Int      // Order in playlist
  addedAt    DateTime @default(now())

  room       Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  addedBy    User     @relation(fields: [addedById], references: [id], onDelete: Cascade)

  @@unique([roomId, position])
  @@index([roomId])
  @@map("playlist_items")
}
```

---

## 6. WebSocket Event Design

### 6.1 Connection Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Auth
    participant Room

    Client->>Server: Connect with JWT
    Server->>Auth: Validate Token
    Auth-->>Server: User Info
    Server-->>Client: connection_success

    Client->>Server: join_room {roomId}
    Server->>Room: Validate Membership
    Room-->>Server: Member OK
    Server->>Server: Join Socket Room
    Server-->>Client: room_joined {roomState}
    Server-->>Client: member_list {members}

    Note over Client,Server: Real-time events start
```

### 6.2 Event Catalog

#### 6.2.1 Room Events (Namespace: `/rooms`)

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join_room` | Client -> Server | `{ roomId: string }` | Join a room |
| `leave_room` | Client -> Server | `{ roomId: string }` | Leave a room |
| `room_joined` | Server -> Client | `{ room: Room, members: Member[], videoState: VideoState }` | Successfully joined |
| `room_left` | Server -> Client | `{ roomId: string }` | Successfully left |
| `member_joined` | Server -> Room | `{ member: Member }` | New member joined |
| `member_left` | Server -> Room | `{ memberId: string }` | Member left |
| `room_updated` | Server -> Room | `{ room: Room }` | Room settings changed |
| `room_closed` | Server -> Room | `{ reason: string }` | Room was closed |
| `error` | Server -> Client | `{ code: string, message: string }` | Error occurred |

#### 6.2.2 Chat Events (Namespace: `/chat`)

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `send_message` | Client -> Server | `{ roomId: string, content: string, type?: MessageType }` | Send chat message |
| `new_message` | Server -> Room | `{ message: Message }` | New message received |
| `typing_start` | Client -> Server | `{ roomId: string }` | User started typing |
| `typing_stop` | Client -> Server | `{ roomId: string }` | User stopped typing |
| `user_typing` | Server -> Room | `{ userId: string, userName: string }` | Someone is typing |
| `user_stopped_typing` | Server -> Room | `{ userId: string }` | Someone stopped typing |
| `message_deleted` | Server -> Room | `{ messageId: string }` | Message was deleted |

#### 6.2.3 Video Sync Events (Namespace: `/video`)

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `video_play` | Client -> Server | `{ roomId: string, currentTime: number }` | Play video |
| `video_pause` | Client -> Server | `{ roomId: string, currentTime: number }` | Pause video |
| `video_seek` | Client -> Server | `{ roomId: string, currentTime: number }` | Seek to time |
| `video_change` | Client -> Server | `{ roomId: string, videoId: string }` | Change video |
| `sync_request` | Client -> Server | `{ roomId: string }` | Request current state |
| `video_state_changed` | Server -> Room | `{ videoState: VideoState }` | Video state updated |
| `sync_response` | Server -> Client | `{ videoState: VideoState }` | Current video state |
| `playback_rate_change` | Client -> Server | `{ roomId: string, rate: number }` | Change playback speed |

#### 6.2.4 Playlist Events (Namespace: `/playlist`)

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `add_video` | Client -> Server | `{ roomId: string, videoId: string }` | Add video to playlist |
| `remove_video` | Client -> Server | `{ roomId: string, itemId: string }` | Remove video from playlist |
| `reorder_playlist` | Client -> Server | `{ roomId: string, items: {id: string, position: number}[] }` | Reorder playlist |
| `play_next` | Client -> Server | `{ roomId: string }` | Play next video |
| `play_previous` | Client -> Server | `{ roomId: string }` | Play previous video |
| `playlist_updated` | Server -> Room | `{ playlist: PlaylistItem[] }` | Playlist changed |
| `video_added` | Server -> Room | `{ item: PlaylistItem }` | Video was added |
| `video_removed` | Server -> Room | `{ itemId: string }` | Video was removed |

### 6.3 Event Payload Types

```typescript
// types/socket.types.ts

// === Room Events ===
interface JoinRoomPayload {
  roomId: string;
  password?: string; // For private rooms
}

interface RoomJoinedPayload {
  room: RoomResponse;
  members: MemberResponse[];
  videoState: VideoStateResponse | null;
  playlist: PlaylistItemResponse[];
}

interface MemberResponse {
  id: string;
  userId: string;
  name: string;
  profileImage: string | null;
  role: 'HOST' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
}

// === Chat Events ===
interface SendMessagePayload {
  roomId: string;
  content: string;
  type?: 'TEXT' | 'SYSTEM' | 'EMOJI';
}

interface MessageResponse {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userProfileImage: string | null;
  content: string;
  type: 'TEXT' | 'SYSTEM' | 'EMOJI';
  createdAt: string;
}

// === Video Sync Events ===
interface VideoStateResponse {
  roomId: string;
  videoId: string | null;
  videoTitle: string | null;
  videoThumbnail: string | null;
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  lastUpdated: string;
}

interface VideoControlPayload {
  roomId: string;
  currentTime: number;
}

interface VideoChangePayload {
  roomId: string;
  videoId: string;
}

// === Playlist Events ===
interface AddVideoPayload {
  roomId: string;
  videoId: string;
}

interface PlaylistItemResponse {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string | null;
  duration: number;
  position: number;
  addedBy: {
    id: string;
    name: string;
  };
  addedAt: string;
}

// === Error Event ===
interface SocketError {
  code: string;
  message: string;
}
```

### 6.4 Video Synchronization Algorithm

```mermaid
flowchart TD
    A[User Action] --> B{Action Type}

    B -->|Play| C[Emit video_play]
    B -->|Pause| D[Emit video_pause]
    B -->|Seek| E[Emit video_seek]

    C --> F[Server Validates User]
    D --> F
    E --> F

    F --> G{Has Permission?}
    G -->|No| H[Send Error]
    G -->|Yes| I[Update VideoState in DB]

    I --> J[Broadcast to Room]
    J --> K[All Clients Receive]

    K --> L{Is Self?}
    L -->|Yes| M[Ignore]
    L -->|No| N[Apply State]

    N --> O[Calculate Time Delta]
    O --> P{Delta > 2 sec?}
    P -->|Yes| Q[Hard Seek]
    P -->|No| R{Delta > 0.5 sec?}
    R -->|Yes| S[Gradual Sync]
    R -->|No| T[No Action]
```

---

## 7. REST API Design

### 7.1 API Overview

| Base URL | Description |
|----------|-------------|
| `/api/auth` | Authentication endpoints |
| `/api/users` | User management |
| `/api/rooms` | Room CRUD operations |
| `/api/rooms/:roomId/messages` | Message history |
| `/api/rooms/:roomId/playlist` | Playlist management |

### 7.2 Authentication Endpoints (Existing)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/auth/google` | Initiate Google OAuth | No |
| `GET` | `/auth/google/callback` | OAuth callback | No |
| `GET` | `/auth/me` | Get current user | Yes |
| `POST` | `/auth/logout` | Logout user | Yes |
| `POST` | `/auth/refresh` | Refresh token | Yes |

### 7.3 Room Endpoints (New)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/rooms` | List public rooms | Yes |
| `GET` | `/rooms/my` | List user's rooms | Yes |
| `POST` | `/rooms` | Create new room | Yes |
| `GET` | `/rooms/:id` | Get room details | Yes |
| `PATCH` | `/rooms/:id` | Update room | Yes (Host) |
| `DELETE` | `/rooms/:id` | Delete room | Yes (Host) |
| `POST` | `/rooms/:id/join` | Join room | Yes |
| `POST` | `/rooms/:id/leave` | Leave room | Yes |
| `GET` | `/rooms/:id/members` | Get room members | Yes (Member) |
| `PATCH` | `/rooms/:id/members/:userId` | Update member role | Yes (Host) |
| `DELETE` | `/rooms/:id/members/:userId` | Kick member | Yes (Host/Mod) |

### 7.4 Message Endpoints (New)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/rooms/:roomId/messages` | Get message history | Yes (Member) |
| `DELETE` | `/rooms/:roomId/messages/:id` | Delete message | Yes (Author/Mod) |

### 7.5 Playlist Endpoints (New)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/rooms/:roomId/playlist` | Get playlist | Yes (Member) |
| `POST` | `/rooms/:roomId/playlist` | Add video to playlist | Yes (Member) |
| `DELETE` | `/rooms/:roomId/playlist/:id` | Remove from playlist | Yes (Member) |
| `PATCH` | `/rooms/:roomId/playlist/reorder` | Reorder playlist | Yes (Host/Mod) |

### 7.6 API Response Format

```typescript
// Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Error Response
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
```

### 7.7 DTOs

#### Room DTOs

```typescript
// create-room.dto.ts
class CreateRoomDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean = true;

  @IsString()
  @IsOptional()
  @MinLength(4)
  password?: string;

  @IsInt()
  @Min(2)
  @Max(100)
  @IsOptional()
  maxMembers?: number = 50;
}

// room-response.dto.ts
class RoomResponseDto {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  maxMembers: number;
  memberCount: number;
  host: {
    id: string;
    name: string;
    profileImage: string | null;
  };
  videoState: VideoStateResponseDto | null;
  createdAt: string;
  updatedAt: string;
}

// join-room.dto.ts
class JoinRoomDto {
  @IsString()
  @IsOptional()
  password?: string;
}
```

---

## 8. Security Architecture

### 8.1 Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Google
    participant DB

    User->>Frontend: Click "Login with Google"
    Frontend->>Backend: GET /auth/google
    Backend->>Google: Redirect to OAuth
    Google->>User: Show consent screen
    User->>Google: Approve
    Google->>Backend: Callback with code
    Backend->>Google: Exchange code for tokens
    Google-->>Backend: Access token + Profile
    Backend->>DB: Find or create user
    Backend->>Backend: Generate JWT
    Backend->>Frontend: Redirect with token
    Frontend->>Frontend: Store token in localStorage
    Frontend->>Backend: GET /auth/me (with JWT)
    Backend-->>Frontend: User profile
```

### 8.2 WebSocket Authentication

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant JwtGuard
    participant UserService

    Client->>Gateway: Connect (auth: {token: JWT})
    Gateway->>JwtGuard: Validate handshake
    JwtGuard->>JwtGuard: Verify JWT signature
    JwtGuard->>UserService: Get user by ID
    UserService-->>JwtGuard: User found
    JwtGuard-->>Gateway: Attach user to socket
    Gateway-->>Client: Connection successful

    Note over Client,Gateway: All subsequent events have user context
```

### 8.3 Authorization Matrix

| Resource | Action | HOST | MODERATOR | MEMBER |
|----------|--------|:----:|:---------:|:------:|
| Room | View | Yes | Yes | Yes |
| Room | Update | Yes | No | No |
| Room | Delete | Yes | No | No |
| Member | Kick | Yes | Yes | No |
| Member | Change Role | Yes | No | No |
| Video | Control | Yes | Yes | No |
| Playlist | Add | Yes | Yes | Yes |
| Playlist | Remove Own | Yes | Yes | Yes |
| Playlist | Remove Any | Yes | Yes | No |
| Playlist | Reorder | Yes | Yes | No |
| Chat | Send | Yes | Yes | Yes |
| Chat | Delete Own | Yes | Yes | Yes |
| Chat | Delete Any | Yes | Yes | No |

### 8.4 Security Measures

| Threat | Mitigation |
|--------|------------|
| **XSS** | Sanitize user input, CSP headers, HTTPOnly cookies |
| **CSRF** | SameSite cookies, CSRF tokens |
| **SQL Injection** | Prisma parameterized queries |
| **Rate Limiting** | Express rate limiter, WebSocket throttling |
| **Token Theft** | Short expiry, refresh tokens, secure storage |
| **DoS** | Rate limiting, connection limits per IP |
| **Room Hijacking** | Password hashing, invite links with tokens |

---

## 9. Deployment Architecture

### 9.1 Development Environment

```mermaid
graph TB
    subgraph Dev["Development Machine"]
        Frontend[Frontend :3000]
        Backend[Backend :3001]
        DB[(PostgreSQL :5432)]
    end

    Frontend --> Backend
    Backend --> DB
```

### 9.2 Production Environment (Recommended)

```mermaid
graph TB
    subgraph CDN["CDN (Cloudflare)"]
        StaticAssets[Static Assets]
    end

    subgraph LoadBalancer["Load Balancer"]
        LB[Nginx / AWS ALB]
    end

    subgraph AppServers["Application Servers"]
        App1[NestJS Instance 1]
        App2[NestJS Instance 2]
    end

    subgraph Cache["Cache Layer"]
        Redis[(Redis)]
    end

    subgraph Database["Database"]
        PrimaryDB[(PostgreSQL Primary)]
        ReplicaDB[(PostgreSQL Replica)]
    end

    subgraph External["External"]
        Google[Google OAuth]
        YouTube[YouTube API]
    end

    CDN --> LB
    LB --> App1
    LB --> App2
    App1 --> Redis
    App2 --> Redis
    App1 --> PrimaryDB
    App2 --> PrimaryDB
    PrimaryDB --> ReplicaDB
    App1 --> External
    App2 --> External
```

### 9.3 Scalability Considerations

| Component | Scaling Strategy |
|-----------|------------------|
| **Frontend** | CDN distribution, code splitting |
| **Backend** | Horizontal scaling with load balancer |
| **WebSocket** | Redis adapter for multi-instance |
| **Database** | Read replicas, connection pooling |
| **Cache** | Redis cluster for session/state |

### 9.4 Environment Variables

```env
# Application
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@host:5432/gethertube

# Authentication
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.gethertube.com/auth/google/callback

# Frontend URL (for CORS and redirects)
FRONTEND_URL=https://gethertube.com

# Redis (for WebSocket scaling)
REDIS_URL=redis://localhost:6379

# YouTube API (optional, for video info)
YOUTUBE_API_KEY=your-youtube-api-key
```

---

## Appendix

### A. Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_001` | 401 | Invalid or expired token |
| `AUTH_002` | 401 | Token not provided |
| `AUTH_003` | 403 | Insufficient permissions |
| `ROOM_001` | 404 | Room not found |
| `ROOM_002` | 403 | Room is full |
| `ROOM_003` | 403 | Invalid room password |
| `ROOM_004` | 403 | Not a room member |
| `VIDEO_001` | 400 | Invalid YouTube URL |
| `VIDEO_002` | 404 | Video not found |
| `SOCKET_001` | 400 | Invalid event payload |
| `SOCKET_002` | 403 | Not authorized for this action |

### B. Rate Limits

| Endpoint | Limit |
|----------|-------|
| REST API (general) | 100 req/min |
| Auth endpoints | 10 req/min |
| WebSocket events | 60 events/min |
| Chat messages | 30 msg/min |
| Video controls | 20 actions/min |

### C. References

- [NestJS Documentation](https://docs.nestjs.com/)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)

---

**Document Version:** 1.0.0  
**Author:** Tech Lead Agent  
**Review Status:** Draft
