/**
 * Room role enum matching backend RoomRole
 */
export type RoomRole = 'HOST' | 'MODERATOR' | 'MEMBER';

/**
 * User presence status
 */
export type PresenceStatus = 'online' | 'away' | 'offline';

/**
 * User presence information
 */
export interface UserPresence {
  userId: string;
  userName: string;
  profileImage: string | null;
  status: PresenceStatus;
}

/**
 * Room response from backend API
 */
export interface RoomResponse {
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
  videoState: VideoStateResponse | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Video state within a room
 */
export interface VideoStateResponse {
  roomId: string;
  videoId: string | null;
  videoTitle: string | null;
  videoThumbnail: string | null;
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  lastUpdated: string;
}

/**
 * Room member info
 */
export interface MemberResponse {
  id: string;
  userId: string;
  name: string;
  profileImage: string | null;
  role: RoomRole;
  joinedAt: string;
}

/**
 * Create room request DTO
 */
export interface CreateRoomRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  password?: string;
  maxMembers?: number;
}

/**
 * Update room request DTO
 */
export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  password?: string;
  maxMembers?: number;
}

/**
 * Join room request DTO
 */
export interface JoinRoomRequest {
  password?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Single item API response
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
}
