import { IsString, IsNumber, IsOptional } from 'class-validator';

export class VideoControlDto {
  @IsString()
  roomId: string;

  @IsNumber()
  currentTime: number;
}

export class VideoChangeDto {
  @IsString()
  roomId: string;

  @IsString()
  videoId: string;

  @IsString()
  @IsOptional()
  videoTitle?: string;

  @IsString()
  @IsOptional()
  videoThumbnail?: string;
}

export class PlaybackRateDto {
  @IsString()
  roomId: string;

  @IsNumber()
  rate: number;
}
