import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PassportsService } from './passports.service';
import { PassportRecord } from './passport.entity';
import { CustomersService } from '../customers/customers.service';
import { User } from '../users/user.entity';

describe('PassportsService', () => {
  let service: PassportsService;

  const mockUser: Partial<User> = {
    id: 'user-1',
    name: 'CSC Operator',
  };

  const mockRecord: PassportRecord = {
    id: 'pass-1',
    applicationType: 'FreshPassport',
    customerName: 'Mahesh Deshmukh',
    phone: '9811223344',
    officialFee: 1500,
    serviceFee: 400,
    amountCharged: 1900,
    dateOfService: '2026-07-16',
    createdBy: mockUser as User,
  } as unknown as PassportRecord;

  const mockRecordQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([
      {
        entity_id: 'pass-1',
        entity_dateOfService: '2026-07-16',
        entity_officialFee: 1500,
        entity_serviceFee: 400,
        entity_amountCharged: 1900,
        u_id: 'user-1',
        u_name: 'CSC Operator',
      },
    ]),
  };

  const mockRecordRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'pass-1', ...entity })),
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
    upsertByPhone: jest.fn().mockResolvedValue({ id: 'cust-1', name: 'Mahesh Deshmukh' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PassportsService,
        { provide: getRepositoryToken(PassportRecord), useValue: mockRecordRepo },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    service = module.get<PassportsService>(PassportsService);
  });

  describe('create', () => {
    it('upserts customer by phone and creates passport record', async () => {
      mockRecordRepo.findOne.mockResolvedValueOnce(mockRecord);

      const dto = {
        applicationType: 'FreshPassport',
        customerName: 'Mahesh Deshmukh',
        phone: '9811223344',
        officialFee: 1500,
        serviceFee: 400,
        amountCharged: 1900,
        dateOfService: '2026-07-16',
      };

      const result = await service.create(dto as any, mockUser as User);

      expect(mockCustomersService.upsertByPhone).toHaveBeenCalledWith('Mahesh Deshmukh', '9811223344', null, null);
      expect(mockRecordRepo.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getDashboardMetrics', () => {
    it('computes total gross and net revenue metrics', async () => {
      const metrics = await service.getDashboardMetrics('2026-07-01', '2026-07-31');

      expect(metrics.key).toBe('passports');
      expect(metrics.count).toBe(1);
      expect(metrics.gross).toBe(1900);
      expect(metrics.net).toBe(400); // 1900 - 1500 = 400
    });
  });
});
