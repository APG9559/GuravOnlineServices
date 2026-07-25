import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TradeLicensesService } from './trade-licenses.service';
import { TradeLicenseRecord } from './trade-license-record.entity';
import { TradeLicensePayment } from './trade-license-payment.entity';
import { TradeTypeConfig } from './trade-type-config.entity';
import { Business } from './business.entity';
import { BusinessTrade } from './business-trade.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';
import { CustomersService } from '../customers/customers.service';
import { User } from '../users/user.entity';

describe('TradeLicensesService', () => {
  let service: TradeLicensesService;

  const mockUser: Partial<User> = {
    id: 'user-1',
    name: 'Operator',
  };

  const mockRecord: TradeLicenseRecord = {
    id: 'tl-1',
    serviceType: 'New',
    customerName: 'Ganesh General Store',
    phone: '9822112233',
    licenseFee: 1000,
    fireFee: 0,
    protocolFee: 0,
    serviceFee: 300,
    amountCharged: 1300,
    dateOfService: '2026-07-18',
    createdBy: mockUser as User,
  } as unknown as TradeLicenseRecord;

  const mockRecordQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([
      {
        entity_id: 'tl-1',
        entity_dateOfService: '2026-07-18',
        entity_amountCharged: 1300,
        entity_licenseFee: 1000,
        entity_fireFee: 0,
        entity_protocolFee: 0,
        u_id: 'user-1',
        u_name: 'Operator',
      },
    ]),
  };

  const mockRecordRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'tl-1', ...entity })),
    softRemove: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(() => mockRecordQueryBuilder),
    metadata: {
      relations: [
        { propertyName: 'createdBy' },
        { propertyName: 'business' },
        { propertyName: 'linkedAffidavit' },
        { propertyName: 'linkedPropertyCard' },
        { propertyName: 'linkedShopAct' },
        { propertyName: 'payments' },
      ],
      columns: [
        { propertyName: 'id' },
        { propertyName: 'dateOfService' },
        { propertyName: 'amountCharged' },
        { propertyName: 'licenseFee' },
        { propertyName: 'fireFee' },
        { propertyName: 'protocolFee' },
        { propertyName: 'serviceFee' },
        { propertyName: 'createdAt' },
      ],
    },
  };

  const mockPaymentQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockPaymentRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'pay-1', ...entity })),
    softRemove: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(() => mockPaymentQueryBuilder),
  };

  const mockConfigRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockBusinessRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'biz-1', ...entity })),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
  };

  const mockBusinessTradeRepo = {
    find: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'bt-1', ...entity })),
    softRemove: jest.fn(),
  };

  const mockAffidavitRepo = { findOneBy: jest.fn() };
  const mockPropertyCardRepo = { findOneBy: jest.fn() };
  const mockShopActRepo = { findOneBy: jest.fn() };

  const mockCustomersService = {
    upsertByPhone: jest.fn().mockResolvedValue({ id: 'cust-1', name: 'Ganesh General Store' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradeLicensesService,
        { provide: getRepositoryToken(TradeLicenseRecord), useValue: mockRecordRepo },
        { provide: getRepositoryToken(TradeLicensePayment), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(TradeTypeConfig), useValue: mockConfigRepo },
        { provide: getRepositoryToken(Business), useValue: mockBusinessRepo },
        { provide: getRepositoryToken(BusinessTrade), useValue: mockBusinessTradeRepo },
        { provide: getRepositoryToken(Affidavit), useValue: mockAffidavitRepo },
        { provide: getRepositoryToken(PropertyCard), useValue: mockPropertyCardRepo },
        { provide: getRepositoryToken(ShopActLicense), useValue: mockShopActRepo },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    service = module.get<TradeLicensesService>(TradeLicensesService);
  });

  describe('getDashboardMetrics', () => {
    it('computes total gross and net revenue metrics', async () => {
      const metrics = await service.getDashboardMetrics('2026-07-01', '2026-07-31');

      expect(metrics.key).toBe('tradeLicenses');
      expect(metrics.label).toBe('Trade Licenses');
      expect(metrics.category).toBe('KMC');
      expect(metrics.count).toBe(1);
      expect(metrics.gross).toBe(1300);
      expect(metrics.net).toBe(300); // 1300 - 1000 - 0 - 0 = 300
    });
  });
});
