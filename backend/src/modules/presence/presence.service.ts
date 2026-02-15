import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { User } from '@prisma/client';
import {
  PresenceStatus,
  UserPresence,
  PresenceResponseDto,
} from './dto/presence-status.dto';

@Injectable()
export class PresenceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PresenceService.name);
  private readonly presenceMap = new Map<string, UserPresence>();
  private cleanupInterval?: NodeJS.Timeout;
  private readonly STALE_THRESHOLD_MS = 90 * 1000; // 90초
  private readonly CLEANUP_INTERVAL_MS = 60 * 1000; // 60초마다 정리

  onModuleInit() {
    this.logger.log('Starting presence cleanup interval');
    this.cleanupInterval = setInterval(() => {
      this.cleanupStalePresences();
    }, this.CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      this.logger.log('Stopping presence cleanup interval');
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * 오래된 presence 엔트리 정리
   */
  private cleanupStalePresences(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, presence] of this.presenceMap.entries()) {
      const lastSeenTime = presence.lastSeen.getTime();
      const elapsedMs = now - lastSeenTime;

      if (elapsedMs > this.STALE_THRESHOLD_MS) {
        this.presenceMap.delete(key);
        cleanedCount++;
        this.logger.log(
          `Cleaned stale presence for user ${presence.userId} in room ${presence.roomId} (stale for ${Math.floor(elapsedMs / 1000)}s)`,
        );
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned ${cleanedCount} stale presence entries`);
    }
  }

  /**
   * 유저를 온라인 상태로 설정
   */
  setOnline(roomId: string, user: User): UserPresence {
    const key = this.getKey(roomId, user.id);
    const presence: UserPresence = {
      userId: user.id,
      userName: user.name,
      profileImage: user.profileImage,
      status: PresenceStatus.ONLINE,
      roomId,
      lastSeen: new Date(),
    };
    this.presenceMap.set(key, presence);
    this.logger.log(`User ${user.id} is now online in room ${roomId}`);
    return presence;
  }

  /**
   * 유저를 자리비움 상태로 설정
   */
  setAway(roomId: string, userId: string): UserPresence | null {
    const key = this.getKey(roomId, userId);
    const presence = this.presenceMap.get(key);
    if (!presence) {
      this.logger.warn(`User ${userId} not found in room ${roomId}`);
      return null;
    }
    presence.status = PresenceStatus.AWAY;
    presence.lastSeen = new Date();
    this.presenceMap.set(key, presence);
    this.logger.log(`User ${userId} is now away in room ${roomId}`);
    return presence;
  }

  /**
   * 유저를 오프라인 상태로 설정 및 제거
   */
  setOffline(roomId: string, userId: string): UserPresence | null {
    const key = this.getKey(roomId, userId);
    const presence = this.presenceMap.get(key);
    if (!presence) {
      return null;
    }
    this.presenceMap.delete(key);
    this.logger.log(`User ${userId} is now offline in room ${roomId}`);
    return { ...presence, status: PresenceStatus.OFFLINE };
  }

  /**
   * 유저의 모든 방에서 오프라인 처리
   */
  setOfflineAll(userId: string): UserPresence[] {
    const offlinePresences: UserPresence[] = [];
    for (const [key, presence] of this.presenceMap.entries()) {
      if (presence.userId === userId) {
        this.presenceMap.delete(key);
        offlinePresences.push({ ...presence, status: PresenceStatus.OFFLINE });
      }
    }
    if (offlinePresences.length > 0) {
      this.logger.log(
        `User ${userId} is now offline in ${offlinePresences.length} rooms`,
      );
    }
    return offlinePresences;
  }

  /**
   * 방 내 모든 유저의 프레즌스 조회
   */
  getRoomPresence(roomId: string): PresenceResponseDto[] {
    const presences: PresenceResponseDto[] = [];
    for (const presence of this.presenceMap.values()) {
      if (presence.roomId === roomId) {
        presences.push(this.toResponseDto(presence));
      }
    }
    return presences;
  }

  /**
   * 특정 유저의 프레즌스 조회
   */
  getUserPresence(roomId: string, userId: string): UserPresence | null {
    const key = this.getKey(roomId, userId);
    return this.presenceMap.get(key) || null;
  }

  private getKey(roomId: string, userId: string): string {
    return `${roomId}:${userId}`;
  }

  private toResponseDto(presence: UserPresence): PresenceResponseDto {
    return {
      userId: presence.userId,
      userName: presence.userName,
      profileImage: presence.profileImage,
      status: presence.status,
      roomId: presence.roomId,
    };
  }
}
