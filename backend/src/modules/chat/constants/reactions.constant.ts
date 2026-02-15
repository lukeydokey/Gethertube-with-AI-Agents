export const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'] as const;

export type ReactionEmoji = (typeof ALLOWED_REACTIONS)[number];

export function isValidReaction(emoji: string): emoji is ReactionEmoji {
  return (ALLOWED_REACTIONS as readonly string[]).includes(emoji);
}
