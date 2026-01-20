import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { User, RoomRole } from '@prisma/client';
import { RoomsService } from './rooms.service';
import {
  CreateRoomDto,
  UpdateRoomDto,
  JoinRoomDto,
  RoomResponseDto,
  RoomMemberResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rooms')
@ApiTags('Rooms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: '새 방 생성' })
  @ApiResponse({
    status: 201,
    description: '방이 성공적으로 생성됨',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  async create(
    @Req() req: Request,
    @Body() createRoomDto: CreateRoomDto,
  ): Promise<RoomResponseDto> {
    const user = req.user as User;
    const room = await this.roomsService.create(user.id, createRoomDto);
    return this.roomsService.findOne(room.id, user.id);
  }

  @Get()
  @ApiOperation({ summary: '공개 방 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '공개 방 목록',
    type: [RoomResponseDto],
  })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  async findAll(@Req() req: Request): Promise<RoomResponseDto[]> {
    const user = req.user as User;
    return this.roomsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 방 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '방 정보',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 404, description: '방을 찾을 수 없음' })
  async findOne(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<RoomResponseDto> {
    const user = req.user as User;
    return this.roomsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '방 정보 수정 (방장/모더레이터만 가능)' })
  @ApiResponse({
    status: 200,
    description: '방 정보가 수정됨',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '방을 찾을 수 없음' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ): Promise<RoomResponseDto> {
    const user = req.user as User;
    const room = await this.roomsService.update(id, user.id, updateRoomDto);
    return this.roomsService.findOne(room.id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '방 삭제 (방장만 가능)' })
  @ApiResponse({ status: 200, description: '방이 삭제됨' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '방을 찾을 수 없음' })
  async remove(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const user = req.user as User;
    await this.roomsService.remove(id, user.id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: '방 참가' })
  @ApiResponse({
    status: 201,
    description: '방에 참가함',
    type: RoomMemberResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음 또는 방이 가득 찼음' })
  @ApiResponse({ status: 404, description: '방을 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 참가한 방' })
  async join(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() joinRoomDto: JoinRoomDto,
  ): Promise<RoomMemberResponseDto> {
    const user = req.user as User;
    const member = await this.roomsService.join(id, user.id, joinRoomDto);
    return {
      id: member.id,
      user: {
        id: member.user.id,
        email: member.user.email,
        name: member.user.name,
        profileImage: member.user.profileImage,
        createdAt: member.user.createdAt,
      },
      role: member.role,
      joinedAt: member.joinedAt,
    };
  }

  @Post(':id/leave')
  @ApiOperation({ summary: '방 나가기' })
  @ApiResponse({ status: 200, description: '방에서 나감' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 404, description: '방을 찾을 수 없음 또는 참가하지 않은 방' })
  async leave(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const user = req.user as User;
    await this.roomsService.leave(id, user.id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: '방 참가자 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '참가자 목록',
    type: [RoomMemberResponseDto],
  })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 404, description: '방을 찾을 수 없음' })
  async getMembers(@Param('id') id: string): Promise<RoomMemberResponseDto[]> {
    const members = await this.roomsService.getRoomMembers(id);
    return members.map((member) => ({
      id: member.id,
      user: {
        id: member.user.id,
        email: member.user.email,
        name: member.user.name,
        profileImage: member.user.profileImage,
        createdAt: member.user.createdAt,
      },
      role: member.role,
      joinedAt: member.joinedAt,
    }));
  }

  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: '멤버 역할 변경 (방장만 가능)' })
  @ApiResponse({
    status: 200,
    description: '역할이 변경됨',
    type: RoomMemberResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '방 또는 멤버를 찾을 수 없음' })
  async updateMemberRole(
    @Req() req: Request,
    @Param('id') roomId: string,
    @Param('userId') userId: string,
    @Body('role') role: RoomRole,
  ): Promise<RoomMemberResponseDto> {
    const user = req.user as User;
    const member = await this.roomsService.updateMemberRole(
      roomId,
      userId,
      role,
      user.id,
    );
    return {
      id: member.id,
      user: {
        id: member.user.id,
        email: member.user.email,
        name: member.user.name,
        profileImage: member.user.profileImage,
        createdAt: member.user.createdAt,
      },
      role: member.role,
      joinedAt: member.joinedAt,
    };
  }
}
