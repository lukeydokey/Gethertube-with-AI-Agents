import { IsString } from 'class-validator';

export class RemoveReactionDto {
  @IsString()
  roomId: string;

  @IsString()
  messageId: string;

  @IsString()
  emoji: string;
}
