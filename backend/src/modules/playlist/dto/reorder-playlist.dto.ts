import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderPlaylistDto {
  @ApiProperty({
    description: 'Playlist item ID to move',
    example: 'clxxx123456789',
  })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({
    description: 'New position (0-based index)',
    example: 2,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  newPosition: number;
}
