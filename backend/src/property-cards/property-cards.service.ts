import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyCard } from './property-card.entity';
import {
  CreatePropertyCardDto,
  UpdatePropertyCardDto,
  PropertyCardFilterDto,
} from './property-cards.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';
import { BaseRecordService } from '../common/base-record.service';
import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';
import { ICustomerHistoryProvider, CustomerHistoryItem } from '../common/interfaces/customer-history.interface';

@Injectable()
export class PropertyCardsService extends BaseRecordService<PropertyCard> implements IDashboardMetrics, ICustomerHistoryProvider {
  constructor(
    @InjectRepository(PropertyCard)
    repo: Repository<PropertyCard>,
    customersService: CustomersService,
  ) {
    super(repo, customersService, 'Property card record');
  }

  async findAll(filter: PropertyCardFilterDto) {
    return super.findAll(
      filter,
      ['customerName', 'phone', 'propertyNumber'],
      (qb) => {
        if (filter.recordType) qb.andWhere('entity.recordType = :rt', { rt: filter.recordType });
      }
    );
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    return this.getDashboardMetricsGeneric(from, to, {
      key: 'propertyCards',
      label: 'Property Cards',
      category: 'AapleSarkar',
      calculateNet: (p: any) => Number(p.amountCharged || 0),
      netExpression: 'COALESCE("entity"."amountCharged", 0)',
      extraGroups: [
        { field: 'recordType', key: 'byCardType' },
      ],
    });
  }

  async getCustomerHistory(customerId: string): Promise<CustomerHistoryItem[]> {
    const qb = this.repo.createQueryBuilder('p');
    if (typeof qb.orderBy === 'function') {
      const records = await qb
        .leftJoin('p.createdBy', 'u')
        .select([
          'p.id AS id',
          'p.recordType AS "recordType"',
          'p.propertyNumber AS "propertyNumber"',
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
        type: 'property-card',
        typeName: 'Property Card',
        dateOfService: p.dateOfService,
        amountCharged: Number(p.amountCharged || 0),
        description: `Type: ${p.recordType}, Property No: ${p.propertyNumber}`,
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
      type: 'property-card',
      typeName: 'Property Card',
      dateOfService: p.dateOfService,
      amountCharged: Number(p.amountCharged || 0),
      description: `Type: ${p.recordType}, Property No: ${p.propertyNumber}`,
      createdBy: p.createdBy?.name || 'Unknown',
      createdAt: p.createdAt,
    }));
  }
}
