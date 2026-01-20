import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { RoomsService } from '../rooms/rooms.service';
import { AddVideoDto, PlaylistItemResponseDto } from './dto';
import { UserResponseDto } from '../users/dto';

type PlaylistItemWithUser = Prisma.PlaylistItemGetPayload<{
  include: { addedBy: true };
}>;

@Injectable()
export class PlaylistService {
  private readonly logger = new Logger(PlaylistService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly roomsService: RoomsService,
  ) {}

  async getPlaylist(
    roomId: string,
    userId: string,
  ): Promise<PlaylistItemResponseDto[]> {
    const isMember = await this.roomsService.isMember(roomId, userId);

    if (!isMember) {
      throw new ForbiddenException(
        'You must be a member of the room to view the playlist',
      );
    }

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    const playlistItems = await this.prisma.playlistItem.findMany({
      where: { roomId },
      include: {
        addedBy: true,
      },
      orderBy: {
        position: 'asc',
      },
    });

    return playlistItems.map((item) => this.toPlaylistItemResponse(item));
  }

  async addVideo(
    roomId: string,
    userId: string,
    addVideoDto: AddVideoDto,
  ): Promise<PlaylistItemWithUser> {
    const isMember = await this.roomsService.isMember(roomId, userId);

    if (!isMember) {
      throw new ForbiddenException(
        'You must be a member of the room to add videos',
      );
    }

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    const maxPosition = await this.prisma.playlistItem.findFirst({
      where: { roomId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const newPosition = maxPosition ? maxPosition.position + 1 : 0;

    const playlistItem = await this.prisma.playlistItem.create({
      data: {
        roomId,
        addedById: userId,
        videoId: addVideoDto.videoId,
        title: addVideoDto.title,
        thumbnail: addVideoDto.thumbnail,
        duration: addVideoDto.duration,
        position: newPosition,
      },
      include: {
        addedBy: true,
      },
    });

    this.logger.log(
      `Video ${addVideoDto.videoId} added to room ${roomId} by user ${userId}`,
    );

    return playlistItem;
  }

  async removeVideo(
    roomId: string,
    itemId: string,
    userId: string,
  ): Promise<void> {
    const isMember = await this.roomsService.isMember(roomId, userId);

    if (!isMember) {
      throw new ForbiddenException(
        'You must be a member of the room to remove videos',
      );
    }

    const item = await this.prisma.playlistItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException(`Playlist item with ID ${itemId} not found`);
    }

    if (item.roomId !== roomId) {
      throw new BadRequestException(
        'Playlist item does not belong to this room',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.playlistItem.delete({
        where: { id: itemId },
      });

      await tx.playlistItem.updateMany({
        where: {
          roomId,
          position: { gt: item.position },
        },
        data: {
          position: { decrement: 1 },
        },
      });
    });

    this.logger.log(
      `Video ${item.videoId} removed from room ${roomId} by user ${userId}`,
    );
  }

  async reorderPlaylist(
    roomId: string,
    itemId: string,
    newPosition: number,
    userId: string,
  ): Promise<PlaylistItemWithUser> {
    const isMember = await this.roomsService.isMember(roomId, userId);

    if (!isMember) {
      throw new ForbiddenException(
        'You must be a member of the room to reorder the playlist',
      );
    }

    const item = await this.prisma.playlistItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException(`Playlist item with ID ${itemId} not found`);
    }

    if (item.roomId !== roomId) {
      throw new BadRequestException(
        'Playlist item does not belong to this room',
      );
    }

    const playlistCount = await this.prisma.playlistItem.count({
      where: { roomId },
    });

    if (newPosition < 0 || newPosition >= playlistCount) {
      throw new BadRequestException(
        `Invalid position. Must be between 0 and ${playlistCount - 1}`,
      );
    }

    if (item.position === newPosition) {
      return this.prisma.playlistItem.findUniqueOrThrow({
        where: { id: itemId },
        include: { addedBy: true },
      });
    }

    const updatedItem = await this.prisma.$transaction(async (tx) => {
      const oldPosition = item.position;

      if (newPosition > oldPosition) {
        await tx.playlistItem.updateMany({
          where: {
            roomId,
            position: {
              gt: oldPosition,
              lte: newPosition,
            },
          },
          data: {
            position: { decrement: 1 },
          },
        });
      } else {
        await tx.playlistItem.updateMany({
          where: {
            roomId,
            position: {
              gte: newPosition,
              lt: oldPosition,
            },
          },
          data: {
            position: { increment: 1 },
          },
        });
      }

      return tx.playlistItem.update({
        where: { id: itemId },
        data: { position: newPosition },
        include: { addedBy: true },
      });
    });

    this.logger.log(
      `Playlist item ${itemId} reordered from position ${item.position} to ${newPosition} in room ${roomId}`,
    );

    return updatedItem;
  }

  async getNextVideo(
    roomId: string,
    currentPosition: number,
    userId: string,
  ): Promise<PlaylistItemResponseDto | null> {
    const isMember = await this.roomsService.isMember(roomId, userId);

    if (!isMember) {
      throw new ForbiddenException(
        'You must be a member of the room to access the playlist',
      );
    }

    const nextItem = await this.prisma.playlistItem.findFirst({
      where: {
        roomId,
        position: { gt: currentPosition },
      },
      include: {
        addedBy: true,
      },
      orderBy: {
        position: 'asc',
      },
    });

    return nextItem ? this.toPlaylistItemResponse(nextItem) : null;
  }

  async getPreviousVideo(
    roomId: string,
    currentPosition: number,
    userId: string,
  ): Promise<PlaylistItemResponseDto | null> {
    const isMember = await this.roomsService.isMember(roomId, userId);

    if (!isMember) {
      throw new ForbiddenException(
        'You must be a member of the room to access the playlist',
      );
    }

    const previousItem = await this.prisma.playlistItem.findFirst({
      where: {
        roomId,
        position: { lt: currentPosition },
      },
      include: {
        addedBy: true,
      },
      orderBy: {
        position: 'desc',
      },
    });

    return previousItem ? this.toPlaylistItemResponse(previousItem) : null;
  }

  async getCurrentVideo(
    roomId: string,
    userId: string,
  ): Promise<PlaylistItemResponseDto | null> {
    const isMember = await this.roomsService.isMember(roomId, userId);

    if (!isMember) {
      throw new ForbiddenException(
        'You must be a member of the room to access the playlist',
      );
    }

    const firstItem = await this.prisma.playlistItem.findFirst({
      where: { roomId },
      include: {
        addedBy: true,
      },
      orderBy: {
        position: 'asc',
      },
    });

    return firstItem ? this.toPlaylistItemResponse(firstItem) : null;
  }

  toPlaylistItemResponse(
    item: PlaylistItemWithUser,
  ): PlaylistItemResponseDto {
    return {
      id: item.id,
      roomId: item.roomId,
      addedBy: this.toUserResponse(item.addedBy),
      videoId: item.videoId,
      title: item.title,
      thumbnail: item.thumbnail,
      duration: item.duration,
      position: item.position,
      addedAt: item.addedAt,
    };
  }

  private toUserResponse(user: {
    id: string;
    email: string;
    name: string | null;
    profileImage: string | null;
    createdAt: Date;
  }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    };
  }
}
