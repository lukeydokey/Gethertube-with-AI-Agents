import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { RoomsModule } from '../rooms/rooms.module';
import { VideoSyncService } from './video-sync.service';
import { VideoSyncGateway } from './video-sync.gateway';
import { WsJwtAuthGuard } from '../../common/guards/ws-jwt-auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    RoomsModule,
  ],
  providers: [VideoSyncService, VideoSyncGateway, WsJwtAuthGuard],
  exports: [VideoSyncService],
})
export class VideoSyncModule {}
