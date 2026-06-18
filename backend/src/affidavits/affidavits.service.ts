import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Affidavit } from './affidavit.entity';
import { CreateAffidavitDto, UpdateAffidavitDto, AffidavitFilterDto } from './affidavits.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class AffidavitsService {
  constructor(
    @InjectRepository(Affidavit)
    private readonly repo: Repository<Affidavit>,
    private readonly customersService: CustomersService,
  ) {}

  async create(dto: CreateAffidavitDto, user: User): Promise<Affidavit> {
    const customer = await this.customersService.upsertByPhone(dto.customerName, dto.phone);
    const record = this.repo.create({ ...dto, createdBy: user, customer });
    return this.repo.save(record);
  }

  async findAll(filter: AffidavitFilterDto) {
    const qb = this.repo.createQueryBuilder('a')
      .leftJoinAndSelect('a.createdBy', 'u')
      .leftJoinAndSelect('a.customer', 'c')
      .orderBy('a.dateOfService', 'DESC');

    if (filter.from) qb.andWhere('a.dateOfService >= :from', { from: filter.from });
    if (filter.to) qb.andWhere('a.dateOfService <= :to', { to: filter.to });
    if (filter.search) {
      qb.andWhere('(LOWER(a.customerName) LIKE :s OR a.phone LIKE :s)', {
        s: `%${filter.search.toLowerCase()}%`,
      });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Affidavit> {
    const rec = await this.repo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
    if (!rec) throw new NotFoundException('Affidavit not found');
    return rec;
  }

  async update(id: string, dto: UpdateAffidavitDto): Promise<Affidavit> {
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
