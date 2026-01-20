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
import { PlaylistService } from './playlist.service';
import { AddVideoDto, ReorderPlaylistDto } from './dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  namespace: 'playlist',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class PlaylistGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PlaylistGateway.name);

  constructor(
    private readonly playlistService: PlaylistService,
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

      this.logger.log(
        `Client ${client.id} connected to playlist as user ${client.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}`,
        error,
      );
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client ${client.id} disconnected from playlist`);
  }

  @SubscribeMessage('join_playlist')
  async handleJoinPlaylist(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      await client.join(`playlist:${data.roomId}`);

      this.logger.log(
        `User ${client.userId} joined playlist room ${data.roomId}`,
      );

      return {
        success: true,
        roomId: data.roomId,
      };
    } catch (error) {
      this.logger.error(
        `Error joining playlist room ${data.roomId} for user ${client.userId}`,
        error,
      );
      return {
        error:
          error instanceof Error ? error.message : 'Failed to join playlist',
      };
    }
  }

  @SubscribeMessage('leave_playlist')
  async handleLeavePlaylist(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      await client.leave(`playlist:${data.roomId}`);

      this.logger.log(
        `User ${client.userId} left playlist room ${data.roomId}`,
      );

      return {
        success: true,
        roomId: data.roomId,
      };
    } catch (error) {
      this.logger.error(
        `Error leaving playlist room ${data.roomId} for user ${client.userId}`,
        error,
      );
      return {
        error:
          error instanceof Error ? error.message : 'Failed to leave playlist',
      };
    }
  }

  @SubscribeMessage('add_video')
  async handleAddVideo(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: AddVideoDto & { roomId: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      const playlistItem = await this.playlistService.addVideo(
        data.roomId,
        client.userId,
        {
          videoId: data.videoId,
          title: data.title,
          thumbnail: data.thumbnail,
          duration: data.duration,
        },
      );

      const response =
        this.playlistService.toPlaylistItemResponse(playlistItem);

      this.server
        .to(`playlist:${data.roomId}`)
        .emit('playlist_updated', { type: 'added', item: response });

      this.logger.log(
        `Video ${data.videoId} added to playlist in room ${data.roomId} by user ${client.userId}`,
      );

      return {
        success: true,
        item: response,
      };
    } catch (error) {
      this.logger.error(
        `Error adding video to playlist in room ${data.roomId}`,
        error,
      );
      return {
        error: error instanceof Error ? error.message : 'Failed to add video',
      };
    }
  }

  @SubscribeMessage('remove_video')
  async handleRemoveVideo(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; itemId: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      await this.playlistService.removeVideo(
        data.roomId,
        data.itemId,
        client.userId,
      );

      this.server
        .to(`playlist:${data.roomId}`)
        .emit('playlist_updated', { type: 'removed', itemId: data.itemId });

      this.logger.log(
        `Video ${data.itemId} removed from playlist in room ${data.roomId} by user ${client.userId}`,
      );

      return {
        success: true,
        itemId: data.itemId,
      };
    } catch (error) {
      this.logger.error(
        `Error removing video from playlist in room ${data.roomId}`,
        error,
      );
      return {
        error:
          error instanceof Error ? error.message : 'Failed to remove video',
      };
    }
  }

  @SubscribeMessage('reorder_playlist')
  async handleReorderPlaylist(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: ReorderPlaylistDto & { roomId: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      const updatedItem = await this.playlistService.reorderPlaylist(
        data.roomId,
        data.itemId,
        data.newPosition,
        client.userId,
      );

      const response =
        this.playlistService.toPlaylistItemResponse(updatedItem);

      this.server.to(`playlist:${data.roomId}`).emit('playlist_updated', {
        type: 'reordered',
        item: response,
      });

      this.logger.log(
        `Playlist reordered in room ${data.roomId} by user ${client.userId}`,
      );

      return {
        success: true,
        item: response,
      };
    } catch (error) {
      this.logger.error(
        `Error reordering playlist in room ${data.roomId}`,
        error,
      );
      return {
        error:
          error instanceof Error ? error.message : 'Failed to reorder playlist',
      };
    }
  }

  @SubscribeMessage('play_next')
  async handlePlayNext(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; currentPosition: number },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      const nextVideo = await this.playlistService.getNextVideo(
        data.roomId,
        data.currentPosition,
        client.userId,
      );

      if (!nextVideo) {
        return {
          success: true,
          hasNext: false,
        };
      }

      this.server.to(`playlist:${data.roomId}`).emit('video_changed', {
        type: 'next',
        video: nextVideo,
      });

      this.logger.log(
        `Next video requested in room ${data.roomId} by user ${client.userId}`,
      );

      return {
        success: true,
        hasNext: true,
        video: nextVideo,
      };
    } catch (error) {
      this.logger.error(
        `Error getting next video in room ${data.roomId}`,
        error,
      );
      return {
        error:
          error instanceof Error ? error.message : 'Failed to get next video',
      };
    }
  }

  @SubscribeMessage('play_previous')
  async handlePlayPrevious(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; currentPosition: number },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      const previousVideo = await this.playlistService.getPreviousVideo(
        data.roomId,
        data.currentPosition,
        client.userId,
      );

      if (!previousVideo) {
        return {
          success: true,
          hasPrevious: false,
        };
      }

      this.server.to(`playlist:${data.roomId}`).emit('video_changed', {
        type: 'previous',
        video: previousVideo,
      });

      this.logger.log(
        `Previous video requested in room ${data.roomId} by user ${client.userId}`,
      );

      return {
        success: true,
        hasPrevious: true,
        video: previousVideo,
      };
    } catch (error) {
      this.logger.error(
        `Error getting previous video in room ${data.roomId}`,
        error,
      );
      return {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get previous video',
      };
    }
  }

  @SubscribeMessage('get_playlist')
  async handleGetPlaylist(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' };
      }

      const playlist = await this.playlistService.getPlaylist(
        data.roomId,
        client.userId,
      );

      this.logger.log(
        `Playlist retrieved for room ${data.roomId} by user ${client.userId}`,
      );

      return {
        success: true,
        playlist,
      };
    } catch (error) {
      this.logger.error(
        `Error getting playlist for room ${data.roomId}`,
        error,
      );
      return {
        error:
          error instanceof Error ? error.message : 'Failed to get playlist',
      };
    }
  }
}
