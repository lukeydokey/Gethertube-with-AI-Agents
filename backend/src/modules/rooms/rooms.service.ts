import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Room, RoomMember, RoomRole, User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/database/prisma.service';
import {
  CreateRoomDto,
  UpdateRoomDto,
  JoinRoomDto,
  RoomResponseDto,
  RoomMemberResponseDto,
} from './dto';
import { UserResponseDto } from '../users/dto';
import { VideoSyncService } from '../video-sync/video-sync.service';

type RoomMemberWithUser = Prisma.RoomMemberGetPayload<{
  include: { user: true };
}>;

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly videoSyncService: VideoSyncService,
  ) {}

  async create(userId: string, createRoomDto: CreateRoomDto): Promise<Room> {
    const { password, ...roomData } = createRoomDto;

    if (createRoomDto.isPublic === false && !password) {
      throw new BadRequestException(
        'Password is required for private rooms',
      );
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          ...roomData,
          password: hashedPassword,
          hostId: userId,
        },
      });

      await tx.roomMember.create({
        data: {
          roomId: room.id,
          userId,
          role: RoomRole.HOST,
        },
      });

      await this.videoSyncService.createVideoState(room.id);

      return room;
    });
  }

  async findAll(_userId?: string): Promise<RoomResponseDto[]> {
    const rooms = await this.prisma.room.findMany({
      where: {
        isPublic: true,
      },
      include: {
        host: true,
        members: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return rooms.map((room) => this.toRoomResponse(room, false));
  }

  async findOne(roomId: string, userId?: string): Promise<RoomResponseDto> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        host: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    const includeMembers = userId
      ? room.members.some((m) => m.userId === userId)
      : false;

    return this.toRoomResponse(room, includeMembers);
  }

  async update(
    roomId: string,
    userId: string,
    updateRoomDto: UpdateRoomDto,
  ): Promise<Room> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: true,
      },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    const member = room.members.find((m) => m.userId === userId);
    if (!member || (member.role !== RoomRole.HOST && member.role !== RoomRole.MODERATOR)) {
      throw new ForbiddenException('Only host or moderators can update the room');
    }

    const { password, ...updateData } = updateRoomDto;

    if (updateRoomDto.isPublic === false && !password && !room.password) {
      throw new BadRequestException(
        'Password is required when changing to private room',
      );
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        ...updateData,
        ...(hashedPassword && { password: hashedPassword }),
      },
    });
  }

  async remove(roomId: string, userId: string): Promise<void> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    if (room.hostId !== userId) {
      throw new ForbiddenException('Only the host can delete the room');
    }

    await this.prisma.room.delete({
      where: { id: roomId },
    });

    this.logger.log(`Room ${roomId} deleted by user ${userId}`);
  }

  async join(
    roomId: string,
    userId: string,
    joinRoomDto: JoinRoomDto,
  ): Promise<RoomMemberWithUser> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: true,
      },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    const existingMember = room.members.find((m) => m.userId === userId);
    if (existingMember) {
      throw new ConflictException('Already a member of this room');
    }

    if (room.members.length >= room.maxMembers) {
      throw new ForbiddenException('Room is full');
    }

    if (!room.isPublic) {
      if (!joinRoomDto.password) {
        throw new BadRequestException('Password is required for private rooms');
      }

      const isPasswordValid = await bcrypt.compare(
        joinRoomDto.password,
        room.password || '',
      );

      if (!isPasswordValid) {
        throw new ForbiddenException('Invalid password');
      }
    }

    const member = await this.prisma.roomMember.create({
      data: {
        roomId,
        userId,
        role: RoomRole.MEMBER,
      },
      include: {
        user: true,
      },
    });

    this.logger.log(`User ${userId} joined room ${roomId}`);

    return member;
  }

  async leave(roomId: string, userId: string): Promise<void> {
    const member = await this.prisma.roomMember.findFirst({
      where: {
        roomId,
        userId,
      },
      include: {
        room: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Not a member of this room');
    }

    if (member.role === RoomRole.HOST) {
      const otherMembers = await this.prisma.roomMember.findMany({
        where: {
          roomId,
          userId: { not: userId },
        },
        orderBy: {
          joinedAt: 'asc',
        },
      });

      if (otherMembers.length > 0) {
        await this.prisma.$transaction([
          this.prisma.roomMember.update({
            where: { id: otherMembers[0].id },
            data: { role: RoomRole.HOST },
          }),
          this.prisma.room.update({
            where: { id: roomId },
            data: { hostId: otherMembers[0].userId },
          }),
          this.prisma.roomMember.delete({
            where: { id: member.id },
          }),
        ]);

        this.logger.log(
          `Host ${userId} left room ${roomId}, transferred to ${otherMembers[0].userId}`,
        );
      } else {
        await this.prisma.room.delete({
          where: { id: roomId },
        });

        this.logger.log(`Last member left, room ${roomId} deleted`);
      }
    } else {
      await this.prisma.roomMember.delete({
        where: { id: member.id },
      });

      this.logger.log(`User ${userId} left room ${roomId}`);
    }
  }

  async updateMemberRole(
    roomId: string,
    targetUserId: string,
    newRole: RoomRole,
    requestUserId: string,
  ): Promise<RoomMemberWithUser> {
    const [requesterMember, targetMember] = await Promise.all([
      this.prisma.roomMember.findFirst({
        where: { roomId, userId: requestUserId },
      }),
      this.prisma.roomMember.findFirst({
        where: { roomId, userId: targetUserId },
      }),
    ]);

    if (!requesterMember || requesterMember.role !== RoomRole.HOST) {
      throw new ForbiddenException('Only the host can change member roles');
    }

    if (!targetMember) {
      throw new NotFoundException('Target user is not a member of this room');
    }

    if (newRole === RoomRole.HOST) {
      throw new BadRequestException('Cannot assign HOST role to another member');
    }

    return this.prisma.roomMember.update({
      where: { id: targetMember.id },
      data: { role: newRole },
      include: {
        user: true,
      },
    });
  }

  async getRoomMembers(roomId: string): Promise<RoomMemberWithUser[]> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    return this.prisma.roomMember.findMany({
      where: { roomId },
      include: {
        user: true,
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
  }

  async isMember(roomId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.roomMember.findFirst({
      where: {
        roomId,
        userId,
      },
    });

    return !!member;
  }

  private toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    };
  }

  private toMemberResponse(
    member: RoomMember & { user: User },
  ): RoomMemberResponseDto {
    return {
      id: member.id,
      user: this.toUserResponse(member.user),
      role: member.role,
      joinedAt: member.joinedAt,
    };
  }

  private toRoomResponse(
    room: Room & { host: User; members: (RoomMember & { user: User })[] },
    includeMembers: boolean,
  ): RoomResponseDto {
    return {
      id: room.id,
      name: room.name,
      description: room.description,
      isPublic: room.isPublic,
      hasPassword: !!room.password,
      maxMembers: room.maxMembers,
      currentMembers: room.members.length,
      host: this.toUserResponse(room.host),
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      ...(includeMembers && {
        members: room.members.map((m) => this.toMemberResponse(m)),
      }),
    };
  }
}
