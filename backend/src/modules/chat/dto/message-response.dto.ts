import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';
import { UserResponseDto } from '@/modules/users/dto';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Message ID',
    example: 'clxxx123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Room ID where the message was sent',
    example: 'clxxx123456789',
  })
  roomId: string;

  @ApiProperty({
    description: 'User who sent the message',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello everyone!',
  })
  content: string;

  @ApiProperty({
    description: 'Type of message',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  type: MessageType;

  @ApiProperty({
    description: 'Message creation timestamp',
    example: '2026-01-21T10:30:00.000Z',
  })
  createdAt: Date;
}
