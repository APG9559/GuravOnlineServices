import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VoterCardsService } from './voter-cards.service';
import { VoterCardRecord } from './voter-card.entity';
import { CustomersService } from '../customers/customers.service';
import { User } from '../users/user.entity';

describe('VoterCardsService', () => {
  let service: VoterCardsService;

  const mockUser: Partial<User> = {
    id: 'user-1',
    name: 'CSC Operator',
  };

  const mockRecord: VoterCardRecord = {
    id: 'voter-1',
    applicationType: 'NewVoterCard',
    customerName: 'Seema Jadhav',
    phone: '9844556677',
    officialFee: 0,
    serviceFee: 100,
    amountCharged: 100,
    dateOfService: '2026-07-17',
    createdBy: mockUser as User,
  } as unknown as VoterCardRecord;

  const mockRecordQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([
      {
        entity_id: 'voter-1',
        entity_dateOfService: '2026-07-17',
        entity_officialFee: 0,
        entity_serviceFee: 100,
        entity_amountCharged: 100,
        u_id: 'user-1',
        u_name: 'CSC Operator',
      },
    ]),
  };

  const mockRecordRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'voter-1', ...entity })),
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
    upsertByPhone: jest.fn().mockResolvedValue({ id: 'cust-1', name: 'Seema Jadhav' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoterCardsService,
        { provide: getRepositoryToken(VoterCardRecord), useValue: mockRecordRepo },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    service = module.get<VoterCardsService>(VoterCardsService);
  });

  describe('create', () => {
    it('upserts customer by phone and creates voter card record', async () => {
      mockRecordRepo.findOne.mockResolvedValueOnce(mockRecord);

      const dto = {
        applicationType: 'NewVoterCard',
        customerName: 'Seema Jadhav',
        phone: '9844556677',
        officialFee: 0,
        serviceFee: 100,
        amountCharged: 100,
        dateOfService: '2026-07-17',
      };

      const result = await service.create(dto as any, mockUser as User);

      expect(mockCustomersService.upsertByPhone).toHaveBeenCalledWith('Seema Jadhav', '9844556677', null, null);
      expect(mockRecordRepo.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getDashboardMetrics', () => {
    it('computes total gross and net revenue metrics', async () => {
      const metrics = await service.getDashboardMetrics('2026-07-01', '2026-07-31');

      expect(metrics.key).toBe('voterCards');
      expect(metrics.count).toBe(1);
      expect(metrics.gross).toBe(100);
      expect(metrics.net).toBe(100);
    });
  });
});
