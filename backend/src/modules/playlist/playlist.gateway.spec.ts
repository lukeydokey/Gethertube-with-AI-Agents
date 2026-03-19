import { PlaylistGateway } from './playlist.gateway';
import { RoomRole } from '@prisma/client';
import type { Socket } from 'socket.io';

function createGateway() {
  const roomsService = {
    getMemberRole: jest.fn(),
    isMember: jest.fn(),
  };
  const playlistService = {
    addVideo: jest.fn(),
    getNextVideo: jest.fn(),
    getPreviousVideo: jest.fn(),
    getPlaylist: jest.fn(),
    removeVideo: jest.fn(),
    reorderPlaylist: jest.fn(),
  };
  const videoSyncService = {
    getVideoState: jest.fn(),
    changeVideo: jest.fn(),
  };
  const gateway = new PlaylistGateway(
    {} as never,
    {} as never,
    roomsService as never,
    playlistService as never,
    videoSyncService as never,
  );
  const emitToRoom = jest.fn();
  gateway.server = {
    to: jest.fn().mockReturnValue({ emit: emitToRoom }),
  } as unknown as PlaylistGateway['server'];

  return { gateway, roomsService, playlistService, videoSyncService, emitToRoom };
}

function createClient(): Socket {
  return {
    emit: jest.fn(),
  } as unknown as Socket;
}

describe('PlaylistGateway', () => {
  it('auto-selects the first added video for the host without autoplay', async () => {
    const { gateway, roomsService, playlistService, videoSyncService, emitToRoom } = createGateway();
    const client = createClient();

    roomsService.getMemberRole.mockResolvedValue(RoomRole.HOST);
    playlistService.addVideo.mockResolvedValue({
      id: 'item-1',
      videoId: 'abc123',
      title: 'Test Video',
      thumbnail: 'thumb.jpg',
      duration: 10,
      position: 0,
      addedBy: { id: 'user-1', name: 'Host' },
      addedAt: new Date(),
    });
    videoSyncService.getVideoState.mockResolvedValue(null);
    videoSyncService.changeVideo.mockResolvedValue({ videoId: 'abc123', isPlaying: false });

    await gateway.handleAddVideo(
      client,
      { roomId: 'room-1', videoId: 'abc123', title: 'Test Video', thumbnail: 'thumb.jpg', duration: 10 },
      { id: 'user-1' } as never,
    );

    expect(videoSyncService.changeVideo).toHaveBeenCalledWith(
      'room-1',
      'abc123',
      'Test Video',
      'thumb.jpg',
      false,
    );
    expect(emitToRoom).toHaveBeenCalledWith('video_state_changed', {
      videoState: { videoId: 'abc123', isPlaying: false },
    });
  });

  it('does not auto-select the first video for non-host members', async () => {
    const { gateway, roomsService, playlistService, videoSyncService } = createGateway();
    const client = createClient();

    roomsService.getMemberRole.mockResolvedValue(RoomRole.MEMBER);
    playlistService.addVideo.mockResolvedValue({
      id: 'item-1',
      videoId: 'abc123',
      title: 'Test Video',
      thumbnail: null,
      duration: 10,
      position: 0,
      addedBy: { id: 'user-2', name: 'Member' },
      addedAt: new Date(),
    });
    videoSyncService.getVideoState.mockResolvedValue(null);

    await gateway.handleAddVideo(
      client,
      { roomId: 'room-1', videoId: 'abc123', title: 'Test Video', duration: 10 },
      { id: 'user-2' } as never,
    );

    expect(videoSyncService.changeVideo).not.toHaveBeenCalled();
  });

  it('rejects moderator playback control because playback is host-only', async () => {
    const { gateway, roomsService } = createGateway();
    const client = createClient();

    roomsService.getMemberRole.mockResolvedValue(RoomRole.MODERATOR);

    await gateway.handlePlayNext(client, { roomId: 'room-1' }, { id: 'mod-1' } as never);

    expect(client.emit).toHaveBeenCalledWith('error', {
      code: 'PLAYLIST_ERROR',
      message: 'Only the host can change video',
    });
  });
});
