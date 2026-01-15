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
    return this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { googleId: profile.googleId },
      });

      if (existingUser) {
        return tx.user.update({
          where: { id: existingUser.id },
          data: {
            name: profile.name,
            profileImage: profile.profileImage,
          },
        });
      }

      const existingEmailUser = await tx.user.findUnique({
        where: { email: profile.email },
      });

      if (existingEmailUser) {
        return tx.user.update({
          where: { id: existingEmailUser.id },
          data: {
            googleId: profile.googleId,
            name: profile.name ?? existingEmailUser.name,
            profileImage: profile.profileImage ?? existingEmailUser.profileImage,
          },
        });
      }

      return tx.user.create({
        data: {
          email: profile.email,
          googleId: profile.googleId,
          name: profile.name,
          profileImage: profile.profileImage,
        },
      });
    });
  }
}
