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

  async create(dto: CreateWaterSupplyDto, user: User): Promise<WaterSupply> {
    if (dto.serviceType === 'ConnectionTransfer') {
      const oldOwnerName = dto.currentOwner || dto.customerName;

      // Ensure the old owner remains registered in the Customers database table
      if (dto.phone && dto.customerName) {
        await this.customersService.upsertByPhone(
          dto.customerName,
          dto.phone,
          dto.connectionAddress || null,
          null,
        );
      }

      // Shift the active connection record to point to the new owner
      const transferDto = {
        ...dto,
        currentOwner: oldOwnerName,
        customerName: dto.newOwnerName,
        phone: dto.newOwnerPhone,
      };
      return super.create(transferDto, user);
    }
    return super.create(dto, user);
  }

  async update(id: string, dto: UpdateWaterSupplyDto): Promise<WaterSupply> {
    const existing = await this.findOne(id);
    const serviceType = dto.serviceType || existing.serviceType;

    if (serviceType === 'ConnectionTransfer') {
      const newOwnerName = dto.newOwnerName || existing.newOwnerName;
      const newOwnerPhone = dto.newOwnerPhone || existing.newOwnerPhone;

      const transferDto = {
        ...dto,
        customerName: newOwnerName,
        phone: newOwnerPhone,
      };
      return super.update(id, transferDto);
    }
    return super.update(id, dto);
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
