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
          customer: {
            id: true,
            phone: true,
          },
        },
      },
    });

    return records
      .map((r) => {
        // Prefer explicit contact person phone, fall back to main customer phone
        const phone = r.connection?.contactPersonPhone?.trim() ||
          r.connection?.customer?.phone?.trim() ||
          null;

        if (!phone) return null; // skip only if truly no phone available

        return {
          serviceType: `Water Supply - ${r.serviceType}`,
          applicationNo: r.applicationTokenNo || 'N/A',
          customerName: r.connection.currentOwner,
          status: 'Approved',
          applicationDate: r.applicationDate,
          contactName: r.connection.contactPersonName || r.connection.currentOwner,
          contactPhone: phone,
          contactAddress: r.connection.connectionAddress || undefined,
          dateOfService: r.dateOfService,
        };
      })
      .filter((r) => r !== null) as ReferenceItem[];
  }
}
