import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRecordService } from '../common/base-record.service';
import { PassportRecord } from './passport.entity';
import { CustomersService } from '../customers/customers.service';
import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';
import { ICustomerHistoryProvider, CustomerHistoryItem } from '../common/interfaces/customer-history.interface';
import { CscFilterDto } from './csc-services.dto';

@Injectable()
export class PassportsService extends BaseRecordService<PassportRecord> implements IDashboardMetrics, ICustomerHistoryProvider {
  constructor(
    @InjectRepository(PassportRecord)
    repo: Repository<PassportRecord>,
    customersService: CustomersService,
  ) {
    super(repo, customersService, 'Passport');
  }

  async findAll(filter: CscFilterDto): Promise<PassportRecord[]> {
    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.createdBy', 'u')
      .leftJoinAndSelect('p.customer', 'c')
      .orderBy('p.dateOfService', 'DESC')
      .addOrderBy('p.createdAt', 'DESC');

    if (filter.from)       qb.andWhere('p.dateOfService >= :from', { from: filter.from });
    if (filter.to)         qb.andWhere('p.dateOfService <= :to',   { to: filter.to });
    if (filter.search) {
      qb.andWhere(
        '(LOWER(p.customerName) LIKE :s OR p.phone LIKE :s OR LOWER(p.fileNo) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    const [stats, daily, userBreakdown] = await Promise.all([
      this.repo.createQueryBuilder('p')
        .select('COUNT(p.id)', 'count')
        .addSelect('SUM(p.amountCharged)', 'gross')
        .where('p.dateOfService >= :from AND p.dateOfService <= :to', { from, to })
        .getRawOne(),
      this.repo.createQueryBuilder('p')
        .select('p.dateOfService', 'date')
        .addSelect('SUM(p.amountCharged)', 'net')
        .where('p.dateOfService >= :from AND p.dateOfService <= :to', { from, to })
        .groupBy('p.dateOfService')
        .getRawMany(),
      this.repo.createQueryBuilder('p')
        .innerJoin('p.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(p.amountCharged)', 'gross')
        .addSelect('SUM(p.amountCharged)', 'net')
        .where('p.dateOfService >= :from AND p.dateOfService <= :to', { from, to })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),
    ]);

    const count = Number(stats?.count || 0);
    const gross = Number(stats?.gross || 0);

    return {
      key: 'passports',
      label: 'Passports',
      category: 'CSC',
      count,
      gross,
      net: gross,
      daily,
      userBreakdown,
    };
  }

  async getCustomerHistory(customerId: string): Promise<CustomerHistoryItem[]> {
    const records = await this.repo.find({
      where: { customer: { id: customerId } },
      relations: ['createdBy'],
    });

    return records.map(p => ({
      id: p.id,
      type: 'passport',
      typeName: 'Passport Service',
      dateOfService: p.dateOfService,
      amountCharged: Number(p.amountCharged),
      description: `Type: ${p.applicationType}${p.fileNo ? `, File No: ${p.fileNo}` : ''}`,
      createdBy: p.createdBy?.name || 'Unknown',
      createdAt: p.createdAt,
    }));
  }
}
