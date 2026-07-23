import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { User } from '../../users/user.entity';
import { CreatePaymentDto, PaymentFilterDto } from './dto/create-payment.dto';

export abstract class BasePaymentService<TPayment extends { id: string; record: any; createdBy: User }> {
  constructor(
    protected readonly paymentRepo: Repository<TPayment>,
  ) {}

  async findAll(filter: PaymentFilterDto): Promise<TPayment[]> {
    const qb = this.paymentRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.createdBy', 'u')
      .leftJoinAndSelect('p.record', 'r')
      .orderBy('p.paymentDate', 'DESC')
      .addOrderBy('p.createdAt', 'DESC');

    if (filter.paymentMode) {
      qb.andWhere('p.paymentMode = :mode', { mode: filter.paymentMode });
    }
    if (filter.account) {
      qb.andWhere('p.account = :account', { account: filter.account });
    }
    if (filter.search) {
      qb.andWhere('(r.tokenNo LIKE :s OR r.applicationTokenNo LIKE :s)', { s: `%${filter.search}%` });
    }

    return qb.take(500).getMany();
  }

  async create(record: any, dto: CreatePaymentDto, user: User): Promise<TPayment> {
    const payment = this.paymentRepo.create({
      ...dto,
      record,
      createdBy: user,
    } as any);
    return this.paymentRepo.save(payment as any);
  }

  async delete(id: string): Promise<void> {
    const payment = await this.paymentRepo.findOne({ where: { id } as any });
    if (!payment) throw new NotFoundException('Payment not found');
    await this.paymentRepo.softRemove(payment);
  }
}
