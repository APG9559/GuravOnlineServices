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

  override async findAll(
    filter: AffidavitFilterDto,
  ): Promise<any> {
    return super.findAll(filter, ['customerName', 'phone', 'purpose'], (qb) => {
      if (filter.authorizerType) {
        qb.andWhere('entity.authorizerType = :authorizerType', {
          authorizerType: filter.authorizerType,
        });
      }
    });
  }


  async getDashboardMetrics(from: string, to: string, pricing: Record<string, number>): Promise<ServiceMetricsResult> {
    const stampCost = pricing['stamp500_cost'] ?? 500;
    const plainCost = pricing['plain_cost'] ?? 0;

    return this.getDashboardMetricsGeneric(from, to, {
      key: 'affidavits',
      label: 'Affidavits',
      category: 'AapleSarkar',
      calculateNet: (a) => {
        const stamp = a.customerBroughtStamp ? 0 : (a.paperType === 'stamp500' ? stampCost : plainCost);
        const auth = a.authorizerType === 'magistrate' ? 30 : Number(a.notaryPublicFee || 0);
        return Number(a.amountCharged || 0) - stamp - auth;
      },
      extraGroups: [
        { field: 'authorizerType', key: 'byAuthorizer' },
        { field: 'paperType', key: 'byPaper' },
      ],
    });
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
