import type { VideoStateResponse } from './room.types';

/**
 * Video control payload (play/pause/seek)
 */
export interface VideoControlPayload {
  roomId: string;
  currentTime: number;
}

/**
 * Video change payload
 */
export interface VideoChangePayload {
  roomId: string;
  videoId: string;
}

/**
 * Playback rate change payload
 */
export interface PlaybackRateChangePayload {
  roomId: string;
  rate: number;
}

/**
 * Video state changed event (Server -> Client)
 */
export interface VideoStateChangedEvent {
  videoState: VideoStateResponse;
}

/**
 * Sync response event (Server -> Client)
 */
export interface SyncResponseEvent {
  videoState: VideoStateResponse;
}

/**
 * YouTube player state (internal)
 */
export enum PlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5,
}
