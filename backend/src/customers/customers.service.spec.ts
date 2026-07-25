import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Customer } from './customer.entity';

describe('CustomersService', () => {
  let service: CustomersService;

  const mockCustomer: Customer = {
    id: 'cust-1',
    name: 'Rajesh Sharma',
    phone: '9876543210',
    address: 'Kolhapur Central',
    email: 'rajesh@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Customer;

  const mockQueryBuilder = {
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([mockCustomer]),
    getCount: jest.fn().mockResolvedValue(1),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const mockRepo = {
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'cust-1', ...entity })),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    softRemove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getRepositoryToken(Customer), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  describe('create', () => {
    it('updates existing customer if phone matches', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ ...mockCustomer });

      const dto = { name: 'Rajesh S.', phone: '9876543210', address: 'New Address' };
      const result = await service.create(dto);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { phone: '9876543210' } });
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Rajesh S.', address: 'New Address' }));
      expect(result.name).toBe('Rajesh S.');
    });

    it('creates new customer if phone is not found', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);

      const dto = { name: 'Anita Patil', phone: '9123456789' };
      const result = await service.create(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('Anita Patil');
    });
  });

  describe('findAll', () => {
    it('returns all customers when no pagination provided', async () => {
      const result = await service.findAll({});

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('c');
      expect(result).toEqual([mockCustomer]);
    });

    it('returns paginated response when page and limit are provided', async () => {
      const result = await service.findAll({ page: 1, limit: 10, search: 'Rajesh' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(c.name) LIKE :s OR c.phone LIKE :s OR LOWER(c.address) LIKE :s)',
        { s: '%rajesh%' },
      );
      expect(result).toEqual({
        data: [mockCustomer],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('findOne & lookup', () => {
    it('returns customer by id', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockCustomer);

      const result = await service.findOne('cust-1');
      expect(result).toEqual(mockCustomer);
    });

    it('throws NotFoundException if customer id is missing', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('looks up customer by phone', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockCustomer);

      const result = await service.lookup('9876543210');
      expect(result).toEqual(mockCustomer);
    });

    it('throws NotFoundException if customer phone lookup fails', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.lookup('0000000000')).rejects.toThrow(NotFoundException);
    });
  });

  describe('upsertByPhone', () => {
    it('returns null if name is omitted', async () => {
      const result = await service.upsertByPhone('');
      expect(result).toBeNull();
    });

    it('finds customer by phone and updates properties', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ ...mockCustomer });

      const result = await service.upsertByPhone('Rajesh Updated', '9876543210', 'Updated Address');

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { phone: '9876543210' } });
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Rajesh Updated', address: 'Updated Address' }),
      );
      expect(result?.name).toBe('Rajesh Updated');
    });

    it('falls back to case-insensitive name lookup if phone lookup returns null', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null); // phone search
      mockQueryBuilder.getOne.mockResolvedValueOnce({ ...mockCustomer, phone: null }); // name search

      const result = await service.upsertByPhone('rajesh sharma', '9876543210');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('LOWER(c.name) = LOWER(:name)', { name: 'rajesh sharma' });
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '9876543210' }),
      );
      expect(result?.phone).toBe('9876543210');
    });

    it('creates new customer when neither phone nor name matches', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      mockQueryBuilder.getOne.mockResolvedValueOnce(null);

      const result = await service.upsertByPhone('New Customer', '9999999999', 'City');

      expect(mockRepo.create).toHaveBeenCalledWith({
        name: 'New Customer',
        phone: '9999999999',
        address: 'City',
        email: null,
      });
      expect(result?.name).toBe('New Customer');
    });
  });

  describe('softDelete', () => {
    it('soft-removes found customer', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockCustomer);

      await service.softDelete('cust-1');

      expect(mockRepo.softRemove).toHaveBeenCalledWith(mockCustomer);
    });
  });
});
