import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './database';

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  database: {
    status: string;
    latency?: number;
  };
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<HealthResponse> {
    const database = await this.checkDatabaseHealth();

    return {
      status: database.status === 'healthy' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: '0.0.1',
      database,
      memory: {
        rss: Math.floor(process.memoryUsage().rss / 1024 / 1024), // MB
        heapUsed: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        heapTotal: Math.floor(process.memoryUsage().heapTotal / 1024 / 1024), // MB
      },
    };
  }

  private async checkDatabaseHealth(): Promise<{
    status: string;
    latency?: number;
  }> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'unhealthy',
      };
    }
  }
}
