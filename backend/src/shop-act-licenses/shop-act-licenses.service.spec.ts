import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShopActLicensesService } from './shop-act-licenses.service';
import { ShopActLicense } from './shop-act-license.entity';
import { CustomersService } from '../customers/customers.service';
import { User } from '../users/user.entity';

describe('ShopActLicensesService', () => {
  let service: ShopActLicensesService;

  const mockUser: Partial<User> = {
    id: 'user-1',
    name: 'Operator',
  };

  const mockRecord: ShopActLicense = {
    id: 'sal-1',
    customerName: 'Kadam Electronics',
    phone: '9822998877',
    officialFee: 0,
    serviceFee: 500,
    amountCharged: 500,
    dateOfService: '2026-07-12',
    createdBy: mockUser as User,
  } as unknown as ShopActLicense;

  const mockRecordQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([
      {
        entity_id: 'sal-1',
        entity_dateOfService: '2026-07-12',
        entity_amountCharged: 500,
        u_id: 'user-1',
        u_name: 'Operator',
      },
    ]),
  };

  const mockRecordRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'sal-1', ...entity })),
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
        { propertyName: 'createdAt' },
      ],
    },
  };

  const mockCustomersService = {
    upsertByPhone: jest.fn().mockResolvedValue({ id: 'cust-1', name: 'Kadam Electronics' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopActLicensesService,
        { provide: getRepositoryToken(ShopActLicense), useValue: mockRecordRepo },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    service = module.get<ShopActLicensesService>(ShopActLicensesService);
  });

  describe('create', () => {
    it('upserts customer by phone and creates shop act license record', async () => {
      mockRecordRepo.findOne.mockResolvedValueOnce(mockRecord);

      const dto = {
        customerName: 'Kadam Electronics',
        phone: '9822998877',
        officialFee: 0,
        serviceFee: 500,
        amountCharged: 500,
        dateOfService: '2026-07-12',
      };

      const result = await service.create(dto as any, mockUser as User);

      expect(mockCustomersService.upsertByPhone).toHaveBeenCalledWith('Kadam Electronics', '9822998877', null, null);
      expect(mockRecordRepo.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getDashboardMetrics', () => {
    it('computes total gross and net revenue metrics', async () => {
      const metrics = await service.getDashboardMetrics('2026-07-01', '2026-07-31');

      expect(metrics.key).toBe('shopAct');
      expect(metrics.count).toBe(1);
      expect(metrics.gross).toBe(500);
      expect(metrics.net).toBe(441); // 500 - 59 = 441
    });
  });
});
