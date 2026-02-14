/**
 * Message type enum matching backend MessageType
 */
export type MessageType = 'TEXT' | 'SYSTEM' | 'EMOJI';

/**
 * Chat message response
 */
export interface MessageResponse {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userProfileImage: string | null;
  content: string;
  type: MessageType;
  createdAt: string;
}

/**
 * Send message payload (Client -> Server)
 */
export interface SendMessagePayload {
  roomId: string;
  content: string;
  type?: MessageType;
}

/**
 * Typing indicator payload
 */
export interface TypingPayload {
  roomId: string;
}

/**
 * User typing event (Server -> Client)
 */
export interface UserTypingEvent {
  userId: string;
  userName: string;
}
