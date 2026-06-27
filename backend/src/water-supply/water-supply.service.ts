import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterSupply } from './water-supply.entity';
import {
  CreateWaterSupplyDto,
  UpdateWaterSupplyDto,
  WaterSupplyFilterDto,
} from './water-supply.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';
import { BaseRecordService } from '../common/base-record.service';
import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';
import { ICustomerHistoryProvider, CustomerHistoryItem } from '../common/interfaces/customer-history.interface';

@Injectable()
export class WaterSupplyService extends BaseRecordService<WaterSupply> implements IDashboardMetrics, ICustomerHistoryProvider {
  constructor(
    @InjectRepository(WaterSupply)
    repo: Repository<WaterSupply>,
    customersService: CustomersService,
  ) {
    super(repo, customersService, 'Water Supply record');
  }

  async findAll(filter: WaterSupplyFilterDto) {
    const qb = this.repo.createQueryBuilder('ws')
      .leftJoinAndSelect('ws.createdBy', 'u')
      .leftJoinAndSelect('ws.customer', 'c')
      .orderBy('ws.dateOfService', 'DESC');

    if (filter.from)       qb.andWhere('ws.dateOfService >= :from', { from: filter.from });
    if (filter.to)         qb.andWhere('ws.dateOfService <= :to',   { to: filter.to });
    if (filter.search) {
      qb.andWhere(
        '(LOWER(ws.customerName) LIKE :s OR ws.phone LIKE :s OR ws.applicationTokenNo LIKE :s OR ws.connectionNo LIKE :s OR LOWER(ws.connectionAddress) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    const [stats, daily, userBreakdown] = await Promise.all([
      this.repo.createQueryBuilder('ws')
        .select('COUNT(ws.id)', 'count')
        .addSelect('SUM(ws.amountCharged)', 'gross')
        .addSelect('SUM(ws.amountCharged - COALESCE(ws.officialFee, 0))', 'net')
        .where('ws.dateOfService >= :from AND ws.dateOfService <= :to', { from, to })
        .getRawOne(),
      this.repo.createQueryBuilder('ws')
        .select('ws.dateOfService', 'date')
        .addSelect('SUM(ws.amountCharged - COALESCE(ws.officialFee, 0))', 'net')
        .where('ws.dateOfService >= :from AND ws.dateOfService <= :to', { from, to })
        .groupBy('ws.dateOfService')
        .getRawMany(),
      this.repo.createQueryBuilder('ws')
        .innerJoin('ws.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(ws.amountCharged)', 'gross')
        .addSelect('SUM(ws.amountCharged - COALESCE(ws.officialFee, 0))', 'net')
        .where('ws.dateOfService >= :from AND ws.dateOfService <= :to', { from, to })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),
    ]);

    const count = Number(stats?.count || 0);
    const gross = Number(stats?.gross || 0);
    const net = Number(stats?.net || 0);

    return {
      key: 'waterSupply',
      label: 'Water Supply',
      category: 'KMC',
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

    return records.map(w => ({
      id: w.id,
      type: 'water-supply',
      typeName: 'Water Supply Service',
      dateOfService: w.dateOfService,
      amountCharged: Number(w.amountCharged),
      description: `Service: ${w.serviceType}, Token: ${w.applicationTokenNo}${w.connectionNo ? `, Connection No: ${w.connectionNo}` : ''}`,
      createdBy: w.createdBy?.name || 'Unknown',
      createdAt: w.createdAt,
    }));
  }
}
