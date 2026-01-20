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
import { RoomsService } from './rooms.service';
import { JoinRoomDto } from './dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  namespace: 'rooms',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class RoomsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomsGateway.name);

  constructor(
    private readonly roomsService: RoomsService,
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

      this.logger.log(`Client ${client.id} connected as user ${client.userId}`);
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}`, error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; password?: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      const isMember = await this.roomsService.isMember(
        data.roomId,
        client.userId,
      );

      if (!isMember) {
        const joinRoomDto: JoinRoomDto = {
          password: data.password,
        };
        await this.roomsService.join(data.roomId, client.userId, joinRoomDto);
      }

      await client.join(`room:${data.roomId}`);

      const room = await this.roomsService.findOne(data.roomId, client.userId);
      const members = await this.roomsService.getRoomMembers(data.roomId);

      const joinedMember = members.find((m) => m.user.id === client.userId);

      this.server.to(`room:${data.roomId}`).emit('member_joined', {
        roomId: data.roomId,
        user: joinedMember?.user,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`User ${client.userId} joined room ${data.roomId} via WebSocket`);

      return {
        success: true,
        room,
        members,
      };
    } catch (error) {
      this.logger.error(
        `Error joining room ${data.roomId} for user ${client.userId}`,
        error,
      );
      return {
        error: error instanceof Error ? error.message : 'Failed to join room',
      };
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      await client.leave(`room:${data.roomId}`);

      const isMember = await this.roomsService.isMember(
        data.roomId,
        client.userId,
      );

      if (isMember) {
        await this.roomsService.leave(data.roomId, client.userId);

        this.server.to(`room:${data.roomId}`).emit('member_left', {
          roomId: data.roomId,
          userId: client.userId,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(`User ${client.userId} left room ${data.roomId} via WebSocket`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error leaving room ${data.roomId} for user ${client.userId}`,
        error,
      );
      return {
        error: error instanceof Error ? error.message : 'Failed to leave room',
      };
    }
  }

  @SubscribeMessage('get_room_info')
  async handleGetRoomInfo(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      const room = await this.roomsService.findOne(data.roomId, client.userId);
      const members = await this.roomsService.getRoomMembers(data.roomId);

      return {
        success: true,
        room,
        members,
      };
    } catch (error) {
      this.logger.error(
        `Error getting room info ${data.roomId} for user ${client.userId}`,
        error,
      );
      return {
        error: error instanceof Error ? error.message : 'Failed to get room info',
      };
    }
  }
}
