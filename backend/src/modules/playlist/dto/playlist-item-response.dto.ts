import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlaylistItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  videoId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional({ nullable: true })
  thumbnail: string | null;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  position: number;

  @ApiProperty()
  addedBy: {
    id: string;
    name: string | null;
  };

  @ApiProperty()
  addedAt: Date;
}
