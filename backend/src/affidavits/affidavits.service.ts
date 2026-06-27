import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Affidavit } from './affidavit.entity';
import { CreateAffidavitDto, UpdateAffidavitDto, AffidavitFilterDto } from './affidavits.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';
import { BaseRecordService } from '../common/base-record.service';
import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';
import { ICustomerHistoryProvider, CustomerHistoryItem } from '../common/interfaces/customer-history.interface';

@Injectable()
export class AffidavitsService extends BaseRecordService<Affidavit> implements IDashboardMetrics, ICustomerHistoryProvider {
  constructor(
    @InjectRepository(Affidavit)
    repo: Repository<Affidavit>,
    customersService: CustomersService,
  ) {
    super(repo, customersService, 'Affidavit');
  }

  async findAll(filter: AffidavitFilterDto) {
    const qb = this.repo.createQueryBuilder('a')
      .leftJoinAndSelect('a.createdBy', 'u')
      .leftJoinAndSelect('a.customer', 'c')
      .orderBy('a.dateOfService', 'DESC');

    if (filter.from) qb.andWhere('a.dateOfService >= :from', { from: filter.from });
    if (filter.to) qb.andWhere('a.dateOfService <= :to', { to: filter.to });
    if (filter.search) {
      qb.andWhere('(LOWER(a.customerName) LIKE :s OR a.phone LIKE :s)', {
        s: `%${filter.search.toLowerCase()}%`,
      });
    }

    return qb.getMany();
  }

  async getDashboardMetrics(from: string, to: string, pricing: Record<string, number>): Promise<ServiceMetricsResult> {
    const stampCost = pricing['stamp500_cost'] ?? 500;
    const plainCost = pricing['plain_cost'] ?? 0;

    const [stats, byAuthorizer, byPaper, daily, userBreakdown] = await Promise.all([
      this.repo.createQueryBuilder('a')
        .select('COUNT(a.id)', 'count')
        .addSelect('SUM(a.amountCharged)', 'gross')
        .addSelect(
          `SUM(a.amountCharged - (CASE WHEN a.customerBroughtStamp THEN 0 WHEN a.paperType = 'stamp500' THEN :stampCost ELSE :plainCost END) - (CASE WHEN a.authorizerType = 'magistrate' THEN 30 ELSE COALESCE(a.notaryPublicFee, 0) END))`,
          'net'
        )
        .where('a.dateOfService >= :from AND a.dateOfService <= :to', { from, to })
        .setParameters({ stampCost, plainCost })
        .getRawOne(),
      this.repo.createQueryBuilder('a')
        .select('a.authorizerType', 'authorizerType')
        .addSelect('COUNT(a.id)', 'count')
        .where('a.dateOfService >= :from AND a.dateOfService <= :to', { from, to })
        .groupBy('a.authorizerType')
        .getRawMany(),
      this.repo.createQueryBuilder('a')
        .select('a.paperType', 'paperType')
        .addSelect('COUNT(a.id)', 'count')
        .where('a.dateOfService >= :from AND a.dateOfService <= :to', { from, to })
        .groupBy('a.paperType')
        .getRawMany(),
      this.repo.createQueryBuilder('a')
        .select('a.dateOfService', 'date')
        .addSelect(
          `SUM(a.amountCharged - (CASE WHEN a.customerBroughtStamp THEN 0 WHEN a.paperType = 'stamp500' THEN :stampCost ELSE :plainCost END) - (CASE WHEN a.authorizerType = 'magistrate' THEN 30 ELSE COALESCE(a.notaryPublicFee, 0) END))`,
          'net'
        )
        .where('a.dateOfService >= :from AND a.dateOfService <= :to', { from, to })
        .groupBy('a.dateOfService')
        .setParameters({ stampCost, plainCost })
        .getRawMany(),
      this.repo.createQueryBuilder('a')
        .innerJoin('a.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(a.amountCharged)', 'gross')
        .addSelect(
          `SUM(a.amountCharged - (CASE WHEN a.customerBroughtStamp THEN 0 WHEN a.paperType = 'stamp500' THEN :stampCost ELSE :plainCost END) - (CASE WHEN a.authorizerType = 'magistrate' THEN 30 ELSE COALESCE(a.notaryPublicFee, 0) END))`,
          'net'
        )
        .where('a.dateOfService >= :from AND a.dateOfService <= :to', { from, to })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .setParameters({ stampCost, plainCost })
        .getRawMany(),
    ]);

    const count = Number(stats?.count || 0);
    const gross = Number(stats?.gross || 0);
    const net = Number(stats?.net || 0);

    return {
      key: 'affidavits',
      label: 'Affidavits',
      category: 'AapleSarkar',
      count,
      gross,
      net,
      daily,
      userBreakdown,
      extra: { byAuthorizer, byPaper },
    };
  }

  async getCustomerHistory(customerId: string): Promise<CustomerHistoryItem[]> {
    const records = await this.repo.find({
      where: { customer: { id: customerId } },
      relations: ['createdBy'],
    });

    return records.map(a => ({
      id: a.id,
      type: 'affidavit',
      typeName: 'Affidavit / Notary',
      dateOfService: a.dateOfService,
      amountCharged: Number(a.amountCharged),
      description: `Purpose: ${a.purpose} (${a.paperType === 'stamp500' ? '₹500 Stamp' : 'Plain'}, ${a.authorizerType})`,
      createdBy: a.createdBy?.name || 'Unknown',
      createdAt: a.createdAt,
    }));
  }
}
