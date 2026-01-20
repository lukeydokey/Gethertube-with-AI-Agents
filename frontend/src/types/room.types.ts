/**
 * Room-related type definitions
 * Used for state management and API responses
 */

import type {
  RoomResponse,
  MemberResponse,
  VideoStateResponse,
  PlaylistItemResponse,
  MessageResponse,
} from './socket.types';

// ============================================
// Room State Types
// ============================================

export interface RoomState {
  room: RoomResponse | null;
  members: MemberResponse[];
  videoState: VideoStateResponse | null;
  playlist: PlaylistItemResponse[];
  messages: MessageResponse[];
  isLoading: boolean;
  error: string | null;
}

// ============================================
// Chat State Types
// ============================================

export interface ChatState {
  messages: MessageResponse[];
  typingUsers: Set<string>;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// Video Sync State Types
// ============================================

export interface VideoSyncState {
  videoState: VideoStateResponse | null;
  isSyncing: boolean;
  syncError: string | null;
}

// ============================================
// Playlist State Types
// ============================================

export interface PlaylistState {
  items: PlaylistItemResponse[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateRoomRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  password?: string;
  maxMembers?: number;
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  password?: string;
  maxMembers?: number;
}

export interface JoinRoomRequest {
  password?: string;
}

export interface RoomListResponse {
  rooms: RoomResponse[];
  total: number;
  page: number;
  totalPages: number;
}

// ============================================
// Member Management Types
// ============================================

export interface UpdateMemberRoleRequest {
  role: 'HOST' | 'MODERATOR' | 'MEMBER';
}

// ============================================
// Helper Types
// ============================================

export type RoomRole = 'HOST' | 'MODERATOR' | 'MEMBER';

export type MessageType = 'TEXT' | 'SYSTEM' | 'EMOJI';

// Re-export commonly used types from socket.types for convenience
export type {
  RoomResponse,
  MemberResponse,
  VideoStateResponse,
  PlaylistItemResponse,
  MessageResponse,
};
