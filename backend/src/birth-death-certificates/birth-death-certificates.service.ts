import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BirthDeathCertificate } from './birth-death-certificate.entity';
import { CreateBirthDeathCertificateDto, UpdateBirthDeathCertificateDto, BirthDeathCertificateFilterDto } from './birth-death-certificates.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';
import { BaseRecordService } from '../common/base-record.service';
import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';
import { ICustomerHistoryProvider, CustomerHistoryItem } from '../common/interfaces/customer-history.interface';

@Injectable()
export class BirthDeathCertificatesService extends BaseRecordService<BirthDeathCertificate> implements IDashboardMetrics, ICustomerHistoryProvider {
  constructor(
    @InjectRepository(BirthDeathCertificate)
    repo: Repository<BirthDeathCertificate>,
    customersService: CustomersService,
  ) {
    super(repo, customersService, 'Birth/Death certificate');
  }

  async findAll(filter: BirthDeathCertificateFilterDto) {
    const qb = this.repo.createQueryBuilder('b')
      .leftJoinAndSelect('b.createdBy', 'u')
      .leftJoinAndSelect('b.customer', 'c')
      .orderBy('b.dateOfService', 'DESC');

    if (filter.from) qb.andWhere('b.dateOfService >= :from', { from: filter.from });
    if (filter.to) qb.andWhere('b.dateOfService <= :to', { to: filter.to });
    if (filter.type) qb.andWhere('b.certificateType = :type', { type: filter.type });
    if (filter.search) {
      qb.andWhere('(LOWER(b.customerName) LIKE :s OR LOWER(b.personName) LIKE :s OR b.phone LIKE :s)', {
        s: `%${filter.search.toLowerCase()}%`,
      });
    }

    return qb.getMany();
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    const [stats, byType, daily, userBreakdown] = await Promise.all([
      this.repo.createQueryBuilder('b')
        .select('COUNT(b.id)', 'count')
        .addSelect('SUM(b.amountCharged)', 'gross')
        .where('b.dateOfService >= :from AND b.dateOfService <= :to', { from, to })
        .getRawOne(),
      this.repo.createQueryBuilder('b')
        .select('b.certificateType', 'certificateType')
        .addSelect('COUNT(b.id)', 'count')
        .where('b.dateOfService >= :from AND b.dateOfService <= :to', { from, to })
        .groupBy('b.certificateType')
        .getRawMany(),
      this.repo.createQueryBuilder('b')
        .select('b.dateOfService', 'date')
        .addSelect('SUM(b.amountCharged)', 'net')
        .where('b.dateOfService >= :from AND b.dateOfService <= :to', { from, to })
        .groupBy('b.dateOfService')
        .getRawMany(),
      this.repo.createQueryBuilder('b')
        .innerJoin('b.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(b.amountCharged)', 'gross')
        .addSelect('SUM(b.amountCharged)', 'net')
        .where('b.dateOfService >= :from AND b.dateOfService <= :to', { from, to })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),
    ]);

    const count = Number(stats?.count || 0);
    const gross = Number(stats?.gross || 0);

    return {
      key: 'birthDeath',
      label: 'Birth/Death',
      category: 'KMC',
      count,
      gross,
      net: gross,
      daily,
      userBreakdown,
      extra: { byType },
    };
  }

  async getCustomerHistory(customerId: string): Promise<CustomerHistoryItem[]> {
    const records = await this.repo.find({
      where: { customer: { id: customerId } },
      relations: ['createdBy'],
    });

    return records.map(b => ({
      id: b.id,
      type: 'birth-death',
      typeName: `${b.certificateType} Certificate`,
      dateOfService: b.dateOfService,
      amountCharged: Number(b.amountCharged),
      description: `Name of person: ${b.personName}, Event Date: ${b.eventDate}, Copies: ${b.numberOfCopies}`,
      createdBy: b.createdBy?.name || 'Unknown',
      createdAt: b.createdAt,
    }));
  }
}
