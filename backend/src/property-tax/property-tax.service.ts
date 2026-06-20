import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyTax } from './property-tax.entity';
import {
  CreatePropertyTaxDto,
  UpdatePropertyTaxDto,
  PropertyTaxFilterDto,
} from './property-tax.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class PropertyTaxService {
  constructor(
    @InjectRepository(PropertyTax)
    private readonly repo: Repository<PropertyTax>,
    private readonly customersService: CustomersService,
  ) {}

  async create(dto: CreatePropertyTaxDto, user: User): Promise<PropertyTax> {
    const customer = await this.customersService.upsertByPhone(dto.customerName, dto.phone, dto.address);
    const record = this.repo.create({ ...dto, createdBy: user, customer });
    return this.repo.save(record);
  }

  async findAll(filter: PropertyTaxFilterDto) {
    const qb = this.repo.createQueryBuilder('pt')
      .leftJoinAndSelect('pt.createdBy', 'u')
      .leftJoinAndSelect('pt.customer', 'c')
      .orderBy('pt.dateOfService', 'DESC');

    if (filter.from)       qb.andWhere('pt.dateOfService >= :from', { from: filter.from });
    if (filter.to)         qb.andWhere('pt.dateOfService <= :to',   { to: filter.to });
    if (filter.search) {
      qb.andWhere(
        '(LOWER(pt.customerName) LIKE :s OR pt.phone LIKE :s OR pt.propertyTaxNo LIKE :s OR LOWER(pt.address) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<PropertyTax> {
    const rec = await this.repo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
    if (!rec) throw new NotFoundException('Property Tax record not found');
    return rec;
  }

  async update(id: string, dto: UpdatePropertyTaxDto): Promise<PropertyTax> {
    const rec = await this.findOne(id);
    Object.assign(rec, dto);

    const phone = dto.phone || rec.phone;
    const customerName = dto.customerName || rec.customerName;
    const address = dto.address || rec.address;
    if (phone && customerName) {
      const customer = await this.customersService.upsertByPhone(customerName, phone, address);
      rec.customer = customer;
    }

    return this.repo.save(rec);
  }

  async softDelete(id: string): Promise<void> {
    const rec = await this.findOne(id);
    await this.repo.softRemove(rec);
  }
}
