import { IsString, IsNotEmpty, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';

export class SendMessageDto {
  @ApiProperty({
    description: 'Room ID where the message is sent',
    example: 'clxxx123456789',
  })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello everyone!',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @ApiProperty({
    description: 'Type of message',
    enum: MessageType,
    default: MessageType.TEXT,
    example: MessageType.TEXT,
  })
  @IsEnum(MessageType)
  type: MessageType = MessageType.TEXT;
}
