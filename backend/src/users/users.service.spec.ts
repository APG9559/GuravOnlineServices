import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser: User = {
    id: 'user-123',
    name: 'Test Operator',
    email: 'operator@test.com',
    role: 'operator',
    isActive: true,
    isFirstLogin: true,
    passwordHash: '$2b$10$hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as User;

  const mockRepo = {
    find: jest.fn().mockResolvedValue([mockUser]),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'user-123', ...entity })),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('hashes password and creates user', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('$2b$10$newhashedpass' as never));

      const dto = { name: 'New Staff', email: 'staff@test.com', password: 'secretpassword', role: 'operator' };
      const result = await service.create(dto as any);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { email: 'staff@test.com' } });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: '$2b$10$newhashedpass' }),
      );
      expect(result).toBeDefined();
    });

    it('throws ConflictException if email is already registered', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockUser);

      await expect(
        service.create({ email: 'operator@test.com', password: 'pass' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne & findByEmailOrName', () => {
    it('returns user by id', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.findOne('user-123');
      expect(result.id).toBe('user-123');
    });

    it('throws NotFoundException if user id is missing', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('searches user by email or name', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.findByEmailOrName('operator@test.com');
      expect(result?.email).toBe('operator@test.com');
    });
  });

  describe('updatePasswordAndClearFirstLogin', () => {
    it('updates password hash and sets isFirstLogin to false', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ ...mockUser, isFirstLogin: true });
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('$2b$10$updatedpass' as never));

      const result = await service.updatePasswordAndClearFirstLogin('user-123', 'newpassword123');

      expect(result.isFirstLogin).toBe(false);
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isFirstLogin: false, passwordHash: '$2b$10$updatedpass' }),
      );
    });
  });

  describe('remove', () => {
    it('removes user entity', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockUser);

      await service.remove('user-123');

      expect(mockRepo.remove).toHaveBeenCalledWith(mockUser);
    });
  });
});
