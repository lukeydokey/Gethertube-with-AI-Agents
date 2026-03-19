jest.mock('@/services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  api: { get: jest.fn(), post: jest.fn() },
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthContext } from '@/store/AuthContext';
import type { AuthContextValue } from '@/types/auth.types';

const createMockContext = (
  overrides: Partial<AuthContextValue> = {}
): AuthContextValue => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  setAuthFromCallback: jest.fn(),
  clearError: jest.fn(),
  ...overrides,
});

const renderWithProviders = (
  ui: React.ReactElement,
  contextValue: AuthContextValue,
  initialEntries: string[] = ['/']
) => {
  return render(
    <AuthContext.Provider value={contextValue}>
      <MemoryRouter
        initialEntries={initialEntries}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        {ui}
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should show loading spinner when isLoading is true', () => {
    const mockContext = createMockContext({ isLoading: true });

    renderWithProviders(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      mockContext
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when authenticated', () => {
    const mockContext = createMockContext({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        profileImage: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    });

    renderWithProviders(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      mockContext
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should not render children when not authenticated', () => {
    const mockContext = createMockContext({
      isAuthenticated: false,
      isLoading: false,
    });

    renderWithProviders(
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      mockContext,
      ['/protected']
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(sessionStorage.getItem('auth:returnTo')).toBe('/protected');
  });

  it('should preserve query string and hash in the saved return target', () => {
    const mockContext = createMockContext({
      isAuthenticated: false,
      isLoading: false,
    });

    renderWithProviders(
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      mockContext,
      ['/protected?source=invite#details']
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(sessionStorage.getItem('auth:returnTo')).toBe(
      '/protected?source=invite#details'
    );
  });
});
