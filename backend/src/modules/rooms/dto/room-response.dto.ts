import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoomHostDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  name: string | null;

  @ApiProperty({ nullable: true })
  profileImage: string | null;
}

export class RoomMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ nullable: true })
  name: string | null;

  @ApiProperty({ nullable: true })
  profileImage: string | null;

  @ApiProperty({ enum: ['HOST', 'MODERATOR', 'MEMBER'] })
  role: string;

  @ApiProperty()
  joinedAt: Date;
}

export class RoomResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  maxMembers: number;

  @ApiProperty()
  memberCount: number;

  @ApiProperty({ type: RoomHostDto })
  host: RoomHostDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
