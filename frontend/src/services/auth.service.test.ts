jest.mock('./api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import { authService } from './auth.service';

describe('authService', () => {
  const mockToken = 'test-jwt-token';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('setToken', () => {
    it('should store token in localStorage', () => {
      authService.setToken(mockToken);
      expect(localStorage.getItem('accessToken')).toBe(mockToken);
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('accessToken', mockToken);
      expect(authService.getToken()).toBe(mockToken);
    });

    it('should return null when no token exists', () => {
      expect(authService.getToken()).toBeNull();
    });
  });

  describe('hasToken', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('accessToken', mockToken);
      expect(authService.hasToken()).toBe(true);
    });

    it('should return false when no token exists', () => {
      expect(authService.hasToken()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should remove token from localStorage', () => {
      localStorage.setItem('accessToken', mockToken);
      authService.logout();
      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });

  describe('getGoogleLoginUrl', () => {
    it('should return google login URL', () => {
      const url = authService.getGoogleLoginUrl();
      expect(url).toContain('/auth/google');
    });
  });
});
