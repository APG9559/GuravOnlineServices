import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TradeLicenseRecord } from './trade-license-record.entity';
import { ReferenceItem, ReferenceProvider } from '../references/interfaces/reference-provider.interface';

@Injectable()
export class TradeLicenseReferenceProvider implements ReferenceProvider {
  constructor(
    @InjectRepository(TradeLicenseRecord)
    private readonly recordRepo: Repository<TradeLicenseRecord>,
  ) {}

  async getReferences(): Promise<ReferenceItem[]> {
    const records = await this.recordRepo.find({
      relations: ['business', 'business.customers'],
    });

    const items: ReferenceItem[] = [];

    for (const record of records) {
      if (!record.business || !record.business.phone) continue;

      const businessPhone = record.business.phone.trim();
      if (businessPhone === '') continue;

      // Extract owners/partners phones
      const partnerPhones = (record.business.customers || [])
        .map((c) => c.phone ? c.phone.trim() : '')
        .filter((p) => p !== '');

      // Check if business phone is same as one of the owners/partners
      if (partnerPhones.includes(businessPhone)) {
        continue;
      }

      items.push({
        serviceType: `Trade License - ${record.serviceType}`,
        applicationNo: record.tokenNo || 'N/A',
        customerName: record.business.name,
        status: record.business.status || 'Pending',
        applicationDate: record.dateOfService,
        contactName: record.business.name,
        contactPhone: businessPhone,
        contactAddress: undefined,
        dateOfService: record.dateOfService,
      });
    }

    return items;
  }
}
