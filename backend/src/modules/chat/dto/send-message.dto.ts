import { IsString, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';
import { MessageType } from '@prisma/client';

export class SendMessageDto {
  @IsString()
  roomId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;
}
