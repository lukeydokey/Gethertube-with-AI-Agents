import { useContext } from 'react';
import { ToastContext } from '@/store/ToastContext';

/**
 * Custom hook to access toast notifications
 * Must be used within ToastProvider
 */
export const useToast = () => {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};

export default useToast;
