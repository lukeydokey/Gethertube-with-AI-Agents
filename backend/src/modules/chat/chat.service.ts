import { Injectable, Logger } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { PrismaService } from '../../database';
import { MessageResponseDto } from './dto/message-response.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createMessage(
    roomId: string,
    userId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
  ): Promise<MessageResponseDto> {
    const sanitizedContent = this.sanitizeHtml(content);

    const message = await this.prisma.message.create({
      data: { roomId, userId, content: sanitizedContent, type },
      include: { user: true },
    });

    return this.toMessageResponse(message);
  }

  async getMessages(
    roomId: string,
    limit = 50,
    before?: string,
  ): Promise<MessageResponseDto[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        roomId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.reverse().map((m) => this.toMessageResponse(m));
  }

  async deleteMessage(
    messageId: string,
    userId: string,
    isModOrHost: boolean,
  ): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) return;

    // 작성자 본인이거나 모더레이터/호스트인 경우만 삭제 가능
    if (message.userId !== userId && !isModOrHost) {
      return;
    }

    await this.prisma.message.delete({ where: { id: messageId } });
  }

  private toMessageResponse(message: {
    id: string;
    roomId: string;
    userId: string;
    content: string;
    type: MessageType;
    createdAt: Date;
    user: { name: string | null; profileImage: string | null };
  }): MessageResponseDto {
    return {
      id: message.id,
      roomId: message.roomId,
      userId: message.userId,
      userName: message.user.name,
      userProfileImage: message.user.profileImage,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
    };
  }

  private sanitizeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
}
