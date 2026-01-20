/**
 * useSocket hook
 * Provides access to Socket.IO connections
 */

import { useSocketContext } from '@/store/SocketContext';

export const useSocket = () => {
  return useSocketContext();
};

export default useSocket;
