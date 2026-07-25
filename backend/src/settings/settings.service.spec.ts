import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SettingsService, DEFAULT_PRICING } from './settings.service';
import { PricingSetting } from './pricing-setting.entity';
import { User } from '../users/user.entity';

describe('SettingsService', () => {
  let service: SettingsService;

  const mockUser: Partial<User> = {
    id: 'admin-1',
    name: 'Admin',
  };

  const mockPricingSetting: PricingSetting = {
    id: 'setting-1',
    key: 'magistrate_fee',
    value: 350,
    label: 'Executive Magistrate fee',
    group: 'affidavit',
    updatedAt: new Date(),
    updatedBy: mockUser as User,
  } as PricingSetting;

  const mockEntityManager = {
    connection: {
      entityMetadatas: [
        { tableName: 'users' },
        { tableName: 'affidavits' },
        { tableName: 'marriages' },
      ],
    },
    query: jest.fn().mockResolvedValue(undefined),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((entityClass, dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve(entity)),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    }),
  };

  const mockRepo = {
    find: jest.fn().mockResolvedValue([mockPricingSetting]),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'setting-1', ...entity })),
    manager: mockEntityManager,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getRepositoryToken(PricingSetting), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  describe('getAll & getPricingMap', () => {
    it('returns all settings ordered by group and key', async () => {
      const result = await service.getAll();

      expect(mockRepo.find).toHaveBeenCalledWith({ order: { group: 'ASC', key: 'ASC' } });
      expect(result).toEqual([mockPricingSetting]);
    });

    it('transforms pricing settings array into key-value map', async () => {
      const map = await service.getPricingMap();

      expect(map).toEqual({ magistrate_fee: 350 });
    });
  });

  describe('updateMany & resetDefaults', () => {
    it('updates matching settings keys with new numeric values', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ ...mockPricingSetting });

      const updates = { magistrate_fee: 400 };
      const results = await service.updateMany(updates, mockUser as User);

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ value: 400, updatedBy: mockUser }),
      );
      expect(results[0].value).toBe(400);
    });

    it('resets pricing settings to DEFAULT_PRICING values', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockPricingSetting });

      const results = await service.resetDefaults(mockUser as User);

      expect(results.length).toBeGreaterThan(0);
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('clearDatabase', () => {
    it('executes TRUNCATE TABLE for non-excluded entities', async () => {
      const result = await service.clearDatabase();

      expect(mockEntityManager.query).toHaveBeenCalledWith(
        'TRUNCATE TABLE "affidavits", "marriages" RESTART IDENTITY CASCADE;',
      );
      expect(result.success).toBe(true);
    });
  });
});
