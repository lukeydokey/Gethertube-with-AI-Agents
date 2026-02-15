import { Injectable } from '@nestjs/common';

export interface HealthResponse {
  status: string;
}

@Injectable()
export class AppService {
  async getHealth(): Promise<HealthResponse> {
    return {
      status: 'ok',
    };
  }
}
