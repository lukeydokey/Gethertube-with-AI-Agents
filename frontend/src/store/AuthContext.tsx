import React, { createContext, useCallback, useEffect, useState } from 'react';
import type { AuthContextValue, AuthState } from '@/types/auth.types';
import authService from '@/services/auth.service';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);

  /**
   * Initialize auth state from stored token
   */
  const initializeAuth = useCallback(async () => {
    const token = authService.getToken();

    if (!token) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const user = await authService.getMe();
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch {
      // Token is invalid or expired
      authService.logout();
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  /**
   * Redirect to Google OAuth login
   */
  const login = useCallback(() => {
    authService.loginWithGoogle();
  }, []);

  /**
   * Logout and clear auth state
   */
  const logout = useCallback(() => {
    authService.logout();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  /**
   * Set auth state from OAuth callback token
   */
  const setAuthFromCallback = useCallback(async (token: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      authService.setToken(token);
      const user = await authService.getMe();
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch {
      authService.logout();
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: '인증에 실패했습니다. 다시 시도해주세요.',
      });
    }
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    setAuthFromCallback,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
