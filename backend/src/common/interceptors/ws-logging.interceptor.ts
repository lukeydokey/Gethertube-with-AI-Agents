import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Socket } from 'socket.io';
import { User } from '@prisma/client';

@Injectable()
export class WsLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('WebSocket');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const client = context.switchToWs().getClient<Socket>();
    const data = context.switchToWs().getData();
    const event = context.getHandler().name;
    const user = client.data?.user as User | undefined;
    const start = Date.now();

    this.logger.log(
      JSON.stringify({
        type: 'ws_event',
        event,
        userId: user?.id,
        socketId: client.id,
        data: this.sanitizeData(data),
        timestamp: new Date().toISOString(),
      }),
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(
          JSON.stringify({
            type: 'ws_event_completed',
            event,
            userId: user?.id,
            socketId: client.id,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
          }),
        );
      }),
      catchError((error) => {
        const duration = Date.now() - start;
        this.logger.error(
          JSON.stringify({
            type: 'ws_event_error',
            event,
            userId: user?.id,
            socketId: client.id,
            error: error.message,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
          }),
        );
        throw error;
      }),
    );
  }

  private sanitizeData(data: unknown): unknown {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...(data as Record<string, unknown>) };
    const sensitiveFields = ['password', 'token', 'secret', 'accessToken'];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***';
      }
    }

    return sanitized;
  }
}
