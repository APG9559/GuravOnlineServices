import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BirthDeathCertificate } from './birth-death-certificate.entity';
import { CreateBirthDeathCertificateDto, UpdateBirthDeathCertificateDto, BirthDeathCertificateFilterDto } from './birth-death-certificates.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class BirthDeathCertificatesService {
  constructor(
    @InjectRepository(BirthDeathCertificate)
    private readonly repo: Repository<BirthDeathCertificate>,
    private readonly customersService: CustomersService,
  ) {}

  async create(dto: CreateBirthDeathCertificateDto, user: User): Promise<BirthDeathCertificate> {
    const customer = await this.customersService.upsertByPhone(dto.customerName, dto.phone);
    const record = this.repo.create({ ...dto, createdBy: user, customer });
    return this.repo.save(record);
  }

  async findAll(filter: BirthDeathCertificateFilterDto) {
    const qb = this.repo.createQueryBuilder('b')
      .leftJoinAndSelect('b.createdBy', 'u')
      .leftJoinAndSelect('b.customer', 'c')
      .orderBy('b.dateOfService', 'DESC');

    if (filter.from) qb.andWhere('b.dateOfService >= :from', { from: filter.from });
    if (filter.to) qb.andWhere('b.dateOfService <= :to', { to: filter.to });
    if (filter.type) qb.andWhere('b.certificateType = :type', { type: filter.type });
    if (filter.search) {
      qb.andWhere('(LOWER(b.customerName) LIKE :s OR LOWER(b.personName) LIKE :s OR b.phone LIKE :s)', {
        s: `%${filter.search.toLowerCase()}%`,
      });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<BirthDeathCertificate> {
    const rec = await this.repo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
    if (!rec) throw new NotFoundException('Birth/Death certificate not found');
    return rec;
  }

  async update(id: string, dto: UpdateBirthDeathCertificateDto): Promise<BirthDeathCertificate> {
    const rec = await this.findOne(id);
    Object.assign(rec, dto);

    const phone = dto.phone || rec.phone;
    const customerName = dto.customerName || rec.customerName;
    if (phone && customerName) {
      const customer = await this.customersService.upsertByPhone(customerName, phone);
      rec.customer = customer;
    }

    return this.repo.save(rec);
  }

  async softDelete(id: string): Promise<void> {
    const rec = await this.findOne(id);
    await this.repo.softRemove(rec);
  }
}
