/**
 * Message type enum matching backend MessageType
 */
export type MessageType = 'TEXT' | 'SYSTEM' | 'EMOJI';

/**
 * Available reaction emojis
 */
export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

/**
 * Reaction group for a message
 */
export interface ReactionGroup {
  emoji: string;
  count: number;
  users: Array<{ userId: string; userName: string }>;
  hasReacted: boolean;
}

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
  reactions: ReactionGroup[];
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

/**
 * Add reaction payload (Client -> Server)
 */
export interface AddReactionPayload {
  roomId: string;
  messageId: string;
  emoji: ReactionEmoji;
}

/**
 * Remove reaction payload (Client -> Server)
 */
export interface RemoveReactionPayload {
  roomId: string;
  messageId: string;
  emoji: ReactionEmoji;
}

/**
 * Reaction added event (Server -> Client)
 */
export interface ReactionAddedEvent {
  messageId: string;
  userId: string;
  userName: string;
  emoji: string;
}

/**
 * Reaction removed event (Server -> Client)
 */
export interface ReactionRemovedEvent {
  messageId: string;
  userId: string;
  emoji: string;
}
