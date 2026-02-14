import type { RoomResponse, MemberResponse, VideoStateResponse } from './room.types';
import type { MessageResponse } from './chat.types';
import type { PlaylistItemResponse } from './playlist.types';

/**
 * Socket connection state
 */
export interface SocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

/**
 * Join room payload (Client -> Server)
 */
export interface JoinRoomPayload {
  roomId: string;
  password?: string;
}

/**
 * Room joined event (Server -> Client)
 */
export interface RoomJoinedPayload {
  room: RoomResponse;
  members: MemberResponse[];
  videoState: VideoStateResponse | null;
  playlist: PlaylistItemResponse[];
}

/**
 * Member joined event (Server -> Room)
 */
export interface MemberJoinedEvent {
  member: MemberResponse;
}

/**
 * Member left event (Server -> Room)
 */
export interface MemberLeftEvent {
  memberId: string;
}

/**
 * Room updated event (Server -> Room)
 */
export interface RoomUpdatedEvent {
  room: RoomResponse;
}

/**
 * Room closed event (Server -> Room)
 */
export interface RoomClosedEvent {
  reason: string;
}

/**
 * Socket error event
 */
export interface SocketError {
  code: string;
  message: string;
}

/**
 * Server -> Client event map for type-safe socket listeners
 */
export interface ServerToClientEvents {
  room_joined: (payload: RoomJoinedPayload) => void;
  room_left: (payload: { roomId: string }) => void;
  member_joined: (payload: MemberJoinedEvent) => void;
  member_left: (payload: MemberLeftEvent) => void;
  room_updated: (payload: RoomUpdatedEvent) => void;
  room_closed: (payload: RoomClosedEvent) => void;
  new_message: (payload: { message: MessageResponse }) => void;
  user_typing: (payload: { userId: string; userName: string }) => void;
  user_stopped_typing: (payload: { userId: string }) => void;
  message_deleted: (payload: { messageId: string }) => void;
  video_state_changed: (payload: { videoState: VideoStateResponse }) => void;
  sync_response: (payload: { videoState: VideoStateResponse }) => void;
  playlist_updated: (payload: { playlist: PlaylistItemResponse[] }) => void;
  video_added: (payload: { item: PlaylistItemResponse }) => void;
  video_removed: (payload: { itemId: string }) => void;
  error: (payload: SocketError) => void;
}

/**
 * Client -> Server event map for type-safe socket emitters
 */
export interface ClientToServerEvents {
  join_room: (payload: JoinRoomPayload) => void;
  leave_room: (payload: { roomId: string }) => void;
  send_message: (payload: { roomId: string; content: string; type?: string }) => void;
  typing_start: (payload: { roomId: string }) => void;
  typing_stop: (payload: { roomId: string }) => void;
  video_play: (payload: { roomId: string; currentTime: number }) => void;
  video_pause: (payload: { roomId: string; currentTime: number }) => void;
  video_seek: (payload: { roomId: string; currentTime: number }) => void;
  video_change: (payload: { roomId: string; videoId: string }) => void;
  sync_request: (payload: { roomId: string }) => void;
  playback_rate_change: (payload: { roomId: string; rate: number }) => void;
  add_video: (payload: { roomId: string; videoId: string }) => void;
  remove_video: (payload: { roomId: string; itemId: string }) => void;
  reorder_playlist: (payload: { roomId: string; items: { id: string; position: number }[] }) => void;
  play_next: (payload: { roomId: string }) => void;
  play_previous: (payload: { roomId: string }) => void;
}
