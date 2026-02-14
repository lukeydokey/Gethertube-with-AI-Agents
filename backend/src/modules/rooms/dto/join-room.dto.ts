import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class JoinRoomDto {
  @ApiPropertyOptional({ example: 'secret123', description: '비공개 방 비밀번호' })
  @IsString()
  @IsOptional()
  password?: string;
}
