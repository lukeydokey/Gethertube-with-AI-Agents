import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VideoPlayer } from './VideoPlayer';
import type { VideoStateResponse } from '@/types/room.types';

const mockDestroy = jest.fn();
const mockSeekTo = jest.fn();
const mockPlayVideo = jest.fn();
const mockPauseVideo = jest.fn();
const mockGetCurrentTime = jest.fn(() => 0);
const mockGetPlayerState = jest.fn(() => 2);
const mockSetVolume = jest.fn();
const mockMute = jest.fn();
const mockUnMute = jest.fn();
const mockIsMuted = jest.fn(() => false);
const mockGetVolume = jest.fn(() => 100);
const playerConstructor = jest.fn();
let latestPlayerOptions: YT.PlayerOptions | undefined;

const baseVideoState: VideoStateResponse = {
  roomId: 'room-1',
  videoId: 'abc123',
  videoTitle: 'Test Video',
  videoThumbnail: null,
  currentTime: 0,
  isPlaying: false,
  playbackRate: 1,
  lastUpdated: '2026-03-19T00:00:00.000Z',
};

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  latestPlayerOptions = undefined;

  (window as Window & typeof globalThis & { YT: typeof YT }).YT = ({
    Player: playerConstructor.mockImplementation(
      (_target: HTMLElement, options: YT.PlayerOptions) => {
        latestPlayerOptions = options;
        const player = {
          destroy: mockDestroy,
          seekTo: mockSeekTo,
          playVideo: mockPlayVideo,
          pauseVideo: mockPauseVideo,
          setVolume: mockSetVolume,
          mute: mockMute,
          unMute: mockUnMute,
          isMuted: mockIsMuted,
          getVolume: mockGetVolume,
          getCurrentTime: mockGetCurrentTime,
          getPlayerState: mockGetPlayerState,
        } as unknown as YT.Player;

        queueMicrotask(() => {
          options.events?.onReady?.({ target: player } as YT.PlayerEvent);
        });

        return player;
      },
    ),
    PlayerState: {
      UNSTARTED: -1,
      ENDED: 0,
      PLAYING: 1,
      PAUSED: 2,
      BUFFERING: 3,
      CUED: 5,
    },
  } as unknown) as typeof YT;

  window.onYouTubeIframeAPIReady = undefined;
});

describe('VideoPlayer', () => {
  it('does not recreate the YouTube player when only callbacks change', async () => {
    const firstOnPlay = jest.fn();
    const secondOnPlay = jest.fn();

    const { rerender } = render(
      <VideoPlayer videoState={baseVideoState} onPlay={firstOnPlay} />,
    );

    window.onYouTubeIframeAPIReady?.();

    await waitFor(() => {
      expect(playerConstructor).toHaveBeenCalledTimes(1);
    });

    rerender(<VideoPlayer videoState={baseVideoState} onPlay={secondOnPlay} />);

    await waitFor(() => {
      expect(playerConstructor).toHaveBeenCalledTimes(1);
    });
  });

  it('renders a guest interaction blocker and local audio controls', async () => {
    const onResync = jest.fn();
    const { getByText, getByLabelText } = render(
      <VideoPlayer videoState={baseVideoState} canInteract={false} onResync={onResync} />,
    );

    window.onYouTubeIframeAPIReady?.();

    expect(await waitFor(() => getByText('호스트가 재생을 제어합니다'))).toBeTruthy();
    expect(getByLabelText('로컬 볼륨')).toBeTruthy();
    expect(getByLabelText('음소거')).toBeTruthy();
    expect(getByLabelText('전체화면')).toBeTruthy();

    fireEvent.click(getByLabelText('동기화 다시 맞추기'));
    expect(onResync).toHaveBeenCalled();
  });

  it('does not emit host pause when the document is hidden', async () => {
    const onPause = jest.fn();

    render(<VideoPlayer videoState={baseVideoState} canInteract onPause={onPause} />);

    window.onYouTubeIframeAPIReady?.();

    await waitFor(() => {
      expect(playerConstructor).toHaveBeenCalledTimes(1);
    });

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });

    latestPlayerOptions?.events?.onStateChange?.({
      data: window.YT.PlayerState.PAUSED,
      target: {
        getCurrentTime: () => 12,
      } as YT.Player,
    } as YT.OnStateChangeEvent);

    expect(onPause).not.toHaveBeenCalled();
  });

  it('still emits host pause when the document is visible', async () => {
    const onPause = jest.fn();

    render(<VideoPlayer videoState={baseVideoState} canInteract onPause={onPause} />);

    window.onYouTubeIframeAPIReady?.();

    await waitFor(() => {
      expect(playerConstructor).toHaveBeenCalledTimes(1);
    });

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });

    latestPlayerOptions?.events?.onStateChange?.({
      data: window.YT.PlayerState.PAUSED,
      target: {
        getCurrentTime: () => 18,
      } as YT.Player,
    } as YT.OnStateChangeEvent);

    expect(onPause).toHaveBeenCalledWith(18);
  });

  it('prompts guests to use Live when local playback drifts from host time', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date(baseVideoState.lastUpdated).getTime());
    mockGetCurrentTime.mockReturnValue(2);
    const onResync = jest.fn();

    render(
      <VideoPlayer
        videoState={{
          ...baseVideoState,
          currentTime: 8,
          isPlaying: true,
        }}
        canInteract={false}
        onResync={onResync}
      />,
    );

    window.onYouTubeIframeAPIReady?.();

    expect(await screen.findByText('호스트와 6.0초 차이')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '동기화 다시 맞추기' }));

    expect(onResync).toHaveBeenCalled();
  });

  it('prompts hosts to resync when authority is gated and local playback drifts', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date(baseVideoState.lastUpdated).getTime());
    mockGetCurrentTime.mockReturnValue(1);
    const onResync = jest.fn();

    render(
      <VideoPlayer
        videoState={{
          ...baseVideoState,
          currentTime: 7,
          isPlaying: true,
        }}
        canInteract
        suppressAuthorityEvents
        onResync={onResync}
      />,
    );

    window.onYouTubeIframeAPIReady?.();

    expect(await screen.findByText('방 상태와 6.0초 차이')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '방 상태로 다시 맞추기' }));

    expect(onResync).toHaveBeenCalled();
  });
});
