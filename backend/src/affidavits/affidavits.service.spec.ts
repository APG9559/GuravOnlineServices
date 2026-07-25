import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AffidavitsService } from './affidavits.service';
import { Affidavit } from './affidavit.entity';
import { CustomersService } from '../customers/customers.service';
import { User } from '../users/user.entity';

describe('AffidavitsService', () => {
  let service: AffidavitsService;

  const mockUser: Partial<User> = {
    id: 'user-1',
    name: 'Operator',
  };

  const mockAffidavit: Affidavit = {
    id: 'aff-123',
    affidavitType: 'NameChange',
    customerName: 'Prakash Kadam',
    phone: '9876543210',
    dateOfService: '2026-07-10',
    officialFee: 350,
    serviceFee: 200,
    amountCharged: 550,
    createdBy: mockUser as User,
  } as unknown as Affidavit;

  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([
      {
        entity_id: 'aff-123',
        entity_dateOfService: '2026-07-10',
        entity_amountCharged: 550,
        entity_authorizerType: 'magistrate',
        entity_paperType: 'stamp500',
        u_id: 'user-1',
        u_name: 'Operator',
      },
    ]),
  };

  const mockAffidavitRepo = {
    find: jest.fn().mockResolvedValue([mockAffidavit]),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'aff-123', ...entity })),
    softRemove: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
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
        { propertyName: 'customerBroughtStamp' },
        { propertyName: 'paperType' },
        { propertyName: 'authorizerType' },
        { propertyName: 'notaryPublicFee' },
      ],
    },
  };

  const mockCustomersService = {
    upsertByPhone: jest.fn().mockResolvedValue({ id: 'cust-1', name: 'Prakash Kadam' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AffidavitsService,
        { provide: getRepositoryToken(Affidavit), useValue: mockAffidavitRepo },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    service = module.get<AffidavitsService>(AffidavitsService);
  });

  describe('create', () => {
    it('upserts customer by phone and creates affidavit record', async () => {

      const dto = {
        affidavitType: 'NameChange',
        customerName: 'Prakash Kadam',
        phone: '9876543210',
        dateOfService: '2026-07-10',
        officialFee: 350,
        serviceFee: 200,
        amountCharged: 550,
      };

      const result = await service.create(dto as any, mockUser as User);

      expect(mockCustomersService.upsertByPhone).toHaveBeenCalledWith('Prakash Kadam', '9876543210', null, null);
      expect(mockAffidavitRepo.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('returns affidavit by id', async () => {
      mockAffidavitRepo.findOne.mockResolvedValueOnce(mockAffidavit);

      const result = await service.findOne('aff-123');

      expect(result.id).toBe('aff-123');
    });

    it('throws NotFoundException if record missing', async () => {
      mockAffidavitRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDashboardMetrics', () => {
    it('calculates gross revenue and service fee metrics', async () => {
      const pricing = { stamp500_cost: 500, plain_cost: 0 };
      const metrics = await service.getDashboardMetrics('2026-07-01', '2026-07-31', pricing);

      expect(metrics.key).toBe('affidavits');
      expect(metrics.count).toBe(1);
      expect(metrics.gross).toBe(550);
    });
  });
});
