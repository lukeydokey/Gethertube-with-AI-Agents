import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { ChatService } from './chat.service';
import { PrismaService } from '@/database/prisma.service';
import { RoomsService } from '../rooms/rooms.service';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: {
    message: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
    room: {
      findUnique: jest.Mock;
    };
  };
  let roomsService: {
    isMember: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      message: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      room: {
        findUnique: jest.fn(),
      },
    };

    roomsService = {
      isMember: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: RoomsService,
          useValue: roomsService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMessage', () => {
    it('should create a message when user is a member', async () => {
      const roomId = 'room-1';
      const userId = 'user-1';
      const content = 'Hello!';
      const type = MessageType.TEXT;

      const mockMessage = {
        id: 'message-1',
        roomId,
        userId,
        content,
        type,
        createdAt: new Date(),
        user: {
          id: userId,
          email: 'test@example.com',
          name: 'Test User',
          profileImage: null,
          googleId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      roomsService.isMember.mockResolvedValue(true);
      prisma.message.create.mockResolvedValue(mockMessage);

      const result = await service.createMessage(roomId, userId, content, type);

      expect(roomsService.isMember).toHaveBeenCalledWith(roomId, userId);
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          roomId,
          userId,
          content,
          type,
        },
        include: {
          user: true,
        },
      });
      expect(result).toEqual(mockMessage);
    });

    it('should throw ForbiddenException when user is not a member', async () => {
      const roomId = 'room-1';
      const userId = 'user-1';
      const content = 'Hello!';

      roomsService.isMember.mockResolvedValue(false);

      await expect(
        service.createMessage(roomId, userId, content, MessageType.TEXT),
      ).rejects.toThrow(ForbiddenException);

      expect(roomsService.isMember).toHaveBeenCalledWith(roomId, userId);
      expect(prisma.message.create).not.toHaveBeenCalled();
    });
  });

  describe('getMessageHistory', () => {
    it('should return message history when user is a member', async () => {
      const roomId = 'room-1';
      const userId = 'user-1';
      const limit = 50;

      const mockRoom = {
        id: roomId,
        name: 'Test Room',
        description: null,
        isPublic: true,
        password: null,
        maxMembers: 50,
        hostId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMessages = [
        {
          id: 'message-1',
          roomId,
          userId,
          content: 'Hello!',
          type: MessageType.TEXT,
          createdAt: new Date(),
          user: {
            id: userId,
            email: 'test@example.com',
            name: 'Test User',
            profileImage: null,
            googleId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      roomsService.isMember.mockResolvedValue(true);
      prisma.room.findUnique.mockResolvedValue(mockRoom);
      prisma.message.findMany.mockResolvedValue(mockMessages);

      const result = await service.getMessageHistory(roomId, userId, limit);

      expect(roomsService.isMember).toHaveBeenCalledWith(roomId, userId);
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: roomId },
      });
      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: {
          roomId,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('message-1');
    });

    it('should throw ForbiddenException when user is not a member', async () => {
      const roomId = 'room-1';
      const userId = 'user-1';

      roomsService.isMember.mockResolvedValue(false);

      await expect(service.getMessageHistory(roomId, userId)).rejects.toThrow(
        ForbiddenException,
      );

      expect(roomsService.isMember).toHaveBeenCalledWith(roomId, userId);
      expect(prisma.room.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when room does not exist', async () => {
      const roomId = 'room-1';
      const userId = 'user-1';

      roomsService.isMember.mockResolvedValue(true);
      prisma.room.findUnique.mockResolvedValue(null);

      await expect(service.getMessageHistory(roomId, userId)).rejects.toThrow(
        NotFoundException,
      );

      expect(roomsService.isMember).toHaveBeenCalledWith(roomId, userId);
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: roomId },
      });
    });

    it('should support pagination with before parameter', async () => {
      const roomId = 'room-1';
      const userId = 'user-1';
      const limit = 20;
      const before = '2026-01-21T10:00:00.000Z';

      const mockRoom = { id: roomId, name: 'Test Room' };

      roomsService.isMember.mockResolvedValue(true);
      prisma.room.findUnique.mockResolvedValue(mockRoom);
      prisma.message.findMany.mockResolvedValue([]);

      await service.getMessageHistory(roomId, userId, limit, before);

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: {
          roomId,
          createdAt: {
            lt: new Date(before),
          },
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });
    });
  });

  describe('createSystemMessage', () => {
    it('should create a system message', async () => {
      const roomId = 'room-1';
      const content = 'User joined the room';
      const systemUserId = 'system-user-id';

      const mockMessage = {
        id: 'message-1',
        roomId,
        userId: systemUserId,
        content,
        type: MessageType.SYSTEM,
        createdAt: new Date(),
        user: {
          id: systemUserId,
          email: 'system@gethertube.com',
          name: 'System',
          profileImage: null,
          googleId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      prisma.message.create.mockResolvedValue(mockMessage);

      const result = await service.createSystemMessage(
        roomId,
        content,
        systemUserId,
      );

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          roomId,
          userId: systemUserId,
          content,
          type: MessageType.SYSTEM,
        },
        include: {
          user: true,
        },
      });
      expect(result).toEqual(mockMessage);
      expect(result.type).toBe(MessageType.SYSTEM);
    });
  });

  describe('toMessageResponse', () => {
    it('should convert message to response DTO', () => {
      const mockMessage = {
        id: 'message-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'Hello!',
        type: MessageType.TEXT,
        createdAt: new Date(),
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          profileImage: null,
          googleId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const result = service.toMessageResponse(mockMessage);

      expect(result).toEqual({
        id: mockMessage.id,
        roomId: mockMessage.roomId,
        user: {
          id: mockMessage.user.id,
          email: mockMessage.user.email,
          name: mockMessage.user.name,
          profileImage: mockMessage.user.profileImage,
          createdAt: mockMessage.user.createdAt,
        },
        content: mockMessage.content,
        type: mockMessage.type,
        createdAt: mockMessage.createdAt,
      });
    });
  });
});
