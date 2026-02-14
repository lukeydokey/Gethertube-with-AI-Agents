import { Test, TestingModule } from '@nestjs/testing';
import { MessageType } from '@prisma/client';
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
    message: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; delete: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      message: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
      ],
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
      };
      prisma.message.create.mockResolvedValue(mockMessage);

      const result = await service.createMessage('room-1', 'user-1', 'Hello!');
      expect(result.content).toBe('Hello!');
      expect(result.type).toBe(MessageType.TEXT);
      expect(result.userName).toBe('Test User');
    });
  });

  describe('getMessages', () => {
    it('should return messages in chronological order', async () => {
      const messages = [
        { id: 'msg-2', roomId: 'room-1', userId: 'user-1', content: 'Second', type: MessageType.TEXT, createdAt: new Date('2026-01-02'), user: mockUser },
        { id: 'msg-1', roomId: 'room-1', userId: 'user-1', content: 'First', type: MessageType.TEXT, createdAt: new Date('2026-01-01'), user: mockUser },
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
      prisma.message.findUnique.mockResolvedValue({ id: 'msg-1', userId: 'user-1' });
      prisma.message.delete.mockResolvedValue({});

      await service.deleteMessage('msg-1', 'user-1', false);
      expect(prisma.message.delete).toHaveBeenCalledWith({ where: { id: 'msg-1' } });
    });

    it('should delete message when user is mod/host', async () => {
      prisma.message.findUnique.mockResolvedValue({ id: 'msg-1', userId: 'user-2' });
      prisma.message.delete.mockResolvedValue({});

      await service.deleteMessage('msg-1', 'user-1', true);
      expect(prisma.message.delete).toHaveBeenCalled();
    });

    it('should not delete message when user is not author and not mod', async () => {
      prisma.message.findUnique.mockResolvedValue({ id: 'msg-1', userId: 'user-2' });

      await service.deleteMessage('msg-1', 'user-1', false);
      expect(prisma.message.delete).not.toHaveBeenCalled();
    });
  });
});
