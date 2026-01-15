import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { GoogleUser } from './strategies/google.strategy';
import { AuthResponseDto, UserResponseDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async googleLogin(googleUser: GoogleUser): Promise<AuthResponseDto> {
    const user = await this.usersService.findOrCreateByGoogle({
      googleId: googleUser.googleId,
      email: googleUser.email,
      name: googleUser.name,
      profileImage: googleUser.profileImage,
    });

    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      user: this.toUserResponse(user),
    };
  }

  generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }

  toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    };
  }
}
