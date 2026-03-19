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
import { User, RoomRole } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { RoomsService } from '../rooms/rooms.service';
import { VideoSyncService } from './video-sync.service';
import { WsJwtAuthGuard } from '../../common/guards/ws-jwt-auth.guard';
import { WsCurrentUser } from '../../common/decorators/ws-current-user.decorator';
import { extractTokenFromSocket } from '../../common/utils/ws.utils';
import { WsLoggingInterceptor } from '../../common/interceptors/ws-logging.interceptor';

@UseInterceptors(WsLoggingInterceptor)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@WebSocketGateway({
  namespace: '/video',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
})
export class VideoSyncGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VideoSyncGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly roomsService: RoomsService,
    private readonly videoSyncService: VideoSyncService,
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

  handleDisconnect() {
    // no-op
  }

  @SubscribeMessage('join_video_room')
  @UseGuards(WsJwtAuthGuard)
  async handleJoinVideoRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
    @WsCurrentUser() user: User,
  ) {
    const isMember = await this.roomsService.isMember(data.roomId, user.id);
    if (!isMember) {
      client.emit('error', {
        code: 'VIDEO_ERROR',
        message: 'Not a room member',
      });
      return;
    }
    client.join(data.roomId);

    const videoState = await this.videoSyncService.getVideoState(data.roomId);
    client.emit('sync_response', { videoState });
  }

  @SubscribeMessage('video_play')
  @UseGuards(WsJwtAuthGuard)
  async handleVideoPlay(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; currentTime: number },
    @WsCurrentUser() user: User,
  ) {
    if (!(await this.hasVideoControl(data.roomId, user.id, client))) return;

    const state = await this.videoSyncService.updatePlayState(
      data.roomId,
      true,
      data.currentTime,
    );
    this.server
      .to(data.roomId)
      .emit('video_state_changed', { videoState: state });
  }

  @SubscribeMessage('video_pause')
  @UseGuards(WsJwtAuthGuard)
  async handleVideoPause(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; currentTime: number },
    @WsCurrentUser() user: User,
  ) {
    if (!(await this.hasVideoControl(data.roomId, user.id, client))) return;

    const state = await this.videoSyncService.updatePlayState(
      data.roomId,
      false,
      data.currentTime,
    );
    this.server
      .to(data.roomId)
      .emit('video_state_changed', { videoState: state });
  }

  @SubscribeMessage('video_seek')
  @UseGuards(WsJwtAuthGuard)
  async handleVideoSeek(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; currentTime: number },
    @WsCurrentUser() user: User,
  ) {
    if (!(await this.hasVideoControl(data.roomId, user.id, client))) return;

    const state = await this.videoSyncService.updateSeek(
      data.roomId,
      data.currentTime,
    );
    this.server
      .to(data.roomId)
      .emit('video_state_changed', { videoState: state });
  }

  @SubscribeMessage('video_change')
  @UseGuards(WsJwtAuthGuard)
  async handleVideoChange(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomId: string;
      videoId: string;
      videoTitle?: string;
      videoThumbnail?: string;
      autoPlay?: boolean;
    },
    @WsCurrentUser() user: User,
  ) {
    if (!(await this.hasVideoControl(data.roomId, user.id, client))) return;

    const state = await this.videoSyncService.changeVideo(
        data.roomId,
        data.videoId,
        data.videoTitle,
        data.videoThumbnail,
        data.autoPlay,
      );
    this.server
      .to(data.roomId)
      .emit('video_state_changed', { videoState: state });
  }

  @SubscribeMessage('sync_request')
  @UseGuards(WsJwtAuthGuard)
  async handleSyncRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const state = await this.videoSyncService.getVideoState(data.roomId);
    client.emit('sync_response', { videoState: state });
  }

  @SubscribeMessage('playback_rate_change')
  @UseGuards(WsJwtAuthGuard)
  async handlePlaybackRateChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; rate: number },
    @WsCurrentUser() user: User,
  ) {
    if (!(await this.hasVideoControl(data.roomId, user.id, client))) return;

    const state = await this.videoSyncService.updatePlaybackRate(
      data.roomId,
      data.rate,
    );
    this.server
      .to(data.roomId)
      .emit('video_state_changed', { videoState: state });
  }

  // HOST만 비디오 제어 가능
  private async hasVideoControl(
    roomId: string,
    userId: string,
    client: Socket,
  ): Promise<boolean> {
    const role = await this.roomsService.getMemberRole(roomId, userId);
    if (!role) {
      client.emit('error', {
        code: 'VIDEO_ERROR',
        message: 'Not a room member',
      });
      return false;
    }
    if (role !== RoomRole.HOST) {
      client.emit('error', {
        code: 'VIDEO_ERROR',
        message: 'Only the host can control video',
      });
      return false;
    }
    return true;
  }
}
