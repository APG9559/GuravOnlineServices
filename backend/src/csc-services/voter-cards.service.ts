import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRecordService } from '../common/base-record.service';
import { VoterCardRecord } from './voter-card.entity';
import { CustomersService } from '../customers/customers.service';
import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';
import { ICustomerHistoryProvider, CustomerHistoryItem } from '../common/interfaces/customer-history.interface';
import { CscFilterDto, UpdateVoterCardDto } from './csc-services.dto';

@Injectable()
export class VoterCardsService extends BaseRecordService<VoterCardRecord> implements IDashboardMetrics, ICustomerHistoryProvider {
  constructor(
    @InjectRepository(VoterCardRecord)
    repo: Repository<VoterCardRecord>,
    customersService: CustomersService,
  ) {
    super(repo, customersService, 'Voter Card');
  }

  override async update(id: string, dto: UpdateVoterCardDto): Promise<VoterCardRecord> {
    const rec = await this.findOne(id);
    
    // Clean up fields based on applicationType
    if (dto.applicationType === 'New') {
      dto.epicNo = null;
    } else if (dto.applicationType) {
      dto.tokenNo = null;
    }

    return super.update(id, dto);
  }

  async findAll(filter: CscFilterDto): Promise<VoterCardRecord[]> {
    const qb = this.repo.createQueryBuilder('v')
      .leftJoinAndSelect('v.createdBy', 'u')
      .leftJoinAndSelect('v.customer', 'c')
      .orderBy('v.dateOfService', 'DESC')
      .addOrderBy('v.createdAt', 'DESC');

    if (filter.from)       qb.andWhere('v.dateOfService >= :from', { from: filter.from });
    if (filter.to)         qb.andWhere('v.dateOfService <= :to',   { to: filter.to });
    if (filter.search) {
      qb.andWhere(
        '(LOWER(v.customerName) LIKE :s OR v.phone LIKE :s OR LOWER(v.epicNo) LIKE :s OR LOWER(v.tokenNo) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    const [stats, daily, userBreakdown] = await Promise.all([
      this.repo.createQueryBuilder('v')
        .select('COUNT(v.id)', 'count')
        .addSelect('SUM(v.amountCharged)', 'gross')
        .addSelect('SUM(v.amountCharged - COALESCE(v.officialFee, 0))', 'net')
        .where('v.dateOfService >= :from AND v.dateOfService <= :to', { from, to })
        .getRawOne(),
      this.repo.createQueryBuilder('v')
        .select('v.dateOfService', 'date')
        .addSelect('SUM(v.amountCharged - COALESCE(v.officialFee, 0))', 'net')
        .where('v.dateOfService >= :from AND v.dateOfService <= :to', { from, to })
        .groupBy('v.dateOfService')
        .getRawMany(),
      this.repo.createQueryBuilder('v')
        .innerJoin('v.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(v.amountCharged)', 'gross')
        .addSelect('SUM(v.amountCharged - COALESCE(v.officialFee, 0))', 'net')
        .where('v.dateOfService >= :from AND v.dateOfService <= :to', { from, to })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),
    ]);

    const count = Number(stats?.count || 0);
    const gross = Number(stats?.gross || 0);
    const net = Number(stats?.net || 0);

    return {
      key: 'voterCards',
      label: 'Voter Cards',
      category: 'CSC',
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

    return records.map(v => ({
      id: v.id,
      type: 'voter-card',
      typeName: 'Voter Card Service',
      dateOfService: v.dateOfService,
      amountCharged: Number(v.amountCharged),
      description: `Type: ${v.applicationType}${v.epicNo ? `, EPIC No: ${v.epicNo}` : ''}${v.tokenNo ? `, Token No: ${v.tokenNo}` : ''}`,
      createdBy: v.createdBy?.name || 'Unknown',
      createdAt: v.createdAt,
    }));
  }
}
