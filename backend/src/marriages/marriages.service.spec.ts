import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MarriagesService } from './marriages.service';
import { Marriage } from './marriage.entity';
import { MarriageTicket, TicketStatus } from './marriage-ticket.entity';
import { MarriagePayment } from './marriage-payment.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { CustomersService } from '../customers/customers.service';
import { User } from '../users/user.entity';

describe('MarriagesService', () => {
  let service: MarriagesService;

  const mockUser: Partial<User> = {
    id: 'user-1',
    name: 'Test Admin',
    email: 'admin@test.com',
  };

  const mockQueryBuilder = {
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    withDeleted: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  };

  const mockEntityManager = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    softRemove: jest.fn(),
    transaction: jest.fn((cb) => cb(mockEntityManager)),
  };

  const mockMarriageRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
    manager: mockEntityManager,
  };

  const mockAffidavitRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTicketRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => dto),
    save: jest.fn((entity) => Promise.resolve({ id: 'ticket-1', ...entity })),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    manager: mockEntityManager,
  };

  const mockPaymentRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockCustomersService = {
    upsertCustomerFromService: jest.fn().mockResolvedValue({ id: 'cust-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarriagesService,
        { provide: getRepositoryToken(Marriage), useValue: mockMarriageRepo },
        { provide: getRepositoryToken(Affidavit), useValue: mockAffidavitRepo },
        { provide: getRepositoryToken(MarriageTicket), useValue: mockTicketRepo },
        { provide: getRepositoryToken(MarriagePayment), useValue: mockPaymentRepo },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    service = module.get<MarriagesService>(MarriagesService);
  });

  describe('createTicket', () => {
    it('generates next ticket number EST-10001 when no prior ticket exists', async () => {
      mockQueryBuilder.getOne.mockResolvedValueOnce(null);

      const dto = {
        contactName: 'Jane Doe',
        amountCharged: 1500,
        questionnaireData: {},
      };

      const result = await service.createTicket(dto, mockUser as User);

      expect(result.ticketNumber).toBe('EST-10001');
      expect(result.status).toBe(TicketStatus.INQUIRED);
      expect(mockTicketRepo.save).toHaveBeenCalled();
    });

    it('increments sequence number EST-10005 when last ticket was EST-10004', async () => {
      mockQueryBuilder.getOne.mockResolvedValueOnce({ ticketNumber: 'EST-10004' });

      const dto = {
        contactName: 'John Smith',
        amountCharged: 2000,
        questionnaireData: {},
      };

      const result = await service.createTicket(dto, mockUser as User);

      expect(result.ticketNumber).toBe('EST-10005');
    });
  });

  describe('confirmTicket', () => {
    it('transitions INQUIRED ticket to CONFIRMED', async () => {
      const ticket = {
        id: 'ticket-10',
        status: TicketStatus.INQUIRED,
        ticketNumber: 'EST-10010',
      };
      mockEntityManager.findOne
        .mockResolvedValueOnce(ticket) // initial lookup
        .mockResolvedValueOnce({ ...ticket, status: TicketStatus.CONFIRMED }); // final lookup

      const result = await service.confirmTicket('ticket-10', undefined, mockUser as User);

      expect(result.status).toBe(TicketStatus.CONFIRMED);
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TicketStatus.CONFIRMED }),
      );
    });

    it('throws BadRequestException when confirming a ticket that is not INQUIRED', async () => {
      const ticket = {
        id: 'ticket-10',
        status: TicketStatus.CONFIRMED,
      };
      mockEntityManager.findOne.mockResolvedValueOnce(ticket);

      await expect(
        service.confirmTicket('ticket-10', undefined, mockUser as User),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('failTicket', () => {
    it('marks an inquired or confirmed ticket as FAILED', async () => {
      const ticket = {
        id: 'ticket-1',
        status: TicketStatus.INQUIRED,
      };
      mockTicketRepo.findOne.mockResolvedValueOnce(ticket);

      await service.failTicket('ticket-1');

      expect(mockTicketRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TicketStatus.FAILED }),
      );
    });

    it('throws BadRequestException when marking a COMPLETED ticket as failed', async () => {
      mockTicketRepo.findOne.mockResolvedValueOnce({
        id: 'ticket-1',
        status: TicketStatus.COMPLETED,
      });

      await expect(service.failTicket('ticket-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('softDeleteTicket', () => {
    it('cascades soft-delete to linked marriage record and payments', async () => {
      const mockTicket = {
        id: 'ticket-1',
        marriage: { id: 'marriage-1' },
      };
      mockTicketRepo.findOne.mockResolvedValueOnce(mockTicket);
      mockEntityManager.find.mockResolvedValueOnce([{ id: 'payment-1' }]);

      await service.softDeleteTicket('ticket-1');

      expect(mockEntityManager.softRemove).toHaveBeenCalledWith(mockTicket.marriage);
      expect(mockEntityManager.softRemove).toHaveBeenCalledWith([{ id: 'payment-1' }]);
      expect(mockEntityManager.softRemove).toHaveBeenCalledWith(mockTicket);
    });
  });
});
