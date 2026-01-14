import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database';

export interface GoogleUserProfile {
  googleId: string;
  email: string;
  name?: string;
  profileImage?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async findOrCreateByGoogle(profile: GoogleUserProfile) {
    const existingUser = await this.findByGoogleId(profile.googleId);

    if (existingUser) {
      // 기존 사용자 정보 업데이트
      return this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: profile.name,
          profileImage: profile.profileImage,
        },
      });
    }

    // 이메일로 기존 사용자 확인 (다른 방법으로 가입한 경우)
    const existingEmailUser = await this.findByEmail(profile.email);

    if (existingEmailUser) {
      // Google ID 연결
      return this.prisma.user.update({
        where: { id: existingEmailUser.id },
        data: {
          googleId: profile.googleId,
          name: profile.name ?? existingEmailUser.name,
          profileImage: profile.profileImage ?? existingEmailUser.profileImage,
        },
      });
    }

    // 새 사용자 생성
    return this.prisma.user.create({
      data: {
        email: profile.email,
        googleId: profile.googleId,
        name: profile.name,
        profileImage: profile.profileImage,
      },
    });
  }
}
