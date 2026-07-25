import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { GazettesService } from './gazettes.service';
import { Gazette } from './gazette.entity';
import { CustomersService } from '../customers/customers.service';
import { User } from '../users/user.entity';

describe('GazettesService', () => {
  let service: GazettesService;

  const mockUser: Partial<User> = {
    id: 'user-1',
    name: 'Operator',
  };

  const mockRecord: Gazette = {
    id: 'gaz-1',
    customerName: 'Anil Deshmukh',
    phone: '9811122233',
    oldName: 'Anil Kumar',
    newName: 'Anil Deshmukh',
    reasonToChangeName: 'After marriage',
    tokenNo: 'TK-200',
    dateOfService: '2026-07-15',
    officialFee: 500,
    serviceFee: 300,
    amountCharged: 800,
    createdBy: mockUser as User,
    createdAt: new Date(),
  } as unknown as Gazette;

  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([
      {
        entity_id: 'gaz-1',
        entity_dateOfService: '2026-07-15',
        entity_amountCharged: 800,
        entity_officialFee: 500,
        u_id: 'user-1',
        u_name: 'Operator',
      },
    ]),
  };

  const mockRepo = {
    find: jest.fn().mockResolvedValue([mockRecord]),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'gaz-1', ...entity })),
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
        { propertyName: 'officialFee' },
        { propertyName: 'createdAt' },
      ],
    },
  };

  const mockCustomersService = {
    upsertByPhone: jest.fn().mockResolvedValue({ id: 'cust-1', name: 'Anil Deshmukh' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GazettesService,
        { provide: getRepositoryToken(Gazette), useValue: mockRepo },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    service = module.get<GazettesService>(GazettesService);
  });

  describe('create', () => {
    it('upserts customer by phone and creates gazette record', async () => {

      const dto = {
        customerName: 'Anil Deshmukh',
        phone: '9811122233',
        oldName: 'Anil Kumar',
        newName: 'Anil Deshmukh',
        reasonToChangeName: 'After marriage',
        dateOfService: '2026-07-15',
        officialFee: 500,
        serviceFee: 300,
        amountCharged: 800,
      };

      const result = await service.create(dto as any, mockUser as User);

      expect(mockCustomersService.upsertByPhone).toHaveBeenCalledWith('Anil Deshmukh', '9811122233', null, null);
      expect(mockRepo.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('returns gazette record by id', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockRecord);

      const result = await service.findOne('gaz-1');

      expect(result.id).toBe('gaz-1');
    });

    it('throws NotFoundException if record missing', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDashboardMetrics', () => {
    it('calculates gross and net (gross minus officialFee) metrics', async () => {
      const metrics = await service.getDashboardMetrics('2026-07-01', '2026-07-31');

      expect(metrics.key).toBe('gazettes');
      expect(metrics.label).toBe('Gazettes');
      expect(metrics.category).toBe('AapleSarkar');
      expect(metrics.count).toBe(1);
      expect(metrics.gross).toBe(800);
      expect(metrics.net).toBe(300); // 800 - 500 = 300
    });
  });

  describe('getCustomerHistory', () => {
    it('returns formatted customer history items', async () => {
      const history = await service.getCustomerHistory('cust-1');

      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('gazette');
      expect(history[0].typeName).toBe('Gazette Name Change');
      expect(history[0].description).toContain('Anil Kumar');
      expect(history[0].description).toContain('Anil Deshmukh');
    });
  });
});
