import { IsString } from 'class-validator';

export class AddReactionDto {
  @IsString()
  roomId: string;

  @IsString()
  messageId: string;

  @IsString()
  emoji: string;
}
