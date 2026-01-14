import api from './api';
import type { User } from '@/types/auth.types';

/**
 * Authentication service for Google OAuth
 */
export const authService = {
  /**
   * Get the Google OAuth login URL
   * Redirects user to Google consent screen
   */
  getGoogleLoginUrl(): string {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    return `${baseUrl}/auth/google`;
  },

  /**
   * Initiate Google OAuth login
   * Redirects to backend which handles OAuth flow
   */
  loginWithGoogle(): void {
    window.location.href = this.getGoogleLoginUrl();
  },

  /**
   * Get current authenticated user info
   * Requires valid JWT token in localStorage
   */
  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Logout - clears local storage
   */
  logout(): void {
    localStorage.removeItem('accessToken');
  },

  /**
   * Check if user has a valid token stored
   */
  hasToken(): boolean {
    return !!localStorage.getItem('accessToken');
  },

  /**
   * Store the access token
   */
  setToken(token: string): void {
    localStorage.setItem('accessToken', token);
  },

  /**
   * Get stored access token
   */
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  },
};

export default authService;
