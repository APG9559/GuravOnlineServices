import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopActLicense } from './shop-act-license.entity';
import {
  CreateShopActLicenseDto,
  UpdateShopActLicenseDto,
  ShopActLicenseFilterDto,
} from './shop-act-licenses.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class ShopActLicensesService {
  constructor(
    @InjectRepository(ShopActLicense)
    private readonly repo: Repository<ShopActLicense>,
    private readonly customersService: CustomersService,
  ) {}

  async create(dto: CreateShopActLicenseDto, user: User): Promise<ShopActLicense> {
    const customer = await this.customersService.upsertByPhone(dto.customerName, dto.phone, null, dto.email);
    const record = this.repo.create({ ...dto, createdBy: user, customer });
    return this.repo.save(record);
  }

  async findAll(filter: ShopActLicenseFilterDto) {
    const qb = this.repo.createQueryBuilder('s')
      .leftJoinAndSelect('s.createdBy', 'u')
      .leftJoinAndSelect('s.customer', 'c')
      .orderBy('s.dateOfService', 'DESC');

    if (filter.from) qb.andWhere('s.dateOfService >= :from', { from: filter.from });
    if (filter.to)   qb.andWhere('s.dateOfService <= :to',   { to: filter.to });
    if (filter.search) {
      qb.andWhere(
        '(LOWER(s.customerName) LIKE :s OR s.phone LIKE :s OR LOWER(s.businessName) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<ShopActLicense> {
    const rec = await this.repo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
    if (!rec) throw new NotFoundException('Shop Act License record not found');
    return rec;
  }

  async update(id: string, dto: UpdateShopActLicenseDto): Promise<ShopActLicense> {
    const rec = await this.findOne(id);
    Object.assign(rec, dto);

    const phone = dto.phone || rec.phone;
    const customerName = dto.customerName || rec.customerName;
    const email = dto.email || rec.email;
    if (phone && customerName) {
      const customer = await this.customersService.upsertByPhone(customerName, phone, null, email);
      rec.customer = customer;
    }

    return this.repo.save(rec);
  }

  async softDelete(id: string): Promise<void> {
    const rec = await this.findOne(id);
    await this.repo.softRemove(rec);
  }
}
