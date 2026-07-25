import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { Expense } from './expense.entity';
import { User } from '../users/user.entity';
import { Role } from '../common/enums';

describe('ExpensesService', () => {
  let service: ExpensesService;

  const mockAdminUser: Partial<User> = {
    id: 'admin-1',
    name: 'Admin',
    role: Role.ADMIN,
  };

  const mockOperatorUser: Partial<User> = {
    id: 'op-1',
    name: 'Operator',
    role: Role.OPERATOR,
  };

  const mockExpense: Expense = {
    id: 'exp-1',
    category: 'Stationery',
    type: 'Paper Purchase',
    amount: 450,
    date: '2026-07-05',
    user: mockOperatorUser as User,
  } as unknown as Expense;

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'exp-1', ...entity })),
    remove: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockExpense]),
      getRawMany: jest.fn().mockResolvedValue([
        {
          e_id: 'exp-1',
          e_amount: 450,
          e_date: '2026-07-05',
          u_id: 'op-1',
          u_name: 'Operator',
        },
      ]),
    }),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: getRepositoryToken(Expense), useValue: mockRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  describe('create', () => {
    it('creates expense assigned to current user', async () => {
      const dto = { category: 'Stationery', type: 'Paper Purchase', amount: 450, date: '2026-07-05' };
      const result = await service.create(dto as any, mockOperatorUser as User);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 450, user: mockOperatorUser }),
      );
      expect(result).toBeDefined();
    });

    it('allows admin to specify target userId', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(mockOperatorUser);

      const dto = { category: 'Tea', type: 'Refreshment', amount: 100, date: '2026-07-05', userId: 'op-1' };
      await service.create(dto as any, mockAdminUser as User);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 'op-1' } });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 100, user: mockOperatorUser }),
      );
    });
  });

  describe('findOne & authorization', () => {
    it('allows admin to view any user expense', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockExpense);

      const result = await service.findOne('exp-1', mockAdminUser as User);
      expect(result.id).toBe('exp-1');
    });

    it('throws ForbiddenException if non-admin tries to view another user expense', async () => {
      const otherUser: Partial<User> = { id: 'op-2', role: Role.OPERATOR };
      mockRepo.findOne.mockResolvedValueOnce(mockExpense); // belongs to op-1

      await expect(service.findOne('exp-1', otherUser as User)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getDashboardMetrics', () => {
    it('computes total expenses and daily breakdown', async () => {
      const metrics = await service.getDashboardMetrics('2026-07-01', '2026-07-31');

      expect(metrics.key).toBe('expenses');
      expect(metrics.isExpense).toBe(true);
      expect(metrics.net).toBe(450);
    });
  });
});
