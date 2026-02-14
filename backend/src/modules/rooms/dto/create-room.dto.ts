import {
  IsString,
  IsBoolean,
  IsInt,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: 'Movie Night', minLength: 2, maxLength: 50 })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: 'Let\'s watch a movie together!', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: 'secret123', minLength: 4 })
  @IsString()
  @IsOptional()
  @MinLength(4)
  password?: string;

  @ApiPropertyOptional({ example: 50, minimum: 2, maximum: 100, default: 50 })
  @IsInt()
  @Min(2)
  @Max(100)
  @IsOptional()
  maxMembers?: number;
}
