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
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { RoomsService } from './rooms.service';
import { PresenceService } from '../presence/presence.service';
import { PresenceStatus } from '../presence/dto';
import { WsJwtAuthGuard } from '../../common/guards/ws-jwt-auth.guard';
import { WsCurrentUser } from '../../common/decorators/ws-current-user.decorator';
import { extractTokenFromSocket } from '../../common/utils/ws.utils';
import { WsLoggingInterceptor } from '../../common/interceptors/ws-logging.interceptor';

@UseInterceptors(WsLoggingInterceptor)
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
    private readonly presenceService: PresenceService,
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

      // 모든 방에서 오프라인 처리
      const offlinePresences = this.presenceService.setOfflineAll(user.id);
      for (const presence of offlinePresences) {
        this.server.to(presence.roomId).emit('presence_updated', {
          userId: presence.userId,
          userName: presence.userName,
          profileImage: presence.profileImage,
          status: PresenceStatus.OFFLINE,
          roomId: presence.roomId,
        });
      }

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

      // 프레즌스 온라인 설정
      const presence = this.presenceService.setOnline(data.roomId, user);

      const [room, members] = await Promise.all([
        this.roomsService.findById(data.roomId),
        this.roomsService.getMembers(data.roomId),
      ]);

      client.emit('room_joined', { room, members });
      client.to(data.roomId).emit('member_joined', { member });

      // 프레즌스 업데이트 브로드캐스트
      this.server.to(data.roomId).emit('presence_updated', {
        userId: presence.userId,
        userName: presence.userName,
        profileImage: presence.profileImage,
        status: presence.status,
        roomId: presence.roomId,
      });

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
      const isMember = await this.roomsService.isMember(data.roomId, user.id);
      if (!isMember) {
        client.emit('error', {
          code: 'ROOM_LEAVE_ERROR',
          message: 'Not a room member',
        });
        return;
      }

      // 프레즌스 오프라인 설정
      const presence = this.presenceService.setOffline(data.roomId, user.id);

      client.leave(data.roomId);
      client.emit('room_left', { roomId: data.roomId });
      this.server.to(data.roomId).emit('member_left', { userId: user.id });

      // 프레즌스 업데이트 브로드캐스트
      if (presence) {
        this.server.to(data.roomId).emit('presence_updated', {
          userId: presence.userId,
          userName: presence.userName,
          profileImage: presence.profileImage,
          status: PresenceStatus.OFFLINE,
          roomId: presence.roomId,
        });
      }

      this.logger.log(`${user.name} left room ${data.roomId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to leave room';
      client.emit('error', { code: 'ROOM_LEAVE_ERROR', message });
    }
  }

  @SubscribeMessage('set_presence')
  @UseGuards(WsJwtAuthGuard)
  async handleSetPresence(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; status: 'online' | 'away' },
    @WsCurrentUser() user: User,
  ) {
    try {
      const isMember = await this.roomsService.isMember(data.roomId, user.id);
      if (!isMember) {
        client.emit('error', {
          code: 'PRESENCE_ERROR',
          message: 'Not a room member',
        });
        return;
      }

      let presence;
      if (data.status === 'online') {
        presence = this.presenceService.setOnline(data.roomId, user);
      } else {
        presence = this.presenceService.setAway(data.roomId, user.id);
      }

      if (presence) {
        this.server.to(data.roomId).emit('presence_updated', {
          userId: presence.userId,
          userName: presence.userName,
          profileImage: presence.profileImage,
          status: presence.status,
          roomId: presence.roomId,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to set presence';
      client.emit('error', { code: 'PRESENCE_ERROR', message });
    }
  }

  @SubscribeMessage('get_presence')
  @UseGuards(WsJwtAuthGuard)
  async handleGetPresence(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
    @WsCurrentUser() user: User,
  ) {
    try {
      const isMember = await this.roomsService.isMember(data.roomId, user.id);
      if (!isMember) {
        client.emit('error', {
          code: 'PRESENCE_ERROR',
          message: 'Not a room member',
        });
        return;
      }

      const presences = this.presenceService.getRoomPresence(data.roomId);
      client.emit('presence_list', { roomId: data.roomId, presences });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to get presence';
      client.emit('error', { code: 'PRESENCE_ERROR', message });
    }
  }

  emitToRoom(roomId: string, event: string, data: unknown) {
    this.server.to(roomId).emit(event, data);
  }

  getSocketByUserId(userId: string): string | undefined {
    return this.userSockets.get(userId);
  }
}
