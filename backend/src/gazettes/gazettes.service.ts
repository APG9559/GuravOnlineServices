import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gazette } from './gazette.entity';
import {
  CreateGazetteDto,
  UpdateGazetteDto,
  GazetteFilterDto,
} from './gazettes.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';
import { BaseRecordService } from '../common/base-record.service';
import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';
import { ICustomerHistoryProvider, CustomerHistoryItem } from '../common/interfaces/customer-history.interface';

@Injectable()
export class GazettesService extends BaseRecordService<Gazette> implements IDashboardMetrics, ICustomerHistoryProvider {
  constructor(
    @InjectRepository(Gazette)
    repo: Repository<Gazette>,
    customersService: CustomersService,
  ) {
    super(repo, customersService, 'Gazette record');
  }

  async findAll(filter: GazetteFilterDto) {
    const qb = this.repo.createQueryBuilder('g')
      .leftJoinAndSelect('g.createdBy', 'u')
      .leftJoinAndSelect('g.customer', 'c')
      .orderBy('g.dateOfService', 'DESC');

    if (filter.from)       qb.andWhere('g.dateOfService >= :from', { from: filter.from });
    if (filter.to)         qb.andWhere('g.dateOfService <= :to',   { to: filter.to });
    if (filter.search) {
      qb.andWhere(
        '(LOWER(g.customerName) LIKE :s OR g.phone LIKE :s OR LOWER(g.oldName) LIKE :s OR LOWER(g.newName) LIKE :s OR LOWER(g.tokenNo) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    const [stats, daily, userBreakdown] = await Promise.all([
      this.repo.createQueryBuilder('g')
        .select('COUNT(g.id)', 'count')
        .addSelect('SUM(g.amountCharged)', 'gross')
        .addSelect('SUM(g.amountCharged - COALESCE(g.officialFee, 0))', 'net')
        .where('g.dateOfService >= :from AND g.dateOfService <= :to', { from, to })
        .getRawOne(),
      this.repo.createQueryBuilder('g')
        .select('g.dateOfService', 'date')
        .addSelect('SUM(g.amountCharged - COALESCE(g.officialFee, 0))', 'net')
        .where('g.dateOfService >= :from AND g.dateOfService <= :to', { from, to })
        .groupBy('g.dateOfService')
        .getRawMany(),
      this.repo.createQueryBuilder('g')
        .innerJoin('g.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(g.amountCharged)', 'gross')
        .addSelect('SUM(g.amountCharged - COALESCE(g.officialFee, 0))', 'net')
        .where('g.dateOfService >= :from AND g.dateOfService <= :to', { from, to })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),
    ]);

    const count = Number(stats?.count || 0);
    const gross = Number(stats?.gross || 0);
    const net = Number(stats?.net || 0);

    return {
      key: 'gazettes',
      label: 'Gazettes',
      category: 'AapleSarkar',
      count,
      gross,
      net,
      daily,
      userBreakdown,
    };
  }

  async getCustomerHistory(customerId: string): Promise<CustomerHistoryItem[]> {
    const records = await this.repo.find({
      where: { customer: { id: customerId } },
      relations: ['createdBy'],
    });

    return records.map(g => ({
      id: g.id,
      type: 'gazette',
      typeName: 'Gazette Name Change',
      dateOfService: g.dateOfService,
      amountCharged: Number(g.amountCharged),
      description: `Old Name: ${g.oldName}, New Name: ${g.newName}, Reason: ${g.reasonToChangeName}`,
      createdBy: g.createdBy?.name || 'Unknown',
      createdAt: g.createdAt,
    }));
  }
}
