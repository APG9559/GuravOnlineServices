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
    return super.findAll(filter, ['customerName', 'phone', 'epicNo', 'tokenNo']);
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    return this.getDashboardMetricsGeneric(from, to, {
      key: 'voterCards',
      label: 'Voter Cards',
      category: 'CSC',
      calculateNet: (v) => Number(v.amountCharged || 0) - Number(v.officialFee || 0),
      netExpression: 'COALESCE("entity"."amountCharged", 0) - COALESCE("entity"."officialFee", 0)',
    });
  }

  async getCustomerHistory(customerId: string): Promise<CustomerHistoryItem[]> {
    const qb = this.repo.createQueryBuilder('v');
    if (typeof qb.orderBy === 'function') {
      const records = await qb
        .leftJoin('v.createdBy', 'u')
        .select([
          'v.id AS id',
          'v.applicationType AS "applicationType"',
          'v.epicNo AS "epicNo"',
          'v.tokenNo AS "tokenNo"',
          'v.dateOfService AS "dateOfService"',
          'v.amountCharged AS "amountCharged"',
          'v.createdAt AS "createdAt"',
          'u.name AS "createdByName"',
        ])
        .where('v.customer_id = :customerId', { customerId })
        .orderBy('v.dateOfService', 'DESC')
        .getRawMany();

      return (records || []).map(v => ({
        id: v.id,
        type: 'voter-card',
        typeName: 'Voter Card Service',
        dateOfService: v.dateOfService,
        amountCharged: Number(v.amountCharged || 0),
        description: `Type: ${v.applicationType}${v.epicNo ? `, EPIC No: ${v.epicNo}` : ''}${v.tokenNo ? `, Token No: ${v.tokenNo}` : ''}`,
        createdBy: v.createdByName || 'Unknown',
        createdAt: v.createdAt,
      }));
    }

    const records = await this.repo.find({
      where: { customer: { id: customerId } },
      relations: ['createdBy'],
    });

    return (records || []).map(v => ({
      id: v.id,
      type: 'voter-card',
      typeName: 'Voter Card Service',
      dateOfService: v.dateOfService,
      amountCharged: Number(v.amountCharged || 0),
      description: `Type: ${v.applicationType}${v.epicNo ? `, EPIC No: ${v.epicNo}` : ''}${v.tokenNo ? `, Token No: ${v.tokenNo}` : ''}`,
      createdBy: v.createdBy?.name || 'Unknown',
      createdAt: v.createdAt,
    }));
  }
}
