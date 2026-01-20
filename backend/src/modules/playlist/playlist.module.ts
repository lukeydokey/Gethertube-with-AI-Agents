import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PlaylistService } from './playlist.service';
import { PlaylistController } from './playlist.controller';
import { PlaylistGateway } from './playlist.gateway';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [
    RoomsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PlaylistController],
  providers: [PlaylistService, PlaylistGateway],
  exports: [PlaylistService],
})
export class PlaylistModule {}
