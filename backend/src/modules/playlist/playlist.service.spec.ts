import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RoomRole } from '@prisma/client';
import { PlaylistService } from './playlist.service';
import { PrismaService } from '../../database';

const mockUser = { id: 'user-1', name: 'Test User' };

const mockPlaylistItem = {
  id: 'item-1',
  roomId: 'room-1',
  addedById: 'user-1',
  videoId: 'dQw4w9WgXcQ',
  title: 'Never Gonna Give You Up',
  thumbnail: null,
  duration: 212,
  position: 0,
  addedAt: new Date(),
  addedBy: mockUser,
};

describe('PlaylistService', () => {
  let service: PlaylistService;
  let prisma: {
    playlistItem: { findMany: jest.Mock; findFirst: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      playlistItem: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaylistService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PlaylistService>(PlaylistService);
  });

  describe('getPlaylist', () => {
    it('should return playlist items in order', async () => {
      prisma.playlistItem.findMany.mockResolvedValue([mockPlaylistItem]);

      const result = await service.getPlaylist('room-1');
      expect(result).toHaveLength(1);
      expect(result[0].videoId).toBe('dQw4w9WgXcQ');
      expect(result[0].position).toBe(0);
    });
  });

  describe('addVideo', () => {
    it('should add video at next position', async () => {
      prisma.playlistItem.findFirst.mockResolvedValue({ position: 2 });
      prisma.playlistItem.create.mockResolvedValue({ ...mockPlaylistItem, position: 3 });

      const result = await service.addVideo('room-1', 'user-1', {
        videoId: 'dQw4w9WgXcQ',
        title: 'Never Gonna Give You Up',
        duration: 212,
      });

      expect(prisma.playlistItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ position: 3 }),
        }),
      );
    });

    it('should add first video at position 0', async () => {
      prisma.playlistItem.findFirst.mockResolvedValue(null);
      prisma.playlistItem.create.mockResolvedValue(mockPlaylistItem);

      await service.addVideo('room-1', 'user-1', {
        videoId: 'dQw4w9WgXcQ',
        title: 'Test',
        duration: 100,
      });

      expect(prisma.playlistItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ position: 0 }),
        }),
      );
    });
  });

  describe('removeVideo', () => {
    it('should allow owner to remove their own item', async () => {
      prisma.playlistItem.findUnique.mockResolvedValue(mockPlaylistItem);
      prisma.playlistItem.delete.mockResolvedValue({});
      prisma.playlistItem.findMany.mockResolvedValue([]);
      prisma.$transaction.mockResolvedValue([]);

      await service.removeVideo('room-1', 'item-1', 'user-1', RoomRole.MEMBER);
      expect(prisma.playlistItem.delete).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when MEMBER tries to remove others item', async () => {
      prisma.playlistItem.findUnique.mockResolvedValue({ ...mockPlaylistItem, addedById: 'user-2' });

      await expect(
        service.removeVideo('room-1', 'item-1', 'user-1', RoomRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow HOST to remove any item', async () => {
      prisma.playlistItem.findUnique.mockResolvedValue({ ...mockPlaylistItem, addedById: 'user-2' });
      prisma.playlistItem.delete.mockResolvedValue({});
      prisma.playlistItem.findMany.mockResolvedValue([]);
      prisma.$transaction.mockResolvedValue([]);

      await service.removeVideo('room-1', 'item-1', 'user-1', RoomRole.HOST);
      expect(prisma.playlistItem.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when item not found', async () => {
      prisma.playlistItem.findUnique.mockResolvedValue(null);

      await expect(
        service.removeVideo('room-1', 'item-999', 'user-1', RoomRole.HOST),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorderPlaylist', () => {
    it('should throw ForbiddenException when MEMBER tries to reorder', async () => {
      await expect(
        service.reorderPlaylist('room-1', [{ id: 'item-1', position: 1 }], RoomRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow HOST to reorder', async () => {
      prisma.$transaction.mockResolvedValue([]);
      prisma.playlistItem.findMany.mockResolvedValue([mockPlaylistItem]);

      const result = await service.reorderPlaylist(
        'room-1',
        [{ id: 'item-1', position: 0 }],
        RoomRole.HOST,
      );
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getNextVideo', () => {
    it('should return next video by position', async () => {
      prisma.playlistItem.findFirst.mockResolvedValue({ ...mockPlaylistItem, position: 1, addedBy: mockUser });

      const result = await service.getNextVideo('room-1', 0);
      expect(result).not.toBeNull();
      expect(result!.position).toBe(1);
    });

    it('should return null when no next video', async () => {
      prisma.playlistItem.findFirst.mockResolvedValue(null);

      const result = await service.getNextVideo('room-1', 5);
      expect(result).toBeNull();
    });
  });
});
