import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WaterSupplyService } from './water-supply.service';
import { WaterServiceRecord } from './water-service-record.entity';
import { WaterConnection } from './water-connection.entity';
import { WaterPayment } from './water-payment.entity';
import { WaterFeeConfig } from './water-fee-config.entity';
import { WaterDocument } from './water-document.entity';
import { CustomersService } from '../customers/customers.service';
import { User } from '../users/user.entity';

describe('WaterSupplyService', () => {
  let service: WaterSupplyService;

  const mockUser: Partial<User> = {
    id: 'user-1',
    name: 'Admin Operator',
  };

  const mockConnection: WaterConnection = {
    id: 'conn-1',
    connectionNo: 'WS-100',
    currentOwner: 'Ramesh Patil',
    connectionAddress: 'Ward 5, Kolhapur',
    currentUsage: 'Domestic',
    connectionStatus: 'Active',
  } as unknown as WaterConnection;

  const mockRecord: WaterServiceRecord = {
    id: 'rec-1',
    serviceType: 'NewConnection',
    dateOfService: '2026-07-15',
    applicationDate: '2026-07-10',
    applicationTokenNo: 'TOK-001',
    officialFee: 500,
    serviceFee: 300,
    protocolFee: 0,
    miscFee: 0,
    discount: 0,
    amountCharged: 800,
    connection: mockConnection,
    createdBy: mockUser as User,
  } as unknown as WaterServiceRecord;

  const mockWsRecordRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'rec-1', ...entity })),
    softRemove: jest.fn().mockResolvedValue(undefined),
    manager: {
      connection: {
        createQueryRunner: jest.fn().mockReturnValue({
          hasTable: jest.fn().mockResolvedValue(false),
          release: jest.fn(),
        }),
      },
    },
    metadata: {
      relations: [
        { propertyName: 'createdBy' },
        { propertyName: 'connection' },
        { propertyName: 'payments' },
        { propertyName: 'documents' },
      ],
      columns: [
        { propertyName: 'id' },
        { propertyName: 'dateOfService' },
        { propertyName: 'amountCharged' },
        { propertyName: 'officialFee' },
        { propertyName: 'serviceFee' },
        { propertyName: 'createdAt' },
      ],
    },
  };

  const mockConnectionRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'conn-1', ...entity })),
    count: jest.fn().mockResolvedValue(0),
    softRemove: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockConnection]),
    }),
  };

  const mockPaymentQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([
      {
        p_id: 'pay-1',
        p_amount: 800,
        p_paymentDate: '2026-07-15',
        r_id: 'rec-1',
        r_serviceFee: 300,
        r_amountCharged: 800,
        u_id: 'user-1',
        u_name: 'Admin Operator',
      },
    ]),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
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

  const mockFeeConfigRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'cfg-1', ...entity })),
    softRemove: jest.fn(),
  };

  const mockDocumentRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'doc-1', ...entity })),
    softRemove: jest.fn(),
  };

  const mockCustomersService = {
    upsertByPhone: jest.fn().mockResolvedValue({ id: 'cust-1', name: 'Ramesh Patil' }),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaterSupplyService,
        { provide: getRepositoryToken(WaterServiceRecord), useValue: mockWsRecordRepo },
        { provide: getRepositoryToken(WaterConnection), useValue: mockConnectionRepo },
        { provide: getRepositoryToken(WaterPayment), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(WaterFeeConfig), useValue: mockFeeConfigRepo },
        { provide: getRepositoryToken(WaterDocument), useValue: mockDocumentRepo },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    service = module.get<WaterSupplyService>(WaterSupplyService);
  });

  describe('createRecord', () => {
    it('creates connection and record for NewConnection', async () => {
      mockWsRecordRepo.findOne.mockResolvedValueOnce(mockRecord);

      const dto = {
        serviceType: 'NewConnection',
        customerName: 'Ramesh Patil',
        phone: '9876543210',
        connectionNo: 'WS-100',
        dateOfService: '2026-07-15',
        applicationDate: '2026-07-10',
        officialFee: 500,
        serviceFee: 300,
        amountCharged: 800,
      };

      const result = await service.createRecord(dto as any, mockUser as User);

      expect(mockCustomersService.upsertByPhone).toHaveBeenCalledWith(
        'Ramesh Patil',
        '9876543210',
        null,
        null,
      );
      expect(mockConnectionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ connectionNo: 'WS-100', connectionStatus: 'Active' }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('approveConnection', () => {
    it('approves pending connection and assigns connection number', async () => {
      mockConnectionRepo.findOne
        .mockResolvedValueOnce({ ...mockConnection, connectionStatus: 'Pending', connectionNo: null }) // lookup connection
        .mockResolvedValueOnce(null); // lookup duplicate check

      const result = await service.approveConnection('conn-1', 'WS-200', mockUser as User);

      expect(result.connectionStatus).toBe('Active');
      expect(result.connectionNo).toBe('WS-200');
    });

    it('throws BadRequestException if connection number is already assigned', async () => {
      mockConnectionRepo.findOne
        .mockResolvedValueOnce({ ...mockConnection, id: 'conn-1' })
        .mockResolvedValueOnce({ ...mockConnection, id: 'conn-other' });

      await expect(
        service.approveConnection('conn-1', 'WS-100', mockUser as User),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateRecord state transitions', () => {
    it('updates connection status to Disconnected for MeterDisconnection', async () => {
      mockWsRecordRepo.findOne.mockResolvedValue({
        ...mockRecord,
        serviceType: 'MeterDisconnection',
        connection: { ...mockConnection },
      });

      await service.updateRecord('rec-1', { remarks: 'Disconnection executed' } as any);

      expect(mockConnectionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ connectionStatus: 'Disconnected' }),
      );
    });

    it('updates connection usage for ChangeOfUse', async () => {
      mockWsRecordRepo.findOne.mockResolvedValue({
        ...mockRecord,
        serviceType: 'ChangeOfUse',
        connection: { ...mockConnection },
        details: {},
      });

      await service.updateRecord('rec-1', { newUsage: 'Commercial' } as any);

      expect(mockConnectionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ currentUsage: 'Commercial' }),
      );
    });
  });

  describe('getDashboardMetrics', () => {
    it('computes metrics and service fee ratio net earnings', async () => {
      const metrics = await service.getDashboardMetrics('2026-07-01', '2026-07-31');

      expect(metrics.key).toBe('waterSupply');
      expect(metrics.count).toBe(1);
      expect(metrics.gross).toBe(800);
      expect(metrics.net).toBe(300); // 800 * (300 / 800) = 300
    });
  });
});
