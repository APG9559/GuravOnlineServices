import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterSupply } from './water-supply.entity';
import {
  CreateWaterSupplyDto,
  UpdateWaterSupplyDto,
  WaterSupplyFilterDto,
} from './water-supply.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';
import { BaseRecordService } from '../common/base-record.service';
import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';
import { ICustomerHistoryProvider, CustomerHistoryItem } from '../common/interfaces/customer-history.interface';

@Injectable()
export class WaterSupplyService extends BaseRecordService<WaterSupply> implements IDashboardMetrics, ICustomerHistoryProvider {
  constructor(
    @InjectRepository(WaterSupply)
    repo: Repository<WaterSupply>,
    customersService: CustomersService,
  ) {
    super(repo, customersService, 'Water Supply record');
  }

  async findAll(filter: WaterSupplyFilterDto) {
    return super.findAll(filter, ['customerName', 'phone', 'applicationTokenNo', 'connectionNo', 'connectionAddress']);
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    return this.getDashboardMetricsGeneric(from, to, {
      key: 'waterSupply',
      label: 'Water Supply',
      category: 'KMC',
      calculateNet: (ws) => Number(ws.amountCharged || 0) - Number(ws.officialFee || 0),
    });
  }

  async getCustomerHistory(customerId: string): Promise<CustomerHistoryItem[]> {
    const records = await this.repo.find({
      where: { customer: { id: customerId } },
      relations: ['createdBy'],
    });

    return records.map(w => ({
      id: w.id,
      type: 'water-supply',
      typeName: 'Water Supply Service',
      dateOfService: w.dateOfService,
      amountCharged: Number(w.amountCharged),
      description: `Service: ${w.serviceType}, Token: ${w.applicationTokenNo}${w.connectionNo ? `, Connection No: ${w.connectionNo}` : ''}`,
      createdBy: w.createdBy?.name || 'Unknown',
      createdAt: w.createdAt,
    }));
  }
}
