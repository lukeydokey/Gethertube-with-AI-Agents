jest.mock('./api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from './api';
import { roomService } from './room.service';

const mockedApi = api as jest.Mocked<typeof api>;

describe('roomService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the public room list from a paginated payload', async () => {
    const rooms = [
      {
        id: 'room-1',
        name: 'Room 1',
        description: null,
        isPublic: true,
        maxMembers: 10,
        memberCount: 1,
        host: { id: 'user-1', name: 'Host', profileImage: null },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    mockedApi.get.mockResolvedValue({
      data: {
        data: rooms,
        meta: {
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: {} },
    });

    await expect(roomService.listRooms()).resolves.toEqual(rooms);
    expect(mockedApi.get).toHaveBeenCalledWith('/rooms');
  });
});
