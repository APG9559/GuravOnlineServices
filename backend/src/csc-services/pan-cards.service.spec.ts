import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PanCardsService } from './pan-cards.service';
import { PanCardRecord } from './pan-card.entity';
import { CustomersService } from '../customers/customers.service';
import { User } from '../users/user.entity';

describe('PanCardsService', () => {
  let service: PanCardsService;

  const mockUser: Partial<User> = {
    id: 'user-1',
    name: 'CSC Operator',
  };

  const mockRecord: PanCardRecord = {
    id: 'pan-1',
    applicationType: 'NewPanCard',
    customerName: 'Vijay Bhosale',
    phone: '9765432109',
    officialFee: 107,
    serviceFee: 150,
    amountCharged: 257,
    dateOfService: '2026-07-14',
    createdBy: mockUser as User,
  } as unknown as PanCardRecord;

  const mockRecordQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([
      {
        entity_id: 'pan-1',
        entity_dateOfService: '2026-07-14',
        entity_officialFee: 107,
        entity_serviceFee: 150,
        entity_amountCharged: 257,
        u_id: 'user-1',
        u_name: 'CSC Operator',
      },
    ]),
  };

  const mockRecordRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'pan-1', ...entity })),
    softRemove: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(() => mockRecordQueryBuilder),
    metadata: {
      relations: [
        { propertyName: 'createdBy' },
        { propertyName: 'customer' },
      ],
      columns: [
        { propertyName: 'id' },
        { propertyName: 'dateOfService' },
        { propertyName: 'amountCharged' },
        { propertyName: 'officialFee' },
        { propertyName: 'createdAt' },
      ],
    },
  };

  const mockCustomersService = {
    upsertByPhone: jest.fn().mockResolvedValue({ id: 'cust-1', name: 'Vijay Bhosale' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PanCardsService,
        { provide: getRepositoryToken(PanCardRecord), useValue: mockRecordRepo },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    service = module.get<PanCardsService>(PanCardsService);
  });

  describe('create', () => {
    it('upserts customer by phone and creates PAN card application record', async () => {
      mockRecordRepo.findOne.mockResolvedValueOnce(mockRecord);

      const dto = {
        applicationType: 'NewPanCard',
        customerName: 'Vijay Bhosale',
        phone: '9765432109',
        officialFee: 107,
        serviceFee: 150,
        amountCharged: 257,
        dateOfService: '2026-07-14',
      };

      const result = await service.create(dto as any, mockUser as User);

      expect(mockCustomersService.upsertByPhone).toHaveBeenCalledWith('Vijay Bhosale', '9765432109', null, null);
      expect(mockRecordRepo.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getDashboardMetrics', () => {
    it('computes total gross and net revenue metrics', async () => {
      const metrics = await service.getDashboardMetrics('2026-07-01', '2026-07-31');

      expect(metrics.key).toBe('panCards');
      expect(metrics.count).toBe(1);
      expect(metrics.gross).toBe(257);
      expect(metrics.net).toBe(150); // 257 - 107 = 150
    });
  });
});
