import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import {
  Logger,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { User, MessageType, RoomRole } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { RoomsService } from '../rooms/rooms.service';
import { ChatService } from './chat.service';
import { WsJwtAuthGuard } from '../../common/guards/ws-jwt-auth.guard';
import { WsCurrentUser } from '../../common/decorators/ws-current-user.decorator';
import { extractTokenFromSocket } from '../../common/utils/ws.utils';
import { WsLoggingInterceptor } from '../../common/interceptors/ws-logging.interceptor';
import { AddReactionDto } from './dto/add-reaction.dto';
import { RemoveReactionDto } from './dto/remove-reaction.dto';

@UseInterceptors(WsLoggingInterceptor)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly typingTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly roomsService: RoomsService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = extractTokenFromSocket(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        client.disconnect();
        return;
      }

      client.data = { user };
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data?.user as User | undefined;
    if (user) {
      const key = `${user.id}`;
      const timer = this.typingTimers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.typingTimers.delete(key);
      }
    }
  }

  @SubscribeMessage('send_message')
  @UseGuards(WsJwtAuthGuard)
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { roomId: string; content: string; type?: MessageType },
    @WsCurrentUser() user: User,
  ) {
    try {
      const isMember = await this.roomsService.isMember(data.roomId, user.id);
      if (!isMember) {
        client.emit('error', {
          code: 'CHAT_ERROR',
          message: 'Not a room member',
        });
        return;
      }

      const message = await this.chatService.createMessage(
        data.roomId,
        user.id,
        data.content,
        data.type ?? MessageType.TEXT,
      );

      this.server.to(data.roomId).emit('new_message', { message });
      this.clearTyping(data.roomId, user);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to send message';
      client.emit('error', { code: 'CHAT_ERROR', message });
    }
  }

  @SubscribeMessage('typing_start')
  @UseGuards(WsJwtAuthGuard)
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
    @WsCurrentUser() user: User,
  ) {
    client.to(data.roomId).emit('user_typing', {
      userId: user.id,
      userName: user.name,
    });

    const key = `${user.id}:${data.roomId}`;
    const existingTimer = this.typingTimers.get(key);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      this.clearTyping(data.roomId, user);
      this.typingTimers.delete(key);
    }, 5000);
    this.typingTimers.set(key, timer);
  }

  @SubscribeMessage('typing_stop')
  @UseGuards(WsJwtAuthGuard)
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
    @WsCurrentUser() user: User,
  ) {
    this.clearTyping(data.roomId, user);
  }

  @SubscribeMessage('delete_message')
  @UseGuards(WsJwtAuthGuard)
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; messageId: string },
    @WsCurrentUser() user: User,
  ) {
    try {
      const role = await this.roomsService.getMemberRole(data.roomId, user.id);
      if (!role) {
        client.emit('error', {
          code: 'CHAT_ERROR',
          message: 'Not a room member',
        });
        return;
      }

      const isModOrHost = role === RoomRole.HOST || role === RoomRole.MODERATOR;
      await this.chatService.deleteMessage(
        data.messageId,
        user.id,
        isModOrHost,
      );

      this.server
        .to(data.roomId)
        .emit('message_deleted', { messageId: data.messageId });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete message';
      client.emit('error', { code: 'CHAT_ERROR', message });
    }
  }

  @SubscribeMessage('add_reaction')
  @UseGuards(WsJwtAuthGuard)
  async handleAddReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: AddReactionDto,
    @WsCurrentUser() user: User,
  ) {
    try {
      const isMember = await this.roomsService.isMember(data.roomId, user.id);
      if (!isMember) {
        client.emit('error', {
          code: 'CHAT_ERROR',
          message: 'Not a room member',
        });
        return;
      }

      const reaction = await this.chatService.addReaction(
        data.messageId,
        user.id,
        data.emoji,
      );

      this.server.to(data.roomId).emit('reaction_added', {
        messageId: data.messageId,
        userId: reaction.userId,
        userName: reaction.userName,
        emoji: reaction.emoji,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to add reaction';
      client.emit('error', { code: 'CHAT_ERROR', message });
    }
  }

  @SubscribeMessage('remove_reaction')
  @UseGuards(WsJwtAuthGuard)
  async handleRemoveReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RemoveReactionDto,
    @WsCurrentUser() user: User,
  ) {
    try {
      const isMember = await this.roomsService.isMember(data.roomId, user.id);
      if (!isMember) {
        client.emit('error', {
          code: 'CHAT_ERROR',
          message: 'Not a room member',
        });
        return;
      }

      await this.chatService.removeReaction(
        data.messageId,
        user.id,
        data.emoji,
      );

      this.server.to(data.roomId).emit('reaction_removed', {
        messageId: data.messageId,
        userId: user.id,
        emoji: data.emoji,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to remove reaction';
      client.emit('error', { code: 'CHAT_ERROR', message });
    }
  }

  @SubscribeMessage('join_chat_room')
  @UseGuards(WsJwtAuthGuard)
  async handleJoinChatRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
    @WsCurrentUser() user: User,
  ) {
    const isMember = await this.roomsService.isMember(data.roomId, user.id);
    if (!isMember) {
      client.emit('error', {
        code: 'CHAT_ERROR',
        message: 'Not a room member',
      });
      return;
    }
    client.join(data.roomId);
  }

  private clearTyping(roomId: string, user: User) {
    const key = `${user.id}:${roomId}`;
    const timer = this.typingTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.typingTimers.delete(key);
    }
    this.server.to(roomId).emit('user_stopped_typing', { userId: user.id });
  }
}
