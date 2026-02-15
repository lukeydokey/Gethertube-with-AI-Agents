import { Test, TestingModule } from '@nestjs/testing';
import { MessageType } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { PrismaService } from '../../database';

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  profileImage: null,
};

describe('ChatService', () => {
  let service: ChatService;
  let prisma: {
    message: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    reaction: {
      create: jest.Mock;
      deleteMany: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      message: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      reaction: {
        create: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('createMessage', () => {
    it('should create a text message', async () => {
      const mockMessage = {
        id: 'msg-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'Hello!',
        type: MessageType.TEXT,
        createdAt: new Date(),
        user: mockUser,
        reactions: [],
      };
      prisma.message.create.mockResolvedValue(mockMessage);

      const result = await service.createMessage('room-1', 'user-1', 'Hello!');
      expect(result.content).toBe('Hello!');
      expect(result.type).toBe(MessageType.TEXT);
      expect(result.userName).toBe('Test User');
      expect(result.reactions).toEqual([]);
    });
  });

  describe('getMessages', () => {
    it('should return messages in chronological order', async () => {
      const messages = [
        {
          id: 'msg-2',
          roomId: 'room-1',
          userId: 'user-1',
          content: 'Second',
          type: MessageType.TEXT,
          createdAt: new Date('2026-01-02'),
          user: mockUser,
          reactions: [],
        },
        {
          id: 'msg-1',
          roomId: 'room-1',
          userId: 'user-1',
          content: 'First',
          type: MessageType.TEXT,
          createdAt: new Date('2026-01-01'),
          user: mockUser,
          reactions: [],
        },
      ];
      prisma.message.findMany.mockResolvedValue(messages);

      const result = await service.getMessages('room-1');
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('First');
      expect(result[1].content).toBe('Second');
    });
  });

  describe('deleteMessage', () => {
    it('should delete message when user is the author', async () => {
      prisma.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        userId: 'user-1',
      });
      prisma.message.delete.mockResolvedValue({});

      await service.deleteMessage('msg-1', 'user-1', false);
      expect(prisma.message.delete).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
      });
    });

    it('should delete message when user is mod/host', async () => {
      prisma.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        userId: 'user-2',
      });
      prisma.message.delete.mockResolvedValue({});

      await service.deleteMessage('msg-1', 'user-1', true);
      expect(prisma.message.delete).toHaveBeenCalled();
    });

    it('should not delete message when user is not author and not mod', async () => {
      prisma.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        userId: 'user-2',
      });

      await service.deleteMessage('msg-1', 'user-1', false);
      expect(prisma.message.delete).not.toHaveBeenCalled();
    });
  });

  describe('addReaction', () => {
    it('should add a valid reaction', async () => {
      prisma.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        roomId: 'room-1',
      });
      prisma.reaction.create.mockResolvedValue({
        id: 'reaction-1',
        messageId: 'msg-1',
        userId: 'user-1',
        emoji: '👍',
        createdAt: new Date(),
        user: mockUser,
      });

      const result = await service.addReaction('msg-1', 'user-1', '👍');
      expect(result.emoji).toBe('👍');
      expect(result.userId).toBe('user-1');
      expect(result.userName).toBe('Test User');
    });

    it('should reject invalid emoji', async () => {
      await expect(
        service.addReaction('msg-1', 'user-1', '🚀'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when message not found', async () => {
      prisma.message.findUnique.mockResolvedValue(null);

      await expect(
        service.addReaction('msg-1', 'user-1', '👍'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle duplicate reactions', async () => {
      prisma.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        roomId: 'room-1',
      });
      const duplicateError = new Error('Unique constraint failed') as Error & {
        code: string;
      };
      duplicateError.code = 'P2002';
      prisma.reaction.create.mockRejectedValue(duplicateError);
      prisma.reaction.findFirst.mockResolvedValue({
        id: 'reaction-1',
        messageId: 'msg-1',
        userId: 'user-1',
        emoji: '👍',
        createdAt: new Date(),
        user: mockUser,
      });

      const result = await service.addReaction('msg-1', 'user-1', '👍');
      expect(result.emoji).toBe('👍');
    });
  });

  describe('removeReaction', () => {
    it('should remove a reaction', async () => {
      prisma.reaction.deleteMany.mockResolvedValue({ count: 1 });

      await service.removeReaction('msg-1', 'user-1', '👍');
      expect(prisma.reaction.deleteMany).toHaveBeenCalledWith({
        where: { messageId: 'msg-1', userId: 'user-1', emoji: '👍' },
      });
    });
  });

  describe('getReactions', () => {
    it('should return grouped reactions', async () => {
      const mockReactions = [
        {
          id: 'r1',
          messageId: 'msg-1',
          userId: 'user-1',
          emoji: '👍',
          createdAt: new Date(),
          user: mockUser,
        },
        {
          id: 'r2',
          messageId: 'msg-1',
          userId: 'user-2',
          emoji: '👍',
          createdAt: new Date(),
          user: { ...mockUser, id: 'user-2', name: 'User 2' },
        },
        {
          id: 'r3',
          messageId: 'msg-1',
          userId: 'user-3',
          emoji: '❤️',
          createdAt: new Date(),
          user: { ...mockUser, id: 'user-3', name: 'User 3' },
        },
      ];
      prisma.reaction.findMany.mockResolvedValue(mockReactions);

      const result = await service.getReactions('msg-1');
      expect(result).toHaveLength(2);
      expect(result[0].emoji).toBe('👍');
      expect(result[0].count).toBe(2);
      expect(result[1].emoji).toBe('❤️');
      expect(result[1].count).toBe(1);
    });
  });
});
