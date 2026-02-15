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
import { PlaylistService } from './playlist.service';
import { VideoSyncService } from '../video-sync/video-sync.service';
import { WsJwtAuthGuard } from '../../common/guards/ws-jwt-auth.guard';
import { WsCurrentUser } from '../../common/decorators/ws-current-user.decorator';
import { extractTokenFromSocket } from '../../common/utils/ws.utils';
import { WsLoggingInterceptor } from '../../common/interceptors/ws-logging.interceptor';

@UseInterceptors(WsLoggingInterceptor)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@WebSocketGateway({
  namespace: '/playlist',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
})
export class PlaylistGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PlaylistGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly roomsService: RoomsService,
    private readonly playlistService: PlaylistService,
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

  @SubscribeMessage('join_playlist_room')
  @UseGuards(WsJwtAuthGuard)
  async handleJoinPlaylistRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
    @WsCurrentUser() user: User,
  ) {
    const isMember = await this.roomsService.isMember(data.roomId, user.id);
    if (!isMember) {
      client.emit('error', {
        code: 'PLAYLIST_ERROR',
        message: 'Not a room member',
      });
      return;
    }
    client.join(data.roomId);
  }

  @SubscribeMessage('add_video')
  @UseGuards(WsJwtAuthGuard)
  async handleAddVideo(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomId: string;
      videoId: string;
      title: string;
      thumbnail?: string;
      duration: number;
    },
    @WsCurrentUser() user: User,
  ) {
    try {
      const isMember = await this.roomsService.isMember(data.roomId, user.id);
      if (!isMember) {
        client.emit('error', {
          code: 'PLAYLIST_ERROR',
          message: 'Not a room member',
        });
        return;
      }

      const item = await this.playlistService.addVideo(data.roomId, user.id, {
        videoId: data.videoId,
        title: data.title,
        thumbnail: data.thumbnail,
        duration: data.duration,
      });

      this.server.to(data.roomId).emit('video_added', { item });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to add video';
      client.emit('error', { code: 'PLAYLIST_ERROR', message });
    }
  }

  @SubscribeMessage('remove_video')
  @UseGuards(WsJwtAuthGuard)
  async handleRemoveVideo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; itemId: string },
    @WsCurrentUser() user: User,
  ) {
    try {
      const role = await this.roomsService.getMemberRole(data.roomId, user.id);
      if (!role) {
        client.emit('error', {
          code: 'PLAYLIST_ERROR',
          message: 'Not a room member',
        });
        return;
      }

      await this.playlistService.removeVideo(
        data.roomId,
        data.itemId,
        user.id,
        role,
      );
      this.server
        .to(data.roomId)
        .emit('video_removed', { itemId: data.itemId });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to remove video';
      client.emit('error', { code: 'PLAYLIST_ERROR', message });
    }
  }

  @SubscribeMessage('reorder_playlist')
  @UseGuards(WsJwtAuthGuard)
  async handleReorderPlaylist(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { roomId: string; items: { id: string; position: number }[] },
    @WsCurrentUser() user: User,
  ) {
    try {
      const role = await this.roomsService.getMemberRole(data.roomId, user.id);
      if (!role) {
        client.emit('error', {
          code: 'PLAYLIST_ERROR',
          message: 'Not a room member',
        });
        return;
      }

      const playlist = await this.playlistService.reorderPlaylist(
        data.roomId,
        data.items,
        role,
      );
      this.server.to(data.roomId).emit('playlist_updated', { playlist });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to reorder playlist';
      client.emit('error', { code: 'PLAYLIST_ERROR', message });
    }
  }

  @SubscribeMessage('play_next')
  @UseGuards(WsJwtAuthGuard)
  async handlePlayNext(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
    @WsCurrentUser() user: User,
  ) {
    try {
      const role = await this.roomsService.getMemberRole(data.roomId, user.id);
      if (!role || role === RoomRole.MEMBER) {
        client.emit('error', {
          code: 'PLAYLIST_ERROR',
          message: 'Only hosts and moderators can change video',
        });
        return;
      }

      const currentState = await this.videoSyncService.getVideoState(
        data.roomId,
      );
      const currentPosition = currentState
        ? await this.findPositionByVideoId(data.roomId, currentState.videoId)
        : -1;

      const next = await this.playlistService.getNextVideo(
        data.roomId,
        currentPosition,
      );
      if (next) {
        const videoState = await this.videoSyncService.changeVideo(
          data.roomId,
          next.videoId,
          next.title,
          next.thumbnail ?? undefined,
        );
        this.server.to(data.roomId).emit('video_state_changed', { videoState });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to play next';
      client.emit('error', { code: 'PLAYLIST_ERROR', message });
    }
  }

  @SubscribeMessage('play_previous')
  @UseGuards(WsJwtAuthGuard)
  async handlePlayPrevious(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
    @WsCurrentUser() user: User,
  ) {
    try {
      const role = await this.roomsService.getMemberRole(data.roomId, user.id);
      if (!role || role === RoomRole.MEMBER) {
        client.emit('error', {
          code: 'PLAYLIST_ERROR',
          message: 'Only hosts and moderators can change video',
        });
        return;
      }

      const currentState = await this.videoSyncService.getVideoState(
        data.roomId,
      );
      const currentPosition = currentState
        ? await this.findPositionByVideoId(data.roomId, currentState.videoId)
        : 1;

      const prev = await this.playlistService.getPreviousVideo(
        data.roomId,
        currentPosition,
      );
      if (prev) {
        const videoState = await this.videoSyncService.changeVideo(
          data.roomId,
          prev.videoId,
          prev.title,
          prev.thumbnail ?? undefined,
        );
        this.server.to(data.roomId).emit('video_state_changed', { videoState });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to play previous';
      client.emit('error', { code: 'PLAYLIST_ERROR', message });
    }
  }

  private async findPositionByVideoId(
    roomId: string,
    videoId: string | null,
  ): Promise<number> {
    if (!videoId) return -1;
    const playlist = await this.playlistService.getPlaylist(roomId);
    const item = playlist.find((i) => i.videoId === videoId);
    return item?.position ?? -1;
  }
}
