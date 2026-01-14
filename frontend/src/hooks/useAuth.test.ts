jest.mock('@/services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  api: { get: jest.fn(), post: jest.fn() },
}));

import { renderHook } from '@testing-library/react';
import { useAuth } from './useAuth';
import { AuthContext } from '@/store/AuthContext';
import type { AuthContextValue } from '@/types/auth.types';
import React from 'react';

const mockContextValue: AuthContextValue = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  setAuthFromCallback: jest.fn(),
  clearError: jest.fn(),
};

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AuthContext.Provider, { value: mockContextValue }, children);

describe('useAuth', () => {
  it('should return auth context value', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.login).toBeDefined();
    expect(result.current.logout).toBeDefined();
  });

  it('should throw error when used outside AuthProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
