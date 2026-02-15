import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Axios instance with base configuration
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to attach JWT token
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

/**
 * Response interceptor for error handling
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Network error (no response received)
    if (!error.response) {
      const networkError = new Error(
        error.message || '네트워크 연결을 확인해주세요.',
      ) as AxiosError;
      networkError.isAxiosError = true;
      networkError.code = error.code;
      return Promise.reject(networkError);
    }

    // HTTP 401: Unauthorized - auto logout
    if (error.response.status === 401) {
      const currentPath = window.location.pathname;
      // Prevent infinite redirect loop
      if (currentPath !== '/login' && currentPath !== '/auth/callback') {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }

    // Enhance error message for better handling in components
    const enhancedError = error;
    if (error.response.data && typeof error.response.data === 'object') {
      const data = error.response.data as { message?: string };
      if (data.message) {
        enhancedError.message = data.message;
      }
    }

    return Promise.reject(enhancedError);
  },
);

export default api;
