import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gazette } from './gazette.entity';
import {
  CreateGazetteDto,
  UpdateGazetteDto,
  GazetteFilterDto,
} from './gazettes.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';
import { BaseRecordService } from '../common/base-record.service';
import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';
import { ICustomerHistoryProvider, CustomerHistoryItem } from '../common/interfaces/customer-history.interface';

@Injectable()
export class GazettesService extends BaseRecordService<Gazette> implements IDashboardMetrics, ICustomerHistoryProvider {
  constructor(
    @InjectRepository(Gazette)
    repo: Repository<Gazette>,
    customersService: CustomersService,
  ) {
    super(repo, customersService, 'Gazette record');
  }

  async findAll(filter: GazetteFilterDto) {
    return super.findAll(filter, ['customerName', 'phone', 'oldName', 'newName', 'tokenNo']);
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    return this.getDashboardMetricsGeneric(from, to, {
      key: 'gazettes',
      label: 'Gazettes',
      category: 'AapleSarkar',
      calculateNet: (g) => Number(g.amountCharged || 0) - Number(g.officialFee || 0),
    });
  }

  async getCustomerHistory(customerId: string): Promise<CustomerHistoryItem[]> {
    const records = await this.repo.find({
      where: { customer: { id: customerId } },
      relations: ['createdBy'],
    });

    return records.map(g => ({
      id: g.id,
      type: 'gazette',
      typeName: 'Gazette Name Change',
      dateOfService: g.dateOfService,
      amountCharged: Number(g.amountCharged),
      description: `Old Name: ${g.oldName}, New Name: ${g.newName}, Reason: ${g.reasonToChangeName}`,
      createdBy: g.createdBy?.name || 'Unknown',
      createdAt: g.createdAt,
    }));
  }
}
