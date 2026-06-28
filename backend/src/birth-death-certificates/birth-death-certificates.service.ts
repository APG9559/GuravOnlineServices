import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BirthDeathCertificate } from './birth-death-certificate.entity';
import { CreateBirthDeathCertificateDto, UpdateBirthDeathCertificateDto, BirthDeathCertificateFilterDto } from './birth-death-certificates.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';
import { BaseRecordService } from '../common/base-record.service';
import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';
import { ICustomerHistoryProvider, CustomerHistoryItem } from '../common/interfaces/customer-history.interface';

@Injectable()
export class BirthDeathCertificatesService extends BaseRecordService<BirthDeathCertificate> implements IDashboardMetrics, ICustomerHistoryProvider {
  constructor(
    @InjectRepository(BirthDeathCertificate)
    repo: Repository<BirthDeathCertificate>,
    customersService: CustomersService,
  ) {
    super(repo, customersService, 'Birth/Death certificate');
  }

  async findAll(filter: BirthDeathCertificateFilterDto) {
    return super.findAll(
      filter,
      ['customerName', 'personName', 'phone'],
      (qb) => {
        if (filter.type) qb.andWhere('entity.certificateType = :type', { type: filter.type });
      }
    );
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    return this.getDashboardMetricsGeneric(from, to, {
      key: 'birthDeath',
      label: 'Birth/Death',
      category: 'KMC',
      extraGroups: [
        { field: 'certificateType', key: 'byType' },
      ],
    });
  }

  async getCustomerHistory(customerId: string): Promise<CustomerHistoryItem[]> {
    const records = await this.repo.find({
      where: { customer: { id: customerId } },
      relations: ['createdBy'],
    });

    return records.map(b => ({
      id: b.id,
      type: 'birth-death',
      typeName: `${b.certificateType} Certificate`,
      dateOfService: b.dateOfService,
      amountCharged: Number(b.amountCharged),
      description: `Name of person: ${b.personName}, Event Date: ${b.eventDate}, Copies: ${b.numberOfCopies}`,
      createdBy: b.createdBy?.name || 'Unknown',
      createdAt: b.createdAt,
    }));
  }
}
