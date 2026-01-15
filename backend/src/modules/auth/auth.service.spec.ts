import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { GoogleUser } from './strategies/google.strategy';
import { User } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    profileImage: 'https://example.com/photo.jpg',
    googleId: 'google-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockGoogleUser: GoogleUser = {
    googleId: 'google-123',
    email: 'test@example.com',
    name: 'Test User',
    profileImage: 'https://example.com/photo.jpg',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOrCreateByGoogle: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('googleLogin', () => {
    it('should return auth response with token and user', async () => {
      usersService.findOrCreateByGoogle.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.googleLogin(mockGoogleUser);

      expect(usersService.findOrCreateByGoogle).toHaveBeenCalledWith({
        googleId: mockGoogleUser.googleId,
        email: mockGoogleUser.email,
        name: mockGoogleUser.name,
        profileImage: mockGoogleUser.profileImage,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          profileImage: mockUser.profileImage,
          createdAt: mockUser.createdAt,
        },
      });
    });
  });

  describe('generateAccessToken', () => {
    it('should generate JWT token with user payload', () => {
      jwtService.sign.mockReturnValue('generated-token');

      const result = service.generateAccessToken(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toBe('generated-token');
    });
  });

  describe('toUserResponse', () => {
    it('should convert User to UserResponseDto', () => {
      const result = service.toUserResponse(mockUser);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        profileImage: mockUser.profileImage,
        createdAt: mockUser.createdAt,
      });
    });

    it('should handle null values', () => {
      const userWithNulls: User = {
        ...mockUser,
        name: null,
        profileImage: null,
      };

      const result = service.toUserResponse(userWithNulls);

      expect(result.name).toBeNull();
      expect(result.profileImage).toBeNull();
    });
  });
});
