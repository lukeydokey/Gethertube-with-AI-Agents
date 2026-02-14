export class VideoStateResponseDto {
  roomId: string;
  videoId: string | null;
  videoTitle: string | null;
  videoThumbnail: string | null;
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  lastUpdated: Date;
}
