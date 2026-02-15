import { IsString, IsIn } from 'class-validator';
import { ALLOWED_REACTIONS } from '../constants';

export class RemoveReactionDto {
  @IsString()
  roomId: string;

  @IsString()
  messageId: string;

  @IsString()
  @IsIn(ALLOWED_REACTIONS, {
    message: `emoji must be one of: ${ALLOWED_REACTIONS.join(', ')}`,
  })
  emoji: string;
}
