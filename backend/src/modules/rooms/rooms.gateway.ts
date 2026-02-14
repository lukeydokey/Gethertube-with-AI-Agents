import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { RoomsService } from './rooms.service';
import { WsJwtAuthGuard } from '../../common/guards/ws-jwt-auth.guard';
import { WsCurrentUser } from '../../common/decorators/ws-current-user.decorator';
import { extractTokenFromSocket } from '../../common/utils/ws.utils';

@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@WebSocketGateway({
  namespace: '/rooms',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
})
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomsGateway.name);
  private readonly userSockets = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly roomsService: RoomsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = extractTokenFromSocket(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: no token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        this.logger.warn(
          `Client ${client.id} connection rejected: user not found`,
        );
        client.disconnect();
        return;
      }

      client.data = { user };
      this.userSockets.set(user.id, client.id);
      this.logger.log(`Client connected: ${user.name} (${client.id})`);
      client.emit('connection_success', { userId: user.id });
    } catch (error) {
      this.logger.warn(`Client ${client.id} connection rejected: ${error}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data?.user as User | undefined;
    if (user) {
      this.userSockets.delete(user.id);
      this.logger.log(`Client disconnected: ${user.name} (${client.id})`);
    }
  }

  @SubscribeMessage('join_room')
  @UseGuards(WsJwtAuthGuard)
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; password?: string },
    @WsCurrentUser() user: User,
  ) {
    try {
      const member = await this.roomsService.joinRoom(
        data.roomId,
        user.id,
        data.password,
      );

      client.join(data.roomId);

      const [room, members] = await Promise.all([
        this.roomsService.findById(data.roomId),
        this.roomsService.getMembers(data.roomId),
      ]);

      client.emit('room_joined', { room, members });
      client.to(data.roomId).emit('member_joined', { member });

      this.logger.log(`${user.name} joined room ${data.roomId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to join room';
      client.emit('error', { code: 'ROOM_JOIN_ERROR', message });
    }
  }

  @SubscribeMessage('leave_room')
  @UseGuards(WsJwtAuthGuard)
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
    @WsCurrentUser() user: User,
  ) {
    try {
      await this.roomsService.leaveRoom(data.roomId, user.id);

      client.leave(data.roomId);
      client.emit('room_left', { roomId: data.roomId });
      this.server.to(data.roomId).emit('member_left', { userId: user.id });

      this.logger.log(`${user.name} left room ${data.roomId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to leave room';
      client.emit('error', { code: 'ROOM_LEAVE_ERROR', message });
    }
  }

  emitToRoom(roomId: string, event: string, data: unknown) {
    this.server.to(roomId).emit(event, data);
  }

  getSocketByUserId(userId: string): string | undefined {
    return this.userSockets.get(userId);
  }
}
