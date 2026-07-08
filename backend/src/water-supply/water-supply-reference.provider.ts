import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterSupply } from './water-supply.entity';
import { ReferenceItem, ReferenceProvider } from '../references/interfaces/reference-provider.interface';

@Injectable()
export class WaterSupplyReferenceProvider implements ReferenceProvider {
  constructor(
    @InjectRepository(WaterSupply)
    private readonly waterSupplyRepo: Repository<WaterSupply>,
  ) {}

  async getReferences(): Promise<ReferenceItem[]> {
    const records = await this.waterSupplyRepo.find({
      select: [
        'id',
        'applicationTokenNo',
        'customerName',
        'serviceType',
        'applicationDate',
        'dateOfService',
        'contactPersonName',
        'contactPersonPhone',
        'connectionAddress',
      ],
    });

    return records
      .filter((r) => r.contactPersonPhone && r.contactPersonPhone.trim() !== '')
      .map((r) => ({
        serviceType: `Water Supply - ${r.serviceType}`,
        applicationNo: r.applicationTokenNo || 'N/A',
        customerName: r.customerName,
        status: 'Approved',
        applicationDate: r.applicationDate,
        contactName: r.contactPersonName || 'Alternative Contact',
        contactPhone: r.contactPersonPhone!,
        contactAddress: r.connectionAddress || undefined,
        dateOfService: r.dateOfService,
      }));
  }
}
