import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { RoomRole } from '@prisma/client';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../../database';

const mockUser = {
  id: 'user-1',
  email: 'test@test.com',
  name: 'Test User',
  profileImage: null,
  googleId: 'google-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRoom = {
  id: 'room-1',
  name: 'Test Room',
  description: 'A test room',
  isPublic: true,
  password: null,
  maxMembers: 50,
  hostId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  host: mockUser,
  _count: { members: 1 },
};

const mockMember = {
  id: 'member-1',
  roomId: 'room-1',
  userId: 'user-1',
  role: RoomRole.HOST,
  joinedAt: new Date(),
  user: mockUser,
};

describe('RoomsService', () => {
  let service: RoomsService;
  let prisma: {
    room: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock; count: jest.Mock };
    roomMember: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock };
    videoState: { create: jest.Mock };
    user: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      room: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      roomMember: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      videoState: {
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  describe('create', () => {
    it('should create a room with host as member', async () => {
      prisma.$transaction.mockImplementation(async (cb: (tx: typeof prisma) => Promise<unknown>) => cb(prisma));
      prisma.room.create.mockResolvedValue(mockRoom);
      prisma.roomMember.create.mockResolvedValue(mockMember);
      prisma.videoState.create.mockResolvedValue({});

      const result = await service.create({ name: 'Test Room', description: 'A test room' }, 'user-1');

      expect(result.name).toBe('Test Room');
      expect(result.host.id).toBe('user-1');
      expect(prisma.roomMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: RoomRole.HOST }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return room when found', async () => {
      prisma.room.findUnique.mockResolvedValue(mockRoom);
      const result = await service.findById('room-1');
      expect(result.id).toBe('room-1');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.room.findUnique.mockResolvedValue(null);
      await expect(service.findById('room-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update room when user is host', async () => {
      prisma.room.findUnique.mockResolvedValue(mockRoom);
      prisma.room.update.mockResolvedValue({ ...mockRoom, name: 'Updated Room' });

      const result = await service.update('room-1', { name: 'Updated Room' }, 'user-1');
      expect(result.name).toBe('Updated Room');
    });

    it('should throw ForbiddenException when user is not host', async () => {
      prisma.room.findUnique.mockResolvedValue(mockRoom);
      await expect(service.update('room-1', { name: 'Updated' }, 'user-2')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete room when user is host', async () => {
      prisma.room.findUnique.mockResolvedValue(mockRoom);
      prisma.room.delete.mockResolvedValue(mockRoom);

      await service.delete('room-1', 'user-1');
      expect(prisma.room.delete).toHaveBeenCalledWith({ where: { id: 'room-1' } });
    });

    it('should throw ForbiddenException when user is not host', async () => {
      prisma.room.findUnique.mockResolvedValue(mockRoom);
      await expect(service.delete('room-1', 'user-2')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('joinRoom', () => {
    it('should add user as member', async () => {
      prisma.room.findUnique.mockResolvedValue(mockRoom);
      prisma.roomMember.findUnique.mockResolvedValue(null);
      prisma.roomMember.create.mockResolvedValue({ ...mockMember, userId: 'user-2', role: RoomRole.MEMBER, user: { ...mockUser, id: 'user-2' } });

      const result = await service.joinRoom('room-1', 'user-2');
      expect(result.role).toBe(RoomRole.MEMBER);
    });

    it('should throw ForbiddenException when room is full', async () => {
      prisma.room.findUnique.mockResolvedValue({ ...mockRoom, maxMembers: 1, _count: { members: 1 } });
      prisma.roomMember.findUnique.mockResolvedValue(null);

      await expect(service.joinRoom('room-1', 'user-2')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for wrong password on private room', async () => {
      prisma.room.findUnique.mockResolvedValue({ ...mockRoom, isPublic: false, password: 'secret' });
      prisma.roomMember.findUnique.mockResolvedValue(null);

      await expect(service.joinRoom('room-1', 'user-2', 'wrong')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('kickMember', () => {
    it('should kick a member when requester is host', async () => {
      prisma.roomMember.findUnique
        .mockResolvedValueOnce({ ...mockMember, role: RoomRole.HOST })
        .mockResolvedValueOnce({ ...mockMember, id: 'member-2', userId: 'user-2', role: RoomRole.MEMBER });
      prisma.roomMember.delete.mockResolvedValue({});

      await service.kickMember('room-1', 'user-2', 'user-1');
      expect(prisma.roomMember.delete).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when member tries to kick', async () => {
      prisma.roomMember.findUnique.mockResolvedValue({ ...mockMember, role: RoomRole.MEMBER, userId: 'user-3' });

      await expect(service.kickMember('room-1', 'user-2', 'user-3')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when trying to kick host', async () => {
      prisma.roomMember.findUnique
        .mockResolvedValueOnce({ ...mockMember, role: RoomRole.MODERATOR, userId: 'user-2' })
        .mockResolvedValueOnce({ ...mockMember, role: RoomRole.HOST });

      await expect(service.kickMember('room-1', 'user-1', 'user-2')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateMemberRole', () => {
    it('should throw BadRequestException when host tries to change own role', async () => {
      prisma.room.findUnique.mockResolvedValue(mockRoom);

      await expect(
        service.updateMemberRole('room-1', 'user-1', RoomRole.MODERATOR, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
