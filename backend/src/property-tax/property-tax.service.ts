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
    return super.findAll(filter, ['customerName', 'phone', 'propertyTaxNo', 'address']);
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    return this.getDashboardMetricsGeneric(from, to, {
      key: 'propertyTax',
      label: 'Property Tax',
      category: 'KMC',
      calculateNet: (pt) => Number(pt.amountCharged || 0) - Number(pt.officialFee || 0),
    });
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
