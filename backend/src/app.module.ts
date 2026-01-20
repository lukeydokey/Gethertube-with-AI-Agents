import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth';
import { RoomsModule } from './modules/rooms';
import { ChatModule } from './modules/chat';
import { VideoSyncModule } from './modules/video-sync';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    RoomsModule,
    ChatModule,
    VideoSyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
