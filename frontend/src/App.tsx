import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/store/AuthContext';
import { SocketProvider } from '@/store/SocketContext';
import { RoomProvider } from '@/store/RoomContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { HomePage } from '@/pages/HomePage';
import { RoomListPage } from '@/pages/RoomListPage';
import { RoomCreatePage } from '@/pages/RoomCreatePage';
import { RoomPage } from '@/pages/RoomPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <RoomProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms"
                element={
                  <ProtectedRoute>
                    <RoomListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms/create"
                element={
                  <ProtectedRoute>
                    <RoomCreatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms/:roomId"
                element={
                  <ProtectedRoute>
                    <RoomPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </RoomProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
