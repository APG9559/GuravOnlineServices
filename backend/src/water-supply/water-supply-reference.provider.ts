import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterServiceRecord } from './water-service-record.entity';
import { ReferenceItem, ReferenceProvider } from '../references/interfaces/reference-provider.interface';

@Injectable()
export class WaterSupplyReferenceProvider implements ReferenceProvider {
  constructor(
    @InjectRepository(WaterServiceRecord)
    private readonly wsRecordRepo: Repository<WaterServiceRecord>,
  ) {}

  async getReferences(): Promise<ReferenceItem[]> {
    const records = await this.wsRecordRepo.find({
      relations: ['connection', 'connection.customer'],
      select: {
        id: true,
        applicationTokenNo: true,
        serviceType: true,
        applicationDate: true,
        dateOfService: true,
        connection: {
          id: true,
          currentOwner: true,
          connectionAddress: true,
          contactPersonName: true,
          contactPersonPhone: true,
        },
      },
    });

    return records
      .filter((r) => r.connection?.contactPersonPhone && r.connection.contactPersonPhone.trim() !== '')
      .map((r) => ({
        serviceType: `Water Supply - ${r.serviceType}`,
        applicationNo: r.applicationTokenNo || 'N/A',
        customerName: r.connection.currentOwner,
        status: 'Approved',
        applicationDate: r.applicationDate,
        contactName: r.connection.contactPersonName || 'Alternative Contact',
        contactPhone: r.connection.contactPersonPhone!,
        contactAddress: r.connection.connectionAddress || undefined,
        dateOfService: r.dateOfService,
      }));
  }
}
