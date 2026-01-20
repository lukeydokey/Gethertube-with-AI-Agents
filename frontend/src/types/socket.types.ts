/**
 * Socket.IO event type definitions
 * Based on ARCHITECTURE.md Section 6: WebSocket Event Design
 */

// ============================================
// Room Events (Namespace: /rooms)
// ============================================

export interface JoinRoomPayload {
  roomId: string;
  password?: string; // For private rooms
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface RoomJoinedPayload {
  room: RoomResponse;
  members: MemberResponse[];
  videoState: VideoStateResponse | null;
  playlist: PlaylistItemResponse[];
}

export interface RoomLeftPayload {
  roomId: string;
}

export interface MemberJoinedPayload {
  member: MemberResponse;
}

export interface MemberLeftPayload {
  memberId: string;
}

export interface RoomUpdatedPayload {
  room: RoomResponse;
}

export interface RoomClosedPayload {
  reason: string;
}

export interface MemberResponse {
  id: string;
  userId: string;
  name: string;
  profileImage: string | null;
  role: 'HOST' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
}

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

// ============================================
// Chat Events (Namespace: /chat)
// ============================================

export interface SendMessagePayload {
  roomId: string;
  content: string;
  type?: 'TEXT' | 'SYSTEM' | 'EMOJI';
}

export interface MessageResponse {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userProfileImage: string | null;
  content: string;
  type: 'TEXT' | 'SYSTEM' | 'EMOJI';
  createdAt: string;
}

export interface TypingPayload {
  roomId: string;
}

export interface UserTypingPayload {
  userId: string;
  userName: string;
}

export interface UserStoppedTypingPayload {
  userId: string;
}

export interface MessageDeletedPayload {
  messageId: string;
}

// ============================================
// Video Sync Events (Namespace: /video)
// ============================================

export interface VideoControlPayload {
  roomId: string;
  currentTime: number;
}

export interface VideoChangePayload {
  roomId: string;
  videoId: string;
}

export interface SyncRequestPayload {
  roomId: string;
}

export interface PlaybackRateChangePayload {
  roomId: string;
  rate: number;
}

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

// ============================================
// Playlist Events (Namespace: /playlist)
// ============================================

export interface AddVideoPayload {
  roomId: string;
  videoId: string;
}

export interface RemoveVideoPayload {
  roomId: string;
  itemId: string;
}

export interface ReorderPlaylistPayload {
  roomId: string;
  items: Array<{
    id: string;
    position: number;
  }>;
}

export interface PlayNextPayload {
  roomId: string;
}

export interface PlayPreviousPayload {
  roomId: string;
}

export interface PlaylistItemResponse {
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

export interface PlaylistUpdatedPayload {
  playlist: PlaylistItemResponse[];
}

export interface VideoAddedPayload {
  item: PlaylistItemResponse;
}

export interface VideoRemovedPayload {
  itemId: string;
}

// ============================================
// Error Event
// ============================================

export interface SocketError {
  code: string;
  message: string;
}

// ============================================
// Socket Connection State
// ============================================

export interface SocketConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

// ============================================
// Socket Event Maps (Type-safe event handlers)
// ============================================

export interface RoomEventMap {
  // Client -> Server
  join_room: (payload: JoinRoomPayload) => void;
  leave_room: (payload: LeaveRoomPayload) => void;

  // Server -> Client
  room_joined: (payload: RoomJoinedPayload) => void;
  room_left: (payload: RoomLeftPayload) => void;
  member_joined: (payload: MemberJoinedPayload) => void;
  member_left: (payload: MemberLeftPayload) => void;
  room_updated: (payload: RoomUpdatedPayload) => void;
  room_closed: (payload: RoomClosedPayload) => void;
  error: (error: SocketError) => void;
}

export interface ChatEventMap {
  // Client -> Server
  send_message: (payload: SendMessagePayload) => void;
  typing_start: (payload: TypingPayload) => void;
  typing_stop: (payload: TypingPayload) => void;

  // Server -> Client
  new_message: (payload: MessageResponse) => void;
  user_typing: (payload: UserTypingPayload) => void;
  user_stopped_typing: (payload: UserStoppedTypingPayload) => void;
  message_deleted: (payload: MessageDeletedPayload) => void;
  error: (error: SocketError) => void;
}

export interface VideoEventMap {
  // Client -> Server
  video_play: (payload: VideoControlPayload) => void;
  video_pause: (payload: VideoControlPayload) => void;
  video_seek: (payload: VideoControlPayload) => void;
  video_change: (payload: VideoChangePayload) => void;
  sync_request: (payload: SyncRequestPayload) => void;
  playback_rate_change: (payload: PlaybackRateChangePayload) => void;

  // Server -> Client
  video_state_changed: (payload: VideoStateResponse) => void;
  sync_response: (payload: VideoStateResponse) => void;
  error: (error: SocketError) => void;
}

export interface PlaylistEventMap {
  // Client -> Server
  add_video: (payload: AddVideoPayload) => void;
  remove_video: (payload: RemoveVideoPayload) => void;
  reorder_playlist: (payload: ReorderPlaylistPayload) => void;
  play_next: (payload: PlayNextPayload) => void;
  play_previous: (payload: PlayPreviousPayload) => void;

  // Server -> Client
  playlist_updated: (payload: PlaylistUpdatedPayload) => void;
  video_added: (payload: VideoAddedPayload) => void;
  video_removed: (payload: VideoRemovedPayload) => void;
  error: (error: SocketError) => void;
}
