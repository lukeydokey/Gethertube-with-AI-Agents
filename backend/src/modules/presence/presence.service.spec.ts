import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import { PresenceService } from './presence.service';
import { PresenceStatus } from './dto/presence-status.dto';

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  profileImage: null,
  googleId: 'google-123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PresenceService', () => {
  let service: PresenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PresenceService],
    }).compile();

    service = module.get<PresenceService>(PresenceService);
  });

  describe('setOnline', () => {
    it('should set user as online', () => {
      const result = service.setOnline('room-1', mockUser);

      expect(result.userId).toBe('user-1');
      expect(result.userName).toBe('Test User');
      expect(result.status).toBe(PresenceStatus.ONLINE);
      expect(result.roomId).toBe('room-1');
    });
  });

  describe('setAway', () => {
    it('should set user as away', () => {
      service.setOnline('room-1', mockUser);
      const result = service.setAway('room-1', 'user-1');

      expect(result).not.toBeNull();
      expect(result?.status).toBe(PresenceStatus.AWAY);
    });

    it('should return null if user not found', () => {
      const result = service.setAway('room-1', 'user-999');
      expect(result).toBeNull();
    });
  });

  describe('setOffline', () => {
    it('should set user as offline and remove from map', () => {
      service.setOnline('room-1', mockUser);
      const result = service.setOffline('room-1', 'user-1');

      expect(result).not.toBeNull();
      expect(result?.status).toBe(PresenceStatus.OFFLINE);

      const presence = service.getUserPresence('room-1', 'user-1');
      expect(presence).toBeNull();
    });

    it('should return null if user not found', () => {
      const result = service.setOffline('room-1', 'user-999');
      expect(result).toBeNull();
    });
  });

  describe('setOfflineAll', () => {
    it('should set user offline in all rooms', () => {
      service.setOnline('room-1', mockUser);
      service.setOnline('room-2', mockUser);

      const results = service.setOfflineAll('user-1');

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe(PresenceStatus.OFFLINE);
      expect(results[1].status).toBe(PresenceStatus.OFFLINE);
    });

    it('should return empty array if user not in any room', () => {
      const results = service.setOfflineAll('user-999');
      expect(results).toHaveLength(0);
    });
  });

  describe('getRoomPresence', () => {
    it('should return all presences in a room', () => {
      const user2: User = { ...mockUser, id: 'user-2', name: 'User 2' };
      service.setOnline('room-1', mockUser);
      service.setOnline('room-1', user2);

      const presences = service.getRoomPresence('room-1');

      expect(presences).toHaveLength(2);
      expect(presences[0].userId).toBe('user-1');
      expect(presences[1].userId).toBe('user-2');
    });

    it('should return empty array for empty room', () => {
      const presences = service.getRoomPresence('room-999');
      expect(presences).toHaveLength(0);
    });
  });

  describe('getUserPresence', () => {
    it('should return user presence', () => {
      service.setOnline('room-1', mockUser);
      const presence = service.getUserPresence('room-1', 'user-1');

      expect(presence).not.toBeNull();
      expect(presence?.userId).toBe('user-1');
      expect(presence?.status).toBe(PresenceStatus.ONLINE);
    });

    it('should return null if user not in room', () => {
      const presence = service.getUserPresence('room-1', 'user-999');
      expect(presence).toBeNull();
    });
  });
});
