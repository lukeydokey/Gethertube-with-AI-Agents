jest.mock('@/services/room.service', () => ({
  roomService: {
    getRoom: jest.fn(),
    getMembers: jest.fn(),
  },
}));

jest.mock('@/hooks/useSocket', () => ({
  useSocket: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/hooks/useChat', () => ({
  useChat: jest.fn(),
}));

jest.mock('@/hooks/useVideoSync', () => ({
  useVideoSync: jest.fn(),
}));

jest.mock('@/hooks/usePlaylist', () => ({
  usePlaylist: jest.fn(),
}));

jest.mock('@/hooks/usePresence', () => ({
  usePresence: jest.fn(),
}));

jest.mock('@/components/layout/RoomLayout', () => ({
  RoomLayout: ({ roomName, children }: { roomName: string; children: React.ReactNode }) => (
    <div>
      <h1>{roomName}</h1>
      {children}
    </div>
  ),
}));

const mockVideoPlayer = jest.fn((_: unknown) => <div>video player</div>);

jest.mock('@/components/video/VideoPlayer', () => ({
  VideoPlayer: (props: unknown) => mockVideoPlayer(props),
}));

jest.mock('@/components/chat/ChatBox', () => ({
  ChatBox: () => <div>chat box</div>,
}));

const mockPlaylistPanel = jest.fn((_: unknown) => <div>playlist panel</div>);

jest.mock('@/components/playlist/PlaylistPanel', () => ({
  PlaylistPanel: (props: unknown) => mockPlaylistPanel(props),
}));

jest.mock('@/components/room/MemberList', () => ({
  MemberList: () => <div>member list</div>,
}));

jest.mock('@/components/common/Loading', () => ({
  Loading: ({ text }: { text?: string }) => <div>{text || 'loading'}</div>,
}));

jest.mock('@/components/common/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RoomPage } from './RoomPage';
import { roomService } from '@/services/room.service';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useChat } from '@/hooks/useChat';
import { useVideoSync } from '@/hooks/useVideoSync';
import { usePlaylist } from '@/hooks/usePlaylist';
import { usePresence } from '@/hooks/usePresence';
import type { RoomResponse, MemberResponse } from '@/types/room.types';

const mockedRoomService = roomService as jest.Mocked<typeof roomService>;
const mockedUseSocket = useSocket as jest.MockedFunction<typeof useSocket>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockedUseChat = useChat as jest.MockedFunction<typeof useChat>;
const mockedUseVideoSync = useVideoSync as jest.MockedFunction<typeof useVideoSync>;
const mockedUsePlaylist = usePlaylist as jest.MockedFunction<typeof usePlaylist>;
const mockedUsePresence = usePresence as jest.MockedFunction<typeof usePresence>;

const room: RoomResponse = {
  id: 'room-1',
  name: '테스트 방',
  description: null,
  isPublic: true,
  maxMembers: 10,
  memberCount: 1,
  host: {
    id: 'host-1',
    name: '호스트',
    profileImage: null,
  },
  videoState: null,
  createdAt: '2026-03-18T00:00:00.000Z',
  updatedAt: '2026-03-18T00:00:00.000Z',
};

function renderPage(initialEntry = '/rooms/room-1') {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/rooms/:roomId" element={<RoomPage />} />
        <Route path="/rooms/:roomId/join" element={<div>join page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RoomPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseSocket.mockReturnValue({
      roomsSocket: null,
      chatSocket: null,
      videoSocket: null,
      playlistSocket: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
    });
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@test.com',
        name: '테스트 유저',
        profileImage: null,
        createdAt: '2026-03-18T00:00:00.000Z',
        updatedAt: '2026-03-18T00:00:00.000Z',
      },
      token: 'token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      setAuthFromCallback: jest.fn(),
      clearError: jest.fn(),
    });
    mockedUseToast.mockReturnValue({
      showToast: jest.fn(),
    });
    mockedUseChat.mockReturnValue({
      messages: [],
      typingUsers: new Map(),
      sendMessage: jest.fn(),
      startTyping: jest.fn(),
      stopTyping: jest.fn(),
      addReaction: jest.fn(),
      removeReaction: jest.fn(),
    });
    mockedUseVideoSync.mockReturnValue({
      videoState: null,
      play: jest.fn(),
      pause: jest.fn(),
      seek: jest.fn(),
      changeVideo: jest.fn(),
      changePlaybackRate: jest.fn(),
      requestSync: jest.fn(),
      lastStateUpdateAt: 0,
    });
    mockedUsePlaylist.mockReturnValue({
      playlist: [],
      addVideo: jest.fn(),
      removeVideo: jest.fn(),
      reorderPlaylist: jest.fn(),
      playNext: jest.fn(),
      playPrevious: jest.fn(),
    });
    mockedUsePresence.mockReturnValue({
      presenceMap: new Map(),
      setMyPresence: jest.fn(),
    });
    mockVideoPlayer.mockClear();
    mockPlaylistPanel.mockClear();
  });

  it('redirects non-members to the join page before initializing realtime hooks', async () => {
    const members: MemberResponse[] = [
      {
        id: 'member-1',
        userId: 'host-1',
        name: '호스트',
        profileImage: null,
        role: 'HOST',
        joinedAt: '2026-03-18T00:00:00.000Z',
      },
    ];

    mockedRoomService.getRoom.mockResolvedValue(room);
    mockedRoomService.getMembers.mockResolvedValue(members);

    renderPage();

    expect(await screen.findByText('join page')).toBeInTheDocument();
  });

  it('renders the room for existing members', async () => {
    const members: MemberResponse[] = [
      {
        id: 'member-1',
        userId: 'user-1',
        name: '테스트 유저',
        profileImage: null,
        role: 'MEMBER',
        joinedAt: '2026-03-18T00:00:00.000Z',
      },
    ];

    mockedRoomService.getRoom.mockResolvedValue(room);
    mockedRoomService.getMembers.mockResolvedValue(members);

    renderPage();

    expect(
      await screen.findByRole('heading', { name: '테스트 방' }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(mockedRoomService.getMembers).toHaveBeenCalledWith('room-1');
    });
  });

  it('does not pass playback control callbacks to non-host members', async () => {
    const members: MemberResponse[] = [
      {
        id: 'member-1',
        userId: 'user-1',
        name: '테스트 유저',
        profileImage: null,
        role: 'MEMBER',
        joinedAt: '2026-03-18T00:00:00.000Z',
      },
    ];

    mockedRoomService.getRoom.mockResolvedValue(room);
    mockedRoomService.getMembers.mockResolvedValue(members);

    renderPage();

    await screen.findByRole('heading', { name: '테스트 방' });

    const videoProps = mockVideoPlayer.mock.calls.at(-1)?.[0] as {
      canInteract?: boolean;
      suppressAuthorityEvents?: boolean;
      onResync?: unknown;
      onPlay?: unknown;
      onPause?: unknown;
      onSeek?: unknown;
    };
    const playlistProps = mockPlaylistPanel.mock.calls.at(-1)?.[0] as {
      canControlPlayback: boolean;
      canManagePlaylist: boolean;
    };

    expect(videoProps.canInteract).toBe(false);
    expect(videoProps.suppressAuthorityEvents).toBe(false);
    expect(typeof videoProps.onResync).toBe('function');
    expect(videoProps.onPlay).toBeUndefined();
    expect(videoProps.onPause).toBeUndefined();
    expect(videoProps.onSeek).toBeUndefined();
    expect(playlistProps.canControlPlayback).toBe(false);
    expect(playlistProps.canManagePlaylist).toBe(false);
  });

  it('passes playback control callbacks to the host', async () => {
    const members: MemberResponse[] = [
      {
        id: 'member-1',
        userId: 'user-1',
        name: '테스트 유저',
        profileImage: null,
        role: 'HOST',
        joinedAt: '2026-03-18T00:00:00.000Z',
      },
    ];

    mockedRoomService.getRoom.mockResolvedValue(room);
    mockedRoomService.getMembers.mockResolvedValue(members);

    renderPage();

    await screen.findByRole('heading', { name: '테스트 방' });

    const videoProps = mockVideoPlayer.mock.calls.at(-1)?.[0] as {
      canInteract?: boolean;
      suppressAuthorityEvents?: boolean;
      onResync?: unknown;
      onPlay?: unknown;
      onPause?: unknown;
      onSeek?: unknown;
    };
    const playlistProps = mockPlaylistPanel.mock.calls.at(-1)?.[0] as {
      canControlPlayback: boolean;
      canManagePlaylist: boolean;
    };

    expect(videoProps.canInteract).toBe(true);
    expect(videoProps.suppressAuthorityEvents).toBe(false);
    expect(typeof videoProps.onResync).toBe('function');
    expect(typeof videoProps.onPlay).toBe('function');
    expect(typeof videoProps.onPause).toBe('function');
    expect(typeof videoProps.onSeek).toBe('function');
    expect(playlistProps.canControlPlayback).toBe(true);
    expect(playlistProps.canManagePlaylist).toBe(true);
  });

  it('suppresses host playback emits while hidden and until sync returns after restore', async () => {
    const members: MemberResponse[] = [
      {
        id: 'member-1',
        userId: 'user-1',
        name: '테스트 유저',
        profileImage: null,
        role: 'HOST',
        joinedAt: '2026-03-18T00:00:00.000Z',
      },
    ];
    const requestSync = jest.fn();

    mockedRoomService.getRoom.mockResolvedValue(room);
    mockedRoomService.getMembers.mockResolvedValue(members);
    mockedUseVideoSync.mockReturnValue({
      videoState: null,
      play: jest.fn(),
      pause: jest.fn(),
      seek: jest.fn(),
      changeVideo: jest.fn(),
      changePlaybackRate: jest.fn(),
      requestSync,
      lastStateUpdateAt: 0,
    });

    const rendered = renderPage();

    await screen.findByRole('heading', { name: '테스트 방' });

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    let videoProps = mockVideoPlayer.mock.calls.at(-1)?.[0] as {
      suppressAuthorityEvents?: boolean;
    };
    expect(videoProps.suppressAuthorityEvents).toBe(true);

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(requestSync).toHaveBeenCalled();

    mockedUseVideoSync.mockReturnValue({
      videoState: null,
      play: jest.fn(),
      pause: jest.fn(),
      seek: jest.fn(),
      changeVideo: jest.fn(),
      changePlaybackRate: jest.fn(),
      requestSync,
      lastStateUpdateAt: Date.now(),
    });

    rendered.rerender(
      <MemoryRouter
        initialEntries={['/rooms/room-1']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/rooms/:roomId" element={<RoomPage />} />
          <Route path="/rooms/:roomId/join" element={<div>join page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      const latestVideoProps = mockVideoPlayer.mock.calls.at(-1)?.[0] as {
        suppressAuthorityEvents?: boolean;
      };
      expect(latestVideoProps.suppressAuthorityEvents).toBe(false);
    });
  });
});
