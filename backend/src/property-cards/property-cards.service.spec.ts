import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PropertyCardsService } from './property-cards.service';
import { PropertyCard } from './property-card.entity';
import { CustomersService } from '../customers/customers.service';
import { User } from '../users/user.entity';

describe('PropertyCardsService', () => {
  let service: PropertyCardsService;

  const mockUser: Partial<User> = { id: 'user-1', name: 'Operator' };

  const mockRecord: PropertyCard = {
    id: 'pc-1',
    customerName: 'Mahesh Joshi',
    phone: '9876501234',
    recordType: 'SevenTwelve',
    propertyNumber: 'PROP-500',
    dateOfService: '2026-07-12',
    amountCharged: 400,
    createdBy: mockUser as User,
    createdAt: new Date(),
  } as unknown as PropertyCard;

  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([{
      entity_id: 'pc-1',
      entity_dateOfService: '2026-07-12',
      entity_amountCharged: 400,
      entity_recordType: 'SevenTwelve',
      u_id: 'user-1',
      u_name: 'Operator',
    }]),
  };

  const mockRepo = {
    find: jest.fn().mockResolvedValue([mockRecord]),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'pc-1', ...entity })),
    softRemove: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    metadata: {
      relations: [{ propertyName: 'createdBy' }, { propertyName: 'customer' }],
      columns: [
        { propertyName: 'id' },
        { propertyName: 'dateOfService' },
        { propertyName: 'amountCharged' },
        { propertyName: 'createdAt' },
        { propertyName: 'recordType' },
      ],
    },
  };

  const mockCustomersService = {
    upsertByPhone: jest.fn().mockResolvedValue({ id: 'cust-1', name: 'Mahesh Joshi' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyCardsService,
        { provide: getRepositoryToken(PropertyCard), useValue: mockRepo },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();
    service = module.get<PropertyCardsService>(PropertyCardsService);
  });

  describe('create', () => {
    it('upserts customer and creates property card record', async () => {
      const dto = {
        customerName: 'Mahesh Joshi',
        phone: '9876501234',
        recordType: 'SevenTwelve',
        propertyNumber: 'PROP-500',
        dateOfService: '2026-07-12',
        amountCharged: 400,
      };
      const result = await service.create(dto as any, mockUser as User);
      expect(mockCustomersService.upsertByPhone).toHaveBeenCalled();
      expect(mockRepo.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('returns record by id', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockRecord);
      expect((await service.findOne('pc-1')).id).toBe('pc-1');
    });

    it('throws NotFoundException if missing', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDashboardMetrics', () => {
    it('returns metrics with recordType breakdown', async () => {
      const m = await service.getDashboardMetrics('2026-07-01', '2026-07-31');
      expect(m.key).toBe('propertyCards');
      expect(m.category).toBe('AapleSarkar');
      expect(m.count).toBe(1);
      expect(m.gross).toBe(400);
    });
  });

  describe('getCustomerHistory', () => {
    it('returns formatted history items', async () => {
      const h = await service.getCustomerHistory('cust-1');
      expect(h).toHaveLength(1);
      expect(h[0].type).toBe('property-card');
      expect(h[0].description).toContain('PROP-500');
    });
  });
});
