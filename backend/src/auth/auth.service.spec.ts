import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Passkey } from './passkey.entity';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-123',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    isActive: true,
    isFirstLogin: false,
    passwordHash: '$2b$10$abcdefghijklmnopqrstuu', // mock bcrypt hash
  };

  const mockUsersService = {
    findByEmailOrName: jest.fn(),
    findOne: jest.fn(),
    updatePasswordAndClearFirstLogin: jest.fn(),
    updateProfile: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockPasskeyRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: getRepositoryToken(Passkey), useValue: mockPasskeyRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('returns access token and user info on valid credentials', async () => {
      mockUsersService.findByEmailOrName.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true as never));

      const result = await service.login({ email: 'admin@example.com', password: 'password123' });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('admin@example.com');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('throws UnauthorizedException if user is not found or inactive', async () => {
      mockUsersService.findByEmailOrName.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if password comparison fails', async () => {
      mockUsersService.findByEmailOrName.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false as never));

      await expect(
        service.login({ email: 'admin@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('me', () => {
    it('returns user details by ID', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await service.me('user-123');

      expect(result.id).toBe('user-123');
      expect(result.name).toBe('Admin User');
    });
  });
});
