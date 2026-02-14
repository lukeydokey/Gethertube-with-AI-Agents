import { Test, TestingModule } from '@nestjs/testing';
import { VideoSyncService } from './video-sync.service';
import { PrismaService } from '../../database';

const mockVideoState = {
  id: 'vs-1',
  roomId: 'room-1',
  videoId: 'dQw4w9WgXcQ',
  videoTitle: 'Test Video',
  videoThumbnail: null,
  currentTime: 42.5,
  isPlaying: true,
  playbackRate: 1.0,
  lastUpdated: new Date(),
};

describe('VideoSyncService', () => {
  let service: VideoSyncService;
  let prisma: {
    videoState: { findUnique: jest.Mock; upsert: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      videoState: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoSyncService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<VideoSyncService>(VideoSyncService);
  });

  describe('getVideoState', () => {
    it('should return video state when exists', async () => {
      prisma.videoState.findUnique.mockResolvedValue(mockVideoState);

      const result = await service.getVideoState('room-1');
      expect(result).not.toBeNull();
      expect(result!.videoId).toBe('dQw4w9WgXcQ');
      expect(result!.currentTime).toBe(42.5);
    });

    it('should return null when no state exists', async () => {
      prisma.videoState.findUnique.mockResolvedValue(null);

      const result = await service.getVideoState('room-999');
      expect(result).toBeNull();
    });
  });

  describe('updatePlayState', () => {
    it('should update play state', async () => {
      prisma.videoState.upsert.mockResolvedValue({ ...mockVideoState, isPlaying: true, currentTime: 10 });

      const result = await service.updatePlayState('room-1', true, 10);
      expect(result.isPlaying).toBe(true);
      expect(result.currentTime).toBe(10);
    });
  });

  describe('changeVideo', () => {
    it('should change video and reset time', async () => {
      prisma.videoState.upsert.mockResolvedValue({
        ...mockVideoState,
        videoId: 'newVideo123',
        videoTitle: 'New Video',
        currentTime: 0,
        isPlaying: false,
      });

      const result = await service.changeVideo('room-1', 'newVideo123', 'New Video');
      expect(result.videoId).toBe('newVideo123');
      expect(result.currentTime).toBe(0);
      expect(result.isPlaying).toBe(false);
    });
  });

  describe('updatePlaybackRate', () => {
    it('should update playback rate', async () => {
      prisma.videoState.upsert.mockResolvedValue({ ...mockVideoState, playbackRate: 1.5 });

      const result = await service.updatePlaybackRate('room-1', 1.5);
      expect(result.playbackRate).toBe(1.5);
    });
  });
});
