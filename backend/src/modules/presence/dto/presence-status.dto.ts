import { IsEnum, IsString } from 'class-validator';

export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  OFFLINE = 'offline',
}

export interface UserPresence {
  userId: string;
  userName: string | null;
  profileImage: string | null;
  status: PresenceStatus;
  roomId: string;
  lastSeen: Date;
}

export class SetPresenceDto {
  @IsString()
  roomId: string;

  @IsEnum(PresenceStatus)
  status: Exclude<PresenceStatus, PresenceStatus.OFFLINE>; // 클라이언트는 online/away만 설정
}

export class GetPresenceDto {
  @IsString()
  roomId: string;
}

export class PresenceResponseDto {
  userId: string;
  userName: string | null;
  profileImage: string | null;
  status: PresenceStatus;
  roomId: string;
}
