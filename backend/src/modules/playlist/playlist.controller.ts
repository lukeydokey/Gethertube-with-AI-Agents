import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { User, RoomRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoomsService } from '../rooms/rooms.service';
import { PlaylistService } from './playlist.service';
import { AddVideoDto, ReorderPlaylistDto, PlaylistItemResponseDto } from './dto';

@Controller('rooms/:roomId/playlist')
@ApiTags('Playlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PlaylistController {
  constructor(
    private readonly playlistService: PlaylistService,
    private readonly roomsService: RoomsService,
  ) {}

  @Get()
  @ApiOperation({ summary: '플레이리스트 조회' })
  @ApiParam({ name: 'roomId', description: '방 ID' })
  @ApiResponse({ status: 200, description: '플레이리스트 항목 목록' })
  async getPlaylist(
    @Param('roomId') roomId: string,
    @CurrentUser() user: User,
  ): Promise<PlaylistItemResponseDto[]> {
    await this.ensureMember(roomId, user.id);
    return this.playlistService.getPlaylist(roomId);
  }

  @Post()
  @ApiOperation({ summary: '플레이리스트에 영상 추가' })
  @ApiParam({ name: 'roomId', description: '방 ID' })
  @ApiResponse({ status: 201, description: '영상 추가 성공' })
  async addVideo(
    @Param('roomId') roomId: string,
    @Body() dto: AddVideoDto,
    @CurrentUser() user: User,
  ): Promise<PlaylistItemResponseDto> {
    await this.ensureMember(roomId, user.id);
    return this.playlistService.addVideo(roomId, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '플레이리스트에서 영상 제거' })
  @ApiParam({ name: 'roomId', description: '방 ID' })
  @ApiParam({ name: 'id', description: '플레이리스트 항목 ID' })
  @ApiResponse({ status: 200, description: '영상 제거 성공' })
  async removeVideo(
    @Param('roomId') roomId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    const role = await this.ensureMember(roomId, user.id);
    return this.playlistService.removeVideo(roomId, id, user.id, role);
  }

  @Patch('reorder')
  @ApiOperation({ summary: '플레이리스트 순서 변경 (호스트/모더레이터)' })
  @ApiParam({ name: 'roomId', description: '방 ID' })
  @ApiResponse({ status: 200, description: '순서 변경 성공' })
  async reorderPlaylist(
    @Param('roomId') roomId: string,
    @Body() dto: ReorderPlaylistDto,
    @CurrentUser() user: User,
  ): Promise<PlaylistItemResponseDto[]> {
    const role = await this.ensureMember(roomId, user.id);
    return this.playlistService.reorderPlaylist(roomId, dto.items, role);
  }

  private async ensureMember(roomId: string, userId: string): Promise<RoomRole> {
    const role = await this.roomsService.getMemberRole(roomId, userId);
    if (!role) {
      throw new ForbiddenException('Not a member of this room');
    }
    return role;
  }
}
