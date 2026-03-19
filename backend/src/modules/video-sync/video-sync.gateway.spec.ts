import { VideoSyncGateway } from './video-sync.gateway';
import { RoomRole } from '@prisma/client';
import type { Socket } from 'socket.io';

function createGateway() {
  const roomsService = {
    isMember: jest.fn(),
    getMemberRole: jest.fn(),
  };
  const videoSyncService = {
    updatePlayState: jest.fn(),
    updateSeek: jest.fn(),
    changeVideo: jest.fn(),
    getVideoState: jest.fn(),
    updatePlaybackRate: jest.fn(),
  };
  const gateway = new VideoSyncGateway(
    {} as never,
    {} as never,
    roomsService as never,
    videoSyncService as never,
  );
  const emitToRoom = jest.fn();
  gateway.server = {
    to: jest.fn().mockReturnValue({ emit: emitToRoom }),
  } as unknown as VideoSyncGateway['server'];

  return { gateway, roomsService, videoSyncService, emitToRoom };
}

function createClient(): Socket {
  return {
    emit: jest.fn(),
  } as unknown as Socket;
}

describe('VideoSyncGateway', () => {
  it('sends the current video snapshot when a member joins the video room', async () => {
    const { gateway, roomsService, videoSyncService } = createGateway();
    const client = {
      emit: jest.fn(),
      join: jest.fn(),
    } as unknown as Socket;
    const videoState = { videoId: 'abc123', currentTime: 42, isPlaying: true };

    roomsService.isMember.mockResolvedValue(true);
    videoSyncService.getVideoState.mockResolvedValue(videoState);

    await gateway.handleJoinVideoRoom(
      client,
      { roomId: 'room-1' },
      { id: 'guest-1' } as never,
    );

    expect(client.join).toHaveBeenCalledWith('room-1');
    expect(client.emit).toHaveBeenCalledWith('sync_response', { videoState });
  });

  it('rejects moderator direct video changes because playback is host-only', async () => {
    const { gateway, roomsService, videoSyncService } = createGateway();
    const client = createClient();

    roomsService.getMemberRole.mockResolvedValue(RoomRole.MODERATOR);

    await gateway.handleVideoChange(
      client,
      { roomId: 'room-1', videoId: 'abc123', autoPlay: true },
      { id: 'mod-1' } as never,
    );

    expect(client.emit).toHaveBeenCalledWith('error', {
      code: 'VIDEO_ERROR',
      message: 'Only the host can control video',
    });
    expect(videoSyncService.changeVideo).not.toHaveBeenCalled();
  });

  it('allows the host to change video with autoplay', async () => {
    const { gateway, roomsService, videoSyncService, emitToRoom } = createGateway();
    const client = createClient();
    const videoState = { videoId: 'abc123', isPlaying: true };

    roomsService.getMemberRole.mockResolvedValue(RoomRole.HOST);
    videoSyncService.changeVideo.mockResolvedValue(videoState);

    await gateway.handleVideoChange(
      client,
      { roomId: 'room-1', videoId: 'abc123', videoTitle: 'Test', autoPlay: true },
      { id: 'host-1' } as never,
    );

    expect(videoSyncService.changeVideo).toHaveBeenCalledWith(
      'room-1',
      'abc123',
      'Test',
      undefined,
      true,
    );
    expect(emitToRoom).toHaveBeenCalledWith('video_state_changed', { videoState });
  });
});
