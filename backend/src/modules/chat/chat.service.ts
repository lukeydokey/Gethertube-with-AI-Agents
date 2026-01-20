import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { MessageType, Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { RoomsService } from '../rooms/rooms.service';
import { MessageResponseDto } from './dto';

type MessageWithUser = Prisma.MessageGetPayload<{
  include: { user: true };
}>;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly roomsService: RoomsService,
  ) {}

  async createMessage(
    roomId: string,
    userId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
  ): Promise<MessageWithUser> {
    const isMember = await this.roomsService.isMember(roomId, userId);

    if (!isMember) {
      throw new ForbiddenException('You must be a member of the room to send messages');
    }

    const message = await this.prisma.message.create({
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

    this.logger.log(`Message created in room ${roomId} by user ${userId}`);

    return message;
  }

  async getMessageHistory(
    roomId: string,
    userId: string,
    limit: number = 50,
    before?: string,
  ): Promise<MessageResponseDto[]> {
    const isMember = await this.roomsService.isMember(roomId, userId);

    if (!isMember) {
      throw new ForbiddenException('You must be a member of the room to view messages');
    }

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    const messages = await this.prisma.message.findMany({
      where: {
        roomId,
        ...(before && {
          createdAt: {
            lt: new Date(before),
          },
        }),
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return messages.reverse().map((message) => this.toMessageResponse(message));
  }

  async createSystemMessage(
    roomId: string,
    content: string,
    systemUserId: string,
  ): Promise<MessageWithUser> {
    const message = await this.prisma.message.create({
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

    this.logger.log(`System message created in room ${roomId}`);

    return message;
  }

  toMessageResponse(message: MessageWithUser): MessageResponseDto {
    return {
      id: message.id,
      roomId: message.roomId,
      user: {
        id: message.user.id,
        email: message.user.email,
        name: message.user.name,
        profileImage: message.user.profileImage,
        createdAt: message.user.createdAt,
      },
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
    };
  }
}
