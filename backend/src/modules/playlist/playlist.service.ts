import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { RoomRole } from '@prisma/client';
import { PrismaService } from '../../database';
import { AddVideoDto } from './dto/add-video.dto';
import { ReorderItemDto } from './dto/reorder-playlist.dto';
import { PlaylistItemResponseDto } from './dto/playlist-item-response.dto';

@Injectable()
export class PlaylistService {
  private readonly logger = new Logger(PlaylistService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPlaylist(roomId: string): Promise<PlaylistItemResponseDto[]> {
    const items = await this.prisma.playlistItem.findMany({
      where: { roomId },
      include: { addedBy: true },
      orderBy: { position: 'asc' },
    });

    return items.map((item) => this.toPlaylistItemResponse(item));
  }

  async addVideo(
    roomId: string,
    userId: string,
    dto: AddVideoDto,
  ): Promise<PlaylistItemResponseDto> {
    // 현재 최대 position 조회
    const maxItem = await this.prisma.playlistItem.findFirst({
      where: { roomId },
      orderBy: { position: 'desc' },
    });
    const nextPosition = maxItem ? maxItem.position + 1 : 0;

    const item = await this.prisma.playlistItem.create({
      data: {
        roomId,
        addedById: userId,
        videoId: dto.videoId,
        title: dto.title,
        thumbnail: dto.thumbnail,
        duration: dto.duration,
        position: nextPosition,
      },
      include: { addedBy: true },
    });

    return this.toPlaylistItemResponse(item);
  }

  async removeVideo(
    roomId: string,
    itemId: string,
    userId: string,
    role: RoomRole,
  ): Promise<void> {
    const item = await this.prisma.playlistItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.roomId !== roomId) {
      throw new NotFoundException('Playlist item not found');
    }

    if (role !== RoomRole.HOST) {
      throw new ForbiddenException('Only the host can remove playlist items');
    }

    await this.prisma.playlistItem.delete({ where: { id: itemId } });

    // 삭제 후 position 재정렬
    await this.reindexPositions(roomId);
  }

  async reorderPlaylist(
    roomId: string,
    items: ReorderItemDto[],
    role: RoomRole,
  ): Promise<PlaylistItemResponseDto[]> {
    if (role !== RoomRole.HOST) {
      throw new ForbiddenException('Only the host can reorder the playlist');
    }

    // Validate all item IDs belong to this room
    const itemIds = items.map((item) => item.id);
    const existingItems = await this.prisma.playlistItem.findMany({
      where: { id: { in: itemIds }, roomId },
      select: { id: true },
    });

    if (existingItems.length !== itemIds.length) {
      throw new ForbiddenException(
        'Some playlist items do not belong to this room',
      );
    }

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.playlistItem.update({
          where: { id: item.id },
          data: { position: item.position },
        }),
      ),
    );

    return this.getPlaylist(roomId);
  }

  async getNextVideo(
    roomId: string,
    currentPosition: number,
  ): Promise<PlaylistItemResponseDto | null> {
    const next = await this.prisma.playlistItem.findFirst({
      where: { roomId, position: { gt: currentPosition } },
      include: { addedBy: true },
      orderBy: { position: 'asc' },
    });

    return next ? this.toPlaylistItemResponse(next) : null;
  }

  async getPreviousVideo(
    roomId: string,
    currentPosition: number,
  ): Promise<PlaylistItemResponseDto | null> {
    const prev = await this.prisma.playlistItem.findFirst({
      where: { roomId, position: { lt: currentPosition } },
      include: { addedBy: true },
      orderBy: { position: 'desc' },
    });

    return prev ? this.toPlaylistItemResponse(prev) : null;
  }

  private async reindexPositions(roomId: string): Promise<void> {
    const items = await this.prisma.playlistItem.findMany({
      where: { roomId },
      orderBy: { position: 'asc' },
    });

    await this.prisma.$transaction(
      items.map((item, index) =>
        this.prisma.playlistItem.update({
          where: { id: item.id },
          data: { position: index },
        }),
      ),
    );
  }

  private toPlaylistItemResponse(item: {
    id: string;
    videoId: string;
    title: string;
    thumbnail: string | null;
    duration: number;
    position: number;
    addedAt: Date;
    addedBy: { id: string; name: string | null };
  }): PlaylistItemResponseDto {
    return {
      id: item.id,
      videoId: item.videoId,
      title: item.title,
      thumbnail: item.thumbnail,
      duration: item.duration,
      position: item.position,
      addedBy: {
        id: item.addedBy.id,
        name: item.addedBy.name,
      },
      addedAt: item.addedAt,
    };
  }
}
