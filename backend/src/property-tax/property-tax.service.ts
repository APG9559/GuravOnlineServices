import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyTax } from './property-tax.entity';
import {
  CreatePropertyTaxDto,
  UpdatePropertyTaxDto,
  PropertyTaxFilterDto,
} from './property-tax.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';
import { BaseRecordService } from '../common/base-record.service';
import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';
import { ICustomerHistoryProvider, CustomerHistoryItem } from '../common/interfaces/customer-history.interface';

@Injectable()
export class PropertyTaxService extends BaseRecordService<PropertyTax> implements IDashboardMetrics, ICustomerHistoryProvider {
  constructor(
    @InjectRepository(PropertyTax)
    repo: Repository<PropertyTax>,
    customersService: CustomersService,
  ) {
    super(repo, customersService, 'Property Tax record');
  }

  async findAll(filter: PropertyTaxFilterDto) {
    const qb = this.repo.createQueryBuilder('pt')
      .leftJoinAndSelect('pt.createdBy', 'u')
      .leftJoinAndSelect('pt.customer', 'c')
      .orderBy('pt.dateOfService', 'DESC');

    if (filter.from)       qb.andWhere('pt.dateOfService >= :from', { from: filter.from });
    if (filter.to)         qb.andWhere('pt.dateOfService <= :to',   { to: filter.to });
    if (filter.search) {
      qb.andWhere(
        '(LOWER(pt.customerName) LIKE :s OR pt.phone LIKE :s OR pt.propertyTaxNo LIKE :s OR LOWER(pt.address) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    const [stats, daily, userBreakdown] = await Promise.all([
      this.repo.createQueryBuilder('pt')
        .select('COUNT(pt.id)', 'count')
        .addSelect('SUM(pt.amountCharged)', 'gross')
        .addSelect('SUM(pt.amountCharged - COALESCE(pt.officialFee, 0))', 'net')
        .where('pt.dateOfService >= :from AND pt.dateOfService <= :to', { from, to })
        .getRawOne(),
      this.repo.createQueryBuilder('pt')
        .select('pt.dateOfService', 'date')
        .addSelect('SUM(pt.amountCharged - COALESCE(pt.officialFee, 0))', 'net')
        .where('pt.dateOfService >= :from AND pt.dateOfService <= :to', { from, to })
        .groupBy('pt.dateOfService')
        .getRawMany(),
      this.repo.createQueryBuilder('pt')
        .innerJoin('pt.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(pt.amountCharged)', 'gross')
        .addSelect('SUM(pt.amountCharged - COALESCE(pt.officialFee, 0))', 'net')
        .where('pt.dateOfService >= :from AND pt.dateOfService <= :to', { from, to })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),
    ]);

    const count = Number(stats?.count || 0);
    const gross = Number(stats?.gross || 0);
    const net = Number(stats?.net || 0);

    return {
      key: 'propertyTax',
      label: 'Property Tax',
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

    return records.map(pt => ({
      id: pt.id,
      type: 'property-tax',
      typeName: 'Property Tax Service',
      dateOfService: pt.dateOfService,
      amountCharged: Number(pt.amountCharged),
      description: `Service: ${pt.serviceType}, Property Tax No: ${pt.propertyTaxNo}`,
      createdBy: pt.createdBy?.name || 'Unknown',
      createdAt: pt.createdAt,
    }));
  }
}
