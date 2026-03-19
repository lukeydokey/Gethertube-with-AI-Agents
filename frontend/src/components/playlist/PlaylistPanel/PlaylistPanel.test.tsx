import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlaylistPanel } from './PlaylistPanel';
import type { PlaylistItemResponse } from '@/types/playlist.types';

const playlist: PlaylistItemResponse[] = [
  {
    id: 'item-1',
    videoId: 'abc123',
    title: '테스트 영상',
    thumbnail: null,
    duration: 120,
    position: 0,
    addedBy: {
      id: 'user-1',
      name: '호스트',
    },
    addedAt: '2026-03-19T00:00:00.000Z',
  },
];

describe('PlaylistPanel', () => {
  it('plays a clicked playlist item', () => {
    const onPlayItem = jest.fn();

    render(
      <PlaylistPanel
        playlist={playlist}
        currentVideoId={null}
        canControlPlayback={true}
        canManagePlaylist={true}
        onAddVideo={jest.fn()}
        onRemoveVideo={jest.fn()}
        onPlayItem={onPlayItem}
        onPlayNext={jest.fn()}
        onPlayPrevious={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByText('테스트 영상'));

    expect(onPlayItem).toHaveBeenCalledWith(playlist[0]);
  });

  it('does not trigger play when removing an item', () => {
    const onPlayItem = jest.fn();
    const onRemoveVideo = jest.fn();

    render(
      <PlaylistPanel
        playlist={playlist}
        currentVideoId={null}
        canControlPlayback={true}
        canManagePlaylist={true}
        onAddVideo={jest.fn()}
        onRemoveVideo={onRemoveVideo}
        onPlayItem={onPlayItem}
        onPlayNext={jest.fn()}
        onPlayPrevious={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '테스트 영상 삭제' }));

    expect(onRemoveVideo).toHaveBeenCalledWith('item-1');
    expect(onPlayItem).not.toHaveBeenCalled();
  });

  it('disables playback controls for non-host users', () => {
    const onPlayItem = jest.fn();

    render(
      <PlaylistPanel
        playlist={playlist}
        currentVideoId={null}
        canControlPlayback={false}
        canManagePlaylist={false}
        onAddVideo={jest.fn()}
        onRemoveVideo={jest.fn()}
        onPlayItem={onPlayItem}
        onPlayNext={jest.fn()}
        onPlayPrevious={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByText('테스트 영상'));

    expect(onPlayItem).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: '테스트 영상 삭제' })).not.toBeInTheDocument();
  });
});
