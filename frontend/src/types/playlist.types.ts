/**
 * Playlist item response
 */
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

/**
 * Add video to playlist payload (Client -> Server)
 */
export interface AddVideoPayload {
  roomId: string;
  videoId: string;
}

/**
 * Remove video from playlist payload (Client -> Server)
 */
export interface RemoveVideoPayload {
  roomId: string;
  itemId: string;
}

/**
 * Reorder playlist payload (Client -> Server)
 */
export interface ReorderPlaylistPayload {
  roomId: string;
  items: { id: string; position: number }[];
}

/**
 * Playlist updated event (Server -> Client)
 */
export interface PlaylistUpdatedEvent {
  playlist: PlaylistItemResponse[];
}

/**
 * Video added event (Server -> Client)
 */
export interface VideoAddedEvent {
  item: PlaylistItemResponse;
}

/**
 * Video removed event (Server -> Client)
 */
export interface VideoRemovedEvent {
  itemId: string;
}
