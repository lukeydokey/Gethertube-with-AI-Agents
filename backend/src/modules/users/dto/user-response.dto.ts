import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: '사용자 고유 ID' })
  id: string;

  @ApiProperty({ description: '이메일 주소' })
  email: string;

  @ApiProperty({ description: '사용자 이름', nullable: true })
  name: string | null;

  @ApiProperty({ description: '프로필 이미지 URL', nullable: true })
  profileImage: string | null;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;
}
