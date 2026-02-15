export class ReactionResponseDto {
  emoji: string;
  count: number;
  users: Array<{ userId: string; userName: string | null }>;
  hasReacted: boolean; // 현재 유저 기준
}

export class ReactionSummaryDto {
  emoji: string;
  count: number;
  users: Array<{ userId: string; userName: string | null }>;
}
