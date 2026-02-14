import React, { createContext, useCallback, useState } from 'react';
import { ToastContainer } from '@/components/common/Toast';
import type { ToastData, ToastType } from '@/components/common/Toast';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION = 4000;

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const toast: ToastData = { id, message, type };

      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        dismissToast(id);
      }, TOAST_DURATION);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
