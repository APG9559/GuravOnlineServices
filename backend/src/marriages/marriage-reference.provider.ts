import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Marriage } from './marriage.entity';
import { ReferenceItem, ReferenceProvider } from '../references/interfaces/reference-provider.interface';

@Injectable()
export class MarriageReferenceProvider implements ReferenceProvider {
  constructor(
    @InjectRepository(Marriage)
    private readonly marriageRepo: Repository<Marriage>,
  ) {}

  async getReferences(): Promise<ReferenceItem[]> {
    const marriages = await this.marriageRepo.find({
      select: [
        'id',
        'applicationNo',
        'spouse1Name',
        'spouse2Name',
        'dateOfService',
        'contactName',
        'phone',
        'address',
        'isPrimaryContactSpouse',
      ],
      where: {
        isPrimaryContactSpouse: false,
      },
    });

    return marriages
      .filter((m) => m.phone && m.phone.trim() !== '')
      .map((m) => ({
        serviceType: 'Marriage Registration',
        applicationNo: m.applicationNo || 'N/A',
        customerName: `${m.spouse1Name} & ${m.spouse2Name}`,
        status: 'Approved',
        applicationDate: m.dateOfService,
        contactName: m.contactName,
        contactPhone: m.phone!,
        contactAddress: m.address || undefined,
        dateOfService: m.dateOfService,
      }));
  }
}
