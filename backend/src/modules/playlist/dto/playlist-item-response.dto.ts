import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '@/modules/users/dto';

export class PlaylistItemResponseDto {
  @ApiProperty({
    description: 'Playlist item ID',
    example: 'clxxx123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Room ID',
    example: 'clyyy987654321',
  })
  roomId: string;

  @ApiProperty({
    description: 'User who added the video',
    type: UserResponseDto,
  })
  addedBy: UserResponseDto;

  @ApiProperty({
    description: 'YouTube video ID',
    example: 'dQw4w9WgXcQ',
  })
  videoId: string;

  @ApiProperty({
    description: 'Video title',
    example: 'Rick Astley - Never Gonna Give You Up',
  })
  title: string;

  @ApiProperty({
    description: 'Video thumbnail URL',
    example: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    nullable: true,
  })
  thumbnail: string | null;

  @ApiProperty({
    description: 'Video duration in seconds',
    example: 212,
  })
  duration: number;

  @ApiProperty({
    description: 'Position in playlist (0-based)',
    example: 0,
  })
  position: number;

  @ApiProperty({
    description: 'Timestamp when video was added',
    example: '2026-01-21T10:30:00Z',
  })
  addedAt: Date;
}
