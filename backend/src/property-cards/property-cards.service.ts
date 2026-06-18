import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyCard } from './property-card.entity';
import {
  CreatePropertyCardDto,
  UpdatePropertyCardDto,
  PropertyCardFilterDto,
} from './property-cards.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class PropertyCardsService {
  constructor(
    @InjectRepository(PropertyCard)
    private readonly repo: Repository<PropertyCard>,
    private readonly customersService: CustomersService,
  ) {}

  async create(dto: CreatePropertyCardDto, user: User): Promise<PropertyCard> {
    const customer = await this.customersService.upsertByPhone(dto.customerName, dto.phone);
    const record = this.repo.create({ ...dto, createdBy: user, customer });
    return this.repo.save(record);
  }

  async findAll(filter: PropertyCardFilterDto) {
    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.createdBy', 'u')
      .leftJoinAndSelect('p.customer', 'c')
      .orderBy('p.dateOfService', 'DESC');

    if (filter.from)       qb.andWhere('p.dateOfService >= :from', { from: filter.from });
    if (filter.to)         qb.andWhere('p.dateOfService <= :to',   { to: filter.to });
    if (filter.recordType) qb.andWhere('p.recordType = :rt',       { rt: filter.recordType });
    if (filter.search) {
      qb.andWhere(
        '(LOWER(p.customerName) LIKE :s OR p.phone LIKE :s OR LOWER(p.propertyNumber) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<PropertyCard> {
    const rec = await this.repo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
    if (!rec) throw new NotFoundException('Property card record not found');
    return rec;
  }

  async update(id: string, dto: UpdatePropertyCardDto): Promise<PropertyCard> {
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
