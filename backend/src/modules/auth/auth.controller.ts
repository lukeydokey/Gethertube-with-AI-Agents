import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { GoogleUser } from './strategies/google.strategy';
import { UserResponseDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth 로그인 시작' })
  @ApiResponse({ status: 302, description: 'Google 로그인 페이지로 리다이렉트' })
  googleAuth() {
    // Google OAuth 페이지로 리다이렉트됨
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth 콜백' })
  @ApiResponse({ status: 302, description: '프론트엔드로 토큰과 함께 리다이렉트' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as GoogleUser;
    const authResponse = await this.authService.googleLogin(googleUser);

    // 프론트엔드로 토큰과 함께 리다이렉트 (URL fragment 사용 - 서버 로그에 노출 방지)
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const redirectUrl = `${frontendUrl}/auth/callback#token=${authResponse.accessToken}`;

    res.redirect(redirectUrl);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 로그인한 사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보', type: UserResponseDto })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  getMe(@Req() req: Request): UserResponseDto {
    const user = req.user as User;
    return this.authService.toUserResponse(user);
  }
}
