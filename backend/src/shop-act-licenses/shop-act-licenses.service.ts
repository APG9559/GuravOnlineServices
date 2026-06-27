import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopActLicense } from './shop-act-license.entity';
import {
  CreateShopActLicenseDto,
  UpdateShopActLicenseDto,
  ShopActLicenseFilterDto,
} from './shop-act-licenses.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';
import { BaseRecordService } from '../common/base-record.service';
import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';
import { ICustomerHistoryProvider, CustomerHistoryItem } from '../common/interfaces/customer-history.interface';

@Injectable()
export class ShopActLicensesService extends BaseRecordService<ShopActLicense> implements IDashboardMetrics, ICustomerHistoryProvider {
  constructor(
    @InjectRepository(ShopActLicense)
    repo: Repository<ShopActLicense>,
    customersService: CustomersService,
  ) {
    super(repo, customersService, 'Shop Act License record');
  }

  async findAll(filter: ShopActLicenseFilterDto) {
    const qb = this.repo.createQueryBuilder('s')
      .leftJoinAndSelect('s.createdBy', 'u')
      .leftJoinAndSelect('s.customer', 'c')
      .orderBy('s.dateOfService', 'DESC');

    if (filter.from) qb.andWhere('s.dateOfService >= :from', { from: filter.from });
    if (filter.to)   qb.andWhere('s.dateOfService <= :to',   { to: filter.to });
    if (filter.search) {
      qb.andWhere(
        '(LOWER(s.customerName) LIKE :s OR s.phone LIKE :s OR LOWER(s.businessName) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    const [stats, daily, userBreakdown] = await Promise.all([
      this.repo.createQueryBuilder('s')
        .select('COUNT(s.id)', 'count')
        .addSelect('SUM(s.amountCharged)', 'gross')
        .where('s.dateOfService >= :from AND s.dateOfService <= :to', { from, to })
        .getRawOne(),
      this.repo.createQueryBuilder('s')
        .select('s.dateOfService', 'date')
        .addSelect('SUM(s.amountCharged)', 'net')
        .where('s.dateOfService >= :from AND s.dateOfService <= :to', { from, to })
        .groupBy('s.dateOfService')
        .getRawMany(),
      this.repo.createQueryBuilder('s')
        .innerJoin('s.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(s.amountCharged)', 'gross')
        .addSelect('SUM(s.amountCharged)', 'net')
        .where('s.dateOfService >= :from AND s.dateOfService <= :to', { from, to })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),
    ]);

    const count = Number(stats?.count || 0);
    const gross = Number(stats?.gross || 0);

    return {
      key: 'shopAct',
      label: 'Shop Act',
      category: 'AapleSarkar',
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

    return records.map(s => ({
      id: s.id,
      type: 'shop-act',
      typeName: 'Shop Act License',
      dateOfService: s.dateOfService,
      amountCharged: Number(s.amountCharged),
      description: `Business Name: ${s.businessName}${s.email ? `, Email: ${s.email}` : ''}`,
      createdBy: s.createdBy?.name || 'Unknown',
      createdAt: s.createdAt,
    }));
  }
}
