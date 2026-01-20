/**
 * useRoom hook
 * Provides access to room state and actions
 */

import { useRoomContext } from '@/store/RoomContext';

export const useRoom = () => {
  return useRoomContext();
};

export default useRoom;
