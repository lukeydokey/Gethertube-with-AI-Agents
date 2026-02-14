import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database';
import { VideoStateResponseDto } from './dto/video-state.dto';

@Injectable()
export class VideoSyncService {
  private readonly logger = new Logger(VideoSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getVideoState(roomId: string): Promise<VideoStateResponseDto | null> {
    const state = await this.prisma.videoState.findUnique({
      where: { roomId },
    });

    if (!state) return null;
    return this.toVideoStateResponse(state);
  }

  async updatePlayState(
    roomId: string,
    isPlaying: boolean,
    currentTime: number,
  ): Promise<VideoStateResponseDto> {
    const state = await this.prisma.videoState.upsert({
      where: { roomId },
      update: { isPlaying, currentTime, lastUpdated: new Date() },
      create: { roomId, isPlaying, currentTime },
    });

    return this.toVideoStateResponse(state);
  }

  async updateSeek(roomId: string, currentTime: number): Promise<VideoStateResponseDto> {
    const state = await this.prisma.videoState.upsert({
      where: { roomId },
      update: { currentTime, lastUpdated: new Date() },
      create: { roomId, currentTime },
    });

    return this.toVideoStateResponse(state);
  }

  async changeVideo(
    roomId: string,
    videoId: string,
    videoTitle?: string,
    videoThumbnail?: string,
  ): Promise<VideoStateResponseDto> {
    const state = await this.prisma.videoState.upsert({
      where: { roomId },
      update: {
        videoId,
        videoTitle: videoTitle ?? null,
        videoThumbnail: videoThumbnail ?? null,
        currentTime: 0,
        isPlaying: false,
        lastUpdated: new Date(),
      },
      create: {
        roomId,
        videoId,
        videoTitle: videoTitle ?? null,
        videoThumbnail: videoThumbnail ?? null,
      },
    });

    return this.toVideoStateResponse(state);
  }

  async updatePlaybackRate(roomId: string, rate: number): Promise<VideoStateResponseDto> {
    const state = await this.prisma.videoState.upsert({
      where: { roomId },
      update: { playbackRate: rate, lastUpdated: new Date() },
      create: { roomId, playbackRate: rate },
    });

    return this.toVideoStateResponse(state);
  }

  private toVideoStateResponse(state: {
    roomId: string;
    videoId: string | null;
    videoTitle: string | null;
    videoThumbnail: string | null;
    currentTime: number;
    isPlaying: boolean;
    playbackRate: number;
    lastUpdated: Date;
  }): VideoStateResponseDto {
    return {
      roomId: state.roomId,
      videoId: state.videoId,
      videoTitle: state.videoTitle,
      videoThumbnail: state.videoThumbnail,
      currentTime: state.currentTime,
      isPlaying: state.isPlaying,
      playbackRate: state.playbackRate,
      lastUpdated: state.lastUpdated,
    };
  }
}
