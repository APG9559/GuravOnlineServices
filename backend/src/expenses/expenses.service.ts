import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './expense.entity';
import { User } from '../users/user.entity';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseFilterDto } from './expenses.dto';
import { Role } from '../common/enums';

import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';

@Injectable()
export class ExpensesService implements IDashboardMetrics {
  constructor(
    @InjectRepository(Expense)
    private readonly repo: Repository<Expense>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateExpenseDto, currentUser: User): Promise<Expense> {
    let targetUser = currentUser;

    // If admin specifies a userId, find that user
    if (dto.userId && currentUser.role === Role.ADMIN) {
      const foundUser = await this.userRepo.findOne({ where: { id: dto.userId } });
      if (!foundUser) {
        throw new NotFoundException(`User with ID ${dto.userId} not found`);
      }
      targetUser = foundUser;
    }

    const expense = this.repo.create({
      category: dto.category,
      type: dto.type,
      description: dto.description || null,
      amount: dto.amount,
      date: dto.date,
      user: targetUser,
    });

    return this.repo.save(expense);
  }

  async findAll(filter: ExpenseFilterDto, currentUser: User): Promise<Expense[]> {
    const qb = this.repo.createQueryBuilder('e')
      .leftJoinAndSelect('e.user', 'u')
      .orderBy('e.date', 'DESC')
      .addOrderBy('e.createdAt', 'DESC');

    // Standard operator can only see their own expenses, unless they are admin
    if (currentUser.role !== Role.ADMIN) {
      qb.andWhere('e.user.id = :curUserId', { curUserId: currentUser.id });
    } else if (filter.userId) {
      // If admin and filtered by user
      qb.andWhere('e.user.id = :userId', { userId: filter.userId });
    }

    if (filter.from) {
      qb.andWhere('e.date >= :from', { from: filter.from });
    }
    if (filter.to) {
      qb.andWhere('e.date <= :to', { to: filter.to });
    }
    if (filter.category) {
      qb.andWhere('e.category = :category', { category: filter.category });
    }

    return qb.getMany();
  }

  async findOne(id: string, currentUser: User): Promise<Expense> {
    const expense = await this.repo.findOne({ where: { id }, relations: ['user'] });
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Verify ownership
    if (currentUser.role !== Role.ADMIN && expense.user.id !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to access this expense');
    }

    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto, currentUser: User): Promise<Expense> {
    const expense = await this.findOne(id, currentUser);

    if (dto.category) expense.category = dto.category;
    if (dto.type) expense.type = dto.type;
    if (dto.description !== undefined) expense.description = dto.description;
    if (dto.amount !== undefined) expense.amount = dto.amount;
    if (dto.date) expense.date = dto.date;

    if (dto.userId && currentUser.role === Role.ADMIN) {
      const foundUser = await this.userRepo.findOne({ where: { id: dto.userId } });
      if (!foundUser) {
        throw new NotFoundException(`User with ID ${dto.userId} not found`);
      }
      expense.user = foundUser;
    }

    return this.repo.save(expense);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const expense = await this.findOne(id, currentUser);
    await this.repo.remove(expense);
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    const records = await this.repo.createQueryBuilder('e')
      .leftJoinAndSelect('e.user', 'u')
      .where('e.date >= :from AND e.date <= :to', { from, to })
      .getMany();

    let total = 0;
    const dailyMap = new Map<string, number>();
    const userMap = new Map<string, { userId: string; userName: string; expenses: number }>();

    for (const r of records) {
      const amt = Number(r.amount || 0);
      total += amt;

      const dateVal = r.date as any;
      const dateStr = dateVal instanceof Date ? dateVal.toISOString().split('T')[0] : String(dateVal).split('T')[0];
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + amt);

      const uid = r.user?.id || 'unknown';
      const uname = r.user?.name || 'Unknown User';
      if (!userMap.has(uid)) {
        userMap.set(uid, { userId: uid, userName: uname, expenses: 0 });
      }
      userMap.get(uid)!.expenses += amt;
    }

    const daily = Array.from(dailyMap.entries()).map(([date, net]) => ({ date, net }));
    const userBreakdown = Array.from(userMap.values()) as any;

    return {
      key: 'expenses',
      label: 'Expenses',
      count: 0,
      gross: 0,
      net: total,
      daily,
      userBreakdown,
      isExpense: true,
    };
  }
}
