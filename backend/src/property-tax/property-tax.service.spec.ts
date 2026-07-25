import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PropertyTaxService, flattenPropertyTaxRecord } from './property-tax.service';
import { Property } from './property.entity';
import { PropertyTaxRecord } from './property-tax-record.entity';
import { PropertyTaxPayment } from './property-tax-payment.entity';
import { PropertyTaxFeeConfig } from './property-tax-fee-config.entity';
import { CustomersService } from '../customers/customers.service';
import { User } from '../users/user.entity';

describe('PropertyTaxService', () => {
  let service: PropertyTaxService;

  const mockUser: Partial<User> = {
    id: 'user-1',
    name: 'Admin User',
  };

  const mockProperty: Property = {
    id: 'prop-1',
    propertyTaxNo: 'PT-999',
    address: 'Tarabai Park, Kolhapur',
    status: 'Active',
    customer: { id: 'cust-1', name: 'Suresh More', phone: '9822012345' } as any,
  } as unknown as Property;

  const mockRecord: PropertyTaxRecord = {
    id: 'pt-rec-1',
    serviceType: 'PropertyTaxReceipt',
    officialFee: 1000,
    serviceFee: 200,
    protocolFee: 0,
    amountCharged: 1200,
    dateOfService: '2026-07-20',
    details: { customerName: 'Suresh More', phone: '9822012345' },
    property: mockProperty,
    createdBy: mockUser as User,
  } as unknown as PropertyTaxRecord;

  const mockPropertyRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'prop-1', ...entity })),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockProperty]),
    }),
  };

  const mockRecordQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([
      {
        ...mockRecord,
        payments: [{ id: 'pay-1', amount: 1200 }],
        createdBy: mockUser,
      },
    ]),
  };

  const mockRecordRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'pt-rec-1', ...entity })),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockRecordQueryBuilder),
    manager: {
      connection: {
        createQueryRunner: jest.fn().mockReturnValue({
          hasTable: jest.fn().mockResolvedValue(false),
          release: jest.fn(),
        }),
      },
    },
  };

  const mockPaymentRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'pay-1', ...entity })),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
  };

  const mockConfigRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockCustomersService = {
    upsertByPhone: jest.fn().mockResolvedValue({ id: 'cust-1', name: 'Suresh More' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyTaxService,
        { provide: getRepositoryToken(Property), useValue: mockPropertyRepo },
        { provide: getRepositoryToken(PropertyTaxRecord), useValue: mockRecordRepo },
        { provide: getRepositoryToken(PropertyTaxPayment), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(PropertyTaxFeeConfig), useValue: mockConfigRepo },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    service = module.get<PropertyTaxService>(PropertyTaxService);
  });

  describe('flattenPropertyTaxRecord', () => {
    it('flattens customer details into top-level properties', () => {
      const flattened = flattenPropertyTaxRecord(mockRecord);

      expect(flattened.customerName).toBe('Suresh More');
      expect(flattened.phone).toBe('9822012345');
      expect(flattened.propertyTaxNo).toBe('PT-999');
    });
  });

  describe('approveProperty', () => {
    it('approves property and assigns tax number', async () => {
      mockPropertyRepo.findOne
        .mockResolvedValueOnce({ ...mockProperty, status: 'Pending', propertyTaxNo: '' })
        .mockResolvedValueOnce(null);

      const result = await service.approveProperty('prop-1', 'PT-1000');

      expect(result.status).toBe('Approved');
      expect(result.propertyTaxNo).toBe('PT-1000');
    });

    it('throws BadRequestException if property is already approved', async () => {
      mockPropertyRepo.findOne.mockResolvedValueOnce({ ...mockProperty, status: 'Approved' });

      await expect(service.approveProperty('prop-1', 'PT-999')).rejects.toThrow(BadRequestException);
    });
  });

  describe('createRecord', () => {
    it('creates record and property if property does not exist', async () => {
      mockPropertyRepo.findOne.mockResolvedValueOnce(null);

      const dto = {
        propertyTaxNo: 'PT-888',
        customerName: 'New Owner',
        phone: '9900990099',
        address: 'Rajaram Road',
        serviceType: 'PropertyTaxReceipt',
        officialFee: 1000,
        serviceFee: 200,
        protocolFee: 0,
        amountCharged: 1200,
        dateOfService: '2026-07-20',
      };

      const result = await service.createRecord(dto, mockUser as User);

      expect(mockCustomersService.upsertByPhone).toHaveBeenCalledWith('New Owner', '9900990099', 'Rajaram Road', null);
      expect(mockPropertyRepo.create).toHaveBeenCalled();
      expect(mockRecordRepo.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getDashboardMetrics', () => {
    it('computes total gross and net revenue metrics', async () => {
      const metrics = await service.getDashboardMetrics('2026-07-01', '2026-07-31');

      expect(metrics.key).toBe('propertyTax');
      expect(metrics.count).toBe(1);
      expect(metrics.gross).toBe(1200);
      expect(metrics.net).toBe(200); // 1200 gross - 1000 official fee = 200 net
    });
  });
});
