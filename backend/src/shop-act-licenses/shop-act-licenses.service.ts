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
    return super.findAll(filter, ['customerName', 'phone', 'businessName']);
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    return this.getDashboardMetricsGeneric(from, to, {
      key: 'shopAct',
      label: 'Shop Act',
      category: 'AapleSarkar',
    });
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
