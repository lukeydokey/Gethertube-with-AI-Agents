import { useContext } from 'react';
import { SocketContext } from '@/store/SocketContext';

/**
 * Custom hook to access socket connections (4 namespaces)
 * Must be used within SocketProvider
 */
export const useSocket = () => {
  const context = useContext(SocketContext);

  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  return context;
};

export default useSocket;
