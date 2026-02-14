import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { RoomsModule } from '../rooms/rooms.module';
import { VideoSyncModule } from '../video-sync/video-sync.module';
import { PlaylistService } from './playlist.service';
import { PlaylistController } from './playlist.controller';
import { PlaylistGateway } from './playlist.gateway';
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
    VideoSyncModule,
  ],
  controllers: [PlaylistController],
  providers: [PlaylistService, PlaylistGateway, WsJwtAuthGuard],
  exports: [PlaylistService],
})
export class PlaylistModule {}
