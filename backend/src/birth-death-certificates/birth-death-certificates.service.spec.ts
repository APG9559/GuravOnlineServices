import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { BirthDeathCertificatesService } from './birth-death-certificates.service';
import { BirthDeathCertificate } from './birth-death-certificate.entity';
import { CustomersService } from '../customers/customers.service';
import { User } from '../users/user.entity';

describe('BirthDeathCertificatesService', () => {
  let service: BirthDeathCertificatesService;

  const mockUser: Partial<User> = {
    id: 'user-1',
    name: 'Operator',
  };

  const mockRecord: BirthDeathCertificate = {
    id: 'bd-1',
    certificateType: 'Birth',
    customerName: 'Ramesh Patil',
    phone: '9876543210',
    personName: 'Baby Patil',
    eventDate: '2026-01-15',
    dateOfService: '2026-07-10',
    numberOfCopies: 2,
    amountCharged: 300,
    createdBy: mockUser as User,
    createdAt: new Date(),
  } as unknown as BirthDeathCertificate;

  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([
      {
        entity_id: 'bd-1',
        entity_dateOfService: '2026-07-10',
        entity_amountCharged: 300,
        entity_certificateType: 'Birth',
        u_id: 'user-1',
        u_name: 'Operator',
      },
    ]),
  };

  const mockRepo = {
    find: jest.fn().mockResolvedValue([mockRecord]),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'bd-1', ...entity })),
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
        { propertyName: 'certificateType' },
      ],
    },
  };

  const mockCustomersService = {
    upsertByPhone: jest.fn().mockResolvedValue({ id: 'cust-1', name: 'Ramesh Patil' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BirthDeathCertificatesService,
        { provide: getRepositoryToken(BirthDeathCertificate), useValue: mockRepo },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    service = module.get<BirthDeathCertificatesService>(BirthDeathCertificatesService);
  });

  describe('create', () => {
    it('upserts customer by phone and creates birth/death certificate record', async () => {

      const dto = {
        certificateType: 'Birth',
        customerName: 'Ramesh Patil',
        phone: '9876543210',
        personName: 'Baby Patil',
        eventDate: '2026-01-15',
        dateOfService: '2026-07-10',
        numberOfCopies: 2,
        amountCharged: 300,
      };

      const result = await service.create(dto as any, mockUser as User);

      expect(mockCustomersService.upsertByPhone).toHaveBeenCalledWith('Ramesh Patil', '9876543210', null, null);
      expect(mockRepo.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('returns record by id', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockRecord);

      const result = await service.findOne('bd-1');

      expect(result.id).toBe('bd-1');
    });

    it('throws NotFoundException if record missing', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDashboardMetrics', () => {
    it('calculates metrics with certificate type breakdown', async () => {
      const metrics = await service.getDashboardMetrics('2026-07-01', '2026-07-31');

      expect(metrics.key).toBe('birthDeath');
      expect(metrics.label).toBe('Birth/Death');
      expect(metrics.category).toBe('KMC');
      expect(metrics.count).toBe(1);
      expect(metrics.gross).toBe(300);
    });
  });

  describe('getCustomerHistory', () => {
    it('returns formatted customer history items', async () => {
      const history = await service.getCustomerHistory('cust-1');

      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('birth-death');
      expect(history[0].amountCharged).toBe(300);
      expect(history[0].description).toContain('Baby Patil');
    });
  });
});
