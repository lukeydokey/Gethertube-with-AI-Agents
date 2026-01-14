/**
 * User information returned from the backend
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  profileImage: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Authentication response from backend
 */
export interface AuthResponse {
  accessToken: string;
  user: User;
}

/**
 * Auth context state
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Auth context actions
 */
export interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => void;
  setAuthFromCallback: (token: string) => Promise<void>;
  clearError: () => void;
}
