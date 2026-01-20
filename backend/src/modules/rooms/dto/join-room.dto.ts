import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class JoinRoomDto {
  @ApiProperty({
    description: '비공개 방 비밀번호 (비공개 방인 경우 필수)',
    example: 'password123',
    required: false,
    minLength: 4,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  password?: string;
}
