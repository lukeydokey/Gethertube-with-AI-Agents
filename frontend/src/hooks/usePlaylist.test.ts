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
import { usePlaylist } from './usePlaylist';

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

describe('usePlaylist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows playlist namespace errors through toast notifications', () => {
    const playlist = createMockSocket();
    const showToast = jest.fn();

    mockedUseSocket.mockReturnValue({
      roomsSocket: null,
      chatSocket: null,
      videoSocket: null,
      playlistSocket: playlist.socket,
      isConnected: true,
      isConnecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
    });
    mockedUseToast.mockReturnValue({ showToast });

    renderHook(() => usePlaylist('room-1'));

    act(() => {
      const handler = playlist.handlers.get('error');
      if (!handler) {
        throw new Error('playlist error handler missing');
      }
      handler({ message: 'Only the host can change video' });
    });

    expect(showToast).toHaveBeenCalledWith('Only the host can change video', 'error');
  });
});
