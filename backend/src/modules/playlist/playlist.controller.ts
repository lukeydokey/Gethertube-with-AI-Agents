import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '@/modules/auth/guards';
import { PlaylistService } from './playlist.service';
import { AddVideoDto, ReorderPlaylistDto, PlaylistItemResponseDto } from './dto';

@ApiTags('Playlist')
@Controller('rooms/:roomId/playlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get()
  @ApiOperation({ summary: 'Get room playlist' })
  @ApiParam({
    name: 'roomId',
    description: 'Room ID',
    example: 'clyyy987654321',
  })
  @ApiResponse({
    status: 200,
    description: 'Playlist retrieved successfully',
    type: [PlaylistItemResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the room' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async getPlaylist(
    @Param('roomId') roomId: string,
    @Req() req: Request,
  ): Promise<PlaylistItemResponseDto[]> {
    const userId = (req.user as { id: string }).id;
    return this.playlistService.getPlaylist(roomId, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add video to playlist' })
  @ApiParam({
    name: 'roomId',
    description: 'Room ID',
    example: 'clyyy987654321',
  })
  @ApiResponse({
    status: 201,
    description: 'Video added successfully',
    type: PlaylistItemResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the room' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async addVideo(
    @Param('roomId') roomId: string,
    @Body() addVideoDto: AddVideoDto,
    @Req() req: Request,
  ): Promise<PlaylistItemResponseDto> {
    const userId = (req.user as { id: string }).id;
    const playlistItem = await this.playlistService.addVideo(
      roomId,
      userId,
      addVideoDto,
    );
    return this.playlistService.toPlaylistItemResponse(playlistItem);
  }

  @Delete(':itemId')
  @ApiOperation({ summary: 'Remove video from playlist' })
  @ApiParam({
    name: 'roomId',
    description: 'Room ID',
    example: 'clyyy987654321',
  })
  @ApiParam({
    name: 'itemId',
    description: 'Playlist item ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({ status: 200, description: 'Video removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the room' })
  @ApiResponse({ status: 404, description: 'Room or item not found' })
  async removeVideo(
    @Param('roomId') roomId: string,
    @Param('itemId') itemId: string,
    @Req() req: Request,
  ): Promise<{ success: boolean }> {
    const userId = (req.user as { id: string }).id;
    await this.playlistService.removeVideo(roomId, itemId, userId);
    return { success: true };
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorder playlist' })
  @ApiParam({
    name: 'roomId',
    description: 'Room ID',
    example: 'clyyy987654321',
  })
  @ApiResponse({
    status: 200,
    description: 'Playlist reordered successfully',
    type: PlaylistItemResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the room' })
  @ApiResponse({ status: 404, description: 'Room or item not found' })
  async reorderPlaylist(
    @Param('roomId') roomId: string,
    @Body() reorderDto: ReorderPlaylistDto,
    @Req() req: Request,
  ): Promise<PlaylistItemResponseDto> {
    const userId = (req.user as { id: string }).id;
    const updatedItem = await this.playlistService.reorderPlaylist(
      roomId,
      reorderDto.itemId,
      reorderDto.newPosition,
      userId,
    );
    return this.playlistService.toPlaylistItemResponse(updatedItem);
  }
}
