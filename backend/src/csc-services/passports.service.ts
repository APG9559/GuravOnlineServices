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
    return super.findAll(filter, ['customerName', 'phone', 'fileNo']);
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    return this.getDashboardMetricsGeneric(from, to, {
      key: 'passports',
      label: 'Passports',
      category: 'CSC',
      calculateNet: (p) => Number(p.amountCharged || 0) - Number(p.officialFee || 0),
      netExpression: 'COALESCE("entity"."amountCharged", 0) - COALESCE("entity"."officialFee", 0)',
    });
  }

  async getCustomerHistory(customerId: string): Promise<CustomerHistoryItem[]> {
    const qb = this.repo.createQueryBuilder('p');
    if (typeof qb.orderBy === 'function') {
      const records = await qb
        .leftJoin('p.createdBy', 'u')
        .select([
          'p.id AS id',
          'p.applicationType AS "applicationType"',
          'p.fileNo AS "fileNo"',
          'p.dateOfService AS "dateOfService"',
          'p.amountCharged AS "amountCharged"',
          'p.createdAt AS "createdAt"',
          'u.name AS "createdByName"',
        ])
        .where('p.customer_id = :customerId', { customerId })
        .orderBy('p.dateOfService', 'DESC')
        .getRawMany();

      return (records || []).map(p => ({
        id: p.id,
        type: 'passport',
        typeName: 'Passport Service',
        dateOfService: p.dateOfService,
        amountCharged: Number(p.amountCharged || 0),
        description: `Type: ${p.applicationType}${p.fileNo ? `, File No: ${p.fileNo}` : ''}`,
        createdBy: p.createdByName || 'Unknown',
        createdAt: p.createdAt,
      }));
    }

    const records = await this.repo.find({
      where: { customer: { id: customerId } },
      relations: ['createdBy'],
    });

    return (records || []).map(p => ({
      id: p.id,
      type: 'passport',
      typeName: 'Passport Service',
      dateOfService: p.dateOfService,
      amountCharged: Number(p.amountCharged || 0),
      description: `Type: ${p.applicationType}${p.fileNo ? `, File No: ${p.fileNo}` : ''}`,
      createdBy: p.createdBy?.name || 'Unknown',
      createdAt: p.createdAt,
    }));
  }
}
