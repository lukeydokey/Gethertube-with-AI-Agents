import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();

    // Already authenticated via handleConnection
    if (client.data?.user) {
      return true;
    }

    const token = this.extractToken(client);
    if (!token) {
      throw new WsException('Authentication token not provided');
    }

    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new WsException('User not found');
      }
      client.data = { ...client.data, user };
      return true;
    } catch (error) {
      this.logger.warn(`WebSocket authentication failed: ${error}`);
      throw new WsException('Invalid or expired token');
    }
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake?.auth;
    if (auth?.token) {
      return auth.token;
    }

    const authHeader = client.handshake?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return null;
  }
}
