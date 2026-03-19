jest.mock('./useSocket', () => ({
  useSocket: jest.fn(),
}));

jest.mock('./useToast', () => ({
  useToast: jest.fn(),
}));

import { act, renderHook } from '@testing-library/react';
import type { Socket } from 'socket.io-client';
import { useSocket } from './useSocket';
import { useToast } from './useToast';
import { useVideoSync } from './useVideoSync';
import type { VideoStateResponse } from '@/types/room.types';

const mockedUseSocket = useSocket as jest.MockedFunction<typeof useSocket>;
const mockedUseToast = useToast as jest.MockedFunction<typeof useToast>;

type Handler = (...args: unknown[]) => void;

function createMockSocket() {
  const handlers = new Map<string, Handler>();

  return {
    handlers,
    socket: {
      on: jest.fn((event: string, handler: Handler) => {
        handlers.set(event, handler);
      }),
      off: jest.fn((event: string) => {
        handlers.delete(event);
      }),
      emit: jest.fn(),
    } as unknown as Socket,
  };
}

describe('useVideoSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates video state from playlist namespace playback events', () => {
    const video = createMockSocket();
    const playlist = createMockSocket();

    mockedUseSocket.mockReturnValue({
      roomsSocket: null,
      chatSocket: null,
      videoSocket: video.socket,
      playlistSocket: playlist.socket,
      isConnected: true,
      isConnecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
    });
    mockedUseToast.mockReturnValue({ showToast: jest.fn() });

    const { result } = renderHook(() => useVideoSync('room-1'));
    const videoState: VideoStateResponse = {
      roomId: 'room-1',
      videoId: 'abc123',
      videoTitle: 'Test Video',
      videoThumbnail: null,
      currentTime: 0,
      isPlaying: true,
      playbackRate: 1,
      lastUpdated: '2026-03-19T00:00:00.000Z',
    };

    act(() => {
      const handler = playlist.handlers.get('video_state_changed');
      if (!handler) {
        throw new Error('playlist video_state_changed handler missing');
      }
      handler({ videoState });
    });

    expect(result.current.videoState).toEqual(videoState);
    expect(result.current.lastStateUpdateAt).toBeGreaterThan(0);
  });

  it('emits video change requests with autoplay metadata', () => {
    const video = createMockSocket();
    const playlist = createMockSocket();

    mockedUseSocket.mockReturnValue({
      roomsSocket: null,
      chatSocket: null,
      videoSocket: video.socket,
      playlistSocket: playlist.socket,
      isConnected: true,
      isConnecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
    });
    mockedUseToast.mockReturnValue({ showToast: jest.fn() });

    const { result } = renderHook(() => useVideoSync('room-1'));

    act(() => {
      result.current.changeVideo('abc123', 'Test Video', 'thumb.jpg', true);
    });

    expect(video.socket.emit).toHaveBeenCalledWith('video_change', {
      roomId: 'room-1',
      videoId: 'abc123',
      videoTitle: 'Test Video',
      videoThumbnail: 'thumb.jpg',
      autoPlay: true,
    });
  });

  it('shows video namespace errors through toast notifications', () => {
    const video = createMockSocket();
    const playlist = createMockSocket();
    const showToast = jest.fn();

    mockedUseSocket.mockReturnValue({
      roomsSocket: null,
      chatSocket: null,
      videoSocket: video.socket,
      playlistSocket: playlist.socket,
      isConnected: true,
      isConnecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
    });
    mockedUseToast.mockReturnValue({ showToast });

    renderHook(() => useVideoSync('room-1'));

    act(() => {
      const handler = video.handlers.get('error');
      if (!handler) {
        throw new Error('video error handler missing');
      }
      handler({ message: 'Only the host can control video' });
    });

    expect(showToast).toHaveBeenCalledWith('Only the host can control video', 'error');
  });
});
