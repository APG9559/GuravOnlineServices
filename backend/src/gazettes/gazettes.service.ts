import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gazette } from './gazette.entity';
import {
  CreateGazetteDto,
  UpdateGazetteDto,
  GazetteFilterDto,
} from './gazettes.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class GazettesService {
  constructor(
    @InjectRepository(Gazette)
    private readonly repo: Repository<Gazette>,
    private readonly customersService: CustomersService,
  ) {}

  async create(dto: CreateGazetteDto, user: User): Promise<Gazette> {
    const customer = await this.customersService.upsertByPhone(dto.customerName, dto.phone);
    const record = this.repo.create({ ...dto, createdBy: user, customer });
    return this.repo.save(record);
  }

  async findAll(filter: GazetteFilterDto) {
    const qb = this.repo.createQueryBuilder('g')
      .leftJoinAndSelect('g.createdBy', 'u')
      .leftJoinAndSelect('g.customer', 'c')
      .orderBy('g.dateOfService', 'DESC');

    if (filter.from)       qb.andWhere('g.dateOfService >= :from', { from: filter.from });
    if (filter.to)         qb.andWhere('g.dateOfService <= :to',   { to: filter.to });
    if (filter.search) {
      qb.andWhere(
        '(LOWER(g.customerName) LIKE :s OR g.phone LIKE :s OR LOWER(g.oldName) LIKE :s OR LOWER(g.newName) LIKE :s OR LOWER(g.tokenNo) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Gazette> {
    const rec = await this.repo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
    if (!rec) throw new NotFoundException('Gazette record not found');
    return rec;
  }

  async update(id: string, dto: UpdateGazetteDto): Promise<Gazette> {
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
