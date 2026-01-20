import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;

      this.logger.log(`Client ${client.id} connected to chat as user ${client.userId}`);
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}`, error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client ${client.id} disconnected from chat`);
  }

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      await client.join(`chat:${data.roomId}`);

      this.logger.log(`User ${client.userId} joined chat room ${data.roomId}`);

      return {
        success: true,
        roomId: data.roomId,
      };
    } catch (error) {
      this.logger.error(
        `Error joining chat room ${data.roomId} for user ${client.userId}`,
        error,
      );
      return {
        error: error instanceof Error ? error.message : 'Failed to join chat',
      };
    }
  }

  @SubscribeMessage('leave_chat')
  async handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      await client.leave(`chat:${data.roomId}`);

      this.logger.log(`User ${client.userId} left chat room ${data.roomId}`);

      return {
        success: true,
        roomId: data.roomId,
      };
    } catch (error) {
      this.logger.error(
        `Error leaving chat room ${data.roomId} for user ${client.userId}`,
        error,
      );
      return {
        error: error instanceof Error ? error.message : 'Failed to leave chat',
      };
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      const message = await this.chatService.createMessage(
        data.roomId,
        client.userId,
        data.content,
        data.type,
      );

      const messageResponse = this.chatService.toMessageResponse(message);

      this.server.to(`chat:${data.roomId}`).emit('new_message', messageResponse);

      this.logger.log(
        `Message sent in room ${data.roomId} by user ${client.userId}`,
      );

      return {
        success: true,
        message: messageResponse,
      };
    } catch (error) {
      this.logger.error(
        `Error sending message in room ${data.roomId} for user ${client.userId}`,
        error,
      );
      return {
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  }

  @SubscribeMessage('get_message_history')
  async handleGetMessageHistory(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; limit?: number; before?: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      const messages = await this.chatService.getMessageHistory(
        data.roomId,
        client.userId,
        data.limit,
        data.before,
      );

      this.logger.log(
        `Message history retrieved for room ${data.roomId} by user ${client.userId}`,
      );

      return {
        success: true,
        messages,
      };
    } catch (error) {
      this.logger.error(
        `Error getting message history for room ${data.roomId}`,
        error,
      );
      return {
        error:
          error instanceof Error ? error.message : 'Failed to get message history',
      };
    }
  }

  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      client.to(`chat:${data.roomId}`).emit('user_typing_start', {
        roomId: data.roomId,
        userId: client.userId,
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Error broadcasting typing start', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to broadcast typing',
      };
    }
  }

  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      client.to(`chat:${data.roomId}`).emit('user_typing_stop', {
        roomId: data.roomId,
        userId: client.userId,
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Error broadcasting typing stop', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to broadcast typing',
      };
    }
  }
}
