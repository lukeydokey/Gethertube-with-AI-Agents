import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({
    description: '방 이름',
    example: '함께 보는 음악 방송',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: '방 설명',
    example: '좋아하는 음악을 함께 들어요',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: '공개 여부',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: '비공개 방 비밀번호 (isPublic이 false일 때 필수)',
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

  @ApiProperty({
    description: '최대 참가 인원',
    example: 50,
    minimum: 2,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(100)
  maxMembers?: number;
}
