import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { User, RoomRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateRoomDto, JoinRoomDto, RoomResponseDto, RoomMemberResponseDto } from './dto';

@Controller('rooms')
@ApiTags('Rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: '새 방 생성' })
  @ApiResponse({ status: 201, description: '방 생성 성공', type: RoomResponseDto })
  create(
    @Body() dto: CreateRoomDto,
    @CurrentUser() user: User,
  ): Promise<RoomResponseDto> {
    return this.roomsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: '공개 방 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: '공개 방 목록' })
  async findPublicRooms(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const { rooms, total } = await this.roomsService.findPublicRooms(page, limit);
    return {
      data: rooms,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  @Get('my')
  @ApiOperation({ summary: '내가 참여한 방 목록 조회' })
  @ApiResponse({ status: 200, description: '참여 중인 방 목록' })
  findMyRooms(@CurrentUser() user: User): Promise<RoomResponseDto[]> {
    return this.roomsService.findMyRooms(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '방 상세 정보 조회' })
  @ApiParam({ name: 'id', description: '방 ID' })
  @ApiResponse({ status: 200, description: '방 정보', type: RoomResponseDto })
  @ApiResponse({ status: 404, description: '방을 찾을 수 없음' })
  findById(@Param('id') id: string): Promise<RoomResponseDto> {
    return this.roomsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '방 정보 수정 (호스트만)' })
  @ApiParam({ name: 'id', description: '방 ID' })
  @ApiResponse({ status: 200, description: '수정 성공', type: RoomResponseDto })
  @ApiResponse({ status: 403, description: '호스트만 수정 가능' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
    @CurrentUser() user: User,
  ): Promise<RoomResponseDto> {
    return this.roomsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '방 삭제 (호스트만)' })
  @ApiParam({ name: 'id', description: '방 ID' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 403, description: '호스트만 삭제 가능' })
  delete(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.roomsService.delete(id, user.id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: '방 참여' })
  @ApiParam({ name: 'id', description: '방 ID' })
  @ApiResponse({ status: 201, description: '참여 성공', type: RoomMemberResponseDto })
  @ApiResponse({ status: 403, description: '방이 가득 찼거나 비밀번호 틀림' })
  join(
    @Param('id') id: string,
    @Body() dto: JoinRoomDto,
    @CurrentUser() user: User,
  ): Promise<RoomMemberResponseDto> {
    return this.roomsService.joinRoom(id, user.id, dto.password);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: '방 나가기' })
  @ApiParam({ name: 'id', description: '방 ID' })
  @ApiResponse({ status: 200, description: '퇴장 성공' })
  leave(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.roomsService.leaveRoom(id, user.id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: '방 멤버 목록 조회' })
  @ApiParam({ name: 'id', description: '방 ID' })
  @ApiResponse({ status: 200, description: '멤버 목록' })
  getMembers(@Param('id') id: string): Promise<RoomMemberResponseDto[]> {
    return this.roomsService.getMembers(id);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: '멤버 역할 변경 (호스트만)' })
  @ApiParam({ name: 'id', description: '방 ID' })
  @ApiParam({ name: 'userId', description: '대상 사용자 ID' })
  @ApiResponse({ status: 200, description: '역할 변경 성공' })
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Body('role') role: RoomRole,
    @CurrentUser() user: User,
  ): Promise<RoomMemberResponseDto> {
    return this.roomsService.updateMemberRole(id, targetUserId, role, user.id);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: '멤버 강퇴 (호스트/모더레이터)' })
  @ApiParam({ name: 'id', description: '방 ID' })
  @ApiParam({ name: 'userId', description: '대상 사용자 ID' })
  @ApiResponse({ status: 200, description: '강퇴 성공' })
  kickMember(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.roomsService.kickMember(id, targetUserId, user.id);
  }
}
