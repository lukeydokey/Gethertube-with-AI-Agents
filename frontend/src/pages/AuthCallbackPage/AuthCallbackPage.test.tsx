jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthCallbackPage } from './AuthCallbackPage';
import { useAuth } from '@/hooks/useAuth';

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      setAuthFromCallback: jest.fn().mockResolvedValue(undefined),
      clearError: jest.fn(),
    });
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
    jest.clearAllMocks();
  });

  it('accepts token from the URL hash fragment', async () => {
    const setAuthFromCallback = jest.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      setAuthFromCallback,
      clearError: jest.fn(),
    });

    window.history.replaceState({}, '', '/auth/callback#token=hash-token');

    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/" element={<div>home</div>} />
          <Route path="/login" element={<div>login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(setAuthFromCallback).toHaveBeenCalledWith('hash-token');
    });
  });
});
