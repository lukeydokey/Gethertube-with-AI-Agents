import { useContext } from 'react';
import { AuthContext } from '@/store/AuthContext';
import type { AuthContextValue } from '@/types/auth.types';

/**
 * Custom hook to access auth context
 * Must be used within AuthProvider
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default useAuth;
