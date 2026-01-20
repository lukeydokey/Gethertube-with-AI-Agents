import { ApiProperty } from '@nestjs/swagger';
import { RoomRole } from '@prisma/client';
import { UserResponseDto } from '../../users/dto';

export class RoomMemberResponseDto {
  @ApiProperty({ description: '멤버십 고유 ID' })
  id: string;

  @ApiProperty({ description: '사용자 정보', type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({
    description: '방 내 역할',
    enum: RoomRole,
    example: RoomRole.MEMBER,
  })
  role: RoomRole;

  @ApiProperty({ description: '참가 시간' })
  joinedAt: Date;
}

export class RoomResponseDto {
  @ApiProperty({ description: '방 고유 ID' })
  id: string;

  @ApiProperty({ description: '방 이름' })
  name: string;

  @ApiProperty({ description: '방 설명', nullable: true })
  description: string | null;

  @ApiProperty({ description: '공개 여부' })
  isPublic: boolean;

  @ApiProperty({ description: '비밀번호 설정 여부' })
  hasPassword: boolean;

  @ApiProperty({ description: '최대 참가 인원' })
  maxMembers: number;

  @ApiProperty({ description: '현재 참가 인원 수' })
  currentMembers: number;

  @ApiProperty({ description: '방장 정보', type: UserResponseDto })
  host: UserResponseDto;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  @ApiProperty({
    description: '참가자 목록',
    type: [RoomMemberResponseDto],
    required: false,
  })
  members?: RoomMemberResponseDto[];
}
