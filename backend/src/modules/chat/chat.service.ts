import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MessageType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database';
import {
  MessageResponseDto,
  ReactionSummaryDto,
} from './dto/message-response.dto';
import { isValidReaction } from './constants';

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
      include: { user: true, reactions: { include: { user: true } } },
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
      include: { user: true, reactions: { include: { user: true } } },
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

  async addReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<{ emoji: string; userId: string; userName: string | null }> {
    // 허용된 이모지인지 확인
    if (!isValidReaction(emoji)) {
      throw new BadRequestException(
        `Invalid emoji. Allowed reactions: 👍, ❤️, 😂, 😮, 😢, 🔥`,
      );
    }

    // 메시지 존재 확인
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // 이미 존재하는 경우 무시 (upsert 대신 create - unique constraint가 처리)
    try {
      const reaction = await this.prisma.reaction.create({
        data: { messageId, userId, emoji },
        include: { user: true },
      });

      return {
        emoji: reaction.emoji,
        userId: reaction.userId,
        userName: reaction.user.name,
      };
    } catch (error) {
      // Unique constraint 위반 시 기존 리액션 반환
      if (this.isUniqueConstraintError(error)) {
        const existing = await this.prisma.reaction.findFirst({
          where: { messageId, userId, emoji },
          include: { user: true },
        });
        if (existing) {
          return {
            emoji: existing.emoji,
            userId: existing.userId,
            userName: existing.user.name,
          };
        }
      }
      throw error;
    }
  }

  private isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError | { code: string } {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 'P2002')
    );
  }

  async removeReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<void> {
    await this.prisma.reaction.deleteMany({
      where: { messageId, userId, emoji },
    });
  }

  async getReactions(messageId: string): Promise<ReactionSummaryDto[]> {
    const reactions = await this.prisma.reaction.findMany({
      where: { messageId },
      include: { user: true },
    });

    return this.summarizeReactions(
      reactions.map((r) => ({
        emoji: r.emoji,
        userId: r.userId,
        user: { name: r.user.name },
      })),
    );
  }

  private toMessageResponse(message: {
    id: string;
    roomId: string;
    userId: string;
    content: string;
    type: MessageType;
    createdAt: Date;
    user: { name: string | null; profileImage: string | null };
    reactions?: Array<{
      emoji: string;
      userId: string;
      user: { name: string | null };
    }>;
  }): MessageResponseDto {
    const reactionSummary = this.summarizeReactions(message.reactions || []);

    return {
      id: message.id,
      roomId: message.roomId,
      userId: message.userId,
      userName: message.user.name,
      userProfileImage: message.user.profileImage,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
      reactions: reactionSummary,
    };
  }

  private summarizeReactions(
    reactions: Array<{
      emoji: string;
      userId: string;
      user: { name: string | null };
    }>,
  ): ReactionSummaryDto[] {
    const grouped = reactions.reduce(
      (acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push({
          userId: reaction.userId,
          userName: reaction.user.name,
        });
        return acc;
      },
      {} as Record<string, Array<{ userId: string; userName: string | null }>>,
    );

    return Object.entries(grouped).map(([emoji, users]) => ({
      emoji,
      count: users.length,
      users,
    }));
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
