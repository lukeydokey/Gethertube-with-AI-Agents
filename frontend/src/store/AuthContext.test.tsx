jest.mock('@/services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  api: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@/services/auth.service');

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from './AuthContext';
import { useAuth } from '@/hooks/useAuth';
import authService from '@/services/auth.service';

const mockedAuthService = authService as jest.Mocked<typeof authService>;

const TestComponent: React.FC = () => {
  const { isAuthenticated, isLoading, user, logout, error } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="user">{user?.name || 'no user'}</div>
      <div data-testid="error">{error || 'no error'}</div>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with loading state', async () => {
    mockedAuthService.getToken.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });
  });

  it('should set authenticated state when token is valid', async () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      name: 'Test User',
      profileImage: null,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    mockedAuthService.getToken.mockReturnValue('valid-token');
    mockedAuthService.getMe.mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });
  });

  it('should clear auth state on logout', async () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      name: 'Test User',
      profileImage: null,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    mockedAuthService.getToken.mockReturnValue('valid-token');
    mockedAuthService.getMe.mockResolvedValue(mockUser);
    mockedAuthService.logout.mockImplementation(() => {
      localStorage.removeItem('accessToken');
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    await act(async () => {
      await userEvent.click(screen.getByText('Logout'));
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    expect(mockedAuthService.logout).toHaveBeenCalled();
  });

  it('should handle invalid token', async () => {
    mockedAuthService.getToken.mockReturnValue('invalid-token');
    mockedAuthService.getMe.mockRejectedValue(new Error('Invalid token'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      expect(mockedAuthService.logout).toHaveBeenCalled();
    });
  });
});
