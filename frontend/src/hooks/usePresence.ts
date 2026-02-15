import { useCallback, useEffect, useState } from 'react';
import { useSocket } from './useSocket';
import type { UserPresence, PresenceStatus } from '@/types/room.types';

interface UsePresenceReturn {
  presenceMap: Map<string, UserPresence>;
  setMyPresence: (status: 'online' | 'away') => void;
}

export const usePresence = (roomId: string): UsePresenceReturn => {
  const { roomsSocket } = useSocket();
  const [presenceMap, setPresenceMap] = useState<Map<string, UserPresence>>(
    new Map()
  );

  // Request presence list when joining room
  useEffect(() => {
    if (!roomsSocket || !roomId) return;

    roomsSocket.emit('get_presence', { roomId });
  }, [roomsSocket, roomId]);

  // Listen to presence events
  useEffect(() => {
    if (!roomsSocket) return;

    const handlePresenceList = (payload: { presences: UserPresence[] }) => {
      const newMap = new Map<string, UserPresence>();
      payload.presences.forEach((presence) => {
        newMap.set(presence.userId, presence);
      });
      setPresenceMap(newMap);
    };

    const handlePresenceUpdated = (payload: UserPresence) => {
      setPresenceMap((prev) => {
        const next = new Map(prev);
        next.set(payload.userId, payload);
        return next;
      });
    };

    roomsSocket.on('presence_list', handlePresenceList);
    roomsSocket.on('presence_updated', handlePresenceUpdated);

    return () => {
      roomsSocket.off('presence_list', handlePresenceList);
      roomsSocket.off('presence_updated', handlePresenceUpdated);
    };
  }, [roomsSocket]);

  // Auto set presence based on browser visibility
  useEffect(() => {
    if (!roomsSocket || !roomId) return;

    const handleVisibilityChange = () => {
      const status: PresenceStatus = document.hidden ? 'away' : 'online';
      roomsSocket.emit('set_presence', { roomId, status });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set initial presence to online
    roomsSocket.emit('set_presence', { roomId, status: 'online' });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [roomsSocket, roomId]);

  const setMyPresence = useCallback(
    (status: 'online' | 'away') => {
      if (!roomsSocket || !roomId) return;
      roomsSocket.emit('set_presence', { roomId, status });
    },
    [roomsSocket, roomId]
  );

  return { presenceMap, setMyPresence };
};

export default usePresence;
