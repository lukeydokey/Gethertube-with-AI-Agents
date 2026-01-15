import { Test, TestingModule } from '@nestjs/testing';
import { UsersService, GoogleUserProfile } from './users.service';
import { PrismaService } from '../../database';
import { User } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    profileImage: 'https://example.com/photo.jpg',
    googleId: 'google-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockGoogleProfile: GoogleUserProfile = {
    googleId: 'google-123',
    email: 'test@example.com',
    name: 'Test User',
    profileImage: 'https://example.com/photo.jpg',
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('user-123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByGoogleId', () => {
    it('should return user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByGoogleId('google-123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { googleId: 'google-123' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOrCreateByGoogle', () => {
    it('should update existing user when found by googleId', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.findOrCreateByGoogle(mockGoogleProfile);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { googleId: mockGoogleProfile.googleId },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          name: mockGoogleProfile.name,
          profileImage: mockGoogleProfile.profileImage,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should link googleId to existing email user', async () => {
      const existingEmailUser = { ...mockUser, googleId: null };
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // googleId not found
        .mockResolvedValueOnce(existingEmailUser); // email found
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.findOrCreateByGoogle(mockGoogleProfile);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: existingEmailUser.id },
        data: {
          googleId: mockGoogleProfile.googleId,
          name: mockGoogleProfile.name,
          profileImage: mockGoogleProfile.profileImage,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should create new user when not found', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // googleId not found
        .mockResolvedValueOnce(null); // email not found
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.findOrCreateByGoogle(mockGoogleProfile);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: mockGoogleProfile.email,
          googleId: mockGoogleProfile.googleId,
          name: mockGoogleProfile.name,
          profileImage: mockGoogleProfile.profileImage,
        },
      });
      expect(result).toEqual(mockUser);
    });
  });
});
