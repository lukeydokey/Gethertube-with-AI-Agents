import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Room, RoomMember, RoomRole, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import {
  RoomResponseDto,
  RoomMemberResponseDto,
} from './dto/room-response.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoomDto, userId: string): Promise<RoomResponseDto> {
    const hashedPassword = dto.password
      ? await bcrypt.hash(dto.password, BCRYPT_ROUNDS)
      : undefined;

    const room = await this.prisma.$transaction(async (tx) => {
      const created = await tx.room.create({
        data: {
          name: dto.name,
          description: dto.description,
          isPublic: dto.isPublic ?? true,
          password: hashedPassword,
          maxMembers: dto.maxMembers ?? 50,
          hostId: userId,
        },
        include: {
          host: true,
          _count: { select: { members: true } },
        },
      });

      // Host를 RoomMember로 자동 추가
      await tx.roomMember.create({
        data: {
          roomId: created.id,
          userId,
          role: RoomRole.HOST,
        },
      });

      // VideoState 초기화
      await tx.videoState.create({
        data: { roomId: created.id },
      });

      return created;
    });

    return this.toRoomResponse(room, 1);
  }

  async findPublicRooms(
    page = 1,
    limit = 20,
  ): Promise<{ rooms: RoomResponseDto[]; total: number }> {
    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      this.prisma.room.findMany({
        where: { isPublic: true },
        include: {
          host: true,
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.room.count({ where: { isPublic: true } }),
    ]);

    return {
      rooms: rooms.map((room) =>
        this.toRoomResponse(room, room._count.members),
      ),
      total,
    };
  }

  async findMyRooms(userId: string): Promise<RoomResponseDto[]> {
    const memberships = await this.prisma.roomMember.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            host: true,
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) =>
      this.toRoomResponse(m.room, m.room._count.members),
    );
  }

  async findById(roomId: string): Promise<RoomResponseDto> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        host: true,
        _count: { select: { members: true } },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return this.toRoomResponse(room, room._count.members);
  }

  async update(
    roomId: string,
    dto: UpdateRoomDto,
    userId: string,
  ): Promise<RoomResponseDto> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    if (room.hostId !== userId) {
      throw new ForbiddenException('Only the host can update the room');
    }

    const hashedPassword = dto.password
      ? await bcrypt.hash(dto.password, BCRYPT_ROUNDS)
      : undefined;

    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data: {
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic,
        password: hashedPassword,
        maxMembers: dto.maxMembers,
      },
      include: {
        host: true,
        _count: { select: { members: true } },
      },
    });

    return this.toRoomResponse(updated, updated._count.members);
  }

  async delete(roomId: string, userId: string): Promise<void> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    if (room.hostId !== userId) {
      throw new ForbiddenException('Only the host can delete the room');
    }

    await this.prisma.room.delete({ where: { id: roomId } });
  }

  async joinRoom(
    roomId: string,
    userId: string,
    password?: string,
  ): Promise<RoomMemberResponseDto> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { _count: { select: { members: true } } },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // 이미 멤버인지 확인
    const existingMember = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (existingMember) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      return this.toMemberResponse(existingMember, user!);
    }

    // 정원 확인
    if (room._count.members >= room.maxMembers) {
      throw new ForbiddenException('Room is full');
    }

    // 비공개 방 비밀번호 확인 (bcrypt)
    if (!room.isPublic && room.password) {
      if (!password) {
        throw new ForbiddenException('Invalid room password');
      }
      const isValid = await bcrypt.compare(password, room.password);
      if (!isValid) {
        throw new ForbiddenException('Invalid room password');
      }
    }

    const member = await this.prisma.roomMember.create({
      data: {
        roomId,
        userId,
        role: RoomRole.MEMBER,
      },
      include: { user: true },
    });

    return this.toMemberResponse(member, member.user);
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (!member) {
      throw new NotFoundException('Not a member of this room');
    }

    // Host가 나가면 다음 멤버에게 호스트 이전, 멤버 없으면 방 삭제
    if (member.role === RoomRole.HOST) {
      const nextHost = await this.prisma.roomMember.findFirst({
        where: { roomId, userId: { not: userId } },
        orderBy: { joinedAt: 'asc' },
      });

      if (!nextHost) {
        // 마지막 멤버 → 방 삭제
        await this.prisma.room.delete({ where: { id: roomId } });
        return;
      }

      // 호스트 이전
      await this.prisma.$transaction([
        this.prisma.roomMember.delete({
          where: { roomId_userId: { roomId, userId } },
        }),
        this.prisma.roomMember.update({
          where: { id: nextHost.id },
          data: { role: RoomRole.HOST },
        }),
        this.prisma.room.update({
          where: { id: roomId },
          data: { hostId: nextHost.userId },
        }),
      ]);
      return;
    }

    await this.prisma.roomMember.delete({
      where: { roomId_userId: { roomId, userId } },
    });
  }

  async getMembers(roomId: string): Promise<RoomMemberResponseDto[]> {
    const members = await this.prisma.roomMember.findMany({
      where: { roomId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((m) => this.toMemberResponse(m, m.user));
  }

  async updateMemberRole(
    roomId: string,
    targetUserId: string,
    role: RoomRole,
    requestingUserId: string,
  ): Promise<RoomMemberResponseDto> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    if (room.hostId !== requestingUserId) {
      throw new ForbiddenException('Only the host can change member roles');
    }
    if (targetUserId === requestingUserId) {
      throw new BadRequestException('Cannot change your own role');
    }

    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: targetUserId } },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const updated = await this.prisma.roomMember.update({
      where: { roomId_userId: { roomId, userId: targetUserId } },
      data: { role },
      include: { user: true },
    });

    return this.toMemberResponse(updated, updated.user);
  }

  async kickMember(
    roomId: string,
    targetUserId: string,
    requestingUserId: string,
  ): Promise<void> {
    const requestingMember = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: requestingUserId } },
    });
    if (!requestingMember) {
      throw new ForbiddenException('You are not a member of this room');
    }
    if (requestingMember.role === RoomRole.MEMBER) {
      throw new ForbiddenException(
        'Only hosts and moderators can kick members',
      );
    }
    if (targetUserId === requestingUserId) {
      throw new BadRequestException('Cannot kick yourself');
    }

    const targetMember = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: targetUserId } },
    });
    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }
    if (targetMember.role === RoomRole.HOST) {
      throw new ForbiddenException('Cannot kick the host');
    }

    await this.prisma.roomMember.delete({
      where: { roomId_userId: { roomId, userId: targetUserId } },
    });
  }

  async isMember(roomId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    return !!member;
  }

  async getMemberRole(
    roomId: string,
    userId: string,
  ): Promise<RoomRole | null> {
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    return member?.role ?? null;
  }

  private toRoomResponse(
    room: Room & { host: User; _count?: { members: number } },
    memberCount: number,
  ): RoomResponseDto {
    return {
      id: room.id,
      name: room.name,
      description: room.description,
      isPublic: room.isPublic,
      maxMembers: room.maxMembers,
      memberCount,
      host: {
        id: room.host.id,
        name: room.host.name,
        profileImage: room.host.profileImage,
      },
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  private toMemberResponse(
    member: RoomMember,
    user: User,
  ): RoomMemberResponseDto {
    return {
      id: member.id,
      userId: user.id,
      name: user.name,
      profileImage: user.profileImage,
      role: member.role,
      joinedAt: member.joinedAt,
    };
  }
}
