import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivityLogService } from './activity-log.service';
import { ActivityLog } from './activity-log.entity';
import { User } from '../users/user.entity';

describe('ActivityLogService', () => {
  let service: ActivityLogService;

  const mockUser: Partial<User> = {
    id: 'user-1',
    name: 'Admin',
  };

  const mockLog: ActivityLog = {
    id: 'log-1',
    action: 'CREATE',
    module: 'affidavits',
    recordId: 'aff-123',
    details: { name: 'Test' },
    user: mockUser as User,
    createdAt: new Date('2026-07-10T10:00:00Z'),
  } as ActivityLog;

  const mockRepo = {
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'log-1', ...entity })),
    findAndCount: jest.fn().mockResolvedValue([[mockLog], 1]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogService,
        { provide: getRepositoryToken(ActivityLog), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ActivityLogService>(ActivityLogService);
  });

  describe('createLog', () => {
    it('creates and saves an activity log entry', async () => {
      const result = await service.createLog(
        'CREATE', 'affidavits', 'aff-123', { name: 'Test' }, mockUser as User,
      );

      expect(mockRepo.create).toHaveBeenCalledWith({
        action: 'CREATE',
        module: 'affidavits',
        recordId: 'aff-123',
        details: { name: 'Test' },
        user: mockUser,
      });
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('handles null user and recordId gracefully', async () => {
      await service.createLog('LOGIN', 'auth', null, null, null);

      expect(mockRepo.create).toHaveBeenCalledWith({
        action: 'LOGIN',
        module: 'auth',
        recordId: null,
        details: null,
        user: null,
      });
    });
  });

  describe('findAll', () => {
    it('returns paginated activity logs with user relations', async () => {
      const result = await service.findAll(50, 0);

      expect(mockRepo.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        take: 50,
        skip: 0,
        relations: ['user'],
      });
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].action).toBe('CREATE');
    });

    it('uses default limit and offset when not specified', async () => {
      await service.findAll();

      expect(mockRepo.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        take: 100,
        skip: 0,
        relations: ['user'],
      });
    });
  });
});
