import { Socket } from 'socket.io';

export function extractTokenFromSocket(client: Socket): string | null {
  const auth = client.handshake?.auth;
  if (auth?.token) return auth.token;

  const authHeader = client.handshake?.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.slice(7);

  return null;
}
