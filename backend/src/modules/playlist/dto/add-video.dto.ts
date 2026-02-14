import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddVideoDto {
  @ApiProperty({ example: 'dQw4w9WgXcQ', description: 'YouTube video ID' })
  @IsString()
  videoId: string;

  @ApiProperty({ example: 'Never Gonna Give You Up' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg' })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({ example: 212, description: 'Duration in seconds' })
  @IsInt()
  @Min(0)
  duration: number;
}
