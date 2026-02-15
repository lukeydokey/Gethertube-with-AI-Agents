import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url } = request;
    const correlationId =
      (request.headers['x-correlation-id'] as string) || randomUUID();
    const start = Date.now();

    // 요청 헤더에 correlation ID 추가
    request.headers['x-correlation-id'] = correlationId;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const statusCode = response.statusCode;

        this.logger.log(
          JSON.stringify({
            type: 'request',
            correlationId,
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
          }),
        );
      }),
      catchError((error) => {
        const duration = Date.now() - start;

        this.logger.error(
          JSON.stringify({
            type: 'error',
            correlationId,
            method,
            url,
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
          }),
        );
        throw error;
      }),
    );
  }
}
