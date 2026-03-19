jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
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
    sessionStorage.clear();
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
      <MemoryRouter
        initialEntries={['/auth/callback']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/" element={<div>home</div>} />
          <Route path="/rooms" element={<div>rooms page</div>} />
          <Route path="/login" element={<div>login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(setAuthFromCallback).toHaveBeenCalledWith('hash-token');
    });
  });

  it('returns to the saved join path after successful authentication', async () => {
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

    sessionStorage.setItem('auth:returnTo', '/rooms/abc/join?source=invite');
    window.history.replaceState({}, '', '/auth/callback#token=hash-token');

    const { getByText } = render(
      <MemoryRouter
        initialEntries={['/auth/callback']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/rooms/:roomId/join" element={<div>join page</div>} />
          <Route path="/rooms" element={<div>rooms page</div>} />
          <Route path="/login" element={<div>login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(setAuthFromCallback).toHaveBeenCalledWith('hash-token');
      expect(getByText('join page')).toBeInTheDocument();
    });

    expect(sessionStorage.getItem('auth:returnTo')).toBeNull();
  });
});
